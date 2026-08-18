namespace api.Services;

using System.Data;

using api.Data;
using api.Models;

using Dapper;

public sealed class DapperFinanceSnapshotService(IPostgresConnectionFactory connectionFactory) : IFinanceSnapshotService
{
    public FinanceSnapshot GetSnapshot()
    {
        using var connection = connectionFactory.CreateConnection();

        var household = connection.QuerySingleOrDefault<HouseholdSummary>(HouseholdSql)
            ?? throw new InvalidOperationException("No household data found. Run the bootstrap seed or load household data first.");
        var payCycle = connection.QuerySingleOrDefault<PayCycleSummary>(CurrentPayCycleSql)
            ?? throw new InvalidOperationException("No current pay cycle found. Run the bootstrap seed or load pay cycle data first.");
        var accounts = connection.Query<AccountSummary>(AccountsSql).ToList();
        var pots = connection.Query<PotSummary>(PotsSql).ToList();
        var inbox = connection.Query<TransactionInboxItem>(InboxSql).ToList();
        var obligations = connection.Query<ActiveObligationSummary>(ActiveObligationsSql).ToList();
        var events = connection.Query<EventSummary>(EventSummariesSql).ToList();

        return new FinanceSnapshot(household, payCycle, accounts, pots, inbox, obligations, events);
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

        transaction.Commit();

        return GetTransaction(connection, transactionId);
    }

    public IReadOnlyList<EventSummary> GetEvents()
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.Query<EventSummary>(EventSummariesSql).ToList();
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
            request.PlannedAmount,
            request.FundedAmount,
            request.Notes,
        }, transaction);

        transaction.Commit();

        return GetEvent(connection, eventId);
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
            detail.Category,
            detail.FundingSource,
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
        string Category,
        string FundingSource,
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
            id as "Id",
            name as "Name",
            pot_type as "Type",
            planned_amount as "PlannedAmount",
            actual_amount as "ActualAmount",
            remaining_amount as "RemainingAmount",
            owner_name as "Owner",
            overspend_rule as "OverspendRule",
            carry_forward_enabled as "CarryForwardEnabled"
        from pots
        order by name asc;
        """;

    private const string InboxSql = """
        select
            id as "Id",
            merchant as "Merchant",
            amount as "Amount",
            transaction_date as "TransactionDate",
            account_name as "AccountName",
            category as "Category",
            funding_source as "FundingSource",
            owner_name as "Owner",
            is_acknowledged as "IsAcknowledged",
            requires_partner_review as "RequiresPartnerReview",
            is_split as "IsSplit",
            refund_pending as "RefundPending"
        from imported_transactions
        order by transaction_date desc, merchant asc;
        """;

    private const string TransactionDetailSql = """
        select
            id as "Id",
            merchant as "Merchant",
            amount as "Amount",
            transaction_date as "TransactionDate",
            account_name as "AccountName",
            category as "Category",
            funding_source as "FundingSource",
            owner_name as "Owner",
            is_acknowledged as "IsAcknowledged",
            requires_partner_review as "RequiresPartnerReview",
            is_split as "IsSplit",
            refund_pending as "RefundPending",
            notes as "Notes"
        from imported_transactions
        where id = @transactionId;
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
            id as "Id",
            name as "Name",
            event_type as "Type",
            status as "Status",
            due_date as "DueDate",
            spend_window_start as "SpendWindowStart",
            spend_window_end as "SpendWindowEnd",
            planned_amount as "PlannedAmount",
            funded_amount as "FundedAmount",
            actual_amount as "ActualAmount",
            case
                when actual_amount > planned_amount then 'over-budget'
                when actual_amount > 0 and actual_amount < planned_amount then 'in-progress'
                else 'on-budget'
            end as "VarianceStatus"
        from events
        order by due_date asc, name asc;
        """;

    private const string EventDetailSql = """
        select
            id as "Id",
            name as "Name",
            event_type as "Type",
            status as "Status",
            due_date as "DueDate",
            spend_window_start as "SpendWindowStart",
            spend_window_end as "SpendWindowEnd",
            planned_amount as "PlannedAmount",
            funded_amount as "FundedAmount",
            actual_amount as "ActualAmount",
            notes as "Notes"
        from events
        where id = @eventId;
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

    private const string UpdateEventSql = """
        update events
        set
            status = @Status,
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
}
