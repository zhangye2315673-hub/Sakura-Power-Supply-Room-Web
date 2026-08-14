import fs from 'node:fs';

const specPath = 'docs/sculpt-specs/printer/object-sculpt-spec.json';
const outPath = 'docs/sculpt-specs/printer/detail-inventory.json';
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const output = {
  sourceImage: 'references/intake/printer/front.png',
  sourceViews: [
    'references/intake/printer/front.png',
    'references/intake/printer/side.png',
    'references/intake/printer/back.png',
  ],
  zonesDir: 'docs/sculpt-specs/printer/detail-zones',
  detailInventory: spec.preSpecAssessment.detailInventory,
  inferredDetailIds: ['printer-detail-12'],
  note: 'Feed rollers are inferred from the hidden paper path. All other listed details are directly supported by at least one supplied view.',
};
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote ${outPath}`);
