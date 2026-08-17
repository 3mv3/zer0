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
