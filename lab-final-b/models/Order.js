const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  email: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  subtotal: Number,
  discount: { type: Number, default: 0 },
  totalPrice: Number,
  status: {
    type: String,
    enum: ["Placed", "Processing", "Delivered"],
    default: "Placed",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);