namespace api.Services;

using System.Data;
using System.Text.Json;

using api.Data;
using api.Models;

using Dapper;

public sealed class DapperFinanceSnapshotService(IPostgresConnectionFactory connectionFactory) : IFinanceSnapshotService
{
    private static readonly string[] BigPotStorageTypes = ["big-pot", "sinking-fund", "holiday", "savings", "emergency"];

    public FinanceSnapshot GetSnapshot()
    {
        using var connection = connectionFactory.CreateConnection();

        var household = connection.QuerySingleOrDefault<HouseholdSummary>(HouseholdSql)
            ?? throw new InvalidOperationException("No household data found. Run the bootstrap seed or load household data first.");
        var payCycle = GetCurrentPayCycle(connection);
        var accounts = connection.Query<AccountSummary>(AccountsSql).ToList();
        var pots = connection.Query<PotSummary>(PotsSql, new
        {
            BigPotStorageTypes,
            StartDate = payCycle.StartDate.ToDateTime(TimeOnly.MinValue),
            EndDate = payCycle.EndDate.ToDateTime(TimeOnly.MinValue),
        }).ToList();
        var inbox = connection.Query<TransactionInboxItem>(InboxSql).ToList();
        var obligations = connection.Query<ActiveObligationSummary>(ActiveObligationsSql).ToList();
        var events = connection.Query<EventSummary>(EventSummariesSql, new { FundingPotId = (Guid?)null }).ToList();

        return new FinanceSnapshot(household, payCycle, accounts, pots, inbox, obligations, events);
    }

    public IReadOnlyList<PotSummary> GetPots()
    {
        using var connection = connectionFactory.CreateConnection();

        var payCycle = GetCurrentPayCycle(connection);

        return connection.Query<PotSummary>(PotsSql, new
        {
            BigPotStorageTypes,
            StartDate = payCycle.StartDate.ToDateTime(TimeOnly.MinValue),
            EndDate = payCycle.EndDate.ToDateTime(TimeOnly.MinValue),
        }).ToList();
    }

    public PotSummary CreatePot(CreatePotRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var householdId = connection.QuerySingleOrDefault<Guid?>(PrimaryHouseholdIdSql, transaction: transaction)
            ?? throw new InvalidOperationException("No household data found. Run the bootstrap seed or load household data first.");

        var potId = Guid.NewGuid();

        connection.Execute(InsertPotSql, new
        {
            PotId = potId,
            HouseholdId = householdId,
            request.Name,
            Kind = NormalizePotKind(request.Kind),
            request.PlannedAmount,
            Owner = request.Owner,
            OverspendRule = request.OverspendRule,
            request.CarryForwardEnabled,
            request.ShowOnDashboard,
        }, transaction);

        InsertAuditEntry(
            connection,
            transaction,
            "pot",
            potId,
            "created",
            $"Pot created for {request.Name}",
            new
            {
                request.Name,
                request.Kind,
                request.PlannedAmount,
                request.Owner,
                request.OverspendRule,
                request.CarryForwardEnabled,
                request.ShowOnDashboard,
            });

        transaction.Commit();

        var payCycle = GetCurrentPayCycle(connection);

        return GetPot(connection, potId, payCycle)
            ?? throw new InvalidOperationException("The pot was created, but could not be reloaded.");
    }

    public PotSummary? UpdatePot(Guid potId, UpdatePotRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var updatedRows = connection.Execute(UpdatePotSql, new
        {
            potId,
            request.PlannedAmount,
            request.ShowOnDashboard,
        }, transaction);

        if (updatedRows == 0)
        {
            return null;
        }

        InsertAuditEntry(
            connection,
            transaction,
            "pot",
            potId,
            "updated",
            "Pot updated",
            new
            {
                request.PlannedAmount,
                request.ShowOnDashboard,
            });

        transaction.Commit();

        var payCycle = GetCurrentPayCycle(connection);

        return GetPot(connection, potId, payCycle);
    }

