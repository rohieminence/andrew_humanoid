const { verifySignUp } = require("../middleware");
const { body } = require("express-validator");
const controller = require("../controllers/auth.controller");
const { validationResult, ValidationChain } = require('express-validator');
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
  app.post(
    "/api/auth/signup",
    validate([
      body('name').notEmpty().withMessage('Name is Required'),
      body('email').notEmpty().withMessage('Email Address is Required'),
      body('email').isEmail().withMessage('Invalide Email Address'),
      body('google_id').optional().trim(),
      body('device_id').notEmpty().withMessage("Device id is Required"),
      body('password').isLength({ min: 8 }).withMessage('Password is required and minimum length is 8'),
      body('phone').optional().trim(),
    ]),
   [ verifySignUp.checkDuplicateUsernameOrEmail ],controller.signup );

  app.post("/api/auth/signin", 
  validate([body('email').notEmpty().withMessage('Email Address is Required'),
    body('email').isEmail().withMessage('Invalide Email Address'),
    body('timeZoneOffset').notEmpty().withMessage("timeZoneOffset  is Required"),
    body('device_id').notEmpty().withMessage("Device id is Required"),
  ]),controller.signin);

  app.post("/api/auth/forgot-password", 
    validate([body('email').notEmpty().withMessage('Email Address is Required'),
    body('email').isEmail().withMessage('Invalide Email Address'),
    ]),controller.fogotPassword);

    app.post("/api/auth/reset-password", 
    validate([body('email').trim().notEmpty().withMessage('Email Address is Required'),
    body('email').trim().isEmail().withMessage('Invalide Email Address'),
    body('otp').trim().notEmpty().withMessage('OTP is Required'),
    body('otp').trim().notEmpty().isLength({ min: 6 }).withMessage('OTP is 6 Character Long'),
    body('password').trim().notEmpty().withMessage('Password is Required'),
    body('password').isLength({ min: 8 }).withMessage('Password minimum length is 8'),
    ]),controller.resetPassword);

    app.post("/api/auth/check-otp", 
    validate([body('email').trim().notEmpty().withMessage('Email Address is Required'),
    body('email').trim().isEmail().withMessage('Invalide Email Address'),
    body('otp').trim().notEmpty().withMessage('OTP is Required'),
    body('otp').trim().notEmpty().isLength({ min: 6 }).withMessage('OTP is 6 Character Long'),
    ]),controller.checkOtp);
};
