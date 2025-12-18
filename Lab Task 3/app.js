var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var config = require("config");

var indexRouter = require("./routes/index");
var protectedRouter = require("./routes/protected");
var sessionAuth = require("./middlewares/sessionAuth");
var checkSessionAuth = require("./middlewares/checkSessionAuth");
var requireAdmin = require("./middlewares/requireAdmin");
var superAdminMiddleware = require("./middlewares/super-admin");
var apiauth = require("./middlewares/apiauth");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
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

// Routes
app.use("/", sessionAuth, indexRouter);
app.use("/my-account", sessionAuth, checkSessionAuth, protectedRouter);
app.use("/", sessionAuth, require("./routes/shop"));
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
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/public/products", require("./routes/api/public/products"));
app.use("/api/products", apiauth, require("./routes/api/products"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;





