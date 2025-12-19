module.exports = function applyDiscount(req, res, next) {
  // 1. Calculate subtotal from session cart
  let subtotal = 0;
  if (req.session.cart && req.session.cart.length > 0) {
    subtotal = req.session.cart.reduce((acc, item) => {
      let price = parseFloat(item.price);
      let qty = parseInt(item.quantity);
      return acc + (price * qty);
    }, 0);
  }

  // 2. Check for coupon
  const couponCode = req.query.coupon || req.body.coupon;
  let discountPercent = 0;

  if (couponCode === "SAVE10") {
    discountPercent = 0.10; // 10%
  }

  // 3. Calculate Discount Amount
  let discountAmount = subtotal * discountPercent;
  let grandTotal = subtotal - discountAmount;

  // 4. Attach data to res.locals as NUMBERS (Do not use toFixed here)
  res.locals.subtotal = subtotal;           // Keeps it as a Number
  res.locals.cartSubtotal = subtotal;       // Backup variable name
  res.locals.discount = discountAmount;     // Keeps it as a Number
  res.locals.grandTotal = grandTotal;       // Keeps it as a Number
  
  res.locals.couponCode = couponCode || ""; 
  res.locals.couponApplied = (discountPercent > 0); // Boolean flag

  next();
};