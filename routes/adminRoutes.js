const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Admin home route - shows login form
router.get("/", adminController.loadLogin);

// Login processing
router.post("/", adminController.verifyLogin);

// Dashboard route
router.get("/dashboard", adminController.dashboard);

module.exports = router;