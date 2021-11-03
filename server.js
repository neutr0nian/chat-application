const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'BOT';

//run when client connects
io.on('connection', (socket)=>{
    console.log("New web socket connection");
    
    //on join
    socket.on('joinRoom', ({username, room}) => {
        
        const user = userJoin(socket.id,username, room);

        socket.join(user.room);

        //new user connection
        socket.emit('message', formatMessage(botName,'Welcome to the chatCord'));

        //broadcase when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat room`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })
   
    //broadcast to everybody
    // io.emit();

    //listen for chat message
    socket.on('chatMessage', (message) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username,message));
    });

    //disconnects
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat room`));
        }
        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});