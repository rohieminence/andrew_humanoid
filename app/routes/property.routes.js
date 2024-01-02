const { authJwt } = require("../middleware");
const propertycontroller = require("../controllers/property.controller");

const { body, check  } = require("express-validator");
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
    
    app.post("/api/property/save",
    validate([
      body('user_id').trim().notEmpty().withMessage('User ID is Required'),
      body('property_id').trim().notEmpty().withMessage('Property ID is Required'),
    ]),
    [authJwt.verifyToken],propertycontroller.propertyStore);

    app.delete("/api/property/remove",
    validate([
      body('user_id').trim().notEmpty().withMessage('User ID is Required'),
      body('property_id').trim().notEmpty().withMessage('Property ID is Required'),
    ]),
    [authJwt.verifyToken], propertycontroller.propertyRemove);
    app.get("/api/properties/users/:user_id", [authJwt.verifyToken], propertycontroller.usersProperties);
    app.get("/api/property/:property_id", [authJwt.verifyToken], propertycontroller.getSingleProperty);

  };
  