const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let messageHistory = [];

io.on('connection', (socket) => {
    // Gestion du chat
    socket.emit('load history', messageHistory);
    socket.on('chat message', (data) => {
        messageHistory.push(data);
        if (messageHistory.length > 50) messageHistory.shift();
        io.emit('chat message', data);
    });

    // Gestion de la création des balles
    socket.on('add ball', (ball) => {
        io.emit('new ball', ball); // Diffuse à tout le monde
    });

    // Gestion de la synchronisation du mouvement
    socket.on('update ball', (data) => {
        // Diffuse à tous les autres utilisateurs sauf celui qui a lancé l'action
        socket.broadcast.emit('move ball', data);
    });
});

http.listen(3000, () => console.log('Serveur actif sur http://localhost:3000'));
