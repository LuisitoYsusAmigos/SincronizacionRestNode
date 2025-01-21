const mysql = require('mysql');

const db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'qr',
};

function getDbConnection() {
    return mysql.createConnection(db_config);
}

module.exports = { getDbConnection };
