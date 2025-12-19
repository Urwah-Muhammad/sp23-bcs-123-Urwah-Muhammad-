const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); 
const User = require("../models/User"); // <--- Import User Model
const applyDiscount = require("../middlewares/applyDiscount");

// ===============================
// TASK 1 & 2: Order Preview & Checkout
// ===============================

// GET: Display Order Preview
router.get("/preview", applyDiscount, (req, res) => {
  res.render("order/preview", { 
    cart: req.session.cart,
    title: "Order Preview"
  });
});

// POST: Finalize Order
router.post("/confirm", applyDiscount, async (req, res) => {
  try {
    // 1. Get email from session if not provided in form
    let userEmail = req.body.email;
    if (!userEmail && req.session.user) {
      userEmail = req.session.user.email;
    }

    // 2. Prevent empty orders
    if (!req.session.cart || req.session.cart.length === 0) {
      if (req.flash) req.flash("danger", "Your cart is empty");
      return res.redirect("/products");
    }

    // 3. Create Order
    const newOrder = new Order({
      email: userEmail || "guest@example.com",
      items: req.session.cart,
      subtotal: res.locals.subtotal,
      discount: res.locals.discount,
      totalPrice: res.locals.grandTotal,
      status: "Placed",
      createdAt: new Date()
    });

    await newOrder.save();

    // 4. Clear Session Cart
    req.session.cart = []; 

    // 5. Clear Database Cart (if logged in)
    // This ensures the cart is empty if they log out and log back in
    if (req.session.user) {
        await User.findByIdAndUpdate(req.session.user._id, { cart: [] });
    }

    return res.render("order/success", { order: newOrder, title: "Order Success" });

  } catch (err) {
    console.log("Order Error:", err);
    res.status(500).send("Error processing order");
  }
});

// ===============================
// TASK 3: Customer Order History
// ===============================

// GET: Show Input Form
router.get("/my-orders", (req, res) => {
  res.render("order/my-orders", {
    orders: null, // No orders initially
    searchedEmail: null,
    title: "My Orders"
  });
});

// POST: Fetch and Show Orders
router.post("/my-orders", async (req, res) => {
  const email = req.body.email;
  
  try {
    // Find orders for this email, sorted by newest first
    const orders = await Order.find({ email: email }).sort({ createdAt: -1 });
    
    res.render("order/my-orders", {
      orders: orders,
      searchedEmail: email,
      title: "My Orders"
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching orders");
  }
});

module.exports = router;