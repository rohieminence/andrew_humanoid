const db = require("../models");
const User = db.user;
const moment  = require('moment');
exports.userTrack = (req, res, next) => {
    
    const { user_id } = req.body;
    try{
        let current_time = moment().format('YYYY-MM-DD HH:mm:ss');
        if(user_id){
            User.update({ 
                last_track : current_time 
            },{
                where: {
                  id: user_id
                }
            });
        }
       
        
        next();
    }catch(error){
        next();
    }
 
  
};

