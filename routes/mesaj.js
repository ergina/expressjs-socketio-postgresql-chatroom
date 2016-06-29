"use strict";

var express = require('express');
var router = express.Router();
var models = require("../models");

router.get('/arsiv/:skip/:limit', function(req, res, next) {
  var skip = req.params.skip;
  var limit = req.params.limit;
  req.query.offset = skip;
  req.query.limit = limit;

  models.Mesaj.getObjects(req.query, models)
  .then(function(mesajlar) {
    models.User.findAll().then(function (users) {
      var userObj = {};
      for (var i = 0; i < users.length; i++){
        userObj[users[i].dataValues.id] = users[i].dataValues.kullaniciAdi;
      }

      for (var j = 0; j < mesajlar.rows.length; j++){
        mesajlar.rows[j].dataValues.gonderen = userObj[mesajlar.rows[j].dataValues.gonderen_id];
      }
      res.json(mesajlar);
    });
  }).catch(function(error) {
    next(error);
  });
});


router.post('/', function(req, res, next) {
  var data = req.body;
  models.Mesaj.create(data).then(function (mesaj){
    res.send(mesaj);
  }).catch(next);
});


router.get('/arsiv', function(req, res, next) {
  models.Mesaj.findAll()
  .then(function(mesajlar) {
    res.json(mesajlar);
  }).catch(function(error) {
    next(error);
  });
});

module.exports = router;
