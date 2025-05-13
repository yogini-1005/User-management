const express = require("express");
const user_route = express();
const session = require("express-session");
const config = require("../config/config");
const path = require("path");

user_route.use(express.static('public'))

// Session configuration
user_route.use(session({
    secret: config.sessionSecret, // This now matches the exported property
    resave: false,
    saveUninitialized: false
  }));

// View engine setup
user_route.set('view engine', 'ejs');
user_route.set('views', path.join(__dirname, '../views/users'));

// Body parser middleware
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
user_route.use(express.static(path.join(__dirname, '../public')));

// Multer configuration for file uploads
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function(req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
const auth = require("../middleware/auth");

// Controllers
const userController = require("../controllers/userController");

// Routes
user_route.get("/register", auth.isLogout, userController.loadRegister);
user_route.post("/register", upload.single('image'), userController.insertUser);

user_route.get("/verify", userController.verifyMail);

user_route.get("/", auth.isLogout, userController.loginLoad);
user_route.get("/login", auth.isLogout, userController.loginLoad);
user_route.post("/login", userController.verifyLogin);

user_route.get("/home", auth.isLogin, userController.loadHome);

user_route.get("/logout", auth.isLogin, userController.userLogout);

user_route.get("/forgot", auth.isLogout, userController.forgotLoad);

user_route.post("/forgot", userController.forgotVerify);

user_route.get("/forgot-password", auth.isLogout, userController.forgotPassLoad);

user_route.post("/forgot-password", userController.resetPassLoad);

user_route.get("/verification", userController.verificationLoad);

user_route.post("/verification", userController.sentVerification);

user_route.get('/edit', auth.isLogin, userController.editLoad);

user_route.post('/edit', upload.single('image'), userController.updateProfile)

// Error handling middleware
user_route.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { message: "Internal Server Error" });
});


// 404 handler
user_route.use((req, res) => {
  res.status(404).render('404', { message: "Page not found." });
});


module.exports = user_route;