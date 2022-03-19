const express = require('express');
const http = require("http");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static("public"));

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/public/index.html');
});

let usuariosConectados = [];

io.on('connection', (socket)=> {
    usuariosConectados.push(socket.id);
    console.log(usuariosConectados);

    socket.on('disconnect', ()=> { 
        console.log("Usuario Desconectado"+ socket.id);

        const newUsuarioConectado = usuariosConectados.filter((usuarioSocketId)=>{
           return usuarioSocketId !== socket.io
        });

        usuariosConectados = newUsuarioConectado;
        console.log(usuariosConectados);

    });
});

server.listen(PORT, ()=>{
    console.log(`listening on ${PORT}`);
});