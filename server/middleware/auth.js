// Authentication and role-based middleware

export function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

export function isTeacher(req, res, next) {
  if (req.session.user && req.session.user.role === 'teacher') return next();
  res.redirect('/login');
}

export function isStudent(req, res, next) {
  if (req.session.user && req.session.user.role === 'student') return next();
  res.redirect('/login');
} 