using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Services;

[ApiController]
[Route("api/obligations")]
public sealed class ObligationsController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    [HttpGet("active")]
    public IActionResult GetActive()
    {
        var snapshot = financeSnapshotService.GetSnapshot();

        return Ok(new
        {
            count = snapshot.ActiveObligations.Count,
            items = snapshot.ActiveObligations,
        });
    }
}