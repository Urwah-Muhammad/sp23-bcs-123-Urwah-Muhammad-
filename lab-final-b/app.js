var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var config = require("config");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// 1. Connect to MongoDB
mongoose
  .connect(config.get("db"))
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Import Routers
var indexRouter = require("./routes/index");
var protectedRouter = require("./routes/protected");
var shopRouter = require("./routes/shop"); 
var orderRouter = require("./routes/order"); // <--- Task 1 & 2: Order Logic
var sessionAuth = require("./middlewares/sessionAuth");
var checkSessionAuth = require("./middlewares/checkSessionAuth");
var requireAdmin = require("./middlewares/requireAdmin");
var superAdminMiddleware = require("./middlewares/super-admin");
var apiauth = require("./middlewares/apiauth");

var app = express();

// CORS middleware
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-auth-token");    
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 2. View engine setup with 'layout1'
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("layout", "layout1"); // <--- Fix: Set default layout
app.use(expressLayouts);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: config.get("sessionSecret"),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// --- ROUTES ---

// API Routes
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/public/products", require("./routes/api/public/products"));
app.use("/api/public/categories", require("./routes/api/public/catagories"));
app.use("/api/categories", require("./routes/api/catagories"));
app.use("/api/products", apiauth, require("./routes/api/products"));

// Super Admin Routes
app.use(
  "/super-admin",
  sessionAuth,
  requireAdmin,
  superAdminMiddleware,
  require("./routes/super-admin/dashboard")
);
app.use(
  "/super-admin",
  sessionAuth,
  requireAdmin,
  superAdminMiddleware,
  require("./routes/super-admin/products")
);

// Task 4: Admin Order Management
app.use(
  "/super-admin/orders",
  sessionAuth,
  requireAdmin,
  superAdminMiddleware,
  require("./routes/super-admin/orders")
);

// Frontend: My Account
app.use("/my-account", sessionAuth, checkSessionAuth, protectedRouter);

// Task 1 & 2: Order Public Routes (Preview, Confirm, History)
app.use("/order", sessionAuth, orderRouter); 

// General Site Routes
app.use("/", sessionAuth, indexRouter);

// Shop Routes (mounted twice to support /shop/cart and root URLs)
app.use("/shop", sessionAuth, shopRouter);
app.use("/", sessionAuth, shopRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;