const csrfProtection = (req, res, next) => {
  const csrfCookie = req.cookies.csrf_token;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: "CSRF validation failed" });
  }

  next();
};

module.exports = {
  csrfProtection,
};


// Use on state-changing routes only
// router.post("/project", requireAuth, csrfProtection, createProject);