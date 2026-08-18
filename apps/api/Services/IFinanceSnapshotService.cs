namespace api.Services;

using api.Models;

public interface IFinanceSnapshotService
{
    FinanceSnapshot GetSnapshot();

    IReadOnlyList<PotSummary> GetPots();

    PotSummary CreatePot(CreatePotRequest request);

    PotSummary? UpdatePot(Guid potId, UpdatePotRequest request);

    TransactionDetail CreateTransaction(CreateTransactionRequest request);

    TransactionDetail? GetTransaction(Guid transactionId);

    TransactionDetail? UpdateTransaction(Guid transactionId, UpdateTransactionRequest request);

    IReadOnlyList<EventSummary> GetEvents(Guid? fundingPotId = null);

    EventDetail CreateEvent(CreateEventRequest request);

    EventDetail? GetEvent(Guid eventId);

    EventDetail? UpdateEvent(Guid eventId, UpdateEventRequest request);

    IReadOnlyList<AuditEntry> GetAuditEntries();
}