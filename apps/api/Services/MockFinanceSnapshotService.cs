namespace api.Services;

using api.Models;

public sealed class MockFinanceSnapshotService : IFinanceSnapshotService
{
    public FinanceSnapshot GetSnapshot()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var cycleStart = new DateOnly(today.Year, today.Month, 25).AddMonths(today.Day < 25 ? -1 : 0);
        var cycleEnd = cycleStart.AddMonths(1);

        return new FinanceSnapshot(
            new HouseholdSummary(
                Guid.Parse("25f335ab-9d0d-4cd8-a7c3-2f05963c70c1"),
                "Varley Household",
                "GBP",
                "Matt",
                "Kris"),
            new PayCycleSummary(
                Guid.Parse("350bd72b-7aad-4c26-b088-cd9f5f84af95"),
                $"{cycleStart:dd MMM} - {cycleEnd:dd MMM}",
                cycleStart,
                cycleEnd,
                true),
            [
                new AccountSummary(Guid.Parse("6f9ec0b2-7f04-4869-b9c7-5556ec8a9445"), "Joint", "bank", 2150.24m, "GBP", true),
                new AccountSummary(Guid.Parse("f66af5f3-e362-4cd1-9ddf-32c630cd4f5f"), "AMEX", "credit-card", -1456.54m, "GBP", true),
                new AccountSummary(Guid.Parse("7c33828d-2168-42c0-a6c0-e7b3cb1e56d6"), "BA", "credit-card", -1488.45m, "GBP", true),
                new AccountSummary(Guid.Parse("25467066-bd35-484c-8d51-c7aa5dd2d6d2"), "Emergency", "savings", 3326.11m, "GBP", false),
            ],
            [
                new PotSummary(Guid.Parse("fd005179-018e-4c51-b9a2-21e9b118f1d7"), "Food", "household-budget", 400m, 292.81m, 107.19m, "Household", "reduce-remaining", false),
                new PotSummary(Guid.Parse("8e3fc9b9-f8e0-4d99-828e-a5cedb6bd4f0"), "Gift", "sinking-fund", 250m, 180.96m, 69.04m, "Household", "manual-resolution", true),
                new PotSummary(Guid.Parse("3c58f65b-9f0c-4244-9088-5f37a20cb857"), "Matt Fun", "personal-budget", 532.68m, 518.24m, 14.44m, "Matt", "take-from-another-source", false),
                new PotSummary(Guid.Parse("376c6ed2-87bf-4b16-8aa1-fa645ec19098"), "Monthly Contingency", "contingency", 50m, 68.28m, -18.28m, "Household", "manual-resolution", false),
            ],
            [
                new TransactionInboxItem(Guid.Parse("33416db0-13df-4678-8036-6ebf3d7123be"), "Tesco", 42.18m, today.AddDays(-1), "Joint", "Food", "Food", "Household", false, false, false, false),
                new TransactionInboxItem(Guid.Parse("7aa1f4ba-201e-4767-9173-7b2a2a22fc7e"), "Zara", 120m, today.AddDays(-2), "AMEX", "Unassigned", "Kris", "Kris", false, true, true, true),
                new TransactionInboxItem(Guid.Parse("74d6e751-c5a8-4a48-a58a-9f43ce771376"), "British Airways", 199m, today.AddDays(-4), "BA", "Holiday", "Bali 2026", "Household", true, false, false, false),
            ],
            [
                new ActiveObligationSummary(
                    Guid.Parse("dc97c3db-a4c3-430e-baac-eb07af17eab9"),
                    "Charlotte Wedding",
                    "Gift",
                    today.AddDays(-5),
                    today.AddDays(12),
                    252.98m,
                    252.98m,
                    252.98m,
                    0m,
                    "on-budget",
                    "resolved"),
                new ActiveObligationSummary(
                    Guid.Parse("84d6da41-88e0-48df-9a49-c8c5d352f1c7"),
                    "Kris Birthday",
                    "Gift",
                    today.AddDays(-3),
                    today.AddDays(20),
                    20m,
                    20m,
                    35m,
                    15m,
                    "over-budget",
                    "open"),
                new ActiveObligationSummary(
                    Guid.Parse("4cd7fc06-2d6c-4f7d-8779-445ac26bb012"),
                    "Bali 2026",
                    "Flights",
                    today.AddDays(-10),
                    today.AddDays(25),
                    1787m,
                    1787m,
                    199m,
                    -1588m,
                    "in-progress",
                    "open")
            ]);
    }
}