namespace api.Models;

public sealed record FinanceSnapshot(
    HouseholdSummary Household,
    PayCycleSummary CurrentPayCycle,
    IReadOnlyList<AccountSummary> Accounts,
    IReadOnlyList<PotSummary> Pots,
    IReadOnlyList<TransactionInboxItem> Inbox,
    IReadOnlyList<ActiveObligationSummary> ActiveObligations,
    IReadOnlyList<EventSummary> Events);

public sealed record HouseholdSummary(Guid Id, string Name, string BaseCurrency, string OwnerName, string PartnerName);

public sealed record PayCycleSummary(Guid Id, string Label, DateOnly StartDate, DateOnly EndDate, bool IsCurrent);

public sealed record AccountSummary(Guid Id, string Name, string Type, decimal Balance, string Currency, bool IsJoint);

public sealed record PotSummary(
    Guid Id,
    string Name,
    string Kind,
    decimal PlannedAmount,
    decimal ActualAmount,
    decimal RemainingAmount,
    string Owner,
    string OverspendRule,
    bool CarryForwardEnabled,
    bool ShowOnDashboard);

public sealed record CreatePotRequest(
    string Name,
    string Kind,
    decimal PlannedAmount,
    string Owner,
    string OverspendRule,
    bool CarryForwardEnabled,
    bool ShowOnDashboard);

public sealed record UpdatePotRequest(
    decimal PlannedAmount,
    bool ShowOnDashboard);

public sealed record TransactionInboxItem(
    Guid Id,
    string Merchant,
    decimal Amount,
    DateOnly TransactionDate,
    string AccountName,
    string Category,
    string FundingSource,
    Guid? EventId,
    string? EventName,
    string Owner,
    bool IsAcknowledged,
    bool RequiresPartnerReview,
    bool IsSplit,
    bool RefundPending);

public sealed record TransactionSplitLine(
    Guid Id,
    string Category,
    string FundingSource,
    decimal Amount,
    string Notes);

public sealed record TransactionDetail(
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
    string Notes,
    IReadOnlyList<TransactionSplitLine> Splits);

public sealed record CreateTransactionRequest(
    string AccountName,
    string Merchant,
    decimal Amount,
    DateOnly TransactionDate,
    string SourceProvider,
    string ExternalTransactionId,
    string Category,
    string FundingSource,
    Guid? EventId,
    string Owner,
    bool RequiresPartnerReview,
    bool IsAcknowledged,
    bool IsSplit,
    bool RefundPending,
    string Notes,
    IReadOnlyList<UpdateTransactionSplitRequest> Splits);

public sealed record UpdateTransactionRequest(
    string Category,
    string FundingSource,
    Guid? EventId,
    string Owner,
    bool IsSplit,
    bool RefundPending,
    bool IsAcknowledged,
    string Notes,
    IReadOnlyList<UpdateTransactionSplitRequest> Splits);

public sealed record UpdateTransactionSplitRequest(
    string Category,
    string FundingSource,
    decimal Amount,
    string Notes);

public sealed record ActiveObligationSummary(
    Guid Id,
    Guid EventId,
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

public sealed record EventSummary(
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
    string VarianceStatus);

public sealed record EventBudgetItem(
    Guid Id,
    string Name,
    decimal PlannedAmount,
    decimal ActualAmount,
    string Status);

public sealed record EventDetail(
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
    string Notes,
    IReadOnlyList<string> Tags,
    IReadOnlyList<EventBudgetItem> Items);

public sealed record CreateEventRequest(
    string Name,
    string Type,
    string Status,
    Guid? FundingPotId,
    DateOnly DueDate,
    DateOnly SpendWindowStart,
    DateOnly SpendWindowEnd,
    decimal PlannedAmount,
    decimal FundedAmount,
    string Notes,
    IReadOnlyList<string> Tags);

public sealed record UpdateEventRequest(
    string Status,
    Guid? FundingPotId,
    decimal PlannedAmount,
    decimal FundedAmount,
    string Notes);

public sealed record AuditEntry(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string Action,
    string Summary,
    string DetailJson,
    DateTime CreatedUtc);