using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Models;
using api.Services;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        var items = financeSnapshotService.GetEvents();

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

        var item = financeSnapshotService.UpdateEvent(eventId, request);

        return item is null ? NotFound() : Ok(item);
    }
}
