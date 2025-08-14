const Joi = require("joi");

const Schema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).max(30).required(),
});

module.exports = Schema;
