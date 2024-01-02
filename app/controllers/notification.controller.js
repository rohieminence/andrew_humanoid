const db = require("../models");
const { Op } = require('sequelize');
const Notification = db.notification;
exports.getNotificationSetting = async (req, res) => {
    const user_id = req.params.user_id;
    Notification.findOne({
        where: {
            userId: user_id
        },
    })
    .then((settings) => {
        
        res.status(200).send(settings);
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
    });
}
exports.updateNotificationSetting = async (req, res) => {
    const user_id = req.params.user_id;
    await Notification.update({ 
        sms : req.body.sms,
        call : req.body.call,
        reminder : req.body.reminder,
     }, {
        where: {
            userId: user_id
        }
    });
    Notification.findOne({
        where: {
            userId: user_id
        },
    })
    .then((settings) => {
        
        res.status(200).send(settings);
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
    });
}