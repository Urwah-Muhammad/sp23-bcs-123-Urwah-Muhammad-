var express = require("express");
var router = express.Router();
var Product = require("../../../models/Product");

router.get("/:id", async function (req, res) {
  let product = await Product.findById(req.params.id);
  return res.send(product);
});

router.get("/", async function (req, res) {
  let products = await Product.find();
  return res.send(products);
});

module.exports = router;


