const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
require("dotenv").config();
const GoogleOneTapStrategy =
  require("passport-google-one-tap").GoogleOneTapStrategy;
const Schema = require("../middlewares/joivalidation");

// ================================
// MIDDLEWARE FUNCTIONS
// ================================

// Validation middleware for user input
const validateUser = (req, res, next) => {
  const { error } = Schema.validate(req.body);
  if (error) {
    console.error("Validation error:", error.details[0].message);
    return res.status(400).send(error.details[0].message);
  }
  next();
};

// ================================
// PASSPORT CONFIGURATION
// ================================

// STEP 1: Setup Google One Tap Strategy
passport.use(
  new GoogleOneTapStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      verifyCsrfToken: false, // One Tap me CSRF token ki jarurat nahi hoti
    },
    async (profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        let isNewUser = false;
        // If not, create new user
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
          });
          isNewUser = true;
        }

        // Pass additional info to indicate if this is a new user
        user.isNewUser = isNewUser;
        console.log("User authenticated:", user);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ================================
// SIGNUP ROUTES
// ================================

// GET signup page
router.get("/signup", (req, res) => {
  res.render("signup/signup.ejs");
});

// POST signup - Create new user account
router.post("/signup", validateUser, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await User.register({ username, email }, password);
    console.log("New user created:", newUser);

    req.login(newUser, (err) => {
      if (err) {
        console.error("Login error:", err);
        req.flash(
          "error",
          "Signup successful but login failed. Please try logging in."
        );
        return res.redirect("/login");
      }
      req.flash("success", "Successfully signed up and logged in!");
      return res.redirect("/");
    });
  } catch (error) {
    req.flash("error", "Signup failed. Please try again.");
    res.redirect("/signup");
    console.log("Error during signup:", error);
  }
});

// ================================
// LOGIN ROUTES
// ================================

// GET login page
router.get("/login", (req, res) => {
  res.render("login/login.ejs");
});

// POST login - Authenticate user with local strategy
router.post("/login", async (req, res, next) => {
  try {
    console.log("Login attempt:", req.body, "date:", new Date().toString());

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }

      if (!user) {
        req.flash("error", info.message || "Invalid credentials");
        console.warn("Login failed:", info.message);
        return res.redirect("/login");
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return next(err);
        }
        req.flash("success", "Successfully logged in!");
        console.log("User logged in:", user);
        let redirect = res.locals.redirectUrl || "/";
        return res.redirect(redirect);
      });
    })(req, res, next);
  } catch (error) {
    console.error("Unexpected error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ================================
// GOOGLE ONE TAP AUTHENTICATION
// ================================

// STEP 2: Handle POST request for login with One Tap
router.post("/", (req, res, next) => {
  passport.authenticate("google-one-tap", (err, user, info) => {
    if (err) {
      console.error("Google One Tap authentication error:", err);
      req.flash("error", "Google authentication failed. Please try again.");
      return res.redirect("/login");
    }

    if (!user) {
      req.flash("error", "Google authentication failed. Please try again.");
      return res.redirect("/signup");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Google login session error:", err);
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/login");
      }
      req.flash("success", "Successfully signed up with Google and logged in!");
      let redirect = res.locals.redirectUrl || "/";
      return res.redirect(redirect);
    });
  })(req, res, next);
});

// ================================
// LOGOUT ROUTE
// ================================

// GET logout - End user session
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return next(err);
    }
    res.redirect("/");
    req.flash("success", "Successfully logged out!");
  });
});

// ================================
// EXPORT MODULE
// ================================
module.exports = router;
