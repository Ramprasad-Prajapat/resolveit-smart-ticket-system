import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function checkEndpointCoverage() {
  const controllerDir = path.join(rootDir, 'backend', 'src', 'main', 'java', 'com', 'resolveit', 'controller');
  const files = fs.readdirSync(controllerDir).filter((f) => f.endsWith('.java'));
  const endpoints = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(controllerDir, file), 'utf8');
    const classReqMatch = content.match(/@RequestMapping\("([^"]+)"\)/);
    const classPrefix = classReqMatch ? classReqMatch[1] : '';

    const regex = /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)(\("?([^"]*)"?\))?/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const verb = match[1].replace('Mapping', '').toUpperCase();
      let sub = match[3] || '';
      if (sub && !sub.startsWith('/')) sub = '/' + sub;
      const fullPath = (classPrefix + sub).replace(/\/+/g, '/');
      endpoints.push({ file, verb, path: fullPath });
    }
  }

  // Parse postman collection
  const postman = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'postman', 'ResolveIT.postman_collection.json'), 'utf8')
  );
  function getReqs(item, list = []) {
    if (item.request) {
      const raw = typeof item.request.url === 'string' ? item.request.url : item.request.url.raw;
      list.push({ method: item.request.method, url: raw });
    }
    if (item.item) {
      item.item.forEach((sub) => getReqs(sub, list));
    }
    return list;
  }
  const pReqs = getReqs(postman);

  const coverageDetails = [];
  let allCovered = true;

  for (const ep of endpoints) {
    const normEp = ep.path.replace('/api', '').replace(/\{[^}]+\}/g, '[^/?]+');
    const regex = new RegExp('^' + normEp + '(\\?.*)?$');
    const matched = pReqs.find((r) => {
      const cleanUrl = r.url.replace('{{baseUrl}}', '').split('?')[0];
      return r.method === ep.verb && (regex.test(r.url.replace('{{baseUrl}}', '')) || regex.test(cleanUrl));
    });

    const isCovered = Boolean(matched);
    if (!isCovered) allCovered = false;
    coverageDetails.push({
      file: ep.file,
      verb: ep.verb,
      path: ep.path,
      covered: isCovered,
    });
  }

  return {
    total: endpoints.length,
    covered: coverageDetails.filter((c) => c.covered).length,
    allCovered,
    details: coverageDetails,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = checkEndpointCoverage();
  console.log(`Endpoint Coverage Check: ${result.covered}/${result.total} Spring controller endpoints covered.`);
  result.details.forEach((d) => {
    console.log(`  [${d.covered ? 'PASS' : 'FAIL'}] ${d.verb.padEnd(6)} ${d.path} (${d.file})`);
  });
  process.exit(result.allCovered ? 0 : 1);
}
