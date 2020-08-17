const mysql = require('mysql');

function connectionErrorHandler (err) {
  if (err) {
    console.log('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Database successfully connected!');
}

const Database = (function () {
  var connection;

  function createInstance() {
    connection = mysql.createConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT
    });
    
    connection.on('error', function (error) {
      // Reestabelece a conexão quando o banco de dados a encerrar
      // if (error.code == 'PROTOCOL_CONNECTION_LOST') createInstance();

      // Reseta a variável pra que o getConnection possa criar uma nova
      if (error.code == 'PROTOCOL_CONNECTION_LOST') {
        console.log('Server disconnected from database.');
        connection = undefined;
      };

      // TODO: Tratar demais erros.
    });
    
    connection.connect(connectionErrorHandler);
    
    return;
  }

  return {
    getConnection: function () {
      if (!connection) {
        createInstance();
      }
      return connection;
    }
  }
})();

module.exports = Database;