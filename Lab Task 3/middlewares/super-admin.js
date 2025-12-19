module.exports = async function (req, res, next) {
  res.locals.layout = "super-admin-layout";
  res.locals.title = "Admin Panel";
  next();
};