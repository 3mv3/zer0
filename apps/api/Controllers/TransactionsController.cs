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

    [HttpPost]
    public IActionResult Create([FromBody] CreateTransactionRequest request)
    {
        var normalizedRequest = request with
        {
            Splits = NormalizeSplits(request.IsSplit, request.Amount, request.Category, request.FundingSource, request.Notes, request.Splits),
        };

        var validationError = ValidateTransactionRequest(request.Amount, normalizedRequest.Splits, request.Merchant, request.AccountName);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var created = financeSnapshotService.CreateTransaction(normalizedRequest);

        return CreatedAtAction(nameof(GetById), new { transactionId = created.Id }, created);
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
        var existing = financeSnapshotService.GetTransaction(transactionId);

        if (existing is null)
        {
            return NotFound();
        }

        var normalizedRequest = request with
        {
            Splits = NormalizeSplits(request.IsSplit, existing.Amount, request.Category, request.FundingSource, request.Notes, request.Splits),
        };

        var validationError = ValidateTransactionRequest(existing.Amount, normalizedRequest.Splits, existing.Merchant, existing.AccountName);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var updated = financeSnapshotService.UpdateTransaction(transactionId, normalizedRequest);

        return Ok(updated);
    }

    private static IReadOnlyList<UpdateTransactionSplitRequest> NormalizeSplits(
        bool isSplit,
        decimal amount,
        string category,
        string fundingSource,
        string notes,
        IReadOnlyList<UpdateTransactionSplitRequest> splits)
    {
        if (isSplit)
        {
            return splits;
        }

        return
        [
            new UpdateTransactionSplitRequest(
                category,
                fundingSource,
                amount,
                notes)
        ];
    }

    private static string? ValidateTransactionRequest(decimal amount, IReadOnlyList<UpdateTransactionSplitRequest> splits, string merchant, string accountName)
    {
        if (string.IsNullOrWhiteSpace(merchant))
        {
            return "Merchant is required.";
        }

        if (string.IsNullOrWhiteSpace(accountName))
        {
            return "Account name is required.";
        }

        if (splits.Count == 0)
        {
            return "At least one split is required.";
        }

        var totalSplitAmount = splits.Sum(split => split.Amount);

        return totalSplitAmount != amount ? "Split total must equal transaction amount." : null;
    }
}