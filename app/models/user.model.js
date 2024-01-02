module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    name: {
      type: Sequelize.STRING,
    },
    google_id: {
      type: Sequelize.NUMBER,
    },
    email: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    phone: {
      type: Sequelize.STRING,
    },
    device_id: {
      type: Sequelize.STRING,
    },
    timeZoneName: {
      type: Sequelize.STRING,
    },
    timeZoneOffset: {
      type: Sequelize.STRING,
    },
    otp: {
      type: Sequelize.STRING,
    },
    last_track: {
      type: Sequelize.STRING,
    },
  });
  return User;
};
