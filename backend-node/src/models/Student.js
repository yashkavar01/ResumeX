const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    university: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    qualification: { type: DataTypes.STRING },
    bio: { type: DataTypes.TEXT },
    githubUrl: { type: DataTypes.STRING },
    linkedinUrl: { type: DataTypes.STRING },
    portfolioUrl: { type: DataTypes.STRING },
    experienceYears: { type: DataTypes.INTEGER, defaultValue: 0 },
    expectedSalary: { type: DataTypes.STRING }
  }, {
    tableName: 'students',
    timestamps: true
  });

  return Student;
};
