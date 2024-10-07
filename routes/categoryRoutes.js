const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Category = require('../models/Category');
const Competence = require('../models/Competence');

// Obtenir toutes les catégories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Créer une nouvelle catégorie
router.post('/', authenticateToken, async (req, res) => {
    const category = new Category({
        name: req.body.name,
        description: req.body.description,
        createdBy: req.user.id
    });

    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Mettre à jour une catégorie
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                updatedAt: Date.now()
            },
            { new: true }
        );
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une catégorie
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Vérifier s'il existe des compétences liées à cette catégorie
        const competencesCount = await Competence.countDocuments({ category: req.params.id });
        if (competencesCount > 0) {
            return res.status(400).json({ message: 'Impossible de supprimer la catégorie car elle contient des compétences' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir une catégorie spécifique
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir toutes les compétences d'une catégorie spécifique
router.get('/:id/competences', authenticateToken, async (req, res) => {
    try {
        const competences = await Competence.find({ category: req.params.id });
        res.json(competences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;