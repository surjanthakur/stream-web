const passport = require("passport");
const User = require("../models/user");
const Schema = require("../middlewares/joivalidation");

// =============== Validation Middleware ===============
exports.validateUser = (req, res, next) => {
  const { error } = Schema.validate(req.body);
  if (error) {
    console.error("Validation error:", error.details[0].message);
    return res.status(400).send(error.details[0].message);
  }
  next();
};

// =============== Signup Handlers ===============
exports.renderSignup = (req, res) => {
  res.render("signup/signup.ejs");
};

exports.handleSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await User.register({ username, email }, password);
    console.log("New user created:", newUser);

    req.login(newUser, (err) => {
      if (err) {
        console.error("Login error:", err);
        req.flash("error", "Signup successful but login failed.");
        return res.redirect("/login");
      }
      req.flash("success", "Successfully signed up and logged in!");
      res.redirect("/");
    });
  } catch (error) {
    req.flash("error", "Signup failed. Please try again.");
    console.log("Error during signup:", error);
    res.redirect("/signup");
  }
};

// =============== Login Handlers ===============
exports.renderLogin = (req, res) => {
  res.render("login/login.ejs");
};

exports.handleLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(err);
    }
    if (!user) {
      req.flash("error", info.message || "Invalid credentials");
      return res.redirect("/login");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Login session error:", err);
        return next(err);
      }
      req.flash("success", "Successfully logged in!");
      res.redirect("/");
    });
  })(req, res, next);
};

// =============== Google One Tap Handler ===============
exports.googleOneTapAuth = (req, res, next) => {
  passport.authenticate("google-one-tap", (err, user) => {
    if (err || !user) {
      req.flash("error", "Google authentication failed.");
      return res.redirect("/login");
    }

    req.logIn(user, (err) => {
      if (err) {
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/login");
      }
      req.flash("success", "Successfully logged in with Google!");
      res.redirect("/");
    });
  })(req, res, next);
};

// =============== Logout Handler ===============
exports.handleLogout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Successfully logged out!");
    res.redirect("/");
  });
};
