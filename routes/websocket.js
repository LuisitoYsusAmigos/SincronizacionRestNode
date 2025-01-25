const WebSocket = require('ws');
const { firestore } = require('../config/firebase'); 


const webScocketAmigos = async (amigosWss) => {
  try {
    firestore.collection('amigos').onSnapshot((snapshot) => {
      const changes = snapshot.docChanges();
      const amigosActualizados = [];

      changes.forEach((change) => {
        if (change.type === 'added') {
          amigosActualizados.push({ type: 'added', data: change.doc.data() });
        } else if (change.type === 'modified') {
          amigosActualizados.push({ type: 'modified', data: change.doc.data() });
        } else if (change.type === 'removed') {
          amigosActualizados.push({ type: 'removed', data: change.doc.id });
        }
      });

      amigosWss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(amigosActualizados));
        }
      });

      //console.log('Datos enviados a los clientes WebSocket:', amigosActualizados);
    });
  } catch (error) {
    console.error('Error al escuchar cambios en Firestore:', error);
  }
};

/**
 * Maneja las conexiones de WebSocket
 */
const handleWebSocketConnection = (wss) => {
  wss.on('connection', (ws) => {
    console.log('Cliente conectado a WebSocket');

    ws.on('message', (message) => {
      console.log(`Mensaje recibido del cliente: ${message}`);
    });

    ws.on('close', () => {
      console.log('Cliente desconectado de WebSocket');
    });
  });
};

module.exports = {
  webScocketAmigos,
  handleWebSocketConnection,
};
