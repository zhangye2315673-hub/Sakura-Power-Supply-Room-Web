import fs from 'node:fs';

const path = 'docs/sculpt-specs/printer/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));
const parents = {
  root: null,
  'main-shell': 'root',
  'top-lid': 'main-shell',
  'shell-highlight-band': 'main-shell',
  'rear-paper-support-pivot': 'main-shell',
  'rear-paper-support': 'rear-paper-support-pivot',
  'rear-support-backplate': 'rear-paper-support',
  'paper-guide-array': 'rear-paper-support',
  'input-paper': 'rear-paper-support-pivot',
  'output-cavity': 'main-shell',
  'output-cavity-inner-lip': 'output-cavity',
  'feed-roller-array': 'output-cavity',
  'output-tray-pivot': 'main-shell',
  'output-tray': 'output-tray-pivot',
  'tray-handle': 'output-tray',
  'printed-paper-pivot': 'output-cavity',
  'printed-paper': 'printed-paper-pivot',
  'control-button-pivot': 'main-shell',
  'control-button': 'control-button-pivot',
  'status-indicator': 'main-shell',
  'rear-power-inlet': 'main-shell',
  'rear-lower-band': 'main-shell',
  'foot-array': 'main-shell',
  'paper-exit-socket': 'output-cavity-inner-lip',
  'power-cable-socket': 'main-shell',
  'inferred-print-carriage': 'output-cavity',
};
for (const component of spec.componentTree) {
  component.parent = parents[component.id] ?? 'root';
  if (component.id === 'root') delete component.parent;
  if (component.attachment) component.attachment.parentSocket = component.parent ?? 'root';
}
fs.writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`updated ${path}`);
