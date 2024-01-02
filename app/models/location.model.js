module.exports = (sequelize, Sequelize) => {
    const Locations = sequelize.define("locations", {
        user_id: {
            type: Sequelize.NUMBER,
        },
        latitude: {
            type: Sequelize.STRING,
        },
        longitude: {
            type: Sequelize.STRING,
        }
    });
        return Locations;
};
  