const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  roles: [String],
  cart: { type: Array, default: [] } // Stores the cart persistently
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;