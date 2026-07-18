const fs = require('fs');
const path = require('path');

const source = 'C:/Users/micha/.gemini/antigravity-ide/brain/9cd2b896-1000-4364-a0ea-407c3b95038d/graduated_student_1784308094978.png';
const target = path.join(__dirname, 'Logos', 'graduated_student.png');

try {
    // Ensure Logos directory exists
    if (!fs.existsSync(path.dirname(target))) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
    }
    fs.copyFileSync(source, target);
    console.log('¡Imagen copiada exitosamente a Logos/graduated_student.png!');
} catch (err) {
    console.error('Error al copiar la imagen:', err.message);
}
