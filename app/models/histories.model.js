module.exports = (sequelize, Sequelize) => {
    const Histories = sequelize.define("histories", {
        user_id: {
            type: Sequelize.NUMBER,
        },
        text: {
            type: Sequelize.TEXT,
        },
        req_type: {
            type: Sequelize.STRING,
        },
        type: {
            type: Sequelize.STRING,
        },
        properties: {
            type: Sequelize.JSON,
        },
        last_search: {
            type: Sequelize.TEXT,
        },
        page: {
            type: Sequelize.NUMBER,
        },
    });
        return Histories;
};
  