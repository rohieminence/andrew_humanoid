module.exports = (sequelize, Sequelize) => {
    const Agentconnect = sequelize.define("agent_connects", {
        user_id: {
            type: Sequelize.NUMBER,
        },
        agent_name: {
            type: Sequelize.STRING,
        },
        phone: {
            type: Sequelize.STRING,
        },
        license: {
            type: Sequelize.STRING,
        },
        property_id: {
            type: Sequelize.STRING,
        },
        email: {
            type: Sequelize.STRING,
        },
        msg: {
            type: Sequelize.STRING,
        },
        type: {
            type: Sequelize.STRING,
        }
    });
        return Agentconnect;
};
  