import {installField} from './lib/field-assets.mjs';
const [job,review]=process.argv.slice(2);if(!job||!review)throw Error('Usage: node tools/install-field.mjs <job.json> <review.json>');
console.log(JSON.stringify(installField(job,review),null,2));
