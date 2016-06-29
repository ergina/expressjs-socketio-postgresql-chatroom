"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true,
      field: 'id'
    },
    kullaniciAdi: {
      type: DataTypes.STRING,
      field: 'kullanici_adi',
      unique: true
    },
    sifre: {
      type: DataTypes.STRING,
      field: 'sifre'
    }
  }, {
    // don't forget to enable timestamps!
    timestamps: true,

    // I don't want createdAt
    createdAt: 'kayit_tarihi',

    // And deletedAt to be called destroyTime (remember to enable paranoid for this to work)
    deletedAt: 'silinme_tarihi',

    paranoid: true,

    freezeTableName: true, // Model tableName will be the same as the model name

    classMethods: {
      associate: function(models) {
        User.hasMany(models.Mesaj, {
          as: 'Mesajlar',
          foreignKey: 'gonderen_id'
        });
      },

      insert: function(data, models) {
        return new models.sequelize.Promise(function(resolve, reject) {
          var err = false;
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
            resolve(user);
          }).catch(reject);
        });
      },

      getByUsername: function(username, models) {
        return models.User.findOne({
          where: {
            kullaniciAdi: username
          },
          attributes: {
            exclude: ['sifre']
          }
        });
      },

      getById: function(id, models) {
        return models.User.findOne({
          where: {
            id: id
          },
          attributes: {
            exclude: ['sifre']
          }
        });
      }
    }
  });

  return User;
};
