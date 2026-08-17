using api.Data;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddSingleton<api.Services.IFinanceSnapshotService, api.Services.MockFinanceSnapshotService>();

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
