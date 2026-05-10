const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Backend funcionando 🚀');
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log('Servidor iniciado');
});

app.get('/reservas', (req, res) => {
   res.send('Aquí estarán las reservas');
});