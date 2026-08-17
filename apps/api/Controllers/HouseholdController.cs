using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Services;

[ApiController]
[Route("api/household")]
public sealed class HouseholdController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    [HttpGet("overview")]
    public IActionResult GetOverview()
    {
        var snapshot = financeSnapshotService.GetSnapshot();

        return Ok(new
        {
            snapshot.Household,
            snapshot.CurrentPayCycle,
            snapshot.Accounts,
            snapshot.Pots,
        });
    }
}