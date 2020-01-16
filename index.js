var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3001;

require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.PROD_MONGODB;
const client = new MongoClient(uri, { useNewUrlParser: true });

var collection;
client.connect(err => {
  collection = client.db("User").collection("Jenny");
  //   client.close();
});

// app.post("/personnel", (request, response) => {
//     collection.insert(request.body, (error, result) => {
//         if(error) return response.status(500).send(error);
//         response.send(result.result);
//     });
// });

io.origins('*:*')
app.use(express.json())
var path = require('path');
app.use(express.static(path.join(__dirname, 'client/build')));

var rooms = {}
app.post('/login', (req, res) => {
  res.send({ data: !users.includes(req.body.data) })
})
app.get('/prev', (req, res) => {
  res.send({ rooms: Object.keys(rooms) })
})
app.post('/room', (req, res) => {
  // console.log(rooms[req.body.data])
  collection.insertOne({ data: req.body.data })

  res.send(rooms[req.body.data])
})
io.on('connection', socket => {
  // console.log(io.sockets.sockets);
  function removeUser(user, r) {
    console.log(rooms)
    if (rooms[r]) {
      if (rooms[r].users.length == 1) {
        delete rooms[r];
        io.emit('room deleted', r);
      } else {
        console.log(rooms[r].users, user)
        rooms[r].users = rooms[r].users.filter(i => i !== user)
        console.log(rooms[r].users)
      }
      socket.broadcast.to(r).emit('user left', user);
    }
  }
  socket.username = socket.id;
  socket.emit("name", socket.id)
  socket.on('join room', function (newroom) {
    if (socket.room) {
      socket.leave(socket.room);
      removeUser(socket.username, socket.room);
    }
    socket.join(newroom);
    socket.broadcast.to(newroom).emit('user joined', socket.username);

    //   io.to('room42').emit('hello', "to all clients in 'room42' room");
    // io.in('game').emit('message', 'cool game'); 
    //   console.log(socket.room,io.sockets.adapter.rooms)
    if (rooms.hasOwnProperty(newroom)) {
      rooms[newroom].users.push(socket.username);
      if (rooms[newroom].users.length == 2) io.to(newroom).emit('ready');
    } else {
      rooms[newroom] = { chats: [], moves: [], users: [socket.username] };
      io.emit('room added', newroom);
    }
    socket.room = newroom;
    //   io.clients[sessionID].send()
    // io.to(socket#id).emit('hey')
  });
  socket.on('chat message', function (msg) {
    rooms[socket.room].chats.push(msg);
    socket.broadcast.to(socket.room).emit('chat message', msg);
  });
  socket.on('move', m => {
    console.log(m)
    rooms[socket.room].moves.push(m);
    io.to(socket.room).emit('user moved', m);
  });
  socket.on('disconnect', () => {
    removeUser(socket.username, socket.room)
  });
});
server.listen(port);