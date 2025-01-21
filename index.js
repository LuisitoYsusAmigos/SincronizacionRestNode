const express = require('express');
const cors = require('cors');
const amigosRoutes = require('./routes/amigos');
const dispositivosRoutes = require('./routes/dispositivos');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/amigos', amigosRoutes);
app.use('/dispositivos', dispositivosRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});