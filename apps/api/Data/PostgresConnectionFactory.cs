namespace api.Data;

using System.Data;

using Npgsql;

public sealed class PostgresConnectionFactory(IConfiguration configuration) : IPostgresConnectionFactory
{
    private readonly string? _connectionString = configuration.GetConnectionString("Postgres");

    public IDbConnection CreateConnection()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:Postgres is not configured.");
        }

        return new NpgsqlConnection(_connectionString);
    }
}
