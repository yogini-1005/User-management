const isLogin = async (req, res, next) => {
    try {
      if (req.session.user_id) {
        return next(); // User is logged in, proceed
      }
      return res.redirect('/'); // User not logged in, redirect
    } catch (error) {
      console.log(error.message);
      return res.status(500).redirect('/'); // Handle errors gracefully
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.user_id) {
        return res.redirect('/home'); // User is logged in, redirect to home
      }
      return next(); // User not logged in, proceed
    } catch (error) {
      console.log(error.message);
      return res.status(500).redirect('/'); // Handle errors gracefully
    }
  };
  
  module.exports = {
    isLogin,
    isLogout
  };