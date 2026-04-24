// sync-ia.js
import fs from 'fs';
import path from 'path';

// 1. Pon aquí las rutas exactas en las que estamos trabajando
const filesToRead = [
  'src/pages/store/Dashboard.jsx',
  'src/pages/client/StoreDetail.jsx',
  'src/pages/client/Home.jsx'
  // Puedes agregar más: 'src/lib/supabase.js', etc.
];

let output = "🗺️ MAPA DEL PROYECTO ACTUALIZADO\n\n";

filesToRead.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      output += `\n// --- ARCHIVO: ${file} ---\n`;
      output += "```javascript\n";
      output += content + '\n';
      output += "```\n";
    } else {
      output += `⚠️ Archivo no encontrado: ${file}\n`;
    }
  } catch (err) {
    console.error(`Error leyendo ${file}:`, err);
  }
});

// 2. Guarda todo en un archivo .txt
fs.writeFileSync('contexto_ia.txt', output);
console.log('✅ ¡Listo! Abre contexto_ia.txt, cópialo todo y pégalo en el chat de la IA.');