require("dotenv/config");
const mongoose = require("mongoose");
const express = require("express");
const morgan = require("morgan");
const config = require("config");
const loggerMW = require("./middleware/loggerMW");
const cors = require("cors");
const chalk = require("chalk");

const usersRouter = require("./routes/usersRouter");
const cardsRouter = require("./routes/cardsRouter");
const authRouter = require("./routes/authRouter");

mongoose
  .connect(config.get("mongoDB.MONGO_URI"))
  .then(() => console.log(chalk.green.bold("Connected to MongoDB")))
  .catch((err) =>
    console.log(chalk.red.bold("Could not connect to MongoDB", err))
  );

const app = express();

app.use(
  morgan(
    chalk.yellow(
      `DATE: :date[web] ; METHOD: :method ; URL: :url ; STATUS: :status ; RESPONSE TIME: :response-time ms`
    )
  )
);
app.use(express.json());
app.use(cors());

app.use(loggerMW);

//Google Login

app.set("view engine", "ejs");

// app.use(
//   session({
//     resave: false,
//     saveUninitialized: true,
//     secret: "SECRET",
//   })
// );

// app.get("/", function (req, res) {
//   res.render("pages/auth");
// });

// let userProfile;

// app.use(passport.initialize());
// app.use(passport.session());
// app.get("/success", (req, res) => res.send(userProfile));
// app.get("/error", (req, res) => res.send("error logging in"));

// passport.serializeUser(function (user, cb) {
//   cb(null, user);
// });

// passport.deserializeUser(function (obj, cb) {
//   cb(null, obj);
// });

/*  Google AUTH  */

// const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
// const GOOGLE_CLIENT_ID = config.get("auth.GOOGLE_CLIENT_ID");
// const GOOGLE_CLIENT_SECRET = config.get("auth.GOOGLE_CLIENT_SECRET");
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/callback",
//     },
//     function (accessToken, refreshToken, profile, done) {
//       userProfile = profile;
//       return done(null, userProfile);
//     }
//   )
// );

// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/error" }),
//   function (req, res) {
//     // Successful authentication, redirect success.
//     res.redirect("/success");
//   }
// );

//End of google login

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/cards", cardsRouter);
app.use(express.static("public"));
app.all("*", (req, res) => {
  res.statusMessage = "404: Page not found.";
  res.status(404).send("404: Page not found.");
  return;
});

app.listen(config.get("server.PORT"), () =>
  console.log(
    chalk.green.bold(`Listening to port ${config.get("server.PORT")}`)
  )
);
