const User = require("../models/userModel");
const bcrypt = require("bcrypt");

const loadLogin = async (req, res) => {
    try {
      res.render("login", { 
        layout: false,
        title: "Admin Login" 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  };
  
  const verifyLogin = async (req, res) => {
    try {
      // Add your authentication logic here
      // For now, we'll just redirect to dashboard
      res.redirect("/admin/dashboard");
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  };
  
  const dashboard = async (req, res) => {
    try {
      res.render("admin/dashboard", {
        title: "Admin Dashboard"
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  };
  
  module.exports = {
    loadLogin,
    verifyLogin,
    dashboard
  };