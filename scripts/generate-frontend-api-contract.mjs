import fs from 'fs';
import path from 'path';

const root = process.cwd();
const openApiPath = path.join(root, 'apps/backend/openapi.json');
const outputDir = path.join(root, 'apps/frontend/src/api/generated');
const outputPath = path.join(outputDir, 'contract.ts');

if (!fs.existsSync(openApiPath)) {
  console.error(`OpenAPI spec not found at ${openApiPath}. Run: pnpm openapi:generate`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const paths = spec.paths || {};

const routeKeys = Object.keys(paths).sort();
const methodEntries = [];

for (const route of routeKeys) {
  const methods = Object.keys(paths[route] || {})
    .filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
    .sort();

  for (const method of methods) {
    methodEntries.push({ route, method });
  }
}

const routesTs = routeKeys.map((r) => `  | '${r}'`).join('\n');
const methodsTs = [...new Set(methodEntries.map((e) => e.method))]
  .sort()
  .map((m) => `  | '${m}'`)
  .join('\n');

const mapLines = routeKeys.map((route) => {
  const methods = Object.keys(paths[route] || {})
    .filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
    .sort()
    .map((m) => `'${m}'`)
    .join(' | ');
  return `  '${route}': ${methods || 'never'};`;
});

const file = `/* AUTO-GENERATED FILE. DO NOT EDIT.
 * Source: apps/backend/openapi.json
 * Regenerate: pnpm api:types:generate
 */

export type ApiRoute =
${routesTs || "  | never"};

export type ApiMethod =
${methodsTs || "  | never"};

export type RouteMethods = {
${mapLines.join('\n')}
};

export type MethodForRoute<R extends ApiRoute> = RouteMethods[R];

export function assertApiRouteMethod<R extends ApiRoute, M extends MethodForRoute<R>>(
  _route: R,
  _method: M,
): void {}
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, file, 'utf8');
console.log(`Generated frontend API contract types at ${outputPath}`);
