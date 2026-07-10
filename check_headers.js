const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const uploadDir = path.join(__dirname, 'Data Uploads');
const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));

const allHeaders = new Set();
const fileHeaders = {};

files.forEach(file => {
    const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
    const parsed = papaparse.parse(content, { header: true, preview: 1 });
    if (parsed.meta && parsed.meta.fields) {
        parsed.meta.fields.forEach(f => allHeaders.add(f));
        fileHeaders[file] = parsed.meta.fields;
    }
});

console.log('--- Unique Headers across all files ---');
console.log(Array.from(allHeaders).sort().join('\n'));

console.log('\n--- Remark related headers ---');
console.log(Array.from(allHeaders).filter(h => h.toLowerCase().includes('remark') || h.toLowerCase().includes('note') || h.toLowerCase().includes('comment')).join('\n'));
