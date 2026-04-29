import fs from 'fs';
import path from 'path';

const root = process.cwd();
const openApiPath = path.join(root, 'apps/backend/openapi.json');
const frontendApiDir = path.join(root, 'apps/frontend/src/api');

if (!fs.existsSync(openApiPath)) {
  console.error(`OpenAPI spec not found at ${openApiPath}. Run: pnpm openapi:generate`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const openApiPaths = spec.paths || {};

const normalizedOpenApi = new Map();
for (const route of Object.keys(openApiPaths)) {
  const normalizedRoute = normalizeRoute(route);
  const methods = new Set(
    Object.keys(openApiPaths[route] || {})
      .filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
      .map((m) => m.toLowerCase()),
  );
  normalizedOpenApi.set(normalizedRoute, methods);
}

const apiFiles = fs
  .readdirSync(frontendApiDir)
  .filter((file) => file.endsWith('.ts') && file !== 'generated')
  .map((file) => path.join(frontendApiDir, file));

const violations = [];

for (const file of apiFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const regex = /(api|client)\.(get|post|put|patch|delete)\s*\(\s*([`'"])(.+?)\3/gms;
  let match;

  while ((match = regex.exec(source)) !== null) {
    const method = match[2].toLowerCase();
    const rawRoute = stripQuery(match[4].trim());
    const normalizedRoute = normalizeRoute(rawRoute);

    if (!normalizedOpenApi.has(normalizedRoute)) {
      violations.push(
        `${relative(file)}: unknown route "${rawRoute}" (normalized: "${normalizedRoute}")`,
      );
      continue;
    }

    const allowedMethods = normalizedOpenApi.get(normalizedRoute);
    if (!allowedMethods.has(method)) {
      violations.push(
        `${relative(file)}: method "${method.toUpperCase()}" not allowed on "${rawRoute}"`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error('Frontend API contract check failed:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Frontend API contract check passed.');

function normalizeRoute(route) {
  return route
    .replace(/\$\{[^}]+\}/g, '{param}')
    .replace(/\{[^}]+\}/g, '{param}')
    .replace(/\/+$/, '')
    .replace(/^$/, '/');
}

function stripQuery(route) {
  const idx = route.indexOf('?');
  return idx >= 0 ? route.slice(0, idx) : route;
}

function relative(filePath) {
  return path.relative(root, filePath);
}
