var express = require("express");
var router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* GET home page. */
router.get("/login", function (req, res, next) {
  return res.render("site/login", { layout: "layout1", title: "Login" });
});

router.post("/login", async function (req, res, next) {
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("danger", "User with this email not present");
    return res.redirect("/login");
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (validPassword) {
    // Store only necessary user data as plain object (not Mongoose document)
    let roles = user.roles || [];
    if (roles.includes("admin")) {
      roles = ["admin"];
    }
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: roles
    };
    req.flash("success", "Logged in Successfully");
    if (Array.isArray(user.roles) && user.roles.includes("admin")) return res.redirect("/super-admin");
    return res.redirect("/");
  } else {
    req.flash("danger", "Invalid Password");
    return res.redirect("/login");
  }
});

router.get("/register", function (req, res, next) {
  return res.render("site/register", { layout: "layout1", title: "Register" });
});

router.get("/logout", async (req, res) => {
  req.session.user = null;
  console.log("session clear");
  return res.redirect("/login");
});

router.post("/register", async function (req, res, next) {
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    req.flash("danger", "User with given email already registered");
    return res.redirect("/register");
  }
  user = new User(req.body);
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  if (!user.roles || user.roles.length === 0) {
    user.roles = ["customer"];
  }
  await user.save();
  return res.redirect("/login");
});

router.get("/contact-us", function (req, res, next) {
  return res.render("site/contact", { layout: "layout1", title: "Contact Us" });
});

// Products page route (additional feature)
router.get("/products", async function (req, res, next) {
  const Product = require("../models/Product");
  const q = req.query.q || "";
  let products = [];
  
  if (q) {
    products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { color: { $regex: q, $options: "i" } },
      ],
    });
  } else {
    products = await Product.find({});
  }
  
  return res.render("site/products", { layout: "layout1", title: "Products", products, q });
});

// Add to cart route (POST version for products page)
router.post("/cart/add", async function (req, res, next) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const { productId } = req.body;
  const Product = require("../models/Product");
  
  try {
    const product = await Product.findById(productId);
    if (!product) {
      req.flash("danger", "Product not found");
      return res.redirect("/products");
    }
    
    // Check if product already in cart
    const existingItem = req.session.cart.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      req.session.cart.push({
        productId: product._id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        color: product.color,
        department: product.department,
        image: product.image,
        quantity: 1
      });
    }
    
    req.flash("success", "Product added to cart");
    return res.redirect("/products");
  } catch (err) {
    req.flash("danger", "Error adding product to cart");
    return res.redirect("/products");
  }
});

// Checkout page route
router.get("/checkout", async function (req, res, next) {
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash("info", "Your cart is empty");
    return res.redirect("/products");
  }
  
  const Product = require("../models/Product");
  const cartItems = [];
  let subtotal = 0;
  
  // Fetch full product details for cart items
  for (let item of req.session.cart) {
    const product = await Product.findById(item.productId);
    if (product) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      cartItems.push({
        ...item,
        product: product
      });
    }
  }
  
  const shipping = 15.00;
  const total = subtotal + shipping;
  
  return res.render("site/checkout", { 
    layout: "layout1", 
    title: "Checkout",
    cartItems: cartItems,
    subtotal: subtotal.toFixed(2),
    shipping: shipping.toFixed(2),
    total: total.toFixed(2)
  });
});

// Payment confirmation route
router.post("/checkout/confirm", function (req, res, next) {
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash("danger", "Your cart is empty");
    return res.redirect("/products");
  }
  
  // Generate order number
  const orderNumber = "ORD-" + Date.now().toString().slice(-6);
  
  // Store order in session (for success page)
  req.session.lastOrder = {
    orderNumber: orderNumber,
    cart: req.session.cart,
    timestamp: new Date()
  };
  
  // Clear cart
  req.session.cart = [];
  
  // Redirect to success page
  return res.redirect("/checkout/success");
});

// Success page route
router.get("/checkout/success", function (req, res, next) {
  if (!req.session.lastOrder) {
    return res.redirect("/products");
  }
  
  const orderNumber = req.session.lastOrder.orderNumber;
  const orderCart = req.session.lastOrder.cart;
  
  // Clear last order from session
  req.session.lastOrder = null;
  
  return res.render("site/checkout", { 
    layout: "layout1", 
    title: "Payment Successful",
    showSuccess: true,
    orderNumber: orderNumber,
    orderCart: orderCart
  });
});


module.exports = router;