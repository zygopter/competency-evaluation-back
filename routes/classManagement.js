const express = require('express');
const router = express.Router();
const ClassModel = require('../models/Class');
const UserModel = require('../models/User');
const StudentModel = require('../models/Student');
const authenticateToken = require('../middleware/auth');
const isTeacher = require('../middleware/isTeacher');
const crypto = require('crypto');

// Générer un code unique pour une classe
const generateClassCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const existingClass = await ClassModel.findOne({ code });
    if (!existingClass) {
      isUnique = true;
    }
  }
  return code;
};

// Créer une nouvelle classe
router.post('/', authenticateToken, isTeacher, async (req, res) => {
  try {
    console.log('Received request to create class:', req.body);
    console.log('User creating class:', req.user);
    const { name, year } = req.body;
    const newClass = new ClassModel({
      name,
      year,
      teacher: req.user.id,
      code: await generateClassCode()
    });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la création de la classe", 
      error: error.message,
      stack: error.stack // Ceci aidera à identifier la source exacte de l'erreur
    });
  }
});

// Supprimer une classe par id
router.delete('/:classId', authenticateToken, isTeacher, async (req, res) => {
  try {
    const classId = req.params.classId;
    const classToDelete = await ClassModel.findById(classId);

    if (!classToDelete) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    // Vérifier que le professeur qui fait la demande est bien le propriétaire de la classe
    if (classToDelete.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette classe" });
    }

    await ClassModel.findByIdAndDelete(classId);
    res.json({ message: "Classe supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la classe" });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log('Received request to fetch classes for user:', userId);
    console.log('User creating class is a ', userRole);

    let classes;
    if (userRole === 'teacher') {
      classes = await ClassModel.find({ teacher: userId });
    } else if (userRole === 'student') {
      classes = await ClassModel.find({ 'students.user': userId });
    } else {
      return res.status(403).json({ message: "Rôle d'utilisateur non autorisé" });
    }
    
    res.json(classes);
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des classes", error: error.message });
  }
});

// Générer un nouveau code pour une classe existante
router.post('/:classId/generate-code', authenticateToken, isTeacher, async (req, res) => {
  try {
    const classObj = await ClassModel.findById(req.params.classId);
    if (!classObj) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }
    if (classObj.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    const newCode = await generateClassCode();
    classObj.code = newCode;
    await classObj.save();
    res.json({ code: newCode });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la génération du code" });
  }
});

// Ajouter des étudiants par liste pour une classe
router.post('/:classId/students', authenticateToken, isTeacher, async (req, res) => {
  try {
    const classId = req.params.classId;
    const { students } = req.body; // Attendu: un tableau d'objets {firstName, lastName}

    const classToUpdate = await ClassModel.findById(classId);

    if (!classToUpdate) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    if (classToUpdate.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette classe" });
    }

    const newStudents = await Promise.all(students.map(async (student) => {
      const newStudent = new StudentModel({
        firstName: student.firstName,
        lastName: student.lastName,
        class: classId
      });
      await newStudent.save();
      return newStudent._id;
    }));

    classToUpdate.students.push(...newStudents);
    await classToUpdate.save();

    res.json({ message: "Étudiants ajoutés avec succès", class: classToUpdate });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout des étudiants", error: error.message });
  }
});

// Get all students of a class by Class Id
router.get('/:classId/students', async (req, res) => {
  try {
    const classId = req.params.classId;
    const classObj = await ClassModel.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    const students = await StudentModel.find({ _id: { $in: classObj.students } });
    res.json(students);
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des étudiants", error: error.message });
  }
});

// Permettre à un élève de rejoindre une classe avec un code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { classCode, firstName, lastName } = req.body;
    const userId = req.user.id;

    const classToJoin = await ClassModel.findOne({ code: classCode });
    if (!classToJoin) {
      return res.status(404).json({ message: "Code de classe invalide" });
    }

    const student = await StudentModel.findOne({
      class: classToJoin._id,
      firstName,
      lastName,
      user: null
    });

    if (!student) {
      return res.status(404).json({ message: "Étudiant non trouvé dans cette classe" });
    }

    student.user = userId;
    await student.save();

    res.json({ message: "Vous avez rejoint la classe avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la tentative de rejoindre la classe", error: error.message });
  }
});

// Récupérer tous les étudiants d'une classe avec le code
router.get('/students-by-code/:classCode', async (req, res) => {
  try {
    const { classCode } = req.params;
    
    const classData = await ClassModel.findOne({ code: classCode });
    if (!classData) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    const students = await StudentModel.find({ 
      class: classData._id,
      user: null // Seulement les étudiants qui n'ont pas encore été liés à un compte utilisateur
    }).select('firstName lastName -_id'); // Nous ne renvoyons que le prénom et le nom

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des étudiants", error: error.message });
  }
});

// Ajouter un élève à la liste d'attente d'une classe
router.post('/:classId/add-pending-student', authenticateToken, isTeacher, async (req, res) => {
  try {
    const { name, email } = req.body;
    const classObj = await ClassModel.findById(req.params.classId);
    if (!classObj) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }
    if (classObj.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    classObj.pendingStudents.push({ name, email });
    await classObj.save();
    res.status(201).json({ message: "Élève ajouté à la liste d'attente" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'élève à la liste d'attente" });
  }
});

// Obtenir la liste des élèves en attente pour une classe
router.get('/:classId/pending-students', authenticateToken, async (req, res) => {
  try {
    const classObj = await ClassModel.findById(req.params.classId);
    if (!classObj) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }
    res.json(classObj.pendingStudents);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des élèves en attente" });
  }
});

module.exports = router;