import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const modelsDir = path.resolve('src/appliances/models');
const files = fs.readdirSync(modelsDir)
  .filter((name) => name.endsWith('.ts') && name !== 'index.ts')
  .map((name) => path.join(modelsDir, name));

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const removals = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'finish' &&
      node.arguments.length > 1
    ) {
      removals.push([node.arguments[0].end, node.arguments[node.arguments.length - 1].end]);
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  if (removals.length === 0) continue;
  let migrated = source;
  removals.sort((a, b) => b[0] - a[0]).forEach(([start, end]) => {
    migrated = migrated.slice(0, start) + migrated.slice(end);
  });
  fs.writeFileSync(file, migrated, 'utf8');
  process.stdout.write(`migrated ${path.basename(file)}\n`);
}
