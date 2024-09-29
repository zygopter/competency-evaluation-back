const isTeacher = (req, res, next) => {
  console.log('Middleware isTeacher appelé');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('req.user est undefined ou null');
    return res.status(403).send({ error: 'Utilisateur non authentifié' });
  }
  
  console.log('req.user.role:', req.user.role);
  
  if (req.user.role === 'teacher') {
    console.log('Utilisateur vérifié comme professeur');
    next();
  } else {
    console.log('Utilisateur non autorisé. Rôle:', req.user.role);
    res.status(403).send({ error: 'Accès refusé. Seuls les professeurs sont autorisés.' });
  }
};

module.exports = isTeacher;