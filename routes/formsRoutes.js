// routes/formulaireRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Formulaire = require('../models/Formulaire');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const formulaires = await Formulaire.find({ createdBy: req.user.id }).populate('competences');
    res.json(formulaires);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const form = new Formulaire({
    title: req.body.title,
    competences: req.body.competences,
    createdBy: req.user.id
  });

  try {
    const newForm = await form.save();
    res.status(201).json(newForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Formulaire.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (form == null) {
      return res.status(404).json({ message: 'Formulaire non trouvé' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Formulaire.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      {
        title: req.body.title,
        competences: req.body.competences,
        updatedAt: Date.now()
      },
      { new: true }
    );
    if (form == null) {
      return res.status(404).json({ message: 'Formulaire non trouvé' });
    }
    res.json(form);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Formulaire.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (form == null) {
      return res.status(404).json({ message: 'Formulaire non trouvé' });
    }
    res.json({ message: 'Formulaire supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;