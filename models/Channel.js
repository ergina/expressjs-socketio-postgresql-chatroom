"use strict";

module.exports = function(sequelize, DataTypes) {
  var Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true,
      field: 'id'
    },
    kanalAdi: {
      type: DataTypes.STRING,
      field: 'kanal_adi',
      unique: true
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

    classMethods: { }
  });

  return Channel;
};
