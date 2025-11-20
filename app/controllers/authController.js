const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      req.session.error = 'Username and password are required';
      return res.redirect('/admin/login');
    }

    const user = await User.findOne({ username });
    if (!user) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/admin/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/admin/login');
    }

    req.session.user = { id: user._id, username: user.username };
    req.session.success = 'Welcome back!';
    res.redirect('/admin');
  } catch (error) {
    req.session.error = 'An error occurred during login';
    res.redirect('/admin/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/admin/login');
  });
};

exports.showLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin');
  }
  res.locals.layout = false;
  res.render('admin/login');
};

