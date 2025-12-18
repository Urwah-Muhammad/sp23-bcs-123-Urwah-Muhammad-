const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const config = require("config");

async function seedAdmin() {
  try {
    const connectionString = config.get("db");
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB");

    const existingUser = await User.findOne({ email: "admin@admin.com" });
    if (existingUser) {
      existingUser.roles = ["admin"];
      await existingUser.save();
      console.log("Admin user updated with correct roles!");
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin", salt);

    const adminUser = new User({
      name: "Admin",
      email: "admin@admin.com",
      password: hashedPassword,
      roles: ["admin"],
    });

    await adminUser.save();
    console.log("Admin user created successfully!");
    console.log("Email: admin@admin.com");
    console.log("Password: admin");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

seedAdmin();


