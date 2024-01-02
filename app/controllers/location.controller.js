const db = require("../models");
const Locations = db.locations;

exports.locationUpdate = (req, res) => {
    const { user_id } = req.body;
    Locations
    .findOne({ user_id: user_id })
    .then(async(obj) => {
        if(obj){
          await  obj.update( req.body)
            
        }else{
            await Locations.create( req.body);
        }
        res.status(200).send({ message: "User Location update Successfully" });
        return;
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
        return;
    });
    
}