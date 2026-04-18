const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Resume = sequelize.define('Resume', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'students', key: 'id' },
      onDelete: 'CASCADE'
    },
    filename: { type: DataTypes.STRING, allowNull: false },
    textContent: { type: DataTypes.TEXT('long') },
    atsScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    analysisData: { type: DataTypes.JSON },
  }, {
    tableName: 'resumes',
    timestamps: true
  });

  return Resume;
};
