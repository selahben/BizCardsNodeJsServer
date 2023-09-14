const usersRouter = require("express").Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const Joi = require("joi");

const { User, validateUser } = require("../models/usersModel");
const authMW = require("../middleware/authMW");

const {
  addToTries,
  getLoginStatus,
  blockLogin,
  loginMW,
  removeBlocked,
} = require("../middleware/logInMW");

//Routes//
//Create User
usersRouter.post("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) {
    res.statusMessage = error.details[0].message;
    res.status(400).json(error.details[0].message);
    return;
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    res.statusMessage = "User already registered";
    res.status(400).send("User already registered");
    return;
  }

  user = new User(req.body);
  user.password = await bcrypt.hash(user.password, 12);

  await user.save();
  //results
  res.json(
    _.pick(user, [
      "_id",
      "name",
      "email",
      "phone",
      "address",
      "image",
      "isBusiness",
    ])
  );
});

//Log In
usersRouter.post("/login", loginMW, async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    res.statusMessage = error.details[0].message;
    res.status(400).json(error.details[0].message);
    return;
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    addToTries(req.ip);
    if (getLoginStatus(req.ip).tries >= 3) {
      blockLogin(req.ip);
    }
    res.statusMessage = "Invalid email or password";
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const passCheck = await bcrypt.compare(req.body.password, user.password);
  if (!passCheck) {
    addToTries(req.ip);
    if (getLoginStatus(req.ip).tries >= 3) {
      blockLogin(req.ip);
    }
    res.statusMessage = "Invalid email or password";
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  removeBlocked(req.ip);
  const token = user.generateAuthToken();
  res.send({ token });
});

function validate(user) {
  const schema = Joi.object({
    email: Joi.string().min(6).max(255).required().email({ tlds: false }),
    password: Joi.string().min(6).max(1024).required(),
  });

  return schema.validate(user);
}

//Get all users
usersRouter.get("/", authMW("isAdmin"), async (req, res) => {
  const users = await User.find().select("-password -__v");
  res.json(users);
});

//Get a user
usersRouter.get("/:id", authMW("isAdmin", "userOwner"), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id }).select(
      "-password -__v"
    );
    res.json(user);
  } catch (err) {
    res.statusMessage = "User was not found.";
    res.status(401).send("User was not found.");
    return;
  }
});

//Edit user
usersRouter.put("/:id", authMW("userOwner"), async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) {
    res.statusMessage = error.details[0].message;
    res.status(400).json(error.details[0].message);
    return;
  }
  let user = await User.findOne({
    email: req.body.email,
    _id: { $ne: req.user._id },
  });
  if (user) {
    res.statusMessage = "A User with this email already exists.";
    res.status(400).send("A User with this email already exists.");
    return;
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body },
      { new: true }
    );
    res.json(
      _.pick(updatedUser, [
        "_id",
        "name",
        "email",
        "phone",
        "address",
        "image",
        "isBusiness",
      ])
    );
  } catch (err) {
    res.statusMessage = "Failed to update user.";
    res.status(400).send("Failed to update user.");
    return;
  }
});

//Change isBusiness
usersRouter.patch("/:id", authMW("userOwner"), async (req, res) => {
  const reqBodyKeys = Object.keys(req.body);
  if (reqBodyKeys.length !== 1 || !reqBodyKeys.includes("isBusiness")) {
    res.statusMessage =
      "The input must contain 'isBusiness' property and nothing else.";
    res
      .status(400)
      .send("The input must contain 'isBusiness' property and nothing else.");
    return;
  }
  if (typeof req.body.isBusiness !== "boolean") {
    res.statusMessage =
      "'isBusiness' must contain a Boolean value (true/false).";
    res
      .status(400)
      .send("'isBusiness' must contain a Boolean value (true/false).");
    return;
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body },
      { new: true }
    );
    res.json(
      _.pick(updatedUser, [
        "_id",
        "name",
        "email",
        "phone",
        "address",
        "image",
        "isBusiness",
      ])
    );
  } catch (err) {
    res.statusMessage = "Failed to update user.";
    res.status(400).send("Failed to update user.");
    return;
  }
});

//Delete User
usersRouter.delete("/:id", authMW("userOwner", "isAdmin"), async (req, res) => {
  try {
    const deletedUser = await User.findOneAndRemove({ _id: req.params.id });
    if (!deletedUser) {
      res.statusMessage = "User was not found..";
      res.status(400).send("User was not found..");
      return;
    }
    res.json(deletedUser);
  } catch (err) {
    res.statusMessage = "Failed to delete user.";
    res.status(400).send("Failed to delete user.");
    return;
  }
});

module.exports = usersRouter;
