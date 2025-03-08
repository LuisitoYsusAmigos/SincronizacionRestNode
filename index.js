const express = require('express');
const amigosRouter = require('./routes/amigos');
const dispositivoRouter = require('./routes/dispositivos');
const placaRouter = require('./routes/placa');
require('dotenv').config();

const http = require('http');
const url = require('url');
const cors = require('cors');
const { Server: WebSocketServer } = require('ws');
const {
    webScocketAmigos,
    handleWebSocketConnection,
} = require('./routes/websocket');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

//Rutas
app.use('/amigos', amigosRouter);
app.use('/dispositivos', dispositivoRouter);
app.use('/placa', placaRouter);
//WS
const amigoWss = new WebSocketServer({ noServer: true });

handleWebSocketConnection(amigoWss);

setInterval(() => webScocketAmigos(amigoWss), 5000);

server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/amigos') {
        amigoWss.handleUpgrade(request, socket, head, (ws) => {
            amigoWss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
