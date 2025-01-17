const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Para analizar solicitudes JSON

// Configura la conexión a la base de datos
const db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'qr'
};

// Crea una función para obtener la conexión a la base de datos
function getDbConnection() {
    return mysql.createConnection(db_config);
}

// Ruta para obtener la información de un dispositivo
app.post('/info_dispositivo', (req, res) => {
    const data = req.body;

    if (!data || (!data.id_dispositivo && !data.id_usuario)) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const { id_dispositivo, id_usuario } = data;

    const connection = getDbConnection();

    connection.connect(err => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar a la base de datos' });
        }

        // Consulta para obtener la información completa del dispositivo
        const selectQuery = 'SELECT * FROM dispositivo WHERE id = ?';
        connection.query(selectQuery, [id_dispositivo], (err, results) => {
            if (err) {
                console.log("Este es el error de conexión");
                console.log(err);
                return res.status(500).json({ error: 'Error en la consulta de la base de datos' });
            }

            if (results.length > 0) {
                const dispositivo = results[0];
                console.log("Dispositivo: " + dispositivo.id_usuario);
                if (dispositivo.estado == 1) {
                    if (dispositivo.id_usuario == null) {
                        // Si el dispositivo no tiene usuario, actualizamos su id_usuario
                        const updateQuery = 'UPDATE dispositivo SET id_usuario = ? WHERE id = ?';
                        connection.query(updateQuery, [id_usuario, id_dispositivo], (err, updateResult) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al actualizar el dispositivo' });
                            }
                            // Cierra la conexión solo después de todas las operaciones
                            connection.end();
                            return res.json({ message: 'Dispositivo actualizado correctamente' });
                        });
                    } else {
                        connection.end();
                        return res.status(500).json({ error: 'El dispositivo ya cuenta con dueño' });
                    }
                } else {
                    connection.end();
                    return res.status(500).json({ error: 'Dispositivo apagado' });
                }
            } else {
                connection.end();
                return res.status(404).json({ error: 'Dispositivo no encontrado' });
            }
        });
    });
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
