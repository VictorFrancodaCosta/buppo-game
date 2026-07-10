import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { extname, join } from 'node:path';

async function collect(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await collect(path));
        else if (['.js', '.mjs', '.cjs'].includes(extname(entry.name))) files.push(path);
    }
    return files;
}

const files = [
    ...await collect('js'),
    ...await collect('desktop'),
    ...await collect('scripts'),
    ...await collect('tests'),
    'sw.js'
];

for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Sintaxe validada: ${files.length} arquivos.`);
