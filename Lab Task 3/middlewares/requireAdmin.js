module.exports = async function requireAdmin(req, res, next) {
  const user = req.session.user;
  const isAdmin = Boolean(user && Array.isArray(user.roles) && user.roles.includes("admin"));

  if (!isAdmin) {
    if (req.flash) req.flash("danger", "Admin access required");
    return res.redirect("/login");
  }

  next();
};


