import { readFile, readdir } from 'node:fs/promises';

const index = await readFile('index.html', 'utf8');
const serviceWorker = await readFile('sw.js', 'utf8');
const buildVersion = index.match(/BUPPO_BUILD_VERSION\s*=\s*'([^']+)'/)?.[1];
const workerVersion = serviceWorker.match(/const VERSION\s*=\s*'([^']+)'/)?.[1];

if(!buildVersion || !workerVersion) throw new Error('Versão de build ou service worker ausente.');
if(buildVersion !== workerVersion) throw new Error(`Versões divergentes: build=${buildVersion}, sw=${workerVersion}`);

const moduleFiles = (await readdir('js')).filter((file) => file.endsWith('.js')).map((file) => `js/${file}`);
const files = ['index.html', ...moduleFiles];
for(const file of files) {
    const source = await readFile(file, 'utf8');
    const versions = [...source.matchAll(/[?&]v=(\d{4}\.\d{2}\.\d{2}\.\d+)/g)].map((match) => match[1]);
    const divergent = versions.filter((version) => version !== buildVersion);
    if(divergent.length) throw new Error(`${file} contém versões divergentes: ${[...new Set(divergent)].join(', ')}`);
    if(file.startsWith('js/')) {
        const internalImports = [...source.matchAll(/from\s+['"](\.\/[^'"]+\.js(?:\?v=([^'"]+))?)['"]/g)];
        const unversioned = internalImports.filter((match) => !match[2]).map((match) => match[1]);
        if(unversioned.length) throw new Error(`${file} contém imports internos sem versão: ${unversioned.join(', ')}`);
    }
}

console.log(`Versão consistente: ${buildVersion}.`);
