const express = require('express');
const router = express.Router();
const { firestore, admin } = require('../config/firebase');
const { getDbConnection } = require('../config/database');

// POST /dispositivos/info
router.post('/info', async (req, res) => {
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
                    console.error('Error en la consulta MySQL:', err);
                    return res.status(500).json({ error: 'Error en la consulta de la base de datos MySQL.' });
                }

                if (results.length > 0) {
                    const dispositivo = results[0];

                    if (dispositivo.estado !== 1) {
                        return res.status(400).json({ error: 'El dispositivo está apagado.' });
                    }

                    if (dispositivo.id_usuario) {
                        return res.status(400).json({ error: 'El dispositivo ya cuenta con un dueño.' });
                    }

                    const updateQuery = 'UPDATE dispositivo SET id_usuario = ? WHERE id = ?';
                    connection.query(updateQuery, [id_usuario, id_dispositivo], async (err) => {
                        if (err) {
                            console.error('Error al actualizar el dispositivo:', err);
                            return res.status(500).json({ error: 'Error al actualizar el dispositivo en MySQL.' });
                        }

                        const dispositivoRef = firestore.collection('dispositivos').doc(`${id_dispositivo}`);
                        await dispositivoRef.set({
                            id_usuario,
                            fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
                        });

                        return res.json({ message: 'Dispositivo actualizado correctamente en MySQL y Firestore.' });
                    });
                } else {
                    return res.status(404).json({ error: 'Dispositivo no encontrado en MySQL.' });
                }
            });
        } catch (firestoreError) {
            console.error('Error en Firestore:', firestoreError);
            return res.status(500).json({ error: 'Error al interactuar con Firestore.' });
        } finally {
            connection.end();
        }
    });
});

module.exports = router;