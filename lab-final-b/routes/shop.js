var express = require("express");
var router = express.Router();
var Product = require("../models/Product");
var User = require("../models/User"); // <--- IMPORT USER MODEL

// 1. Show Cart Page
router.get("/cart", async function (req, res, next) {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.render("site/cart", { products: [], total: 0 });
  }

  let productIds = req.session.cart.map((item) => item.productId);
  let products = await Product.find({ _id: { $in: productIds } });

  // Map products with quantities from cart
  let cartProducts = products.map((product) => {
    let cartItem = req.session.cart.find(
      (item) => item.productId.toString() === product._id.toString()
    );
    return {
      ...product.toObject(),
      quantity: cartItem ? cartItem.quantity : 1,
    };
  });

  let total = cartProducts.reduce(
    (total, product) => total + Number(product.price) * (product.quantity || 1),
    0
  );

  res.render("site/cart", { products: cartProducts, total });
});

// 2. Add to Cart (GET Method - via Link)
router.get("/add-cart/:id", async function (req, res, next) {
  try {
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
    const existingItem = req.session.cart.find(
      (item) => item.productId.toString() === productId
    );
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
        quantity: 1,
      });
    }

    // --- SAVE TO DB IF LOGGED IN ---
    if (req.session.user) {
      await User.findByIdAndUpdate(req.session.user._id, {
        cart: req.session.cart,
      });
    }
    // -------------------------------

    req.flash("success", "Product Added To Cart");
    res.redirect("/products");
  } catch (err) {
    console.error("Error adding to cart:", err);
    req.flash("danger", "Error adding product to cart");
    res.redirect("/products");
  }
});

// 3. Add to Cart (POST Method - via Form, if used)
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
    const existingItem = req.session.cart.find(
      (item) => item.productId.toString() === productId
    );
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
        quantity: 1,
      });
    }

    // --- SAVE TO DB IF LOGGED IN ---
    if (req.session.user) {
      await User.findByIdAndUpdate(req.session.user._id, {
        cart: req.session.cart,
      });
    }
    // -------------------------------

    req.flash("success", "Product Added To Cart");
    res.redirect("/products");
  } catch (err) {
    console.error("Error adding to cart:", err);
    req.flash("danger", "Error adding product to cart");
    res.redirect("/products");
  }
});

// 4. Products Page (Search & List)
router.get("/products", async function (req, res, next) {
  try {
    let q = req.query.q;
    let query = {};

    if (q) {
      query = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { department: { $regex: q, $options: "i" } },
          { color: { $regex: q, $options: "i" } },
        ],
      };
    }

    let products = await Product.find(query);
    return res.render("site/products", {
      layout: "layout1",
      products,
      q: q || "",
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.render("site/products", {
      layout: "layout1",
      products: [],
      q: "",
    });
  }
});

// 5. Homepage (Pagination)
// WARNING: This must be at the BOTTOM because /:page? matches everything
router.get("/:page?", async function (req, res, next) {
  try {
    let page = Number(req.params.page);
    let pageSize = 10;
    
    // Check if 'page' is actually a string route that got caught here (e.g. "favicon.ico")
    if (isNaN(page)) {
        if(req.params.page === "cart") return next(); // Fallback just in case
        page = 1; 
    }

    let skip = (page - 1) * pageSize;
    if (!page || page < 1) page = 1;
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
  } catch (err) {
      console.log(err);
      res.redirect("/products");
  }
});

module.exports = router;