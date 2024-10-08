// models/Formulaire.js
const mongoose = require('mongoose');

const FormulaireSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  competences: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Competence' 
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Formulaire', FormulaireSchema);