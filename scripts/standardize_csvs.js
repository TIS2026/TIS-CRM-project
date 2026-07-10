const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const uploadDir = path.join(__dirname, '..', 'Data Uploads');
const standardizedDir = path.join(uploadDir, 'Standardized');

if (!fs.existsSync(standardizedDir)) {
    fs.mkdirSync(standardizedDir);
}

const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));

const fieldMapping = {
    'student name': 'studentName',
    'student': 'studentName',
    'student ': 'studentName',
    'student emailid': 'studentEmail',
    'student number': 'studentContactNumber',
    'student_contact_number': 'studentContactNumber',
    'parent name': 'parentName',
    'parent': 'parentName',
    'parent emailid': 'parentEmail',
    'parent number': 'parentContactNumber',
    'parent_contact_number': 'parentContactNumber',
    'contact no.': 'parentContactNumber',
    '8108760083': 'parentContactNumber', // some weird header from earlier dump
    'school': 'school',
    'grade': 'studentGrade',
    'student_grade': 'studentGrade',
    'city': 'city',
    'country': 'country',
    'course': 'courseName',
    'course_name': 'courseName',
    'course category': 'courseCategory',
    'course hours': 'courseHours',
    'course_duration_hours': 'courseHours',
    'scheduled_hours': 'courseHours',
    'enrollment date': 'enrollmentDate',
    'enrolled_date': 'enrollmentDate',
    'enrolment_center': 'enrollmentCenter',
    'counselor name': 'counselorName',
    'mentor_name': 'mentorName',
    'source': 'leadSource',
    'type': 'leadType',
    'role': 'leadType', 
    'current status': 'currentStatus',
    'disposition': 'disposition',
    'last course': 'lastCourse',
    'latest course enrolled for': 'lastCourse',
    'mit enrolled': 'mitEnrolled',
    'ni enrolled': 'niEnrolled',
    'bucket': 'bucket',
    'latest remark date': 'latestRemarkDate',
    'active?': 'currentStatus'
};

const ignoredFields = ['sessions completed', 'sessions pending', 'revenue', 'completed_hours', 'pending_hours', 'emrollment month', 'emrollment month2'];

files.forEach(file => {
    console.log(`Processing: ${file}`);
    const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
    const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true });
    
    if (parsed.errors.length > 0) {
        console.warn(`Warnings in ${file}:`, parsed.errors);
    }
    
    const standardizedData = [];
    
    parsed.data.forEach(row => {
        const newRow = {};
        const remarks = [];
        
        Object.keys(row).forEach(key => {
            const val = row[key];
            if (!val || val.trim() === '') return;
            
            const lowerKey = key.trim().toLowerCase();
            
            // Handle ignored
            if (ignoredFields.includes(lowerKey)) {
                return;
            }
            
            // Handle remarks consolidation
            if (lowerKey.includes('remark') && lowerKey !== 'latest remark date') {
                remarks.push(val.trim());
            } else if (lowerKey.startsWith('__empty')) {
                remarks.push(val.trim());
            } 
            else if (fieldMapping[lowerKey]) {
                const standardizedKey = fieldMapping[lowerKey];
                
                if (standardizedKey === 'parentName' && (val.includes('/') || val.includes('&') || val.toLowerCase().includes(' and '))) {
                    const parts = val.split(/\s*(?:\/|&|and)\s*/i);
                    newRow['parentName'] = parts[0].trim();
                    if (parts.length > 1 && parts[1].trim() !== '') {
                        newRow['parent2Name'] = parts.slice(1).join(' & ').trim();
                    }
                } else if (standardizedKey === 'parentContactNumber' && (val.includes('/') || val.includes('&') || val.toLowerCase().includes(' and '))) {
                    const parts = val.split(/\s*(?:\/|&|and)\s*/i);
                    newRow['parentContactNumber'] = parts[0].trim();
                    if (parts.length > 1 && parts[1].trim() !== '') {
                        newRow['parent2ContactNumber'] = parts.slice(1).join(' / ').trim();
                    }
                } else {
                    newRow[standardizedKey] = val.trim();
                }
            }
        });
        
        if (remarks.length > 0) {
            newRow['remarks'] = remarks.join(' | ');
        }
        
        // Only push rows that actually have some data
        if (Object.keys(newRow).length > 0) {
            standardizedData.push(newRow);
        }
    });
    
    if (standardizedData.length > 0) {
        const csvContent = papaparse.unparse(standardizedData);
        fs.writeFileSync(path.join(standardizedDir, file), csvContent, 'utf8');
        console.log(`Saved standardized ${file}`);
    } else {
        console.log(`Skipped ${file} (no valid data)`);
    }
});

console.log('All done!');
