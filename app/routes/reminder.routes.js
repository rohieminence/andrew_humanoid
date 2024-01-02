const { authJwt } = require("../middleware");
const propertycontroller = require("../controllers/property.controller");

const { body, check  } = require("express-validator");
const { validationResult, ValidationChain } = require('express-validator');
const { get_reminders, update_reminders, delete_reminders } = require("../controllers/reminderchat.controller");
const validate = validations => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
}

module.exports = function (app) {
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
    
    app.post("/api/reminder_get",
    validate([
      body('user_id').trim().notEmpty().withMessage('User ID is Required'),
     ]),
    [authJwt.verifyToken],get_reminders);

    
    app.delete("/api/reminder_delete",
    validate([
      body('user_id').trim().notEmpty().withMessage('User ID is Required'),
      body('id').trim().notEmpty().withMessage(' ID is Required'),
 
    ]),
    [authJwt.verifyToken], delete_reminders);

    app.put("/api/update_reminders",
    validate([
      body('id').trim().notEmpty().withMessage(' ID is Required'),
      body('user_id').trim().notEmpty().withMessage(' User ID is Required'),
      body('sms_status').optional().trim().notEmpty().withMessage('SMS Status is Required'),
      body('call_status').optional().trim().notEmpty().withMessage('Call Status is Required'),
      body('reminder_status').optional().trim().notEmpty().withMessage('Notification Statud is Required'),
  
    ]),
    [authJwt.verifyToken], update_reminders);
   
  };
  