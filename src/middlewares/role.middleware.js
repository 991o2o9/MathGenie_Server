// Middleware для проверки ролей (ADMIN, USER)
// ...

function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res
        .status(403)
        .json({ message: 'Forbidden: insufficient rights' });
    }
    next();
  };
}

export default roleMiddleware;
