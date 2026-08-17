namespace api.Models;

public sealed record FinanceSnapshot(
    HouseholdSummary Household,
    PayCycleSummary CurrentPayCycle,
    IReadOnlyList<AccountSummary> Accounts,
    IReadOnlyList<PotSummary> Pots,
    IReadOnlyList<TransactionInboxItem> Inbox,
    IReadOnlyList<ActiveObligationSummary> ActiveObligations);

public sealed record HouseholdSummary(Guid Id, string Name, string BaseCurrency, string OwnerName, string PartnerName);

public sealed record PayCycleSummary(Guid Id, string Label, DateOnly StartDate, DateOnly EndDate, bool IsCurrent);

public sealed record AccountSummary(Guid Id, string Name, string Type, decimal Balance, string Currency, bool IsJoint);

public sealed record PotSummary(
    Guid Id,
    string Name,
    string Type,
    decimal PlannedAmount,
    decimal ActualAmount,
    decimal RemainingAmount,
    string Owner,
    string OverspendRule,
    bool CarryForwardEnabled);

public sealed record TransactionInboxItem(
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
    bool RefundPending);

public sealed record ActiveObligationSummary(
    Guid Id,
    string EventName,
    string ItemName,
    DateOnly SpendWindowStart,
    DateOnly SpendWindowEnd,
    decimal PlannedAmount,
    decimal FundedAmount,
    decimal ActualAmount,
    decimal VarianceAmount,
    string VarianceStatus,
    string ResolutionStatus);