const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+05:30', // Sets timezone to IST (UTC +5:30)
    logging: false, // Set to console.log to see SQL queries
  }
);

const User = require('./User')(sequelize);
const Student = require('./Student')(sequelize);
const HR_Profile = require('./HR_Profile')(sequelize);
const Resume = require('./Resume')(sequelize);
const Skill = require('./Skill')(sequelize);
const Job = require('./Job')(sequelize);
const Job_Matches = require('./Job_Matches')(sequelize);
const Job_Application = require('./Job_Application')(sequelize);
const Notification = require('./Notification')(sequelize);

// Associations
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(HR_Profile, { foreignKey: 'userId', as: 'hrProfile', onDelete: 'CASCADE' });
HR_Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Student.hasMany(Resume, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Resume.belongsTo(Student, { foreignKey: 'studentId' });

HR_Profile.hasMany(Job, { foreignKey: 'hrId', onDelete: 'CASCADE' });
Job.belongsTo(HR_Profile, { foreignKey: 'hrId' });

// Junction tables for N:M relationships
Resume.belongsToMany(Skill, { through: 'Resume_Skills', foreignKey: 'resumeId', otherKey: 'skillId' });
Skill.belongsToMany(Resume, { through: 'Resume_Skills', foreignKey: 'skillId', otherKey: 'resumeId' });

Job.belongsToMany(Skill, { through: 'Job_Skills', foreignKey: 'jobId', otherKey: 'skillId' });
Skill.belongsToMany(Job, { through: 'Job_Skills', foreignKey: 'skillId', otherKey: 'jobId' });

// Matches
Student.hasMany(Job_Matches, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Job_Matches.belongsTo(Student, { foreignKey: 'studentId' });

Job.hasMany(Job_Matches, { foreignKey: 'jobId', onDelete: 'CASCADE' });
Job_Matches.belongsTo(Job, { foreignKey: 'jobId' });

// Applications
Student.hasMany(Job_Application, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Job_Application.belongsTo(Student, { foreignKey: 'studentId' });

Job.hasMany(Job_Application, { foreignKey: 'jobId', onDelete: 'CASCADE' });
Job_Application.belongsTo(Job, { foreignKey: 'jobId' });

module.exports = {
  sequelize,
  User,
  Student,
  HR_Profile,
  Resume,
  Skill,
  Job,
  Job_Matches,
  Job_Application,
  Notification,
};
