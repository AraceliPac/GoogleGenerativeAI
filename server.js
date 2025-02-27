require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));

// Configurar cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Ruta para manejar la subida y descripción de imágenes
app.post('/describe', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Obtener el modelo generativo
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generar contenido basado en la imagen
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: "Descripción imagen: " },
          { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ]
      }]
    });

    const description = result.response.candidates[0].content.parts[0].text;

    // Eliminar imagen temporal
    fs.unlinkSync(imagePath);

    // Enviar la descripción como respuesta
    res.json({ description });
  } catch (error) {
    console.error('Error al describir la imagen:', error);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});