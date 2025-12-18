var express = require("express");
var router = express.Router();
var Category = require("../../../models/Category");

router.get("/", async function (req, res, next) {
  console.log("inside");
  setTimeout(async () => {
    let catagories = await Category.find();

    res.send(catagories);
  }, 5000);
});
module.exports = router;
