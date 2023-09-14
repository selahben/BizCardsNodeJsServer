const mongoose = require("mongoose");
const Joi = require("joi");
const _ = require("lodash");

const cardsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
  subtitle: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
  description: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 1024,
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
  },
  web: {
    type: String,
    required: true,
    minlength: 11,
    maxlength: 1024,
  },
  image: {
    url: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_1280.jpg",
      minlength: 11,
      maxlength: 1024,
    },
    alt: {
      type: String,
      minlength: 6,
      maxlength: 255,
      default: "Business Image",
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
  bizNumber: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 999_999_999,
    unique: true,
  },
  likes: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Card = mongoose.model("Card", cardsSchema, "cards");

function validateCard(card) {
  const schema = Joi.object({
    title: Joi.string().min(2).max(255).required(),
    subtitle: Joi.string().min(2).max(255).required(),
    description: Joi.string().min(2).max(1024).required(),
    phone: Joi.string()
      .min(9)
      .max(10)
      .required()
      .regex(/^0[2-9]\d{7,8}$/),
    email: Joi.string().min(6).max(255).required().email({ tlds: false }),
    web: Joi.string().min(11).max(1024).required(),
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
  });

  return schema.validate(card);
}

async function generateBizNumber() {
  while (true) {
    const randomNumber = _.random(1000, 999_999_999);
    const card = await Card.findOne({ bizNumber: randomNumber });
    if (!card) {
      return String(randomNumber);
    }
  }
}

module.exports = { Card, validateCard, generateBizNumber };
