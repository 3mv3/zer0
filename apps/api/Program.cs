using api.Data;
using api.Services;

var builder = WebApplication.CreateBuilder(args);
var persistenceEnabled = builder.Configuration.GetValue<bool>("Persistence:Enabled");

builder.Services.AddControllers();
builder.Services.Configure<PersistenceOptions>(builder.Configuration.GetSection("Persistence"));
builder.Services.AddCors(options =>
{
    options.AddPolicy("expo-dev", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSingleton<IPostgresConnectionFactory, PostgresConnectionFactory>();
builder.Services.AddHostedService<DatabaseBootstrapService>();
if (persistenceEnabled)
{
    builder.Services.AddSingleton<IFinanceSnapshotService, DapperFinanceSnapshotService>();
}
else
{
    builder.Services.AddSingleton<IFinanceSnapshotService, MockFinanceSnapshotService>();
}

var app = builder.Build();

app.UseCors("expo-dev");

app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "zero-sum-api",
    utc = DateTime.UtcNow,
}));

app.Run();
