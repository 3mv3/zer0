namespace api.Services;

using api.Models;

public sealed class MockFinanceSnapshotService : IFinanceSnapshotService
{
    private readonly object _lock = new();

    private readonly HouseholdSummary _household = new(
        Guid.Parse("25f335ab-9d0d-4cd8-a7c3-2f05963c70c1"),
        "Varley Household",
        "GBP",
        "Matt",
        "Kris");

    private readonly List<AccountSummary> _accounts =
    [
        new(Guid.Parse("6f9ec0b2-7f04-4869-b9c7-5556ec8a9445"), "Joint", "bank", 2150.24m, "GBP", true),
        new(Guid.Parse("f66af5f3-e362-4cd1-9ddf-32c630cd4f5f"), "AMEX", "credit-card", -1456.54m, "GBP", true),
        new(Guid.Parse("7c33828d-2168-42c0-a6c0-e7b3cb1e56d6"), "BA", "credit-card", -1488.45m, "GBP", true),
        new(Guid.Parse("25467066-bd35-484c-8d51-c7aa5dd2d6d2"), "Emergency", "savings", 3326.11m, "GBP", false),
    ];

    private readonly List<PotSummary> _pots =
    [
        new(Guid.Parse("fd005179-018e-4c51-b9a2-21e9b118f1d7"), "Food", "household-budget", 400m, 292.81m, 107.19m, "Household", "reduce-remaining", false),
        new(Guid.Parse("8e3fc9b9-f8e0-4d99-828e-a5cedb6bd4f0"), "Gift", "sinking-fund", 250m, 180.96m, 69.04m, "Household", "manual-resolution", true),
        new(Guid.Parse("3c58f65b-9f0c-4244-9088-5f37a20cb857"), "Matt Fun", "personal-budget", 532.68m, 518.24m, 14.44m, "Matt", "take-from-another-source", false),
        new(Guid.Parse("376c6ed2-87bf-4b16-8aa1-fa645ec19098"), "Monthly Contingency", "contingency", 50m, 68.28m, -18.28m, "Household", "manual-resolution", false),
    ];

    private readonly List<ActiveObligationSummary> _activeObligations;

    private readonly List<MutableEvent> _events;

    private readonly List<MutableTransaction> _transactions;

    public MockFinanceSnapshotService()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        _transactions =
        [
            new MutableTransaction(
                Guid.Parse("33416db0-13df-4678-8036-6ebf3d7123be"),
                "Tesco",
                42.18m,
                today.AddDays(-1),
                "Joint",
                "Food",
                "Food",
                "Household",
                false,
                false,
                false,
                false,
                "Debit transaction from the joint account.",
                [new MutableTransactionSplit("Food", "Food", 42.18m, "Weekly groceries")]),
            new MutableTransaction(
                Guid.Parse("7aa1f4ba-201e-4767-9173-7b2a2a22fc7e"),
                "Zara",
                120m,
                today.AddDays(-2),
                "AMEX",
                "Unassigned",
                "Kris",
                "Kris",
                false,
                true,
                true,
                true,
                "Kris card spend waiting for split confirmation and refund tracking.",
                [
                    new MutableTransactionSplit("Clothes", "Kris", 60m, "Items being kept"),
                    new MutableTransactionSplit("Refund Pending", "Kris", 60m, "Expected return")
                ]),
            new MutableTransaction(
                Guid.Parse("74d6e751-c5a8-4a48-a58a-9f43ce771376"),
                "British Airways",
                199m,
                today.AddDays(-4),
                "BA",
                "Holiday",
                "Bali 2026",
                "Household",
                true,
                false,
                false,
                false,
                "Flight deposit already matched to the Bali event.",
                [new MutableTransactionSplit("Holiday", "Bali 2026", 199m, "Deposit")])
        ];

        _activeObligations =
        [
            new ActiveObligationSummary(
                Guid.Parse("dc97c3db-a4c3-430e-baac-eb07af17eab9"),
                Guid.Parse("cbe8fdb8-d26a-412c-bca4-662846415f04"),
                "Charlotte Wedding",
                "Gift",
                today.AddDays(-5),
                today.AddDays(12),
                252.98m,
                252.98m,
                252.98m,
                0m,
                "on-budget",
                "resolved"),
            new ActiveObligationSummary(
                Guid.Parse("84d6da41-88e0-48df-9a49-c8c5d352f1c7"),
                Guid.Parse("16622be5-3114-42a1-b40c-cf3bcfa1c6f5"),
                "Kris Birthday",
                "Gift",
                today.AddDays(-3),
                today.AddDays(20),
                20m,
                20m,
                35m,
                15m,
                "over-budget",
                "open"),
            new ActiveObligationSummary(
                Guid.Parse("4cd7fc06-2d6c-4f7d-8779-445ac26bb012"),
                Guid.Parse("d0da3ff7-280f-443f-8ded-4cbe7b6b6e5f"),
                "Bali 2026",
                "Flights",
                today.AddDays(-10),
                today.AddDays(25),
                1787m,
                1787m,
                199m,
                -1588m,
                "in-progress",
                "open")
        ];

