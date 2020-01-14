var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3001;
io.origins('*:*')
// app.use(express.static('public'));
var path = require('path');                    
app.use(express.static(path.join(__dirname, 'client/build')));

// app.post('/login', (req, res) => {
//   res.json({data:'heoll'})
// })
app.get('/login', (req, res) => {
    res.json({data:'heoll'})
})
var users = [];
var chatMsg=[
];
io.on('connection', socket => {
    // console.log(io.sockets.sockets);
    socket.on('test', m => {
        io.emit("test","hi")
    });
    socket.on('join room', function(newroom){
      if(socket.room){
        socket.leave(socket.room);
      }
      // join new room, received as function parameter
      // console.log(socket.room,socket.rooms)
      socket.join(newroom);
      socket.room = newroom;
  
  
      io.in(newroom).clients((err , clients) => {
        console.log(clients)
      });
      // io.emit('messssageage', "this is a test"); //sending to all clients, include sender
      // io.in('game').emit('message', 'cool game'); 
      // io.sockets.in('room1').emit('function', {foo:bar});
      console.log(socket.room,socket.rooms)
      socket.broadcast.to(newroom).emit('updatechat', socket.id+' joined');
      // socket.room = newroom;
      
    });
    socket.on('chat message', function(msg){
      chatMsg.push(msg);
      socket.broadcast.emit('chat message', msg);
    });
    socket.on('add user', name => {
      socket.emit('prev',{users,'chats':chatMsg});
      socket.username = name;
      users.push(name);
      socket.broadcast.emit('user joined', name);
    });
    socket.on('typing', data => {
      socket.broadcast.emit('typing', {
        typing: data,
        username: socket.username
      });
    });
    socket.on('disconnect', () => {
      socket.broadcast.emit('user left', socket.username);
      users=users.filter(i => i !== socket.username);
    });
  });
  server.listen(port);