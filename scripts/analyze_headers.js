const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const uploadDir = path.join(__dirname, '..', 'Data Uploads');
const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));

const fieldMapping = {
    'student name': 'studentName',
    'student': 'studentName',
    'student ': 'studentName',
    'student emailid': 'studentEmail',
    'student number': 'studentContactNumber',
    'parent name': 'parentName',
    'parent': 'parentName',
    'parent emailid': 'parentEmail',
    'parent number': 'parentContactNumber',
    'parent_contact_number': 'parentContactNumber',
    'contact no.': 'parentContactNumber',
    '8108760083': 'parentContactNumber', 
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

const ignoredFields = ['no', 'sessions completed', 'sessions pending', 'revenue', 'completed_hours', 'pending_hours', 'emrollment month', 'emrollment month2', '__empty'];

const unmappedHeaders = new Set();
const allHeaders = new Set();

files.forEach(file => {
    const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
    const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true, preview: 1 });
    
    if (parsed.meta.fields) {
        parsed.meta.fields.forEach(header => {
            const rawHeader = header;
            const lowerKey = header.trim().toLowerCase();
            allHeaders.add(rawHeader);
            
            if (!ignoredFields.includes(lowerKey) && !lowerKey.includes('remark') && !lowerKey.startsWith('__empty')) {
                if (!fieldMapping[lowerKey]) {
                    unmappedHeaders.add(`File: ${file} | Header: "${rawHeader}" -> lowerKey: "${lowerKey}"`);
                }
            }
        });
    }
});

console.log("All Unique Headers Found in Raw CSVs:");
Array.from(allHeaders).sort().forEach(h => console.log(h));
