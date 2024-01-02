const db = require("../models");
const User = db.user;
const ChatHistory = db.ChatHistory;
const Property = db.property;
const Remineder = db.Remineder;
const Notification = db.notification;
const Op = db.Sequelize.Op;
var bcrypt = require("bcryptjs");
const moment  = require('moment');
const fs = require('fs')
exports.getprofile = (req, res) => {
  const user_id = req.params.user_id;
  User.findOne({
    where: {
      id: user_id,
      status : 1
    },
  })
    .then((user) => {
      res.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        timeZoneName : user.timeZoneName,
        timeZoneOffset : user.timeZoneOffset,
        image : 'http://api.realtorai.us:3006/images/'+ (user.image ? user.image : 'user.png')
      
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
exports.update = async (req, res) => {
  const user_id = req.params.user_id;
  const base64image = req.body.image;
  const path = 'app/public/images/';
  const imageName = "user_"+moment().format('YYYYMMDDHHmmss')+'.png';
  try{
   
  if(base64image){
    const matches = base64image.match(/^image:(.+)$/);
    await fs.writeFile(path+imageName, base64image, 'base64', async(err)=>{
      if (err) {
        console.log(err?.message);
      } else {
        await User.update({ 
          image: imageName
         }, {
          where: {
            id: user_id
          }
        });
        console.log("Image Update Time : ", new Date());
        console.log("succeeded in saving");
      }
    });
  
  }
  await User.update({ 
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone, }, {
    where: {
      id: user_id
    }
  });
  await User.findOne({
    where: {
      id: user_id,
      status : 1
    },
  })
    .then((user) => {

       res.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image : 'http://api.realtorai.us:3006/images/'+ (user.image ? user.image : 'user.png')
      
      });
      return;
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
      return;
    });
  }catch(err){
    res.status(500).send({ message: err?.message });
}
};

exports.changePassword = async (req, res) => {
  User.findOne({
    where: {
      id: req.body.user_id,
      status : 1
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.current_password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Current Password did not match!",
        });
      }
      User.update({password :  bcrypt.hashSync(req.body.new_password, 8)}, {
        where: {
          id: user.id
        }
      });
      res.status(200).send({ message: "Password Change Successfully" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
exports.deleteProfile = async (req, res) => {
   const user_id = req.params.user_id;
   
  try{
    await Property.destroy({where: { user_id: user_id } });
    await ChatHistory.destroy({ where: { user_id: user_id} });
    await Remineder.destroy({ where: {user_id: user_id} });
    await User.destroy({ where: {id: user_id} });
    await Notification.destroy({ where: {userId: user_id} });
    res.status(202).send({ message: "Delete Account Successfully." });
  }catch(error){
    res.status(500).send({ message: error?.message });
  }
};
