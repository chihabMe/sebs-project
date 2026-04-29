import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const mode = process.argv[2] === 'full' ? 'full' : 'quick';
const failOnHigh = process.argv.includes('--fail-on-high');

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const findings = [];
const commandLogs = [];

const runAt = new Date();
const dateStamp = runAt.toISOString().slice(0, 10);
const timestamp = runAt.toISOString();

function execCommand(cmd, args, options = {}) {
  const label = [cmd, ...args].join(' ');
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

  commandLogs.push({
    label,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  });

  return result;
}

function addFinding({
  severity,
  area,
  symptom,
  repro,
  expectedVsActual,
  rootCause,
  fixRecommendation,
  owner,
  status = 'Open',
}) {
  findings.push({
    severity,
    area,
    symptom,
    repro,
    expectedVsActual,
    rootCause,
    fixRecommendation,
    owner,
    status,
  });
}

function runCheck({ name, cmd = 'pnpm', args, severityOnFail, area, owner, symptomOnFail, expected }) {
  const res = execCommand(cmd, args);
  if (res.status !== 0) {
    addFinding({
      severity: severityOnFail,
      area,
      owner,
      symptom: symptomOnFail,
      repro: [cmd, ...args].join(' '),
      expectedVsActual: `Expected success. Actual exit code: ${res.status ?? 1}.`,
      rootCause: `Check "${name}" failed.`,
      fixRecommendation: `Run "${[cmd, ...args].join(' ')}" locally, inspect logs, and fix failures before merge.`,
    });
  }
  return res;
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

// 1) Preflight + baseline
execCommand('node', ['-v']);
execCommand('pnpm', ['-v']);
execCommand('git', ['status', '--short']);

if (!fileExists('apps/backend/.env.example')) {
  addFinding({
    severity: 'High',
    area: 'Infra',
    owner: 'infra',
    symptom: 'Backend env example file is missing.',
    repro: 'ls apps/backend/.env.example',
    expectedVsActual: 'Expected file to exist. Actual: missing.',
    rootCause: 'Missing environment template for backend runtime setup.',
    fixRecommendation: 'Add apps/backend/.env.example with required backend env vars.',
  });
}

if (!fileExists('apps/frontend/.env.example')) {
  addFinding({
    severity: 'High',
    area: 'Infra',
    owner: 'infra',
    symptom: 'Frontend env example file is missing.',
    repro: 'ls apps/frontend/.env.example',
    expectedVsActual: 'Expected file to exist. Actual: missing.',
    rootCause: 'Missing environment template for frontend runtime setup.',
    fixRecommendation: 'Add apps/frontend/.env.example with required frontend env vars.',
  });
}

// 2) Static integrity scan
runCheck({
  name: 'openapi generate',
  args: ['openapi:generate'],
  severityOnFail: 'High',
  area: 'Integration',
  owner: 'backend',
  symptomOnFail: 'OpenAPI generation failed.',
  expected: 'OpenAPI spec should generate successfully.',
});

runCheck({
  name: 'api types generate',
  args: ['api:types:generate'],
  severityOnFail: 'High',
  area: 'Integration',
  owner: 'frontend',
  symptomOnFail: 'Frontend API contract type generation failed.',
  expected: 'Generated frontend API contract types should be up to date.',
});

runCheck({
  name: 'api contract check',
  args: ['api:contract:check'],
  severityOnFail: 'Critical',
  area: 'Integration',
  owner: 'frontend',
  symptomOnFail: 'Frontend API contract mismatch detected.',
  expected: 'Frontend API calls should match backend routes/methods.',
});

runCheck({
  name: 'lint',
  args: ['lint'],
  severityOnFail: 'High',
  area: 'Full stack',
  owner: 'frontend',
  symptomOnFail: 'Lint check failed.',
  expected: 'Lint should pass.',
});

// 3) Backend reliability + security scan
runCheck({
  name: 'backend tests',
  args: ['--filter', '@sebs/backend', 'test'],
  severityOnFail: 'Critical',
  area: 'Backend',
  owner: 'backend',
  symptomOnFail: 'Backend unit/integration tests failed.',
  expected: 'Backend tests should pass.',
});

if (mode === 'full') {
  const e2e = runCheck({
    name: 'backend e2e',
    args: ['--filter', '@sebs/backend', 'test:e2e'],
    severityOnFail: 'High',
    area: 'Backend',
    owner: 'backend',
    symptomOnFail: 'Backend e2e tests failed.',
    expected: 'Backend e2e tests should pass.',
  });

  const e2eText = `${e2e.stdout ?? ''}\n${e2e.stderr ?? ''}`;
  if (e2eText.includes('skipped')) {
    addFinding({
      severity: 'Medium',
      area: 'Integration',
      owner: 'backend',
      symptom: 'Some backend e2e tests were skipped.',
      repro: 'pnpm --filter @sebs/backend test:e2e',
      expectedVsActual: 'Expected no skipped critical integration tests. Actual: skipped suites/tests detected.',
      rootCause: 'Environment/runtime limitation or gated e2e suite.',
      fixRecommendation: 'Run full e2e in CI/runtime environment with required capabilities and remove unnecessary skips.',
    });
  }
}

runCheck({
  name: 'backend build',
  args: ['--filter', '@sebs/backend', 'build'],
  severityOnFail: 'Critical',
  area: 'Backend',
  owner: 'backend',
  symptomOnFail: 'Backend build failed.',
  expected: 'Backend build should pass.',
});

// 4) Frontend integration scan
runCheck({
  name: 'frontend build',
  args: ['--filter', '@sebs/frontend', 'build'],
  severityOnFail: 'High',
  area: 'Frontend',
  owner: 'frontend',
  symptomOnFail: 'Frontend build failed.',
  expected: 'Frontend build should pass.',
});

// 5) Runtime integration smoke (full mode)
if (mode === 'full') {
  const dockerVersion = execCommand('docker', ['--version']);
  if (dockerVersion.status !== 0) {
    addFinding({
      severity: 'High',
      area: 'Infra',
      owner: 'infra',
      symptom: 'Docker is unavailable; runtime integration bootstrap was not executed.',
      repro: 'docker --version',
      expectedVsActual: 'Expected Docker available. Actual: command failed.',
      rootCause: 'Missing Docker runtime in scan environment.',
      fixRecommendation: 'Run full scan in Docker-enabled environment or install Docker.',
      status: 'Blocked',
    });
  } else {
    const integration = execCommand('pnpm', ['dev:integration']);
    if (integration.status !== 0) {
      const output = `${integration.stdout ?? ''}\n${integration.stderr ?? ''}`;
      const dockerBlocked =
        output.includes('/var/run/docker.sock') ||
        output.includes('permission denied while trying to connect to the Docker daemon') ||
        output.includes('connect: operation not permitted');

      if (dockerBlocked) {
        addFinding({
          severity: 'Medium',
          area: 'Infra',
          owner: 'infra',
          symptom: 'Integration bootstrap skipped: Docker daemon access is blocked in this environment.',
          repro: 'pnpm dev:integration',
          expectedVsActual: `Expected Docker daemon access. Actual: blocked (exit ${integration.status ?? 1}).`,
          rootCause: 'Environment lacks permission to access Docker daemon socket.',
          fixRecommendation: 'Run full integration scan in Docker-enabled environment (CI runner or local machine with daemon access).',
          status: 'Blocked',
        });
      } else {
        addFinding({
          severity: 'Critical',
          area: 'Integration',
          owner: 'infra',
          symptom: 'Integration bootstrap failed.',
          repro: 'pnpm dev:integration',
          expectedVsActual: `Expected successful bootstrap. Actual exit code: ${integration.status ?? 1}.`,
          rootCause: 'One or more runtime services/schema/smoke checks failed during integration bootstrap.',
          fixRecommendation: 'Inspect integration logs, fix failing service startup/migration/smoke step, re-run bootstrap.',
        });
      }
    }
  }
}

// 6) CI parity scan
const workflowPath = path.join(root, '.github/workflows/ci.yml');
if (fs.existsSync(workflowPath)) {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const requiredCiChecks = [
    'api:contract:check',
    '--filter=@sebs/backend run test',
    '--filter=@sebs/backend run test:e2e',
    '--filter=@sebs/frontend run build',
  ];
  for (const check of requiredCiChecks) {
    if (!workflow.includes(check)) {
      addFinding({
        severity: 'High',
        area: 'CI',
        owner: 'infra',
        symptom: `CI pipeline is missing required gate: ${check}`,
        repro: `grep -n "${check}" .github/workflows/ci.yml`,
        expectedVsActual: `Expected CI to include "${check}". Actual: missing.`,
        rootCause: 'CI config drift from local quality gates.',
        fixRecommendation: `Add "${check}" to CI workflow to keep parity with local scan gates.`,
      });
    }
  }
} else {
  addFinding({
    severity: 'Critical',
    area: 'CI',
    owner: 'infra',
    symptom: 'CI workflow file is missing.',
    repro: 'ls .github/workflows/ci.yml',
    expectedVsActual: 'Expected CI workflow file present. Actual: missing.',
    rootCause: 'No pipeline definition found.',
    fixRecommendation: 'Add CI workflow with lint/test/build/contract gates.',
  });
}

// 7) Completion-gap scan
const todoScan = execCommand('rg', [
  '-n',
  'TODO|FIXME|TBD|WIP|HACK|XXX',
  '.',
  '--glob',
  '!node_modules/**',
  '--glob',
  '!pnpm-lock.yaml',
  '--glob',
  '!**/*.min.*',
  '--glob',
  '!reports/**',
  '--glob',
  '!scripts/run-project-scan.mjs',
  '--glob',
  '!SCAN.md',
]);
if ((todoScan.stdout ?? '').trim().length > 0) {
  addFinding({
    severity: 'Medium',
    area: 'Full stack',
    owner: 'backend',
    symptom: 'Unresolved TODO/FIXME markers found in repository.',
    repro: "rg -n 'TODO|FIXME|TBD|WIP|HACK|XXX' . --glob '!node_modules/**' --glob '!pnpm-lock.yaml' --glob '!reports/**' --glob '!scripts/run-project-scan.mjs' --glob '!SCAN.md'",
    expectedVsActual: 'Expected no unresolved critical markers in active code. Actual: markers found.',
    rootCause: 'Outstanding implementation work or technical debt remains in codebase.',
    fixRecommendation: 'Review each marker and convert into tracked issue or complete implementation.',
  });
}

const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

const reportJson = {
  meta: {
    mode,
    runAt: timestamp,
    summary: {
      totalFindings: findings.length,
      bySeverity: countBy(findings, 'severity'),
    },
  },
  findings,
};

const jsonPath = path.join(reportsDir, `scan-${dateStamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify(reportJson, null, 2), 'utf8');

const markdown = renderMarkdownReport({
  mode,
  timestamp,
  findings,
  commandLogs,
  jsonPath: path.relative(root, jsonPath),
});

const mdPath = path.join(reportsDir, `scan-${dateStamp}.md`);
fs.writeFileSync(mdPath, markdown, 'utf8');

console.log(`Scan complete (${mode}).`);
console.log(`Report (md): ${path.relative(root, mdPath)}`);
console.log(`Report (json): ${path.relative(root, jsonPath)}`);

const highOrCritical = findings.filter(
  (f) => (f.severity === 'Critical' || f.severity === 'High') && f.status !== 'Blocked',
).length;
if (failOnHigh && highOrCritical > 0) {
  process.exit(1);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key];
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function esc(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderMarkdownReport({ mode, timestamp, findings, commandLogs, jsonPath }) {
  const summary = countBy(findings, 'severity');
  const rows = findings
    .map(
      (f) =>
        `| ${esc(f.severity)} | ${esc(f.area)} | ${esc(f.symptom)} | ${esc(f.repro)} | ${esc(f.expectedVsActual)} | ${esc(f.rootCause)} | ${esc(f.fixRecommendation)} | ${esc(f.owner)} | ${esc(f.status)} |`,
    )
    .join('\n');

  const commandSection = commandLogs
    .map((log) => `- \`${log.label}\` => exit ${log.exitCode}`)
    .join('\n');

  return `# Project Scan Report

- **Mode:** ${mode}
- **Run At (UTC):** ${timestamp}
- **Machine Report:** \`${jsonPath}\`
- **Findings:** ${findings.length} (Critical: ${summary.Critical || 0}, High: ${summary.High || 0}, Medium: ${summary.Medium || 0}, Low: ${summary.Low || 0})

## Severity Triage Board

| Severity | Area | Symptom | Repro command/steps | Expected vs Actual | Probable root cause | Fix recommendation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
${rows || '| - | - | No findings | - | - | - | - | - | Done |'}

## Executed Checks

${commandSection}
`;
}
