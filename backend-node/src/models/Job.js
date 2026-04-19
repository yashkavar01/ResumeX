const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Job = sequelize.define('Job', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hrId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'hr_profiles', key: 'id' },
      onDelete: 'CASCADE'
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    caseStudyQuestion: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'jobs',
    timestamps: true
  });

  return Job;
};
