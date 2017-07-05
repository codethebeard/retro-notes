var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs');
var os = require('os');
var officegen = require('officegen');
var async = require('async');

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

app.get('/review', function(req, res){
  res.sendFile(__dirname + '/review.html')
})

http.listen(3000, function(){
  console.log('Listening on http://' + addresses[0] + ':3000');
})

saveJSON = function(){
  fs.writeFile('data/cardList.json', JSON.stringify(cardList), function(error){
    if(error) throw error;
  })
}

var cardList = {};
fs.readFile('data/cardList.json', function(err, data) {
  if (err) throw err;
  cardList = JSON.parse(data);
});

// Sockets
io.on('connection', function(socket){
  console.log('User Connected')
  io.emit('notification', "New User Joined")

  socket.on('disconnect', function(){
    // io.emit('notification', "A User Left")
    console.log('User disconnected')
  })

  socket.on('reset', function(){
    console.log("Reset triggered");
    io.emit('notification', "Reset has been triggered")
    cardList = {"good":[],"bad":[],"learned":[]};
    saveJSON()
    io.emit('resetBrowser');
    socket.emit('cardList', cardList)
  });

  socket.on('updateCard', function(list){
    console.log("Cards Updated");
    cardList = list

    // Let others know.
    io.emit('cardList', cardList)
    saveJSON()
  })

  socket.on('getCardList', function(){
    socket.emit('cardList', cardList)
  })

  socket.on('microdoc', function(){
      console.log("microdoc")
      var docx = officegen({
        type: 'docx',
        orientation: 'portrait'
      });

      docx.on('error', function ( err ) {
			  console.log(err);
		  });

      fs.readFile('data/cardList.json', function(err, data) {
        if (err) throw err;
        var good = JSON.parse(data)['good'];
        var bad = JSON.parse(data)['bad'];
        var learned = JSON.parse(data)['learned'];

        var pObj = docx.createP({align: 'center'});
        pObj.addText('Retrospective Review', { bold: true })

        var pObj = docx.createP();
        pObj.addText('Good', { bold: true })
        for (var content in good) {
          if (good.hasOwnProperty(content)) {
            var pObj = docx.createListOfNumbers();
            pObj.addText ( good[content].content );
          }
        }

        var pObj = docx.createP();
        pObj.addText('Bad', { bold: true })
        for (var content in bad) {
          if (bad.hasOwnProperty(content)) {
            var pObj = docx.createListOfNumbers();
            pObj.addText ( bad[content].content );
          }
        }

        var pObj = docx.createP();
        pObj.addText('Learned', { bold: true })
        for (var content in learned) {
          if (learned.hasOwnProperty(content)) {
            console.log(content);
            var pObj = docx.createListOfNumbers();
            pObj.addText ( learned[content].content );
          }
        }


        var out = fs.createWriteStream( os.homedir() + '/retrospective.docx' );
        out.on('error', function ( err ) {
          console.log ( err );
        });

        async.parallel ([
          function ( done ) {
            out.on ( 'close', function () {
              console.log ( 'Finish to create a DOCX file.' );
              io.emit('notification', "WordDoc created: " + os.homedir() + '/retrospective.docx');
              done ( null );
            });
            docx.generate ( out );
          }

          ], function ( err ) {
            if ( err ) {
            console.log ( 'error: ' + err );
          } // Endif.
        });

      });



  })

})
