const express = require("express");
require("dotenv").config();
const router = express.Router();
const passport = require("passport");
require("dotenv").config();
const GoogleOneTapStrategy =
  require("passport-google-one-tap").GoogleOneTapStrategy;
const User = require("../models/user");
passport.use(
  new GoogleOneTapStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      verifyCsrfToken: false,
    },
    async function (profile, done) {
      try {
        // Extract email from profile
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value
            ? profile.emails[0].value
            : null;

        if (!email) {
          throw new Error("No email found in Google profile");
        }

        // Optionally, check if user exists first (recommended)
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: email,
            username: profile.displayName,
          });
        }
        console.log(user);
        return done(null, user);
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("User creation failed");
      }
    }
  )
);
const {
  renderSignup,
  handleSignup,
  renderLogin,
  handleLogin,
  handleLogout,
  validateUser,
} = require("../controller/authController");

// =============== Signup ===============
router.get("/signup", renderSignup);
router.post("/signup", validateUser, handleSignup);

// =============== Login ===============
router.get("/login", renderLogin);
router.post("/login", handleLogin);

// =============== Google One Tap ===============
router.post("/", (req, res, next) => {
  passport.authenticate("google-one-tap", (err, user) => {
    if (err) {
      console.log("Google authentication error:", err);
      req.flash("error", "Google authentication failed. Please try again.");
      return res.redirect("/login");
    }

    if (!user) {
      req.flash("error", "Google authentication failed. Please try again.");
      return res.redirect("/signup");
    }
    req.logIn(user, (err) => {
      if (err) {
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/login");
      }
      req.flash("success", "Successfully signed up with Google and logged in!");
      return res.redirect("/");
    });
  })(req, res, next);
});

// =============== Logout ===============
router.get("/logout", handleLogout);

module.exports = router;
