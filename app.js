if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const { createServer } = require("node:http");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const User = require("./models/user.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const connectToSocket = require("./controller/socketManager.js");
const MongoStore = require("connect-mongo");

const store = MongoStore.create({
  mongoUrl: process.env.MONGO_DB_STORE,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("error in mongo store !");
});

const sessionOption = {
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
};

// Importing routes
const authRoutes = require("./routes/user.js");
const mainRoutes = require("./routes/main.js");

const app = express();
const server = createServer(app);
connectToSocket(server);

// ======= Middleware =======
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(express.json({ limit: "40kb" }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ======= View Engine Setup =======
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======= Mongoose Connection =======
mongoose
  .connect(process.env.MONGO_DB_STORE)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ======= Session Middleware =======
app.use(session(sessionOption));
app.use(flash());
app.use(cookieParser());

// ======= Passport Config =======
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make flash messages available in all views via res.locals
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  res.locals.currentUser = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// ======= Routes =======
app.use("/", authRoutes);
app.use("/", mainRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { message });
});

server.listen(8080, () => {
  console.log(`Server running on http://localhost:8080}`);
});
