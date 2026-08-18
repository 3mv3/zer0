using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Models;
using api.Services;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    private static readonly HashSet<string> AllowedRecurrenceRules = new(StringComparer.OrdinalIgnoreCase)
    {
        "one-time",
        "monthly",
        "quarterly",
        "yearly",
    };

    [HttpGet]
    public IActionResult GetAll([FromQuery] Guid? fundingPotId)
    {
        var items = financeSnapshotService.GetEvents(fundingPotId);

        return Ok(new
        {
            count = items.Count,
            items,
        });
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateEventRequest request)
    {
        var normalizedRequest = request with { RecurrenceRule = NormalizeRecurrenceRule(request.RecurrenceRule) };

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Type))
        {
            return BadRequest(new { message = "Type is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new { message = "Status is required." });
        }

        if (!AllowedRecurrenceRules.Contains(normalizedRequest.RecurrenceRule))
        {
            return BadRequest(new { message = "Recurrence must be one of: one-time, monthly, quarterly, yearly." });
        }

        var fundingPotValidationError = ValidateFundingPot(normalizedRequest.FundingPotId);

        if (fundingPotValidationError is not null)
        {
            return BadRequest(new { message = fundingPotValidationError });
        }

        if (normalizedRequest.SpendWindowStart > normalizedRequest.SpendWindowEnd)
        {
            return BadRequest(new { message = "Spend window start must be on or before the spend window end." });
        }

        var item = financeSnapshotService.CreateEvent(normalizedRequest);

        return CreatedAtAction(nameof(GetById), new { eventId = item.Id }, item);
    }

    [HttpGet("{eventId:guid}")]
    public IActionResult GetById(Guid eventId)
    {
        var item = financeSnapshotService.GetEvent(eventId);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPut("{eventId:guid}")]
    public IActionResult Update(Guid eventId, [FromBody] UpdateEventRequest request)
    {
        var normalizedRequest = request with { RecurrenceRule = NormalizeRecurrenceRule(request.RecurrenceRule) };

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new { message = "Status is required." });
        }

        if (!AllowedRecurrenceRules.Contains(normalizedRequest.RecurrenceRule))
        {
            return BadRequest(new { message = "Recurrence must be one of: one-time, monthly, quarterly, yearly." });
        }

        var fundingPotValidationError = ValidateFundingPot(normalizedRequest.FundingPotId);

        if (fundingPotValidationError is not null)
        {
            return BadRequest(new { message = fundingPotValidationError });
        }

        var item = financeSnapshotService.UpdateEvent(eventId, normalizedRequest);

        return item is null ? NotFound() : Ok(item);
    }

    private string? ValidateFundingPot(Guid? fundingPotId)
    {
        if (fundingPotId is null)
        {
            return null;
        }

        var pot = financeSnapshotService.GetPots().FirstOrDefault(item => item.Id == fundingPotId.Value);

        if (pot is null)
        {
            return "Funding pot was not found.";
        }

        return string.Equals(pot.Kind, "big-pot", StringComparison.OrdinalIgnoreCase)
            ? null
            : "Only big pots can fund events.";
    }

    private static string NormalizeRecurrenceRule(string? recurrenceRule)
    {
        return string.IsNullOrWhiteSpace(recurrenceRule)
            ? "one-time"
            : recurrenceRule.Trim().ToLowerInvariant();
    }
}
