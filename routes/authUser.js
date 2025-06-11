const express = require("express");
const router = express.Router();
const {
  renderSignup,
  handleSignup,
  renderLogin,
  handleLogin,
  googleOneTapAuth,
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
router.post("/", googleOneTapAuth);

// =============== Logout ===============
router.get("/logout", handleLogout);

module.exports = router;
