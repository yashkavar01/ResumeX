const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Job_Application = sequelize.define('Job_Application', {
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
    status: {
      type: DataTypes.ENUM('pending', 'shortlisted', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'job_applications',
    timestamps: true
  });

  return Job_Application;
};
