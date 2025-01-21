const { Sequelize, DataTypes } = require('sequelize');
const sequelize2 = require('../config/db2');

const Rol = sequelize2.define('rol', {
  idrol: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombrerol: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  condicionrol: {
    type: DataTypes.NUMERIC,
    defaultValue: 1,
  },
}, {
  tableName: 'rol',
  timestamps: false
});

module.exports = Rol;