    public TransactionDetail CreateTransaction(CreateTransactionRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var householdId = connection.QuerySingleOrDefault<Guid?>(PrimaryHouseholdIdSql, transaction: transaction)
            ?? throw new InvalidOperationException("No household data found. Run the bootstrap seed or load household data first.");

        var transactionId = Guid.NewGuid();
        var isSplit = request.IsSplit || request.Splits.Count > 1;

        connection.Execute(InsertTransactionSql, new
        {
            TransactionId = transactionId,
            HouseholdId = householdId,
            request.AccountName,
            request.Merchant,
            request.Amount,
            TransactionDate = request.TransactionDate.ToDateTime(TimeOnly.MinValue),
            SourceProvider = request.SourceProvider ?? string.Empty,
            ExternalTransactionId = request.ExternalTransactionId ?? string.Empty,
            request.Category,
            request.FundingSource,
            request.EventId,
            Owner = request.Owner,
            request.RequiresPartnerReview,
            request.IsAcknowledged,
            IsSplit = isSplit,
            request.RefundPending,
            Notes = request.Notes ?? string.Empty,
        }, transaction);

        foreach (var split in request.Splits)
        {
            connection.Execute(InsertTransactionSplitSql, new
            {
                Id = Guid.NewGuid(),
                TransactionId = transactionId,
                split.Category,
                split.FundingSource,
                split.Amount,
                Notes = split.Notes ?? string.Empty,
            }, transaction);
        }

        InsertAuditEntry(
            connection,
            transaction,
            "transaction",
            transactionId,
            "created",
            $"Imported transaction created for {request.Merchant}",
            new
            {
                request.AccountName,
                request.Merchant,
                request.Amount,
                request.TransactionDate,
                request.Category,
                request.FundingSource,
                request.EventId,
                request.Owner,
                request.RequiresPartnerReview,
                request.RefundPending,
                request.SourceProvider,
                request.ExternalTransactionId,
                request.Splits,
            });

        transaction.Commit();

        return GetTransaction(connection, transactionId)
            ?? throw new InvalidOperationException("The transaction was created, but could not be reloaded.");
    }

    public TransactionDetail? GetTransaction(Guid transactionId)
    {
        using var connection = connectionFactory.CreateConnection();

        return GetTransaction(connection, transactionId);
    }

    public TransactionDetail? UpdateTransaction(Guid transactionId, UpdateTransactionRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var existing = connection.QuerySingleOrDefault<TransactionDetailRow>(TransactionDetailSql, new { transactionId }, transaction);

        if (existing is null)
        {
            return null;
        }

        connection.Execute(UpdateTransactionSql, new
        {
            transactionId,
            request.Category,
            request.FundingSource,
            request.EventId,
            Owner = request.Owner,
            request.IsSplit,
            request.RefundPending,
            request.IsAcknowledged,
            request.Notes,
        }, transaction);

        connection.Execute(DeleteTransactionSplitsSql, new { transactionId }, transaction);

        foreach (var split in request.Splits)
        {
            connection.Execute(InsertTransactionSplitSql, new
            {
                Id = Guid.NewGuid(),
                TransactionId = transactionId,
                split.Category,
                split.FundingSource,
                split.Amount,
                split.Notes,
            }, transaction);
        }

        InsertAuditEntry(
            connection,
            transaction,
            "transaction",
            transactionId,
            "updated",
            $"Transaction updated for {existing.Merchant}",
            new
            {
                request.Category,
                request.FundingSource,
                request.EventId,
                request.Owner,
                request.IsSplit,
                request.RefundPending,
                request.IsAcknowledged,
                request.Notes,
                request.Splits,
            });

        transaction.Commit();

        return GetTransaction(connection, transactionId);
    }

