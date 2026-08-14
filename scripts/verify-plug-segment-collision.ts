import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import type { ArrowDefinition } from '../src/puzzle/types';

// The plug heads begin 0.82 world units apart, so the former start-point-only
// check accepted them. Their full +X and +Y envelopes intersect near the
// middle/end of both plug segments and must now be rejected.
const crossingPlugs: ArrowDefinition[] = [
  {
    id: 'horizontal-plug',
    path: [[5, 5, 4], [5, 5, 5]],
    exitDirection: '+X',
    color: 0xff6688,
    lengthClass: 'short',
  },
  {
    id: 'vertical-plug',
    path: [[6, 4, 4], [6, 4, 5]],
    exitDirection: '+Y',
    color: 0x66aaff,
    lengthClass: 'short',
  },
];

const separatedPlugs: ArrowDefinition[] = [
  crossingPlugs[0],
  {
    ...crossingPlugs[1],
    id: 'separated-plug',
    path: [[7, 4, 4], [7, 4, 5]],
  },
];

const crossingIssues = validatePuzzleGeometry(crossingPlugs);
const separatedIssues = validatePuzzleGeometry(separatedPlugs);
const crossingPlugIssue = crossingIssues.find((issue) => issue.kind === 'plug-overlap');
const separatedPlugIssue = separatedIssues.find((issue) => issue.kind === 'plug-overlap');
const report = {
  crossingHeadDistance: Math.sqrt(0.58 ** 2 + 0.58 ** 2),
  crossingDetected: Boolean(crossingPlugIssue),
  crossingIssue: crossingPlugIssue ?? null,
  separatedAccepted: !separatedPlugIssue,
  separatedIssues,
  passed: Boolean(crossingPlugIssue) && !separatedPlugIssue,
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
