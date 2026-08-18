using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Models;
using api.Services;

[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    private const string SplitParentValue = "Split";

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
        var normalizedRequest = NormalizeCreateRequest(request);

        var linkedEventError = ValidateLinkedEvent(normalizedRequest.FundingSource, normalizedRequest.EventId, normalizedRequest.IsSplit);

        if (linkedEventError is not null)
        {
            return BadRequest(new { message = linkedEventError });
        }

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

        var normalizedRequest = NormalizeUpdateRequest(request, existing.Amount);

        var linkedEventError = ValidateLinkedEvent(normalizedRequest.FundingSource, normalizedRequest.EventId, normalizedRequest.IsSplit);

        if (linkedEventError is not null)
        {
            return BadRequest(new { message = linkedEventError });
        }

        var validationError = ValidateTransactionRequest(existing.Amount, normalizedRequest.Splits, existing.Merchant, existing.AccountName);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var updated = financeSnapshotService.UpdateTransaction(transactionId, normalizedRequest);

        return Ok(updated);
    }

    private static CreateTransactionRequest NormalizeCreateRequest(CreateTransactionRequest request)
    {
        var parentCategory = request.IsSplit ? SplitParentValue : request.Category;
        var parentFundingSource = request.IsSplit ? SplitParentValue : request.FundingSource;

        return request with
        {
            Category = parentCategory,
            FundingSource = parentFundingSource,
            Splits = NormalizeSplits(request.IsSplit, request.Amount, parentCategory, parentFundingSource, request.Notes, request.Splits),
        };
    }

    private static UpdateTransactionRequest NormalizeUpdateRequest(UpdateTransactionRequest request, decimal amount)
    {
        var parentCategory = request.IsSplit ? SplitParentValue : request.Category;
        var parentFundingSource = request.IsSplit ? SplitParentValue : request.FundingSource;

        return request with
        {
            Category = parentCategory,
            FundingSource = parentFundingSource,
            Splits = NormalizeSplits(request.IsSplit, amount, parentCategory, parentFundingSource, request.Notes, request.Splits),
        };
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

    private string? ValidateLinkedEvent(string fundingSource, Guid? eventId, bool isSplit)
    {
        if (eventId is null)
        {
            return null;
        }

        if (isSplit)
        {
            return "Linked events are only available when the funding source is a big pot.";
        }

        var pots = financeSnapshotService.GetPots();
        var fundingPot = pots.FirstOrDefault(pot => string.Equals(pot.Name, fundingSource, StringComparison.OrdinalIgnoreCase));

        if (fundingPot is null || !string.Equals(fundingPot.Kind, "big-pot", StringComparison.OrdinalIgnoreCase))
        {
            return "Linked events are only available when the funding source is a big pot.";
        }

        var linkedEvent = financeSnapshotService.GetEvent(eventId.Value);

        if (linkedEvent is null)
        {
            return "Linked event was not found.";
        }

        return linkedEvent.FundingPotId == fundingPot.Id
            ? null
            : "The linked event does not belong to the selected big pot.";
    }
}