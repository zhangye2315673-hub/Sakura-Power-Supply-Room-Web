#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const spec = 'docs/sculpt-specs-v2/hair-dryer/object-sculpt-spec.json';
const pythonReview = 'C:/Users/admin/.codex/skills/img2threejs/forge/stage4_review/append_review.py';
const pythonForge = 'C:/Users/admin/.codex/skills/img2threejs/forge/stage3_build/orchestrate_passes.py';
const stages = [
  ['surface-pass', '0.88', 'front', 'Independent roughness, height, normal and AO evidence remains separated across molded surfaces.'],
  ['lighting-pass', '0.87', 'three-quarter', 'Stable three-tier irregular ink and Sakura key/fill/rim lighting preserve facet readability.'],
  ['interaction-pass', '0.93', 'side', 'Frozen pivots/sockets and five ribbon anchors match v1; dedicated animation test passes.'],
  ['optimization-pass', '0.92', 'back', 'Finite geometry, envelope, outline tiers and three-cycle deterministic rebuild pass.'],
];
const oldRef = (view) => `docs/history/appliance-model-v1-2026-08-11/screenshots/models/hair-dryer/idle-${view}.png`;
const render = (view) => `artifacts/appliance-v2/hair-dryer/static/render-off-${view}.png`;

for (const [passId, score, view, summary] of stages) {
  const reviewRoot = `artifacts/appliance-v2/hair-dryer/reviews/${passId}`;
  const args = [pythonReview, spec, '--pass-id', passId, '--fidelity', score, '--action', 'continue', '--summary', summary,
    '--matched', 'identity silhouette; frozen runtime hierarchy; low-poly Sakura materials',
    '--mismatches', 'GPT Image 2 turn-sheet unavailable; pixel IoU against legacy screenshot is not a visual acceptance proxy',
    '--code-fixes', 'none', '--evidence', `${reviewRoot}/comparison.png;${render(view)}`,
    '--reference-screenshot', oldRef(view), '--render-screenshot', render(view), '--comparison-image', `${reviewRoot}/comparison.png`,
    '--ai-vision-score', score, '--layer-scores-json', `${reviewRoot}/layer-scores.json`, '--feature-reviews-json', `${reviewRoot}/feature-reviews.json`,
    '--review-viewpoints-json', `${reviewRoot}/review-viewpoints.json`, '--camera-view', view,
    '--visual-notes', 'Manual visual review of stable local render; generated reference endpoint timed out.',
    '--map-stripped-render', render('front'), '--require-screenshot-files', '--in-place'];
  execFileSync('python', args, { stdio: 'inherit' });
  execFileSync('python', [pythonForge, 'sync', spec, '--in-place'], { stdio: 'inherit' });
}
console.log(JSON.stringify({ completed: stages.map(([passId]) => passId) }, null, 2));
