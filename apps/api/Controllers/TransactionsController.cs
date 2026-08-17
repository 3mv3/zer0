using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Models;
using api.Services;

[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    [HttpGet("inbox")]
    public IActionResult GetInbox()
    {
        var snapshot = financeSnapshotService.GetSnapshot();

        return Ok(new
        {
            total = snapshot.Inbox.Count,
            pending = snapshot.Inbox.Count(item => !item.IsAcknowledged),
            items = snapshot.Inbox,
        });
    }

    [HttpGet("{transactionId:guid}")]
    public IActionResult GetById(Guid transactionId)
    {
        var transaction = financeSnapshotService.GetTransaction(transactionId);

        return transaction is null ? NotFound() : Ok(transaction);
    }

    [HttpPut("{transactionId:guid}")]
    public IActionResult Update(Guid transactionId, [FromBody] UpdateTransactionRequest request)
    {
        var totalSplitAmount = request.Splits.Sum(split => split.Amount);

        var existing = financeSnapshotService.GetTransaction(transactionId);

        if (existing is null)
        {
            return NotFound();
        }

        if (request.Splits.Count == 0)
        {
            return BadRequest(new { message = "At least one split is required." });
        }

        if (totalSplitAmount != existing.Amount)
        {
            return BadRequest(new { message = "Split total must equal transaction amount." });
        }

        var updated = financeSnapshotService.UpdateTransaction(transactionId, request);

        return Ok(updated);
    }
}