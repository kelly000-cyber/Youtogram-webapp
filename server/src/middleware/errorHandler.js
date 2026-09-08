const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const fieldLabels = {
      username: 'Username',
      email: 'Email',
      phone: 'Mobile number'
    };

    return res.status(400).json({
      status: 'error',
      message: `${fieldLabels[duplicateField] || 'That value'} is already in use`
    });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.status && err.status < 500 ? err.message : 'Something went wrong. Please try again.'
  });
};

module.exports = errorHandler;
