const jwt = require("jsonwebtoken");
const config = require("config");
const { Card } = require("../models/cardsModel");

function authMW(...roles) {
  return async (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token) {
      res.statusMessage = "Access Denied. No token provided";
      res.status(401).send("Access Denied. No token provided");
      return;
    }

    let rolesObj = {
      isAdmin: false,
      isBusiness: false,
      userOwner: false,
      cardOwner: false,
    };

    try {
      const decode = jwt.verify(token, config.get("auth.JWT_SECRET"));
      req.user = decode;

      if (!roles || roles.length == 0) {
        next();
        return;
      }

      if (roles.includes("isAdmin") && req.user.isAdmin) {
        rolesObj.isAdmin = true;
      }

      if (
        roles.includes("userOwner") &&
        req.params.id &&
        req.user._id == req.params.id
      ) {
        rolesObj.userOwner = true;
      }

      if (roles.includes("isBusiness") && req.user.isBusiness) {
        rolesObj.isBusiness = true;
      }

      if (roles.includes("cardOwner")) {
        try {
          const card = await Card.findOne({
            _id: req.params.id,
            user_id: req.user._id,
          });
          if (!card) {
            res.statusMessage =
              "Card Operation Failed. A Card with that ID was not found or you are not it's owner.";
            res
              .status(401)
              .send(
                "Card Operation Failed. A Card with that ID was not found or you are not it's owner."
              );
            return;
          } else {
            rolesObj.cardOwner = true;
          }
        } catch (err) {
          res.statusMessage("Error finding any card.");
          res.status(401).send("Error finding any card.");
          return;
        }
      }

      let rolesValArr = [];
      roles.forEach((role) => {
        rolesValArr.push(rolesObj[role]);
      });
      let rolesValidation = rolesValArr.reduce(
        (accumulator, currentValue) => accumulator || currentValue,
        false
      );

      if (rolesValidation) {
        next();
        return;
      } else {
        res.statusMessage = "User is not authorized to do that operation.";
        res.status(400).send("User is not authorized to do that operation.");
        return;
      }
    } catch (err) {
      res.statusMessage = "Invalid Token";
      res.status(400).send("Invalid Token");
      return;
    }
  };
}

module.exports = authMW;
