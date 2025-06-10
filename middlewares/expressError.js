module.exports = class ExpressError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
  }
};
