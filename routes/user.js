"use strict";

var express = require('express');
var router = express.Router();
var models = require("../models");
var crypto = require('crypto');

router.get('/:kullaniciAdi', function(req, res, next) {
  var username = req.params.kullaniciAdi;
  models.User.getByUsername(username, models).then(function(result) {
    result = result.get({
      plain: true
    });
    res.json(result);
  }).catch(function(error) {
    next(error);
  });
});

router.post('/', function(req, res, next) {
  var err = false;
  var data = req.body;
  var password = data.sifre;
  if (password) {
    var salt = crypto.randomBytes(8);
    var recievedHash = crypto.createHash('md5')
    .update(password)
    .update(salt)
    .digest('hex');
    var hashedPassword = recievedHash + ',' + salt.toString('hex');
    data.sifre = hashedPassword;
  }
  models.User.create(data).then(function(user) {
    res.send(user);
  }).catch(next);
});

module.exports = router;
