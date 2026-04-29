import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const backendSrc = path.join(backendRoot, 'src');
const outFile = path.join(backendRoot, 'openapi.json');

const controllerFiles = walk(backendSrc).filter((file) => file.endsWith('.controller.ts'));
const paths = {};

for (const file of controllerFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const controllerPrefixMatch = source.match(/@Controller\('([^']*)'\)/);
  if (!controllerPrefixMatch) continue;

  const controllerPrefix = controllerPrefixMatch[1];
  const methodRegex = /@(Get|Post|Put|Patch|Delete)\((?:'([^']*)')?\)[\s\S]*?(?:async\s+)?[A-Za-z0-9_]+\s*\(/g;

  let match;
  while ((match = methodRegex.exec(source)) !== null) {
    const httpMethod = match[1].toLowerCase();
    const routePart = (match[2] || '').trim();
    const fullPath = normalizePath(`/${controllerPrefix}${routePart ? `/${routePart}` : ''}`);
    if (!paths[fullPath]) paths[fullPath] = {};
    paths[fullPath][httpMethod] = {
      responses: {
        '200': {
          description: 'Success',
        },
      },
    };
  }
}

const document = {
  openapi: '3.0.0',
  info: {
    title: 'SEBS API (Generated)',
    version: '1.0.0',
  },
  paths,
};

fs.writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf8');
console.log(`Generated ${outFile} with ${Object.keys(paths).length} routes.`);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizePath(route) {
  return route
    .replace(/\/+/g, '/')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    .replace(/\/$/, '') || '/';
}
