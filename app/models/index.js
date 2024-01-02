
const config = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  operatorsAliases: false,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = require("../models/user.model.js")(sequelize, Sequelize);
// db.ChatHistory = require("./chatHistory.model.js")(sequelize, Sequelize);
db.Remineder = require("./remineder.model.js")(sequelize, Sequelize);
db.property = require("./property.model.js")(sequelize, Sequelize);
db.notification = require("./notification.model")(sequelize, Sequelize);
db.agentconnect = require("./agent.model.js")(sequelize, Sequelize);
db.histories = require("./histories.model.js")(sequelize, Sequelize);
db.locations = require("./location.model.js")(sequelize, Sequelize);
// db.smsConversation = require("./smsConversation.model.js")(sequelize, Sequelize);


db.Remineder.belongsTo(db.notification, { foreignKey: 'user_id', targetKey: 'userId' });
 
module.exports = db;
