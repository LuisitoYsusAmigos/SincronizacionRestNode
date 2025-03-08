const express = require('express');
const router = express.Router();
//const { firestore, admin } = require('../config/firebase');
const { getDbConnection } = require('../config/database');


// GET /testmql
// GET /test_mysql
router.get('/test_mysql', (req, res) => {
    const connection = getDbConnection();

    connection.connect((err) => {
        if (err) {
            console.error('Error al conectar a la base de datos MySQL:', err);
            return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
        }

        connection.end();
        return res.json({ message: 'Conexión a la base de datos MySQL exitosa.' });
    });
});
module.exports = router;