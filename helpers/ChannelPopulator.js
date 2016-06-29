var models = require("../models");

module.exports = function (callback) {
  models.Channel.create({
    'kanalAdi': 'Genel'
  }).then(function () {
    callback(null, null);
  });
};
