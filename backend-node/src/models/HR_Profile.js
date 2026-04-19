  const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HR_Profile = sequelize.define('HR_Profile', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    companyName: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.STRING },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    bio: { type: DataTypes.TEXT },
    linkedInUrl: { type: DataTypes.STRING },
    verificationStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' }
  }, {
    tableName: 'hr_profiles',
    timestamps: true
  });

  return HR_Profile;
};