        _events =
        [
            new MutableEvent(
                Guid.Parse("cbe8fdb8-d26a-412c-bca4-662846415f04"),
                "Charlotte Wedding",
                "event",
                "committed",
                today.AddDays(10),
                today.AddDays(-5),
                today.AddDays(12),
                252.98m,
                252.98m,
                252.98m,
                "Tracked as an active summer event and fully funded.",
                ["gift", "one-off"],
                [
                    new MutableEventItem(Guid.Parse("f7e19ca8-151d-409c-9845-d3cdb589bff5"), "Gift", 200m, 200m, "paid"),
                    new MutableEventItem(Guid.Parse("46051562-25ff-4a22-b1cb-8e7aa0f1dff9"), "Travel", 52.98m, 52.98m, "paid")
                ]),
            new MutableEvent(
                Guid.Parse("16622be5-3114-42a1-b40c-cf3bcfa1c6f5"),
                "Kris Birthday",
                "birthday",
                "active",
                today.AddDays(18),
                today.AddDays(-3),
                today.AddDays(20),
                20m,
                20m,
                35m,
                "Planned at 20 but current spend is already above forecast.",
                ["gift", "recurring"],
                [
                    new MutableEventItem(Guid.Parse("6efc4dd5-6140-43cb-a3d5-9b83c624a684"), "Gift", 20m, 35m, "paid")
                ]),
            new MutableEvent(
                Guid.Parse("d0da3ff7-280f-443f-8ded-4cbe7b6b6e5f"),
                "Bali 2026",
                "holiday",
                "planned",
                today.AddDays(45),
                today.AddDays(-10),
                today.AddDays(25),
                1787m,
                1787m,
                199m,
                "Flights have started to come out, but most of the trip remains forecasted.",
                ["holiday", "sinking-fund"],
                [
                    new MutableEventItem(Guid.Parse("fb311c20-1988-414e-8e70-d64e7bfa8f34"), "Flights", 1787m, 199m, "partially-paid"),
                    new MutableEventItem(Guid.Parse("ff0dfa03-df8f-4600-8a73-0418f8a7c24c"), "Spending Money", 700m, 0m, "planned")
                ])
        ];
    }

    public FinanceSnapshot GetSnapshot()
    {
        lock (_lock)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var cycleStart = new DateOnly(today.Year, today.Month, 25).AddMonths(today.Day < 25 ? -1 : 0);
            var cycleEnd = cycleStart.AddMonths(1);

            return new FinanceSnapshot(
                _household,
                new PayCycleSummary(
                    Guid.Parse("350bd72b-7aad-4c26-b088-cd9f5f84af95"),
                    $"{cycleStart:dd MMM} - {cycleEnd:dd MMM}",
                    cycleStart,
                    cycleEnd,
                    true),
                _accounts.ToList(),
                _pots.ToList(),
                _transactions.Select(ToInboxItem).ToList(),
                _activeObligations.ToList(),
                _events.Select(ToEventSummary).ToList());
        }
    }

    public TransactionDetail? GetTransaction(Guid transactionId)
    {
        lock (_lock)
        {
            var transaction = _transactions.SingleOrDefault(item => item.Id == transactionId);

            return transaction is null ? null : ToDetail(transaction);
        }
    }

    public TransactionDetail? UpdateTransaction(Guid transactionId, UpdateTransactionRequest request)
    {
        lock (_lock)
        {
            var transaction = _transactions.SingleOrDefault(item => item.Id == transactionId);

            if (transaction is null)
            {
                return null;
            }

            transaction.Category = request.Category;
            transaction.FundingSource = request.FundingSource;
            transaction.Owner = request.Owner;
            transaction.IsSplit = request.IsSplit;
            transaction.RefundPending = request.RefundPending;
            transaction.IsAcknowledged = request.IsAcknowledged;
            transaction.Notes = request.Notes;
            transaction.Splits = request.Splits.Select(split => new MutableTransactionSplit(
                split.Category,
                split.FundingSource,
                split.Amount,
                split.Notes)).ToList();

            return ToDetail(transaction);
        }
    }

    public IReadOnlyList<EventSummary> GetEvents()
    {
        lock (_lock)
        {
            return _events.Select(ToEventSummary).ToList();
        }
    }

    public EventDetail? GetEvent(Guid eventId)
    {
        lock (_lock)
        {
            var item = _events.SingleOrDefault(current => current.Id == eventId);

            return item is null ? null : ToEventDetail(item);
        }
    }

    public EventDetail? UpdateEvent(Guid eventId, UpdateEventRequest request)
    {
        lock (_lock)
        {
            var item = _events.SingleOrDefault(current => current.Id == eventId);

            if (item is null)
            {
                return null;
            }

            item.Status = request.Status;
            item.PlannedAmount = request.PlannedAmount;
            item.FundedAmount = request.FundedAmount;
            item.Notes = request.Notes;

            return ToEventDetail(item);
        }
    }

    private static TransactionInboxItem ToInboxItem(MutableTransaction transaction)
    {
        return new TransactionInboxItem(
            transaction.Id,
            transaction.Merchant,
            transaction.Amount,
            transaction.TransactionDate,
            transaction.AccountName,
            transaction.Category,
            transaction.FundingSource,
            transaction.Owner,
            transaction.IsAcknowledged,
            transaction.RequiresPartnerReview,
            transaction.IsSplit,
            transaction.RefundPending);
    }

    private static TransactionDetail ToDetail(MutableTransaction transaction)
    {
        return new TransactionDetail(
            transaction.Id,
            transaction.Merchant,
            transaction.Amount,
            transaction.TransactionDate,
            transaction.AccountName,
            transaction.Category,
            transaction.FundingSource,
            transaction.Owner,
            transaction.IsAcknowledged,
            transaction.RequiresPartnerReview,
            transaction.IsSplit,
            transaction.RefundPending,
            transaction.Notes,
            transaction.Splits.Select(split => new TransactionSplitLine(
                Guid.NewGuid(),
                split.Category,
                split.FundingSource,
                split.Amount,
                split.Notes)).ToList());
    }

    private static EventSummary ToEventSummary(MutableEvent item)
    {
        var variance = item.ActualAmount - item.PlannedAmount;
        var varianceStatus = variance switch
        {
            > 0 => "over-budget",
            < 0 when item.ActualAmount > 0 => "in-progress",
            _ => "on-budget",
        };

        return new EventSummary(
            item.Id,
            item.Name,
            item.Type,
            item.Status,
            item.DueDate,
            item.SpendWindowStart,
            item.SpendWindowEnd,
            item.PlannedAmount,
            item.FundedAmount,
            item.ActualAmount,
            varianceStatus);
    }

    private static EventDetail ToEventDetail(MutableEvent item)
    {
        return new EventDetail(
            item.Id,
            item.Name,
            item.Type,
            item.Status,
            item.DueDate,
            item.SpendWindowStart,
            item.SpendWindowEnd,
            item.PlannedAmount,
            item.FundedAmount,
            item.ActualAmount,
            item.Notes,
            item.Tags.ToList(),
            item.Items.Select(current => new EventBudgetItem(
                current.Id,
                current.Name,
                current.PlannedAmount,
                current.ActualAmount,
                current.Status)).ToList());
    }

    private sealed class MutableTransaction(
        Guid id,
        string merchant,
        decimal amount,
        DateOnly transactionDate,
        string accountName,
        string category,
        string fundingSource,
        string owner,
        bool isAcknowledged,
        bool requiresPartnerReview,
        bool isSplit,
        bool refundPending,
        string notes,
        List<MutableTransactionSplit> splits)
    {
        public Guid Id { get; } = id;

        public string Merchant { get; } = merchant;

        public decimal Amount { get; } = amount;

        public DateOnly TransactionDate { get; } = transactionDate;

        public string AccountName { get; } = accountName;

        public string Category { get; set; } = category;

        public string FundingSource { get; set; } = fundingSource;

        public string Owner { get; set; } = owner;

        public bool IsAcknowledged { get; set; } = isAcknowledged;

        public bool RequiresPartnerReview { get; } = requiresPartnerReview;

        public bool IsSplit { get; set; } = isSplit;

        public bool RefundPending { get; set; } = refundPending;

        public string Notes { get; set; } = notes;

        public List<MutableTransactionSplit> Splits { get; set; } = splits;
    }

    private sealed class MutableTransactionSplit(string category, string fundingSource, decimal amount, string notes)
    {
        public string Category { get; } = category;

        public string FundingSource { get; } = fundingSource;

        public decimal Amount { get; } = amount;

        public string Notes { get; } = notes;
    }

    private sealed class MutableEvent(
        Guid id,
        string name,
        string type,
        string status,
        DateOnly dueDate,
        DateOnly spendWindowStart,
        DateOnly spendWindowEnd,
        decimal plannedAmount,
        decimal fundedAmount,
        decimal actualAmount,
        string notes,
        List<string> tags,
        List<MutableEventItem> items)
    {
        public Guid Id { get; } = id;

        public string Name { get; } = name;

        public string Type { get; } = type;

        public string Status { get; set; } = status;

        public DateOnly DueDate { get; } = dueDate;

        public DateOnly SpendWindowStart { get; } = spendWindowStart;

        public DateOnly SpendWindowEnd { get; } = spendWindowEnd;

        public decimal PlannedAmount { get; set; } = plannedAmount;

        public decimal FundedAmount { get; set; } = fundedAmount;

        public decimal ActualAmount { get; } = actualAmount;

        public string Notes { get; set; } = notes;

        public List<string> Tags { get; } = tags;

        public List<MutableEventItem> Items { get; } = items;
    }

    private sealed class MutableEventItem(Guid id, string name, decimal plannedAmount, decimal actualAmount, string status)
    {
        public Guid Id { get; } = id;

        public string Name { get; } = name;

        public decimal PlannedAmount { get; } = plannedAmount;

        public decimal ActualAmount { get; } = actualAmount;

        public string Status { get; } = status;
    }
}
