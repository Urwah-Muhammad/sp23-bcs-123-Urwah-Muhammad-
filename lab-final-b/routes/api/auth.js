var express = require("express");
var router = express.Router();
var User = require("../../models/User");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");

// JWT login (useful for API clients)
router.post("/", async function (req, res) {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email or password");

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send("Invalid email or password");

    const token = jwt.sign(
      { _id: user._id, roles: user.roles, name: user.name, email: user.email },
      config.get("jwtPrivateKey")
    );

    return res.send(token);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;