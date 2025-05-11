using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using StarJoinViewer.Server.Dto;
using System.Data;
using System.Data.SqlClient;

namespace StarJoinViewer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StarJoinController : ControllerBase
    {

        public class Query
        {
            public string QueryString { get; set; } = string.Empty;
        }
        public class ImenaTablica
        {
            public string NazivTablice { get; set; } = string.Empty;
            public string SQLNazivTablice { get; set; } = string.Empty;
        }

        public class Atribut
        {
            public string PunNazivAtributa { get; set; } = string.Empty;
            public string NazivAtributa { get; set; } = string.Empty;
            public string SQLNazivAtributa { get; set; } = string.Empty;
            public string Funkcija { get; set; } = string.Empty;
        }

        public class Mjera
        {
            public string NazivMjere { get; set; } = string.Empty;
            public string SQLNazivMjere { get; set; } = string.Empty;
        }

        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] ConnectionRequest request)
        {
            try
            {
                using var connection = new SqlConnection(request.ConnectionString);
                await connection.OpenAsync();
                connection.Close();

                return Ok(new { message = "Connection successful." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Connection failed: {ex.Message}" });
            }
        }

        [HttpGet("getfacttables")]
        public async Task<IActionResult> GetFactTables([FromQuery] string connectionString)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var command = new SqlCommand("SELECT sifTablica, nazTablica, nazSQLTablica FROM tablica WHERE sifTipTablica=1", connection);
                var reader = await command.ExecuteReaderAsync();

                var tables = new Dictionary<int, ImenaTablica>();
                while (await reader.ReadAsync())
                {
                    int sifTablica = reader.GetInt32(0);
                    string nazTablica = reader.GetString(1);
                    string nazSQLTablica = reader.GetString(2);
                    tables[sifTablica] = new ImenaTablica() { NazivTablice = nazTablica, SQLNazivTablice = nazSQLTablica };
                }

                return Ok(tables);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving fact tables: {ex.Message}" });
            }
        }

        [HttpGet("getdimtables")]
        public async Task<IActionResult> GetDimTables([FromQuery] string connectionString)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var command = new SqlCommand("SELECT sifTablica, nazTablica, nazSQLTablica FROM tablica WHERE sifTipTablica=2", connection);
                var reader = await command.ExecuteReaderAsync();

                var attributes = new Dictionary<int, ImenaTablica>();
                while (await reader.ReadAsync())
                {
                    int sifAtribut = reader.GetInt32(0);
                    string nazAtribut = reader.GetString(1);
                    string nazSQLAtribut = reader.GetString(2);
                    attributes[sifAtribut] = new ImenaTablica() { SQLNazivTablice = nazSQLAtribut, NazivTablice = nazAtribut };
                }

                return Ok(attributes);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving dim tables: {ex.Message}" });
            }
        }

        [HttpGet("getftabledims")]
        public async Task<IActionResult> GetFTableDims([FromQuery] string connectionString, [FromQuery] int sifTablica)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var command = new SqlCommand($"select sifTablica, nazTablica, nazSQLTablica from dimCinj join tablica on dimCinj.sifDimTablica=tablica.sifTablica where sifCinjTablica={sifTablica}", connection);
                var reader = await command.ExecuteReaderAsync();

                var data = new List<Dictionary<int, ImenaTablica>>();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<int, ImenaTablica>();
                    int sifTablica_ = reader.GetInt32(0);
                    string nazTablica = reader.GetString(1);
                    string nazSQLTablica = reader.GetString(2);
                    row[sifTablica_] = new ImenaTablica() { NazivTablice = nazTablica, SQLNazivTablice = nazSQLTablica };
                    data.Add(row);
                }

                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving fact table dimensions: {ex.Message}" });
            }
        }

        [HttpGet("getdimtableatrs")]
        public async Task<IActionResult> GetDimTableAtrs([FromQuery] string connectionString, [FromQuery] int sifTablica)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var command = new SqlCommand($"select imeAtrib, imeSQLAtrib from tabAtribut where sifTipAtrib=2 and sifTablica={sifTablica}", connection);
                var reader = await command.ExecuteReaderAsync();


                var data = new List<Mjera>();
                while (await reader.ReadAsync())
                {
                    var row = new Mjera();
                    row.NazivMjere = reader.GetString(0);
                    row.SQLNazivMjere = reader.GetString(1);
                    data.Add(row);
                }

                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving dim table attributes: {ex.Message}" });
            }
        }

        [HttpGet("getfmeasures")]
        public async Task<IActionResult> GetFMeasures([FromQuery] string connectionString, [FromQuery] int sifTablica)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var command = new SqlCommand($"select tabAtributAgrFun.imeAtrib, nazAgrFun, imeSQLAtrib, tabAtribut.imeAtrib from tabAtributAgrFun join agrFun on tabAtributAgrFun.sifAgrFun = agrFun.sifAgrFun join tabAtribut on tabAtribut.rbrAtrib = tabAtributAgrFun.rbrAtrib and tabAtribut.rbrAtrib=tabAtributAgrFun.rbrAtrib and tabAtribut.sifTablica=tabAtributAgrFun.sifTablica where tabAtributAgrFun.sifTablica ={sifTablica} and sifTipAtrib=1", connection);
                var reader = await command.ExecuteReaderAsync();


                var data = new List<Atribut>();
                while (await reader.ReadAsync())
                {
                    var row = new Atribut();
                    row.PunNazivAtributa = reader.GetString(0);
                    row.Funkcija = reader.GetString(1);
                    row.SQLNazivAtributa = reader.GetString(2);
                    row.NazivAtributa = reader.GetString(3);
                    data.Add(row);
                }

                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving dim table attributes: {ex.Message}" });
            }
        }

        [HttpGet("getdimkeys")]
        public async Task<IActionResult> GetDimKeys([FromQuery] string connectionString)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var command = new SqlCommand("select sifTablica, imeSQLAtrib from tabAtribut where rbrAtrib=1 and sifTipAtrib=2", connection);
                var reader = await command.ExecuteReaderAsync();

                var keys = new Dictionary<int, string>();
                while (await reader.ReadAsync())
                {
                    int sifTablica = reader.GetInt32(0);
                    keys[sifTablica] = reader.GetString(1);
                }

                return Ok(keys);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving dim table keys: {ex.Message}" });
            }
        }

        [HttpPost("getdatafromsql")]
        public async Task<IActionResult> GetDataFromSql([FromBody] Query query, [FromQuery] string connectionString)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand(query.QueryString, connection);
                using var reader = await command.ExecuteReaderAsync(CommandBehavior.SequentialAccess);

                var result = new List<Dictionary<string, object?>>();

                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object?>(reader.FieldCount);
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var columnName = reader.GetName(i);
                        if (await reader.IsDBNullAsync(i))
                        {
                            row[columnName] = null;
                        }
                        else
                        {
                            row[columnName] = reader.GetValue(i); // brže nego GetFieldValue za object
                        }
                    }

                    result.Add(row);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Greška pri izvršavanju upita: {ex.Message}" });
            }
        }

    }
}
