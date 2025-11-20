// Helper to set layout for admin routes
const setAdminLayout = (req, res, next) => {
  res.locals.layout = 'layouts/admin';
  next();
};

module.exports = { setAdminLayout };

