const cardsRouter = require("express").Router();
const authMW = require("../middleware/authMW");

const {
  Card,
  validateCard,
  generateBizNumber,
} = require("../models/cardsModel");

//Get All Cards
cardsRouter.get("/", async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.statusMessage = "Error! Can't retrieve cards.";
    res.status(400).send("Error! Can't retrieve cards.");
    return;
  }
});

//Get All user Cards
cardsRouter.get("/my-cards", authMW("isBusiness"), async (req, res) => {
  try {
    const cards = await Card.find({ user_id: req.user._id });
    res.json(cards);
  } catch (err) {
    res.statusMessage = "Error! Can't retrieve cards.";
    res.status(400).send("Error! Can't retrieve cards.");
    return;
  }
});

//Get Card by ID
cardsRouter.get("/:id", async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id });
    res.json(card);
  } catch (err) {
    res.statusMessage = "Error! Card was not found.";
    res.status(400).send("Error! Card was not found.");
    return;
  }
});

//Create New Card
cardsRouter.post("/", authMW("isBusiness"), async (req, res) => {
  const { error } = validateCard(req.body);
  if (error) {
    res.status(400).json(error.details[0].message);
    return;
  }

  const card = new Card({
    ...req.body,
    bizNumber: await generateBizNumber(),
    user_id: req.user._id,
  });

  await card.save();

  res.json(card);
});

//Edit Card
cardsRouter.put("/:id", authMW("cardOwner"), async (req, res) => {
  const { error } = validateCard(req.body);
  if (error) {
    res.statusMessage = error.details[0].message;
    res.status(400).json(error.details[0].message);
    return;
  }

  try {
    const updatedCard = await Card.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body },
      { new: true }
    );
    res.json(updatedCard);
  } catch (err) {
    res.statusMessage = "Failed to update card.";
    res.status(400).send("Failed to update card.");
    return;
  }
});

//Like a card
cardsRouter.patch("/:id", authMW(), async (req, res) => {
  try {
    const foundCard = await Card.findOne({
      _id: req.params.id,
      "likes.user_id": req.user._id,
    });
    if (foundCard) {
      res.statusMessage = "You already liked this card.";
      res.status(400).send("You already liked this card.");
      return;
    }
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id },
      { "$push": { likes: { user_id: req.user._id } } },
      { new: true }
    );
    res.json(card);
  } catch (err) {
    res.statusMessage = "The Card Likes where not updated.";
    res.status(400).send("The Card Likes where not updated.");
    return;
  }
});

//Delete card
cardsRouter.delete("/:id", authMW("cardOwner", "isAdmin"), async (req, res) => {
  try {
    const deletedCard = await Card.findOneAndRemove({ _id: req.params.id });
    res.json(deletedCard);
  } catch (err) {
    res.statusMessage = "Failed to delete card.";
    res.status(400).send("Failed to delete card.");
    return;
  }
});

//Change card bizNumber (from body or auto generate)
cardsRouter.patch("/bizNum/:id", authMW("isAdmin"), async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id });
    if (!card) {
      res.statusMessage = "No card with this ID was found.";
      res.status(401).send("No card with this ID was found.");
    }
  } catch (err) {
    res.statusMessage = "Database Error.";
    res.status(401).send(err.message);
  }
  if (Object.keys(req.body).length > 0 && req.body.bizNumber) {
    try {
      const card = await Card.findOne({
        bizNumber: req.body.bizNumber,
        _id: { $ne: req.params.id },
      });
      if (card) {
        res.statusMessage = "A card with this bizNumber already exists.";
        res.status(401).send("A card with this bizNumber already exists.");
        return;
      }
    } catch (err) {
      res.statusMessage = "Database Error.";
      res.status(401).send(err.message);
    }
  }
  try {
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id },
      {
        bizNumber:
          Object.keys(req.body).length > 0 && req.body.bizNumber
            ? req.body.bizNumber
            : await generateBizNumber(),
      },
      { new: true }
    );
    res.send(card);
  } catch (err) {
    res.statusMessage = "Failed to update user.";
    res.status(400).send("Failed to update user.");
    return;
  }
});

module.exports = cardsRouter;
