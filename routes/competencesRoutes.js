const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Competence = require('../models/Competence');

// Obtenir toutes les compétences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const competences = await Competence.find().populate('category');
    res.json(competences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une nouvelle compétence
router.post('/', authenticateToken, async (req, res) => {
  const competence = new Competence({
    name: req.body.name,
    description: req.body.description,
    category: req.body.categoryId,
    createdBy: req.user.id
  });

  try {
    const newCompetence = await competence.save();
    res.status(201).json(newCompetence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mettre à jour une compétence
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedCompetence = await Competence.findByIdAndUpdate(
      req.params.id,
      { 
        name: req.body.name,
        description: req.body.description,
        category: req.body.categoryId,
        updatedAt: Date.now()
      },
      { new: true }
    );
    res.json(updatedCompetence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Supprimer une compétence
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Competence.findByIdAndDelete(req.params.id);
    res.json({ message: 'Compétence supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir une compétence spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const competence = await Competence.findById(req.params.id).populate('category');
    if (!competence) {
      return res.status(404).json({ message: 'Compétence non trouvée' });
    }
    res.json(competence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;