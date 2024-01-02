const express = require('express');
const { validationResult, ValidationChain } = require('express-validator');
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
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
const userValidation = {
    validate: validate
  };
  module.exports = userValidation;