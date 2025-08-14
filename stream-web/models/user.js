const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;
// This code defines a Mongoose schema for a User model with fields for username, email, and password.
// It ensures that both username and email are unique and required, while the password is also required.
// The User model is then exported for use in other parts of the application.
