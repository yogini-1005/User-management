const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const config = require("../config/config");

// Secure Password Hashing
const securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    throw new Error("Password hashing failed");
  }
};

// Send Verification Email
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
      rejectUnauthorized: false,
    });

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "Email Verification",
      html: `<p>Hi ${name}, please click the link below to verify your email:</p>
             <a href="http://localhost:3000/verify?id=${user_id}">Verify</a>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    throw error;
  }
};

// Send Password Reset Email
const sendResetMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    const resetLink = `http://localhost:3000/forgot-password?token=${encodeURIComponent(
      token
    )}`;

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "Reset Password Link",
      text: `Hi ${name}, click this link to reset your password: ${resetLink}`,
      html: `<p>Hi ${name},</p>
             <p>Click the link below to reset your password:</p>
             <a href="${resetLink}">Reset Password</a>
             <p>If you did not request this, please ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent to:", email);
  } catch (error) {
    console.error("Error sending reset email:", error.message);
    throw error;
  }
};

// Load Registration Page
const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("500");
  }
};

// Insert New User
const insertUser = async (req, res) => {
  try {
    if (!req.file) {
      return res.render("registration", { message: "Please upload an image." });
    }

    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      image: req.file.filename,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();
    await sendVerifyMail(req.body.name, req.body.email, userData._id);

    res.render("registration", {
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.render("registration", { message: "Registration failed." });
  }
};

// Verify Email
const verifyMail = async (req, res) => {
  try {
    await User.updateOne({ _id: req.query.id }, { is_verified: 1 });
    res.render("email-verified");
  } catch (error) {
    console.error("Verification error:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Load Login Page
const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("500");
  }
};

// Verify Login Credentials
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.render("login", { message: "Email or password is invalid." });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.render("login", { message: "Email or password is invalid." });
    }

    if (userData.is_verified === 0) {
      return res.render("login", { message: "Please verify your email." });
    }

    req.session.user_id = userData._id;
    res.redirect("/home");
  } catch (error) {
    console.error("Login error:", error.message);
    res.render("login", { message: "An error occurred." });
  }
};

// Load Home Page
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { user: userData });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// User Logout
const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Load Forgot Password Page
const forgotLoad = async (req, res) => {
  try {
    res.render("forgot");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("500");
  }
};

// Verify Email for Password Reset
const forgotVerify = async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.render("forgot", { message: "Email is required." });
    }

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.render("forgot", { message: "Email not found." });
    }

    if (!userData.is_verified) {
      return res.render("forgot", { message: "Please verify your email." });
    }

    const randomString = randomstring.generate();
    const updatedData = await User.updateOne(
      { email: email },
      { $set: { token: randomString } }
    );

    if (updatedData.modifiedCount === 1) {
      sendResetMail(userData.name, userData.email, randomString);
      return res.render("forgot", {
        message: "Please check your email to reset password.",
      });
    } else {
      return res.render("forgot", {
        message: "Something went wrong while generating reset link.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.render("forgot", { message: "An error occurred." });
  }
};

const forgotPassLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("forgot-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is invalid." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassLoad = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const secure_password = await securePassword(password);

    await User.findByIdAndUpdate(user_id, {
      $set: { password: secure_password },
    });
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.render("forgot-password", { message: "Failed to reset password." });
  }
};

const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

const sentVerification = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email });

    if (userData) {
      await sendVerifyMail(userData.name, userData.email, userData._id); // use _id instead of user_id
      res.render("verification", {
        message: "Reset verification mail sent. Please check your email id.",
      });
    } else {
      res.render("verification", { message: "This email doesn't exist." });
    }
  } catch (error) {
    console.log(error.message);
    res.render("verification", { message: "An error occurred." });
  }
};

const editLoad = async (req, res) => {
  try {
    const id = req.query.id;

    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render('edit',{user:userData});
    } else {
    res.redirect('/home');
  }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
   if(req.file){
    const userData=await User.findByIdAndUpdate({ _id:req.body.user_id },{ $set:{name:req.body.name,email:req.body.email,mobile:req.body.mno,image:req.file.filename} })
   }else{
    const userData=await User.findByIdAndUpdate({ _id:req.body.user_id },{ $set:{name:req.body.name,email:req.body.email,mobile:req.body.mno} });
   }

   res.redirect('/home');
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  forgotLoad,
  forgotVerify,
  forgotPassLoad,
  resetPassLoad,
  verificationLoad,
  sentVerification,
  editLoad,
  updateProfile
};
