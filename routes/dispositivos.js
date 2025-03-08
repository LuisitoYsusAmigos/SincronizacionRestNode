const express = require('express');
const router = express.Router();
const { firestore, admin } = require('../config/firebase');
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


// POST /dispositivos/info
router.post('/asignar_dispositivo', async (req, res) => {
    const data = req.body;

    if (!data || (!data.id_dispositivo && !data.id_usuario)) {
        return res.status(400).json({ error: 'Datos incompletos. Se requiere id_dispositivo o id_usuario.' });
    }

    const { id_dispositivo, id_usuario } = data;
    const connection = getDbConnection();

    connection.connect(async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar a la base de datos MySQL.' });
        }

        try {
            const selectQuery = 'SELECT * FROM dispositivo WHERE id = ?';
            connection.query(selectQuery, [id_dispositivo], async (err, results) => {
                if (err) {
                    console.error('Error en la consulta MySQL 1 :', err);
                    return res.status(500).json({ error: 'Error en la consulta de la base de datos MySQL.' });
                }

                if (results.length > 0) {
                    const dispositivo = results[0];

                    if (dispositivo.estado !== 1) {
                        connection.end(); // Finalizamos la conexión aquí si hay un error.
                        return res.status(400).json({ error: 'El dispositivo está apagado.' });
                    }

                    if (dispositivo.id_usuario) {
                        connection.end(); // Finalizamos la conexión aquí si hay un error.
                        return res.status(400).json({ error: 'El dispositivo ya cuenta con un dueño.' });
                    }

                    console.log("los datos son:", id_usuario, " ", id_dispositivo);

                    const updateQuery = 'UPDATE dispositivo SET id_usuario = ? WHERE id = ?';
                    connection.query(updateQuery, [id_usuario, id_dispositivo], async (err) => {
                        if (err) {
                            console.error('Error al actualizar el dispositivo:', err);
                            connection.end(); // Finalizamos la conexión aquí en caso de error.
                            return res.status(500).json({
                                error: 'Error al actualizar el dispositivo en MySQL.',
                                query: updateQuery,
                            });
                        }

                        // Actualizar en Firestore
                        try {
                            const dispositivoRef = firestore.collection('dispositivos').doc(`${id_dispositivo}`);
                            await dispositivoRef.set({
                                id_usuario,
                                fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
                            });

                            res.json({ message: 'Dispositivo actualizado correctamente en MySQL y Firestore.' });
                        } catch (firestoreError) {
                            console.error('Error en Firestore:', firestoreError);
                            return res.status(500).json({ error: 'Error al interactuar con Firestore.' });
                        } finally {
                            connection.end(); // Finalizamos la conexión aquí después de todas las operaciones.
                        }
                    });
                } else {
                    connection.end(); // Finalizamos la conexión aquí si no se encuentra el dispositivo.
                    return res.status(404).json({ error: 'Dispositivo no encontrado en MySQL.' });
                }
            });
        } catch (firestoreError) {
            console.error('Error en Firestore:', firestoreError);
            return res.status(500).json({ error: 'Error al interactuar con Firestore.' });
        }
    });
});



router.post('/encendidoPlaca', (req, res) => {
    const data = req.body;

    if (!data || !data.id_dispositivo) {
        return res.status(400).json({ error: 'Datos incompletos. Se requiere id_dispositivo.' });
    }

    const id_dispositivo = data.id_dispositivo;
    const connection = getDbConnection();

    connection.connect((err) => {
        if (err) {
            console.error('Error al conectar a la base de datos MySQL:', err);
            return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
        }

        // Verifica si el dispositivo existe
        const selectQuery = 'SELECT * FROM dispositivo WHERE id = ?';
        connection.query(selectQuery, [id_dispositivo], (err, results) => {
            if (err) {
                console.error('Error en la consulta MySQL:', err);
                connection.end();
                return res.status(500).json({ error: 'Error en la consulta de la base de datos MySQL.' });
            }

            if (results.length > 0) {
                // Si el dispositivo existe, llama al procedimiento almacenado
                const dispositivo = results[0];
                const callQuery = 'CALL CambiarEstadoTemporal(?)';
                connection.query(callQuery, [id_dispositivo], (err) => {
                    if (err) {
                        console.error('Error al ejecutar el procedimiento:', err);
                        connection.end();
                        return res.status(500).json({ error: 'Error al ejecutar el procedimiento.' });
                    }

                    connection.end();
                    return res.json({ message: 'Estado activado temporalmente para el dispositivo.' });
                });
            } else {
                // Si el dispositivo no existe
                connection.end();
                return res.status(404).json({ error: 'No existe ese dispositivo.' });
            }
        });
    });
});


module.exports = router;