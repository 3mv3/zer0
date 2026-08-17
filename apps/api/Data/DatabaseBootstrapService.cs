namespace api.Data;

using Dapper;
using Npgsql;

public sealed class DatabaseBootstrapService(
    ILogger<DatabaseBootstrapService> logger,
    IPostgresConnectionFactory connectionFactory,
    IHostEnvironment environment,
    IConfiguration configuration) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var options = configuration.GetSection("Persistence").Get<PersistenceOptions>() ?? new PersistenceOptions();

        if (!options.Enabled || !options.BootstrapOnStart)
        {
            logger.LogInformation("Dapper bootstrap skipped because persistence is disabled or bootstrapping is off.");
            return;
        }

        var schemaPath = Path.Combine(environment.ContentRootPath, "Data", "Sql", "001_initial.sql");

        if (!File.Exists(schemaPath))
        {
            logger.LogWarning("Schema bootstrap file not found at {SchemaPath}", schemaPath);
            return;
        }

        await using var connection = (NpgsqlConnection)connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = await File.ReadAllTextAsync(schemaPath, cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(sql, cancellationToken: cancellationToken));

        logger.LogInformation("Phase 1 schema bootstrap completed using Dapper.");
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
