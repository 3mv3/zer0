using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Models;
using api.Services;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
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

        var fundingPotValidationError = ValidateFundingPot(request.FundingPotId);

        if (fundingPotValidationError is not null)
        {
            return BadRequest(new { message = fundingPotValidationError });
        }

        if (request.SpendWindowStart > request.SpendWindowEnd)
        {
            return BadRequest(new { message = "Spend window start must be on or before the spend window end." });
        }

        var item = financeSnapshotService.CreateEvent(request);

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
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new { message = "Status is required." });
        }

        var fundingPotValidationError = ValidateFundingPot(request.FundingPotId);

        if (fundingPotValidationError is not null)
        {
            return BadRequest(new { message = fundingPotValidationError });
        }

        var item = financeSnapshotService.UpdateEvent(eventId, request);

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
}
