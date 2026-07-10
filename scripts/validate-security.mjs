import { readFile } from 'node:fs/promises';

const index = await readFile('index.html', 'utf8');
const main = await readFile('js/main.js', 'utf8');
const desktop = await readFile('desktop/main.cjs', 'utf8');
const rules = await readFile('firestore.rules', 'utf8');

const failures = [];
if(!index.includes('Content-Security-Policy')) failures.push('CSP web ausente');
if(!desktop.includes("'Content-Security-Policy': contentSecurityPolicy")) failures.push('CSP desktop ausente');
if(main.includes("${(p.name || 'JOGADOR').split(' ')[0].toUpperCase()}")) failures.push('ranking usa nome remoto sem escape');
if(main.includes("${h.opponent || 'OPONENTE'}")) failures.push('histórico usa oponente remoto sem escape');
if(!rules.includes("match /{document=**}")) failures.push('negação padrão das regras ausente');
if(!rules.includes('allow read, write: if false')) failures.push('negação padrão das regras inválida');

if(failures.length) {
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log('Controles estáticos de segurança validados.');
