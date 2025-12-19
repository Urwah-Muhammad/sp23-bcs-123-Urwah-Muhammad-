async function sessionAuth(req, res, next) {
  res.locals.user = req.session.user;
  res.locals.isAdmin = false;

  if (req.session.user && Array.isArray(req.session.user.roles)) {
    res.locals.isAdmin = Boolean(req.session.user.roles.find((r) => r === "admin"));
  } else if (!req.session.user) {
    req.session.user = null;
  }

  // Initialize cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = [];
  }

  // Flash helper (stored in session)
  req.flash = function (type, message) {
    req.session.flash = { type, message };
  };
  if (req.session.flash) {
    res.locals.flash = req.session.flash;
    req.session.flash = null;
  }

  next();
}

module.exports = sessionAuth;