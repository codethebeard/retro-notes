var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs');
var os = require('os');

var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

app.use(express.static('.'))

// Routes
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

http.listen(3000, function(){
  console.log('Listening on http://' + addresses[0] + ':3000');
})

saveJSON = function(){
  fs.writeFile('cardList.json', JSON.stringify(cardList), function(error){
    if(error) throw error;
    // console.log("New File Saved");
  })
}

var cardList = {
  "good":[],
  "bad":[],
  "learned":[]
}

// Sockets
io.on('connection', function(socket){
  console.log('User Connected')
  io.emit('notification', "New User Joined")

  socket.on('disconnect', function(){
    io.emit('notification', "A User Left")
    console.log('User disconnected')
  })

  socket.on('updateCard', function(list){
    // console.log("Cards Updated");
    cardList = list

    // Let others know.
    io.emit('cardList', cardList)
    saveJSON()
  })

  socket.on('getCardList', function(){
    socket.emit('cardList', cardList)
  })

})
