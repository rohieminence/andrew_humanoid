module.exports = (sequelize, Sequelize) => {
    const Property = sequelize.define("properties", {
        user_id: {
            type: Sequelize.NUMBER,
        },
        property_id: {
            type: Sequelize.NUMBER,
        },
        property: {
            type: Sequelize.JSON,
        },
        status: {
            type: Sequelize.NUMBER,
        }
    });
        return Property;
};
  