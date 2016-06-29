"use strict";

module.exports = function(sequelize, DataTypes) {
  var Mesaj = sequelize.define('Mesaj', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true,
      field: 'id'
    },
    mesaj: {
      type: DataTypes.STRING,
      field: 'mesaj'
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

    indexes: [{
      fields: ['kayit_tarihi']
    }],

    classMethods: {
      associate: function(models) {
        Mesaj.belongsTo(models.User, {
          as: 'GonderenId',
          foreignKey: 'gonderen_id'
        });
      },

      getObjects: function(where, models) {
        var conditions = {};

        conditions.order = [[ sequelize.col('kayit_tarihi') , 'DESC' ]];

        if (where.offset) {
          conditions.offset = where.offset;
        }
        if (where.limit) {
          conditions.limit = where.limit;
        }

        return Mesaj.findAndCountAll(conditions);
      }
    }
  });

  return Mesaj;
};
