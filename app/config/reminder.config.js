const jwt = require("jsonwebtoken");
const config = require("./auth.config");
verifytwillio = async () => {
    const configuration = jwt.verify(process.env.SECRET_PASSWORD, config.secret);
   
    return configuration;
};

  module.exports = { verifytwillio };