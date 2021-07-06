const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/message');
const { userJoin, getCurrentUser, userLeave, getRoomUser } = require('./utils/users');



const app = express();
const server = http.createServer(app);
const io = socketio(server);
//set static folder

app.use(express.static(path.join(__dirname, 'public')));

botName = 'LetsTalk Assistant';

//run when client runs
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        socket.emit('message', formatMessage(botName, '<h2> Welcome to LetsTalk! </h2>'));

        //broadcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `<h3> ${user.username} has joined the Room </h3>`));

        //send users and room
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUser(user.room)
        });
    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `<h3>${user.username} has left the Room </h3>`));

            //send users and room
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUser(user.room)
            });
        }
    });
});

const PORT = 3001 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));