const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
      next();
    } else {
      res.status(403).send({ error: 'Accès refusé. Seuls les professeurs sont autorisés.' });
    }
  };
  
  module.exports = isTeacher;