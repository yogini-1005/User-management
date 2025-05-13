const express = require("express");
const app = express();
const path = require("path");

// Database connection
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/ums")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/users"),
  path.join(__dirname, "views")
]);

// Routes
const userRoute = require("./routes/userRoutes");
const adminRoute = require("./routes/adminRoutes");

app.use("/", userRoute);
app.use("/admin", adminRoute); // Admin routes prefixed with /admin

// Error handling
app.use((req, res) => {
  res.status(404).render("404");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});