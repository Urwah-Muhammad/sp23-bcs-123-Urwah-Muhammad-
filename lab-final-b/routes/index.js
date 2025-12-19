const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET Home Page
router.get("/", function (req, res, next) {
  res.render("site/homepage", { pagetitle: "Home", layout: "layout1" });
});

// GET Login Page
router.get("/login", function (req, res, next) {
  // UPDATED PATH: site/login
  res.render("site/login", { layout: "layout1", title: "Login" });
});

// POST Login Logic
router.post("/login", async function (req, res, next) {
  let user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    req.flash("danger", "User with this email not present");
    return res.redirect("/login");
  }
  
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  
  if (validPassword) {
    // 1. Set User Session
    req.session.user = { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        roles: user.roles 
    };

    // 2. Load Saved Cart from DB
    req.session.cart = user.cart || [];

    req.flash("success", "Logged in Successfully");
    
    if (user.roles.includes("admin")) return res.redirect("/super-admin");
    return res.redirect("/");
  } else {
    req.flash("danger", "Invalid Password");
    return res.redirect("/login");
  }
});

// GET Register Page
router.get("/register", function (req, res, next) {
  // UPDATED PATH: site/register (Assuming this is also in site folder)
  res.render("site/register", { layout: "layout1", title: "Register" });
});

// POST Register Logic
router.post("/register", async function (req, res, next) {
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    req.flash("danger", "User already exists");
    return res.redirect("/register");
  }
  
  user = new User(req.body);
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  
  await user.save();
  req.flash("success", "Registered Successfully");
  res.redirect("/login");
});

// GET Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;