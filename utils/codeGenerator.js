const fs = require('fs');
const path = require('path');

// Charger la liste de mots depuis un fichier JSON
const words = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'french_words.json'), 'utf8'));

// Filtrer les mots pour n'inclure que ceux de plus de 3 lettres
const filteredWords = words.filter(word => word.length > 3);

function generateClassCode() {
  const word1 = filteredWords[Math.floor(Math.random() * filteredWords.length)];
  const word2 = filteredWords[Math.floor(Math.random() * filteredWords.length)];
  return word1.toLowerCase() + word2.toLowerCase();
}

async function generateUniqueClassCode(ClassModel) {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = generateClassCode();
    const existingClass = await ClassModel.findOne({ code });
    if (!existingClass) {
      isUnique = true;
    }
  }
  return code;
}

module.exports = { generateUniqueClassCode };
