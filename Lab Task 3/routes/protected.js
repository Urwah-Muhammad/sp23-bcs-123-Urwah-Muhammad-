var express = require("express");
var router = express.Router();

router.get("/", function (req, res) {
  return res.render("site/myaccount", { layout: "layout1", title: "My Account" });
});

module.exports = router;


