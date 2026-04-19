const mysql = require('mysql2');

const connection = mysql.createConnection({
host: 'localhost',
user: 'root',        
password: '1234',  
database: 'employees'
});

connection.connect((err) => {
if (err) {
    console.log('❌ Error de conexión:', err.message);
    return;
}
console.log('✅ Conectado a MySQL');
});

module.exports = connection;

