using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

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
}