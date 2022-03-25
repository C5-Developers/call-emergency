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

let connectedPeers = [];

io.on('connection', (socket)=> {
    connectedPeers.push(socket.id);
    // console.log(connectedPeers);

    socket.on('pre-offer', (data)=> {
        console.log('pre-offer-came');
        const { calleePersonalCode, callType } = data;
        console.log(calleePersonalCode);
        console.log(connectedPeers);
        const connectedPeer = connectedPeers.find((peerSocketId) => {
           return peerSocketId === calleePersonalCode;
        });
        
        console.log(connectedPeer);

        if (connectedPeer) {
            const data = {
                callerSocketId: socket.id,
                callType,
            };

            io.to(calleePersonalCode).emit('pre-offer', data);
        }else{
            const data = {
                preOfferAnswer: 'CALLEE_NOT_FOUND',
            }
            io.to(socket.id).emit('pre-offer-answer',data);
        }
    })

    socket.on('pre-offer-answer',(data) => {
        console.log('pre offer answer came');
        console.log(data);

        const {callerSocketId} = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === callerSocketId;
         });

         if (connectedPeer){
             io.to(data.callerSocketId).emit('pre-offer-answer',data);
         }
    });

    socket.on('webRTC-signaling', (data)=>{
        const { connectedUserSocketId } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === connectedUserSocketId;
         });

         if(connectedPeer){
             io.to(connectedUserSocketId).emit('webRTC-signaling',data);
         }
    })


    socket.on('disconnect', ()=> { 
        // console.log("Usuario Desconectado"+ socket.id);

        const newConnectedPeers= connectedPeers.filter((usuarioSocketId)=>{
           return usuarioSocketId !== socket.io
        });

        connectedPeers = newConnectedPeers;
        // console.log(connectedPeers);

    });
});

server.listen(PORT, ()=>{
    console.log(`listening on ${PORT}`);
});