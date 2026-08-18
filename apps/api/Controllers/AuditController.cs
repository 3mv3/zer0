using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

using api.Services;

[ApiController]
[Route("api/audit")]
public sealed class AuditController(IFinanceSnapshotService financeSnapshotService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetRecent()
    {
        var items = financeSnapshotService.GetAuditEntries();

        return Ok(new
        {
            count = items.Count,
            items,
        });
    }
}