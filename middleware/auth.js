const jwt = require('jsonwebtoken');

const authenticateTokenOld = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Veuillez vous authentifier.' });
  }
};
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth Header:', authHeader); // Log l'en-tête d'autorisation
  console.log('Token:', token); // Log le token extrait

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.sendStatus(403);
    }

    console.log('Decoded user:', user); // Log l'utilisateur décodé
    req.user = user.user;
    next();
  });
}

module.exports = authenticateToken;