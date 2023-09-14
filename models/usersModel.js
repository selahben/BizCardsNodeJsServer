const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const usersSchema = new mongoose.Schema({
  name: {
    first: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 255,
    },
    middle: {
      type: String,
      minlength: 0,
      maxlength: 255,
      default: "",
    },
    last: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 255,
    },

    _id: {
      type: mongoose.Types.ObjectId,
      default: new mongoose.Types.ObjectId(),
    },
  },
  phone: {
    type: String,
    required: true,
    minlength: 9,
    maxlength: 10,
  },
  email: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
  },
  image: {
    url: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      minlength: 11,
      maxlength: 1024,
    },
    alt: {
      type: String,
      minlength: 6,
      maxlength: 255,
      default: "User Image",
    },
    _id: {
      type: mongoose.Types.ObjectId,
      default: new mongoose.Types.ObjectId(),
    },
  },
  address: {
    state: {
      type: String,
      minlength: 0,
      maxlength: 255,
      default: "",
    },
    country: {
      type: String,
      minlength: 3,
      maxlength: 255,
      required: true,
    },
    city: {
      type: String,
      minlength: 6,
      maxlength: 255,
      required: true,
    },
    street: {
      type: String,
      minlength: 3,
      maxlength: 255,
      required: true,
    },
    houseNumber: {
      type: String,
      minlength: 1,
      maxlength: 10,
      required: true,
    },
    zip: {
      type: String,
      minlength: 0,
      maxlength: 12,
      default: "",
    },

    _id: {
      type: mongoose.Types.ObjectId,
      default: new mongoose.Types.ObjectId(),
    },
  },
  isBusiness: {
    type: Boolean,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

usersSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      isBusiness: this.isBusiness,
      isAdmin: this.isAdmin,
    },
    config.get("auth.JWT_SECRET")
  );
};

const User = mongoose.model("User", usersSchema, "users");

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.object({
      first: Joi.string().min(2).max(255).required(),
      middle: Joi.string().min(2).max(255),
      last: Joi.string().min(2).max(255).required(),
    }).required(),
    phone: Joi.string()
      .min(9)
      .max(10)
      .required()
      .regex(/^0[2-9]\d{7,8}$/),
    email: Joi.string().min(6).max(255).required().email({ tlds: false }),
    password: Joi.string().min(6).max(1024).required(),
    image: Joi.object({
      url: Joi.string().min(11).max(1024),
      alt: Joi.string().min(6).max(255),
    }),
    address: Joi.object({
      state: Joi.string().allow(""),
      country: Joi.string().min(3).max(255).required(),
      city: Joi.string().min(6).max(255).required(),
      street: Joi.string().min(3).max(255).required(),
      houseNumber: Joi.string().min(1).max(10).required(),
      zip: Joi.string().min(0).max(12),
    }).required(),
    isBusiness: Joi.boolean().required(),
  });

  return schema.validate(user);
}

module.exports = { User, validateUser };
