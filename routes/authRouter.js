const authRouter = require("express").Router();
const config = require("config");
const session = require("express-session");
const passport = require("passport");
const { User } = require("../models/usersModel");
const bcrypt = require("bcrypt");

authRouter.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

authRouter.get("/", function (req, res) {
  res.render("pages/auth");
});

let userProfile;

authRouter.use(passport.initialize());
authRouter.use(passport.session());
authRouter.get("/google/success", async (req, res) => {
  if (!userProfile) {
    res.statusMessage = "No User Information was found.";
    res.status(400).send("No User Information was found.");
  }
  const userExist = await User.findOne({ email: userProfile.emails[0].value });
  if (userExist) {
    const token = userExist.generateAuthToken();
    res.send({ token });
  } else {
    let newUser = new User({
      "name": {
        "first": userProfile.name.givenName,
        "last": userProfile.name.familyName,
      },
      "phone": "050555555",
      "email": userProfile.emails[0].value,
      "password": userProfile.id,
      "isBusiness": false,
      "address": {
        "state": "",
        "country": "userCountry",
        "city": "userCity",
        "street": "userStreet",
        "houseNumber": "houseNum",
      },
    });
    newUser.password = await bcrypt.hash(newUser.password, 12);
    await newUser.save();
    const token = newUser.generateAuthToken();
    res.send({ token });
  }

  //   console.log(userProfile);
  //   res.render("pages/success", { user: userProfile });
  //res.send(userProfile);
});
authRouter.get("/google/error", (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

/*  Google AUTH  */

const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const GOOGLE_CLIENT_ID = config.get("auth.GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = config.get("auth.GOOGLE_CLIENT_SECRET");
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      userProfile = profile;
      return done(null, userProfile);
    }
  )
);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "./error" }),
  function (req, res) {
    // Successful authentication, redirect success.
    res.redirect("./success");
  }
);

module.exports = authRouter;
