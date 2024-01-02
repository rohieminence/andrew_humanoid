const { authJwt } = require("../middleware");
const controller = require("../controllers/history.controller.js");
const { body } = require("express-validator");
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
   
    app.get("/api/chat-histories/:user_id",
    [authJwt.verifyToken], controller.getUserHistory);
    app.get("/api/histories/test",
    [authJwt.verifyToken], controller.getUserHistorytest);
    app.get("/api/notifications/:user_id",
    [authJwt.verifyToken], controller.getNotification);
    app.delete("/api/chat-histories/:user_id",
    [authJwt.verifyToken], controller.deleteUserHistory);
    
  };
  