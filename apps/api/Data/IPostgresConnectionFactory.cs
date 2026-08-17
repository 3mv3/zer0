namespace api.Data;

using System.Data;

public interface IPostgresConnectionFactory
{
    IDbConnection CreateConnection();
}
