module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notifications", {
      userId: {
        type: Sequelize.NUMBER,
      },
      reminder_id: {
        type: Sequelize.NUMBER,
    },
      datetime: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.NOW,
      },
      sms: {
        type: Sequelize.NUMBER,
      },
      call: {
        type: Sequelize.NUMBER,
      },
      reminder: {
        type: Sequelize.NUMBER,
      },
    });
    return Notification;
  };
  