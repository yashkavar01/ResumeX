const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Job_Matches = sequelize.define('Job_Matches', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'students', key: 'id' },
      onDelete: 'CASCADE'
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'jobs', key: 'id' },
      onDelete: 'CASCADE'
    },
    matchPercentage: { type: DataTypes.FLOAT, allowNull: false },
  }, {
    tableName: 'job_matches',
    timestamps: true
  });

  return Job_Matches;
};
