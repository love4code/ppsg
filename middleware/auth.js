// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.error = 'Please log in to access this page';
    return res.redirect('/admin/login');
  }
  next();
};

module.exports = { requireAuth };

