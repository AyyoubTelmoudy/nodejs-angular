const express = require('express');
const app = express();
const cors = require('cors')
const { ExpressPeerServer } = require('peer');
const server = require('http').createServer(app);


const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
  });


app.use(
    cors({origin: ['http://localhost:4200', 'http://127.0.0.1:4200']})
  );

app.use('/', peerServer);

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', socket => {
    console.log('user connected ')
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId)

        socket.on('change-stream', (roomId, userId,data) => {
           socket.broadcast.to(roomId).emit('user-change-stream',userId,data)
        })

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    });
})
 
server.listen(3000,()=>{
 console.log("server is listening !!!!")
});

