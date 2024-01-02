const db = require("../models");
const Locations = db.locations;
exports.locationDetails = async(user_id) => {
  
    return await Locations.findOne({ user_id: user_id })
};