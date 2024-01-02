module.exports = (sequelize, Sequelize) => {
    const Remineder = sequelize.define("reminders", {
        user_id: {
            type: Sequelize.NUMBER,
        },
        title: {
            type: Sequelize.STRING,
        },
        msg: {
            type: Sequelize.STRING,
        },
        phone: {
            type: Sequelize.STRING,
        },
        datetime: {
            type: Sequelize.STRING,
        },
        status: {
            type: Sequelize.NUMBER,
        }
    });
        return Remineder;
};
  