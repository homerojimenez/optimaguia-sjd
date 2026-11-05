// Genera el contenido de la visita que usa el guía con IA (Worker de Cloudflare, ruta /sjd/ask)
// a partir de js/data.js, para que la app y el guía digan lo mismo.
// Uso: node tools/build-contenido.mjs  (escribe ../prototipo-ra/worker/src/sjd-contenido.js)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { STOPS, TERMS, KB } = await import(path.join(here, '../js/data.js'));
const plain = (l) => l.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

const lines = [];
lines.push('Recorrido (10 paradas; planta 0 = iglesia, planta 1 = camarín):');
for (const s of STOPS) {
  lines.push('');
  lines.push(`Parada ${s.n} · id «${s.id}» · ${s.name} · planta ${s.floor} · unos ${s.min} min.`);
  lines.push(`Cómo llegar: ${s.howto}`);
  lines.push(`Lo que cuenta la audioguía: ${s.chapters.flatMap((c) => c.lines.map(plain)).join(' ')}`);
  if (s.kids) lines.push(`Para niños: ${s.kids}`);
  const terms = s.ar.map((id) => TERMS[id]).filter(Boolean);
  if (terms.length) lines.push(`Lo que se ve en la sala: ${terms.map((t) => `${t.name} (${t.cartela}): ${t.def}`).join(' | ')}`);
}
lines.push('');
lines.push('Otros datos de la visita:');
for (const k of KB) lines.push(`- ${k.a} (parada «${k.stop}»)`);

const out = `// Generado por prototipo-funcional/tools/build-contenido.mjs a partir de js/data.js. No editar a mano.\nexport const SJD_CONTENIDO = ${JSON.stringify(lines.join('\n'))};\nexport const SJD_PARADAS = ${JSON.stringify(STOPS.map((s) => s.id))};\n`;
const dest = path.join(here, '../../prototipo-ra/worker/src/sjd-contenido.js');
fs.writeFileSync(dest, out);
console.log('escrito', dest, out.length, 'caracteres');
