namespace api.Services;

using api.Models;

public interface IFinanceSnapshotService
{
    FinanceSnapshot GetSnapshot();

    TransactionDetail? GetTransaction(Guid transactionId);

    TransactionDetail? UpdateTransaction(Guid transactionId, UpdateTransactionRequest request);

    IReadOnlyList<EventSummary> GetEvents();

    EventDetail? GetEvent(Guid eventId);

    EventDetail? UpdateEvent(Guid eventId, UpdateEventRequest request);
}