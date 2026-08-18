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

        var sqlDirectory = Path.Combine(environment.ContentRootPath, "Data", "Sql");

        if (!Directory.Exists(sqlDirectory))
        {
            logger.LogWarning("Bootstrap SQL directory not found at {SqlDirectory}", sqlDirectory);
            return;
        }

        var scriptPaths = Directory
            .GetFiles(sqlDirectory, "*.sql", SearchOption.TopDirectoryOnly)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (scriptPaths.Length == 0)
        {
            logger.LogWarning("No bootstrap SQL scripts were found in {SqlDirectory}", sqlDirectory);
            return;
        }

        await using var connection = (NpgsqlConnection)connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        foreach (var scriptPath in scriptPaths)
        {
            var sql = await File.ReadAllTextAsync(scriptPath, cancellationToken);
            await connection.ExecuteAsync(new CommandDefinition(sql, cancellationToken: cancellationToken));
            logger.LogInformation("Applied bootstrap script {ScriptName}", Path.GetFileName(scriptPath));
        }

        logger.LogInformation("Phase 1 schema bootstrap completed using Dapper.");
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
