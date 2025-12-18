var express = require("express");
var router = express.Router();
var Product = require("../../models/Product");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "public/images/uploaded");
  },
  filename: (req, file, callBack) => {
    callBack(null, `${Date.now()}-${file.originalname.split(" ").join("-")}`);
  },
});

let upload = multer({ storage });

router.get("/:id", async function (req, res) {
  let product = await Product.findById(req.params.id);
  return res.send(product);
});

router.get("/", async function (req, res) {
  let products = await Product.find();
  return res.send(products);
});

router.post("/", upload.single("image"), async function (req, res) {
  let product = new Product(req.body);
  if (req.file) product.image = req.file?.filename ? req.file.filename : "";
  await product.save();
  return res.send(product);
});

router.put("/:id", async function (req, res) {
  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found");

  product.name = req.body.name;
  product.price = req.body.price;
  product.color = req.body.color;
  product.description = req.body.description;
  product.department = req.body.department;
  await product.save();
  return res.send(product);
});

router.delete("/:id", async function (req, res) {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    await product.deleteOne();
    return res.send("deleted");
  } catch (err) {
    return res.status(400).send("Invalid Id");
  }
});

module.exports = router;


