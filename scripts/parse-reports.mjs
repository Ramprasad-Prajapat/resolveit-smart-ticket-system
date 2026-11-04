import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function parseJacocoReport() {
  const reportPath = path.join(rootDir, 'backend', 'target', 'site', 'jacoco', 'index.html');
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  const html = fs.readFileSync(reportPath, 'utf8');

  const packages = [];
  // Match each row in tbody
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (tbodyMatch) {
    const rowRegex = /<tr><td id="[^"]*"><a href="[^"]*" class="el_package">([^<]+)<\/a><\/td><td class="bar"[^>]*>[\s\S]*?<\/td><td class="ctr2"[^>]*>([^<]+)<\/td><td class="bar"[^>]*>[\s\S]*?<\/td><td class="ctr2"[^>]*>([^<]+)<\/td>/g;
    let match;
    while ((match = rowRegex.exec(tbodyMatch[1])) !== null) {
      packages.push({
        name: match[1],
        instructionCoverage: match[2],
        instructionPct: parseInt(match[2].replace('%', ''), 10) || 0,
        branchCoverage: match[3],
        branchPct: match[3] === 'n/a' ? null : parseInt(match[3].replace('%', ''), 10) || 0,
      });
    }
  }

  // Extract totals from tfoot
  const tfootMatch = html.match(/<tfoot><tr><td>Total<\/td><td class="bar">([^<]+)<\/td><td class="ctr2">([^<]+)<\/td><td class="bar">([^<]+)<\/td><td class="ctr2">([^<]+)<\/td>/);
  let totalInstructions = '0';
  let totalInstructionCov = '0%';
  let totalBranches = '0';
  let totalBranchCov = '0%';

  if (tfootMatch) {
    totalInstructions = tfootMatch[1];
    totalInstructionCov = tfootMatch[2];
    totalBranches = tfootMatch[3];
    totalBranchCov = tfootMatch[4];
  }

  const servicePkg = packages.find((p) => p.name === 'com.resolveit.service');
  const securityPkg = packages.find((p) => p.name === 'com.resolveit.security');
  const controllerPkg = packages.find((p) => p.name === 'com.resolveit.controller');

  const thresholds = {
    service: {
      required: 85,
      actual: servicePkg ? servicePkg.instructionPct : 0,
      passed: servicePkg ? servicePkg.instructionPct >= 85 : false,
    },
    security: {
      required: 85,
      actual: securityPkg ? securityPkg.instructionPct : 0,
      passed: securityPkg ? securityPkg.instructionPct >= 85 : false,
    },
    controller: {
      required: 80,
      actual: controllerPkg ? controllerPkg.instructionPct : 0,
      passed: controllerPkg ? controllerPkg.instructionPct >= 80 : false,
    },
  };

  const allThresholdsMet =
    thresholds.service.passed && thresholds.security.passed && thresholds.controller.passed;

  return {
    packages,
    totalInstructions,
    totalInstructionCov,
    totalBranches,
    totalBranchCov,
    thresholds,
    allThresholdsMet,
  };
}

export function parseVitestCoverage() {
  const summaryPath = path.join(rootDir, 'frontend', 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

  function aggregate(folder) {
    let linesTotal = 0;
    let linesCovered = 0;
    let branchesTotal = 0;
    let branchesCovered = 0;
    let stmtsTotal = 0;
    let stmtsCovered = 0;
    let funcsTotal = 0;
    let funcsCovered = 0;

    for (const [file, data] of Object.entries(summary)) {
      if (file === 'total') continue;
      const parts = file.split(/[\/\\]/);
      if (parts.includes(folder)) {
        linesTotal += data.lines.total;
        linesCovered += data.lines.covered;
        branchesTotal += data.branches.total;
        branchesCovered += data.branches.covered;
        stmtsTotal += data.statements.total;
        stmtsCovered += data.statements.covered;
        funcsTotal += data.functions.total;
        funcsCovered += data.functions.covered;
      }
    }

    return {
      linesPct: linesTotal > 0 ? Number(((linesCovered / linesTotal) * 100).toFixed(2)) : 0,
      branchesPct: branchesTotal > 0 ? Number(((branchesCovered / branchesTotal) * 100).toFixed(2)) : 0,
      stmtsPct: stmtsTotal > 0 ? Number(((stmtsCovered / stmtsTotal) * 100).toFixed(2)) : 0,
      funcsPct: funcsTotal > 0 ? Number(((funcsCovered / funcsTotal) * 100).toFixed(2)) : 0,
      linesCovered,
      linesTotal,
    };
  }

  const components = aggregate('components');
  const pages = aggregate('pages');

  const thresholds = {
    components: {
      required: 75,
      actual: components.linesPct,
      passed: components.linesPct >= 75,
    },
    pages: {
      required: 75,
      actual: pages.linesPct,
      passed: pages.linesPct >= 75,
    },
  };

  const allThresholdsMet = thresholds.components.passed && thresholds.pages.passed;

  return {
    total: summary.total,
    components,
    pages,
    thresholds,
    allThresholdsMet,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('JaCoCo:', JSON.stringify(parseJacocoReport(), null, 2));
  console.log('Vitest:', JSON.stringify(parseVitestCoverage(), null, 2));
}
