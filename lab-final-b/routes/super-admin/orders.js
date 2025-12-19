const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");

// GET: List all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render("super-admin/orders/list", {
      orders,
      layout: "super-admin-layout",
      title: "Manage Orders"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching orders");
  }
});

// POST: Update Order Status
router.post("/:id/update-status", async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;
    const order = await Order.findById(orderId);

    if (!order) {
      req.flash("danger", "Order not found");
      return res.redirect("/super-admin/orders");
    }

    const currentStatus = order.status;

    // Lifecycle Logic: Prevent skipping steps
    let isValidTransition = false;

    if (currentStatus === "Placed" && newStatus === "Processing") isValidTransition = true;
    if (currentStatus === "Processing" && newStatus === "Delivered") isValidTransition = true;
    
    // Optional: Allow reverting or duplicate status if needed, but per task "Prevent skipping"
    if (currentStatus === newStatus) isValidTransition = true; 

    if (isValidTransition) {
      order.status = newStatus;
      await order.save();
      req.flash("success", "Order status updated successfully");
    } else {
      req.flash("danger", `Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    res.redirect("/super-admin/orders");

  } catch (err) {
    console.error(err);
    req.flash("danger", "Error updating status");
    res.redirect("/super-admin/orders");
  }
});

module.exports = router;