    public IReadOnlyList<EventSummary> GetEvents(Guid? fundingPotId = null)
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.Query<EventSummary>(EventSummariesSql, new { FundingPotId = fundingPotId }).ToList();
    }

    public IReadOnlyList<AuditEntry> GetAuditEntries()
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.Query<AuditEntry>(AuditEntriesSql).ToList();
    }

    public EventDetail CreateEvent(CreateEventRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var householdId = connection.QuerySingleOrDefault<Guid?>(PrimaryHouseholdIdSql, transaction: transaction)
            ?? throw new InvalidOperationException("No household data found. Run the bootstrap seed or load household data first.");

        var eventId = Guid.NewGuid();
        var tags = request.Tags
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(tag => tag.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        connection.Execute(InsertEventSql, new
        {
            EventId = eventId,
            HouseholdId = householdId,
            request.Name,
            Type = request.Type,
            Status = request.Status,
            request.FundingPotId,
            DueDate = request.DueDate.ToDateTime(TimeOnly.MinValue),
            SpendWindowStart = request.SpendWindowStart.ToDateTime(TimeOnly.MinValue),
            SpendWindowEnd = request.SpendWindowEnd.ToDateTime(TimeOnly.MinValue),
            request.PlannedAmount,
            request.FundedAmount,
            ActualAmount = 0m,
            Notes = request.Notes ?? string.Empty,
        }, transaction);

        foreach (var tag in tags)
        {
            connection.Execute(InsertEventTagSql, new
            {
                EventId = eventId,
                Tag = tag,
            }, transaction);
        }

        InsertAuditEntry(
            connection,
            transaction,
            "event",
            eventId,
            "created",
            $"Event created for {request.Name}",
            new
            {
                request.Name,
                request.Type,
                request.Status,
                request.FundingPotId,
                request.DueDate,
                request.SpendWindowStart,
                request.SpendWindowEnd,
                request.PlannedAmount,
                request.FundedAmount,
                request.Notes,
                Tags = tags,
            });

        transaction.Commit();

        return GetEvent(connection, eventId)
            ?? throw new InvalidOperationException("The event was created, but could not be reloaded.");
    }

    public EventDetail? GetEvent(Guid eventId)
    {
        using var connection = connectionFactory.CreateConnection();

        return GetEvent(connection, eventId);
    }

    public EventDetail? UpdateEvent(Guid eventId, UpdateEventRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var existing = connection.QuerySingleOrDefault<EventDetailRow>(EventDetailSql, new { eventId }, transaction);

        if (existing is null)
        {
            return null;
        }

        connection.Execute(UpdateEventSql, new
        {
            eventId,
            request.Status,
            request.FundingPotId,
            request.PlannedAmount,
            request.FundedAmount,
            request.Notes,
        }, transaction);

        InsertAuditEntry(
            connection,
            transaction,
            "event",
            eventId,
            "updated",
            $"Event updated for {existing.Name}",
            new
            {
                request.Status,
                request.FundingPotId,
                request.PlannedAmount,
                request.FundedAmount,
                request.Notes,
            });

        transaction.Commit();

        return GetEvent(connection, eventId);
    }

    private static void InsertAuditEntry(
        IDbConnection connection,
        IDbTransaction transaction,
        string entityType,
        Guid entityId,
        string action,
        string summary,
        object detail)
    {
        connection.Execute(InsertAuditEntrySql, new
        {
            Id = Guid.NewGuid(),
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Summary = summary,
            DetailJson = JsonSerializer.Serialize(detail),
            CreatedUtc = DateTime.UtcNow,
        }, transaction);
    }

    private static PotSummary? GetPot(IDbConnection connection, Guid potId, PayCycleSummary payCycle)
    {
        return connection.QuerySingleOrDefault<PotSummary>(PotByIdSql, new
        {
            BigPotStorageTypes,
            potId,
            StartDate = payCycle.StartDate.ToDateTime(TimeOnly.MinValue),
            EndDate = payCycle.EndDate.ToDateTime(TimeOnly.MinValue),
        });
    }

    private static string NormalizePotKind(string kind)
    {
        return string.Equals(kind, "big-pot", StringComparison.OrdinalIgnoreCase)
            ? "big-pot"
            : "little-pot";
    }

    private static PayCycleSummary GetCurrentPayCycle(IDbConnection connection)
    {
        return connection.QuerySingleOrDefault<PayCycleSummary>(CurrentPayCycleSql)
            ?? throw new InvalidOperationException("No current pay cycle found. Run the bootstrap seed or load pay cycle data first.");
    }

    private static TransactionDetail? GetTransaction(IDbConnection connection, Guid transactionId)
    {
        var detail = connection.QuerySingleOrDefault<TransactionDetailRow>(TransactionDetailSql, new { transactionId });

        if (detail is null)
        {
            return null;
        }

        var splits = connection.Query<TransactionSplitLine>(TransactionSplitsSql, new { transactionId }).ToList();

        return new TransactionDetail(
            detail.Id,
            detail.Merchant,
            detail.Amount,
            detail.TransactionDate,
            detail.AccountName,
            detail.SourceProvider,
            detail.ExternalTransactionId,
            detail.Category,
            detail.FundingSource,
            detail.EventId,
            detail.EventName,
            detail.Owner,
            detail.IsAcknowledged,
            detail.RequiresPartnerReview,
            detail.IsSplit,
            detail.RefundPending,
            detail.Notes,
            splits);
    }

    private static EventDetail? GetEvent(IDbConnection connection, Guid eventId)
    {
        var detail = connection.QuerySingleOrDefault<EventDetailRow>(EventDetailSql, new { eventId });

        if (detail is null)
        {
            return null;
        }

        var tags = connection.Query<string>(EventTagsSql, new { eventId }).ToList();
        var items = connection.Query<EventBudgetItem>(EventItemsSql, new { eventId }).ToList();

        return new EventDetail(
            detail.Id,
            detail.Name,
            detail.Type,
            detail.Status,
            detail.FundingPotId,
            detail.FundingPotName,
            detail.DueDate,
            detail.SpendWindowStart,
            detail.SpendWindowEnd,
            detail.PlannedAmount,
            detail.FundedAmount,
            detail.ActualAmount,
            detail.Notes,
            tags,
            items);
    }

    private sealed record TransactionDetailRow(
        Guid Id,
        string Merchant,
        decimal Amount,
        DateOnly TransactionDate,
        string AccountName,
        string SourceProvider,
        string ExternalTransactionId,
        string Category,
        string FundingSource,
        Guid? EventId,
        string? EventName,
        string Owner,
        bool IsAcknowledged,
        bool RequiresPartnerReview,
        bool IsSplit,
        bool RefundPending,
        string Notes);

    private sealed record EventDetailRow(
        Guid Id,
        string Name,
        string Type,
        string Status,
        Guid? FundingPotId,
        string? FundingPotName,
        DateOnly DueDate,
        DateOnly SpendWindowStart,
        DateOnly SpendWindowEnd,
        decimal PlannedAmount,
        decimal FundedAmount,
        decimal ActualAmount,
        string Notes);

    private const string HouseholdSql = """
        select
            id as "Id",
            name as "Name",
            base_currency as "BaseCurrency",
            owner_name as "OwnerName",
            partner_name as "PartnerName"
        from households
        order by created_utc asc
        limit 1;
        """;

    private const string PrimaryHouseholdIdSql = """
        select id
        from households
        order by created_utc asc
        limit 1;
        """;

    private const string CurrentPayCycleSql = """
        select
            id as "Id",
            label as "Label",
            start_date as "StartDate",
            end_date as "EndDate",
            is_current as "IsCurrent"
        from pay_cycles
        where is_current = true
        order by start_date desc
        limit 1;
        """;

    private const string AccountsSql = """
        select
            id as "Id",
            name as "Name",
            account_type as "Type",
            balance as "Balance",
            currency as "Currency",
            is_joint as "IsJoint"
        from accounts
        order by is_joint desc, name asc;
        """;

    private const string PotsSql = """
        select
            pots.id as "Id",
            pots.name as "Name",
            case
                when pots.pot_type = any(@BigPotStorageTypes) then 'big-pot'
                else 'little-pot'
            end as "Kind",
            pots.planned_amount as "PlannedAmount",
            coalesce((
                select sum(transaction_splits.amount)
                from transaction_splits
                inner join imported_transactions on imported_transactions.id = transaction_splits.transaction_id
                where transaction_splits.funding_source = pots.name
                    and imported_transactions.transaction_date >= @StartDate
                    and imported_transactions.transaction_date <= @EndDate
            ), 0) as "ActualAmount",
            pots.planned_amount - coalesce((
                select sum(transaction_splits.amount)
                from transaction_splits
                inner join imported_transactions on imported_transactions.id = transaction_splits.transaction_id
                where transaction_splits.funding_source = pots.name
                    and imported_transactions.transaction_date >= @StartDate
                    and imported_transactions.transaction_date <= @EndDate
            ), 0) as "RemainingAmount",
            pots.owner_name as "Owner",
            pots.overspend_rule as "OverspendRule",
            pots.carry_forward_enabled as "CarryForwardEnabled",
            pots.show_on_dashboard as "ShowOnDashboard"
        from pots
        order by pots.name asc;
        """;

    private const string PotByIdSql = """
        select
            pots.id as "Id",
            pots.name as "Name",
            case
                when pots.pot_type = any(@BigPotStorageTypes) then 'big-pot'
                else 'little-pot'
            end as "Kind",
            pots.planned_amount as "PlannedAmount",
            coalesce((
                select sum(transaction_splits.amount)
                from transaction_splits
                inner join imported_transactions on imported_transactions.id = transaction_splits.transaction_id
                where transaction_splits.funding_source = pots.name
                    and imported_transactions.transaction_date >= @StartDate
                    and imported_transactions.transaction_date <= @EndDate
            ), 0) as "ActualAmount",
            pots.planned_amount - coalesce((
                select sum(transaction_splits.amount)
                from transaction_splits
                inner join imported_transactions on imported_transactions.id = transaction_splits.transaction_id
                where transaction_splits.funding_source = pots.name
                    and imported_transactions.transaction_date >= @StartDate
                    and imported_transactions.transaction_date <= @EndDate
            ), 0) as "RemainingAmount",
            pots.owner_name as "Owner",
            pots.overspend_rule as "OverspendRule",
            pots.carry_forward_enabled as "CarryForwardEnabled",
            pots.show_on_dashboard as "ShowOnDashboard"
        from pots
        where pots.id = @potId;
        """;

    private const string InsertPotSql = """
        insert into pots (
            id,
            household_id,
            name,
            pot_type,
            planned_amount,
            actual_amount,
            remaining_amount,
            owner_name,
            overspend_rule,
            carry_forward_enabled,
            show_on_dashboard)
        values (
            @PotId,
            @HouseholdId,
            @Name,
            @Kind,
            @PlannedAmount,
            0,
            @PlannedAmount,
            @Owner,
            @OverspendRule,
            @CarryForwardEnabled,
            @ShowOnDashboard);
        """;

    private const string UpdatePotSql = """
        update pots
        set
            planned_amount = @PlannedAmount,
            remaining_amount = @PlannedAmount,
            show_on_dashboard = @ShowOnDashboard
        where id = @potId;
        """;

    private const string InboxSql = """
        select
            imported_transactions.id as "Id",
            imported_transactions.merchant as "Merchant",
            imported_transactions.amount as "Amount",
            imported_transactions.transaction_date as "TransactionDate",
            imported_transactions.account_name as "AccountName",
            imported_transactions.category as "Category",
            imported_transactions.funding_source as "FundingSource",
            imported_transactions.event_id as "EventId",
            events.name as "EventName",
            imported_transactions.owner_name as "Owner",
            imported_transactions.is_acknowledged as "IsAcknowledged",
            imported_transactions.requires_partner_review as "RequiresPartnerReview",
            imported_transactions.is_split as "IsSplit",
            imported_transactions.refund_pending as "RefundPending"
        from imported_transactions
        left join events on events.id = imported_transactions.event_id
        order by imported_transactions.transaction_date desc, imported_transactions.merchant asc;
        """;

    private const string TransactionDetailSql = """
        select
            imported_transactions.id as "Id",
            imported_transactions.merchant as "Merchant",
            imported_transactions.amount as "Amount",
            imported_transactions.transaction_date as "TransactionDate",
            imported_transactions.account_name as "AccountName",
            imported_transactions.source_provider as "SourceProvider",
            imported_transactions.external_transaction_id as "ExternalTransactionId",
            imported_transactions.category as "Category",
            imported_transactions.funding_source as "FundingSource",
            imported_transactions.event_id as "EventId",
            events.name as "EventName",
            imported_transactions.owner_name as "Owner",
            imported_transactions.is_acknowledged as "IsAcknowledged",
            imported_transactions.requires_partner_review as "RequiresPartnerReview",
            imported_transactions.is_split as "IsSplit",
            imported_transactions.refund_pending as "RefundPending",
            imported_transactions.notes as "Notes"
        from imported_transactions
        left join events on events.id = imported_transactions.event_id
        where imported_transactions.id = @transactionId;
        """;

    private const string InsertTransactionSql = """
        insert into imported_transactions (
            id,
            household_id,
            account_name,
            merchant,
            amount,
            transaction_date,
            source_provider,
            external_transaction_id,
            category,
            funding_source,
            event_id,
            owner_name,
            requires_partner_review,
            is_acknowledged,
            is_split,
            refund_pending,
            notes)
        values (
            @TransactionId,
            @HouseholdId,
            @AccountName,
            @Merchant,
            @Amount,
            @TransactionDate,
            @SourceProvider,
            @ExternalTransactionId,
            @Category,
            @FundingSource,
            @EventId,
            @Owner,
            @RequiresPartnerReview,
            @IsAcknowledged,
            @IsSplit,
            @RefundPending,
            @Notes);
        """;

    private const string TransactionSplitsSql = """
        select
            id as "Id",
            category as "Category",
            funding_source as "FundingSource",
            amount as "Amount",
            notes as "Notes"
        from transaction_splits
        where transaction_id = @transactionId
        order by id asc;
        """;

    private const string UpdateTransactionSql = """
        update imported_transactions
        set
            category = @Category,
            funding_source = @FundingSource,
            event_id = @EventId,
            owner_name = @Owner,
            is_split = @IsSplit,
            refund_pending = @RefundPending,
            is_acknowledged = @IsAcknowledged,
            notes = @Notes
        where id = @transactionId;
        """;

    private const string DeleteTransactionSplitsSql = """
        delete from transaction_splits
        where transaction_id = @transactionId;
        """;

    private const string InsertTransactionSplitSql = """
        insert into transaction_splits (id, transaction_id, category, funding_source, amount, notes)
        values (@Id, @TransactionId, @Category, @FundingSource, @Amount, @Notes);
        """;

    private const string EventSummariesSql = """
        select
            events.id as "Id",
            events.name as "Name",
            events.event_type as "Type",
            events.status as "Status",
            events.funding_pot_id as "FundingPotId",
            pots.name as "FundingPotName",
            events.due_date as "DueDate",
            events.spend_window_start as "SpendWindowStart",
            events.spend_window_end as "SpendWindowEnd",
            events.planned_amount as "PlannedAmount",
            events.funded_amount as "FundedAmount",
            events.actual_amount as "ActualAmount",
            case
                when events.actual_amount > events.planned_amount then 'over-budget'
                when events.actual_amount > 0 and events.actual_amount < events.planned_amount then 'in-progress'
                else 'on-budget'
            end as "VarianceStatus"
        from events
        left join pots on pots.id = events.funding_pot_id
        where @FundingPotId is null or events.funding_pot_id = @FundingPotId
        order by events.due_date asc, events.name asc;
        """;

    private const string EventDetailSql = """
        select
            events.id as "Id",
            events.name as "Name",
            events.event_type as "Type",
            events.status as "Status",
            events.funding_pot_id as "FundingPotId",
            pots.name as "FundingPotName",
            events.due_date as "DueDate",
            events.spend_window_start as "SpendWindowStart",
            events.spend_window_end as "SpendWindowEnd",
            events.planned_amount as "PlannedAmount",
            events.funded_amount as "FundedAmount",
            events.actual_amount as "ActualAmount",
            events.notes as "Notes"
        from events
        left join pots on pots.id = events.funding_pot_id
        where events.id = @eventId;
        """;

    private const string EventTagsSql = """
        select tag
        from event_tags
        where event_id = @eventId
        order by tag asc;
        """;

    private const string EventItemsSql = """
        select
            id as "Id",
            name as "Name",
            planned_amount as "PlannedAmount",
            actual_amount as "ActualAmount",
            status as "Status"
        from event_items
        where event_id = @eventId
        order by name asc;
        """;

    private const string InsertEventSql = """
        insert into events (
            id,
            household_id,
            name,
            event_type,
            status,
            funding_pot_id,
            due_date,
            spend_window_start,
            spend_window_end,
            planned_amount,
            funded_amount,
            actual_amount,
            notes)
        values (
            @EventId,
            @HouseholdId,
            @Name,
            @Type,
            @Status,
            @FundingPotId,
            @DueDate,
            @SpendWindowStart,
            @SpendWindowEnd,
            @PlannedAmount,
            @FundedAmount,
            @ActualAmount,
            @Notes);
        """;

    private const string InsertEventTagSql = """
        insert into event_tags (event_id, tag)
        values (@EventId, @Tag)
        on conflict (event_id, tag) do nothing;
        """;

    private const string UpdateEventSql = """
        update events
        set
            status = @Status,
            funding_pot_id = @FundingPotId,
            planned_amount = @PlannedAmount,
            funded_amount = @FundedAmount,
            notes = @Notes
        where id = @eventId;
        """;

    private const string ActiveObligationsSql = """
        select
            obligations.id as "Id",
            obligations.event_id as "EventId",
            events.name as "EventName",
            obligations.item_name as "ItemName",
            obligations.spend_window_start as "SpendWindowStart",
            obligations.spend_window_end as "SpendWindowEnd",
            obligations.planned_amount as "PlannedAmount",
            obligations.funded_amount as "FundedAmount",
            obligations.actual_amount as "ActualAmount",
            obligations.variance_amount as "VarianceAmount",
            obligations.variance_status as "VarianceStatus",
            obligations.resolution_status as "ResolutionStatus"
        from active_obligations obligations
        inner join events on events.id = obligations.event_id
        order by obligations.spend_window_end asc, events.name asc;
        """;

    private const string InsertAuditEntrySql = """
        insert into audit_entries (id, entity_type, entity_id, action, summary, detail_json, created_utc)
        values (@Id, @EntityType, @EntityId, @Action, @Summary, @DetailJson, @CreatedUtc);
        """;

    private const string AuditEntriesSql = """
        select
            id as "Id",
            entity_type as "EntityType",
            entity_id as "EntityId",
            action as "Action",
            summary as "Summary",
            detail_json as "DetailJson",
            created_utc as "CreatedUtc"
        from audit_entries
        order by created_utc desc
        limit 50;
        """;
}
