const fs = require('fs');

const inputFile = 'Consolidated_Enrollments.csv';
const outputFile = 'Consolidated_Enrollments_Remaining.csv';

const content = fs.readFileSync(inputFile, 'utf8');
const lines = content.split('\n');

// Keep the header (line 0) and the remaining lines after the first 2000 data rows
const header = lines[0];
const remainingLines = lines.slice(2001);

const newContent = [header, ...remainingLines].join('\n');
fs.writeFileSync(outputFile, newContent);

console.log(`Successfully created ${outputFile} with ${remainingLines.length} rows.`);
