"use strict";

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var auth = require('basic-auth');
var crypto = require('crypto');
var NodeCache = require("node-cache");
var logger = require('./lib/logger.js');
var user = require('./routes/user');
var mesaj = require('./routes/mesaj');
var models = require('./models');
var users = new NodeCache({
  stdTTL: 600
});

var PORT = process.env.PORT || 3000;


app.use(require("morgan")("combined", {
  "stream": logger.stream
}));
app.use(express.static('public'));
app.use(bodyParser.json({
  limit: '50mb',
  extended: true
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Basic Authentication
app.use(function(req, res, next) {
  function unauthorized(username, response) {
    response.statusCode = 401;
    response.setHeader('WWW-Authenticate', 'X-Basic realm="' + username + '"');
    response.json({
      "message": "Unauthorized"
    });
  }
  if (req.method == "OPTIONS") {
    res.statusCode = 200;
    res.setHeader('Allow', 'HEAD,GET,POST,OPTIONS');
    return res.end();
  }

  if (req.method == "POST" && req.url == "/user") {
    return next();
  }

  var user = auth(req);
  if (!user) {
    return unauthorized('Unknown', res);
  }
  var userObject = users.get(user.name);
  if (userObject && userObject.sifre) {
    var creArray = userObject.sifre.split(',');
    var hash = creArray[0];
    var salt = new Buffer(creArray[1], 'hex');
    var recievedHash = crypto.createHash('md5')
    .update(user.pass)
    .update(salt)
    .digest('hex');
    if (hash === recievedHash) {
      req.user = userObject;
      return next();
    }
  }
  models.User.findOne({
    where: {
      kullaniciAdi: user.name
    }
  }).then(function(member) {
    if (!member) {
      return unauthorized(user.name, res);
    }
    var asJson = member.get({
      plain: true
    });
    var creArray = asJson.sifre.split(',');
    var hash = creArray[0];
    var salt = new Buffer(creArray[1], 'hex');
    var recievedHash = crypto.createHash('md5')
    .update(user.pass)
    .update(salt)
    .digest('hex');
    if (hash === recievedHash) {
      users.set(asJson.kullaniciAdi, asJson);
      req.user = asJson;
      return next();
    } else {
      return unauthorized(asJson.kullaniciAdi, res);
    }
  }).catch(function(error) {
    return next(error);
  });
});

app.use('/user', user);
app.use('/mesaj', mesaj);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development' || app.get('env') === 'test') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    var errorJson = {
      message: err.message,
      status: err.status,
      stack: err.stack
    };
    logger.log('error', errorJson.stack);
    var header = err.header;
    if (header) {
      var key = Object.keys(header)[0];
      res.setHeader(key, header[key]);
      delete err.header;
    }
    res.send(JSON.stringify(errorJson));
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  var errorJson = {
    message: err.message
  };
  logger.log('error', errorJson.stack);
  var header = err.header;
  if (header) {
    var key = Object.keys(header)[0];
    res.setHeader(key, header[key]);
    delete err.header;
  }
  res.send(JSON.stringify(errorJson));
});


//socket
var peopleOnline = {
  count: 0,
  people: {}
};
io.on('connection', function(socket) {
  peopleOnline.count++;

  socket.on('connected person', function(person){
    peopleOnline.people[socket.id] = person;
    peopleOnline.justJoined = person;
    io.emit('user connected', peopleOnline);
  });

  socket.on('yeni mesaj', function(obj) {
    // dbye yaz.
    models.Mesaj.create(obj).then(function (mesaj){
      models.User.getById(obj.gonderen_id, models).then(function(result) {
        result = result.get({
          plain: true
        });

        mesaj.dataValues.gonderen = result.kullaniciAdi;
        //tüm kullanıcılara gönder
        io.emit('yeni mesaj', mesaj);

      }).catch(function(error) {
        next(error);
      });

    });

  });

  socket.on('end', function(){
    socket.disconnect();
  });

  socket.on('disconnect', function() {
    peopleOnline.count--;
    peopleOnline.justLeft = peopleOnline.people[socket.id];
    delete peopleOnline.people[socket.id];
    socket.disconnect();
    io.emit('user disconnected', peopleOnline);
  });
});

http.listen(PORT, function() {
  console.log('Listening on port ' + PORT);
});

module.exports = app;
