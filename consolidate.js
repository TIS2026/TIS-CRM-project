const xlsx = require('xlsx');
const fs = require('fs');

function normalizeName(name) {
  if (!name) return '';
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

// 1. Read File 1
const wb1 = xlsx.readFile('Course Wise Enrollment_09_Jul_2026_13_42_14.xlsx');
const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
const data1 = xlsx.utils.sheet_to_json(sheet1, { defval: '' });

// 2. Read File 2
const wb2 = xlsx.readFile('List of all students registered_09_Jul_2026_13_42_03.xlsx');
const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
const data2 = xlsx.utils.sheet_to_json(sheet2, { defval: '' });

// 3. Create a lookup for File 2 based on student name and phone
const file2Lookup = new Map();
data2.forEach(row => {
  const normName = normalizeName(row['Student Name']);
  const normPhone = normalizePhone(row['student_contact_number']);
  const normParentPhone = normalizePhone(row['parent_contact_number']);
  
  // Try to store by name, if missing then by phone
  if (normName) file2Lookup.set(normName, row);
  if (normPhone) file2Lookup.set(normPhone, row);
  if (normParentPhone) file2Lookup.set(normParentPhone, row);
});

// 4. Perform Outer Join
const consolidatedData = [];
const usedFile2Rows = new Set();

// Process File 1 (Course enrollments)
data1.forEach(row1 => {
  const normName = normalizeName(row1['student_name']);
  const normPhone = normalizePhone(row1['contact_number']);
  
  let match2 = file2Lookup.get(normName) || file2Lookup.get(normPhone) || {};
  if (Object.keys(match2).length > 0) {
    usedFile2Rows.add(match2);
  }

  consolidatedData.push({
    'Student Name': row1['student_name'] || match2['Student Name'] || '',
    'Student Email ID': match2['Student EmailID'] || '',
    'Student Contact Number': match2['student_contact_number'] || row1['contact_number'] || '',
    'Parent Name': match2['Parent Name'] || '',
    'Parent Email ID': match2['Parent EmailID'] || '',
    'Parent Contact Number': match2['parent_contact_number'] || '',
    'Enrollment Date': row1['enrolled_date'] || match2['Enrollment Date'] || '',
    'Enrollment Center': row1['enrolment_center'] || match2['enrolment_center'] || '',
    'School': row1['school'] || match2['school'] || '',
    'Grade at Enrollment': match2['student_grade'] || '',
    'Course Name': row1['course_name'] || ''
  });
});

// Process File 2 rows that didn't match anything in File 1
data2.forEach(row2 => {
  if (!usedFile2Rows.has(row2)) {
    consolidatedData.push({
      'Student Name': row2['Student Name'] || '',
      'Student Email ID': row2['Student EmailID'] || '',
      'Student Contact Number': row2['student_contact_number'] || '',
      'Parent Name': row2['Parent Name'] || '',
      'Parent Email ID': row2['Parent EmailID'] || '',
      'Parent Contact Number': row2['parent_contact_number'] || '',
      'Enrollment Date': row2['Enrollment Date'] || '',
      'Enrollment Center': row2['enrolment_center'] || '',
      'School': row2['school'] || '',
      'Grade at Enrollment': row2['student_grade'] || '',
      'Course Name': '' // No course from file 1
    });
  }
});

// 5. Write to new CSV file
const newWs = xlsx.utils.json_to_sheet(consolidatedData, {
  header: [
    'Student Name', 'Student Email ID', 'Student Contact Number', 
    'Parent Name', 'Parent Email ID', 'Parent Contact Number', 
    'Enrollment Date', 'Enrollment Center', 'School', 'Grade at Enrollment', 'Course Name'
  ]
});

const csvData = xlsx.utils.sheet_to_csv(newWs);
fs.writeFileSync('Consolidated_Enrollments.csv', csvData);

console.log('Successfully created Consolidated_Enrollments.csv with', consolidatedData.length, 'rows.');
