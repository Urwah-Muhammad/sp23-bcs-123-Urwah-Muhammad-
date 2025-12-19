var express = require("express");
var router = express.Router();
var Product = require("../models/Product");

router.get("/cart", async function (req, res, next) {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.render("site/cart", { products: [], total: 0 });
  }
  
  let productIds = req.session.cart.map(item => item.productId);
  let products = await Product.find({ _id: { $in: productIds } });
  
  // Map products with quantities from cart
  let cartProducts = products.map(product => {
    let cartItem = req.session.cart.find(item => item.productId.toString() === product._id.toString());
    return {
      ...product.toObject(),
      quantity: cartItem ? cartItem.quantity : 1
    };
  });

  let total = cartProducts.reduce(
    (total, product) => total + (Number(product.price) * (product.quantity || 1)),
    0
  );

  res.render("site/cart", { products: cartProducts, total });
});

router.get("/add-cart/:id", async function (req, res, next) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const productId = req.params.id;
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
  
  req.flash("success", "Product Added To Cart");
  res.redirect("/products");
});

router.get("/products", async function (req, res, next) {
  try {
    let q = req.query.q;
    let query = {};
    
    if (q) {
      query = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { department: { $regex: q, $options: "i" } },
          { color: { $regex: q, $options: "i" } }
        ]
      };
    }
    
    let products = await Product.find(query);
    return res.render("site/products", {
      layout: "layout1",
      products,
      q: q || ""
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.render("site/products", {
      layout: "layout1",
      products: [],
      q: ""
    });
  }
});

router.post("/cart/add", async function (req, res, next) {
  try {
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    const productId = req.body.productId;
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
    
    req.flash("success", "Product Added To Cart");
    res.redirect("/products");
  } catch (err) {
    console.error("Error adding to cart:", err);
    req.flash("danger", "Error adding product to cart");
    res.redirect("/products");
  }
});

router.get("/:page?", async function (req, res, next) {
  let page = Number(req.params.page);
  let pageSize = 10;
  let skip = (page - 1) * pageSize;
  if (!page) page = 1;
  if (!skip) skip = 0;

  let products = await Product.find().skip(skip).limit(pageSize);
  let totalProducts = await Product.countDocuments();
  let totalPages = Math.ceil(totalProducts / pageSize);
  return res.render("site/homepage", {
    layout: "layout1",
    pagetitle: "Awesome Products",
    products,
    page,
    pageSize,
    totalPages,
  });
});

module.exports = router;
