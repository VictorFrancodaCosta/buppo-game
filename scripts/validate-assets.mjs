import { existsSync, readFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sources = [
    'index.html',
    'offline.html',
    'manifest.json',
    'sw.js',
    'css/style.css',
    'css/lobby.css',
    'css/game.css',
    'css/effects.css',
    'css/accessibility.css',
    'js/app_shell.js',
    'js/audio_controller.js',
    'js/data.js',
    'js/effects.js',
    'js/main.js',
    'js/mobile_simple.js',
    'js/ui_controller.js'
];

const assetPattern = /(?:\.\.\/)?assets\/[A-Za-z0-9_./\u00c0-\u024f ()-]+\.(?:webp|png|jpe?g|svg|mp3|wav)/giu;
const missing = [];
const checked = new Set();

for (const source of sources) {
    const sourcePath = resolve(root, source);
    if (!existsSync(sourcePath)) {
        missing.push({ source, asset: source });
        continue;
    }
    const contents = readFileSync(sourcePath, 'utf8');
    for (const match of contents.matchAll(assetPattern)) {
        const normalized = match[0].replace(/^\.\.\//, '').replaceAll('/', sep);
        const assetPath = resolve(root, normalized);
        const key = `${source}:${assetPath}`;
        if (checked.has(key)) continue;
        checked.add(key);
        if (!existsSync(assetPath)) missing.push({ source, asset: relative(root, assetPath) });
    }
}

if (missing.length) {
    console.error('Assets obrigatórios ausentes:');
    for (const item of missing) console.error(`- ${item.asset} (referenciado por ${item.source})`);
    process.exitCode = 1;
} else {
    console.log(`Assets validados: ${checked.size} referências estáticas.`);
}
