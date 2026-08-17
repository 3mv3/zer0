namespace api.Services;

using api.Models;

public interface IFinanceSnapshotService
{
    FinanceSnapshot GetSnapshot();
}