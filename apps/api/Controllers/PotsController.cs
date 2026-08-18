using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Models;
using api.Services;

[ApiController]
[Route("api/pots")]
public sealed class PotsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        var items = financeSnapshotService.GetPots();

        return Ok(new
        {
            count = items.Count,
            items,
        });
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreatePotRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Kind))
        {
            return BadRequest(new { message = "Kind is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Owner))
        {
            return BadRequest(new { message = "Owner is required." });
        }

        if (string.IsNullOrWhiteSpace(request.OverspendRule))
        {
            return BadRequest(new { message = "Overspend rule is required." });
        }

        var created = financeSnapshotService.CreatePot(request);

        return CreatedAtAction(nameof(GetAll), new { potId = created.Id }, created);
    }

    [HttpPut("{potId:guid}")]
    public IActionResult Update(Guid potId, [FromBody] UpdatePotRequest request)
    {
        var updated = financeSnapshotService.UpdatePot(potId, request);

        return updated is null ? NotFound() : Ok(updated);
    }
}