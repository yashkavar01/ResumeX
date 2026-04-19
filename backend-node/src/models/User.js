const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'hr', 'admin'), allowNull: false },
    resetOTP: { type: DataTypes.STRING, allowNull: true },
    resetOTPExpires: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
