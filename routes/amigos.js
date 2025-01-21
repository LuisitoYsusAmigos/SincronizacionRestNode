const express = require('express');
const router = express.Router();
const { firestore } = require('../config/firebase');

// GET /amigos
router.get('/', async (req, res) => {
    try {
        const amigosRef = firestore.collection('amigos');
        const snapshot = await amigosRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No se encontraron amigos' });
        }

        const amigos = [];
        snapshot.forEach(doc => {
            amigos.push({ id: doc.id, ...doc.data() });
        });

        return res.json(amigos);
    } catch (error) {
        console.error('Error al obtener la colección amigos:', error);
        return res.status(500).json({ error: 'Error al obtener los datos de Firestore' });
    }
});

// POST /amigos
router.post('/', async (req, res) => {
    try {
        const { idUsuario, idAmigo } = req.body;

        if (!idUsuario || !idAmigo) {
            return res.status(400).json({ 
                error: 'Datos incompletos. Se requiere idUsuario y idAmigo.' 
            });
        }

        if (idUsuario === idAmigo) {
            return res.status(400).json({ 
                error: 'Un usuario no puede ser amigo de sí mismo.' 
            });
        }

        const amigosRef = firestore.collection('amigos');

        const [id1, id2] = [idUsuario, idAmigo].sort();
        const documentId = `${id1}_${id2}`;

        const existingDoc = await amigosRef.doc(documentId).get();
        if (existingDoc.exists) {
            return res.status(400).json({ 
                error: 'Esta relación de amistad ya existe.' 
            });
        }

        await amigosRef.doc(documentId).set({
            usuarios: [idUsuario, idAmigo],
            fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({ 
            message: 'Relación de amistad creada correctamente',
            id: documentId
        });

    } catch (error) {
        console.error('Error al crear relación de amistad:', error);
        return res.status(500).json({ 
            error: 'Error al crear relación de amistad en Firestore' 
        });
    }
});


// GET /amigos/:idUsuario
router.get('/:idUsuario', async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const amigosRef = firestore.collection('amigos');
        
        const amistades = await amigosRef
            .where('idUsuario', '==', idUsuario)
            .get();

        const amigos = [];
        amistades.forEach(doc => {
            const data = doc.data();
            amigos.push({
                id: doc.id,
                ...data
            });
        });

        return res.json(amigos);
    } catch (error) {
        console.error('Error al obtener amigos:', error);
        return res.status(500).json({ 
            error: 'Error al obtener amigos' 
        });
    }
});

// DELETE /amigos/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const amigosRef = firestore.collection('amigos');

        await amigosRef.doc(id).delete();

        return res.json({ 
            message: 'Relación de amistad eliminada correctamente' 
        });
    } catch (error) {
        console.error('Error al eliminar relación de amistad:', error);
        return res.status(500).json({ 
            error: 'Error al eliminar relación de amistad' 
        });
    }
});


module.exports = router;