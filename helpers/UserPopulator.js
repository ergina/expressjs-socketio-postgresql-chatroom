var models = require("../models");
var crypto = require('crypto');

module.exports = function (callback) {
  var password = "123";
  var salt = crypto.randomBytes(8);
  var recievedHash = crypto.createHash('md5')
  .update(password)
  .update(salt)
  .digest('hex');
  var hashedPassword = recievedHash + ',' + salt.toString('hex');
  models.User.create({
    kullaniciAdi: 'root',
    sifre: hashedPassword
  }).then(function () {
    callback(null, null);
  });
};
