var express = require('express');
var app = express();
// var server = require('http').Server(app);
// var io = require('socket.io')(server);
var port = process.env.PORT || 3001;

// app.use(express.static('public'));                    
app.use(express.json())

// app.post('/login', (req, res) => {
//   res.json({data:'heoll'})
// })
app.get('/login', (req, res) => {
    res.json({data:'heoll'})
})
app.listen(port);