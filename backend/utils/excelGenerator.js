const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class ExcelGenerator {
  // Generate students Excel template
  static generateStudentTemplate() {
    const template = [
      {
        'Name': 'John Doe',
        'Roll Number': 'CS2024001',
        'Email': 'john.doe@example.com',
        'Password': 'Student@123',
        'Group ID': 'group_id_here',
        'Contact Number': '9876543210',
        'Address': '123 Main St, City'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Add instructions as a separate sheet
    const instructions = [
      { 'Field': 'Name', 'Required': 'Yes', 'Description': 'Student full name' },
      { 'Field': 'Roll Number', 'Required': 'Yes', 'Description': 'Unique roll number (uppercase letters, numbers, hyphens only)' },
      { 'Field': 'Email', 'Required': 'Yes', 'Description': 'Valid email address' },
      { 'Field': 'Password', 'Required': 'Yes', 'Description': 'Minimum 6 characters' },
      { 'Field': 'Group ID', 'Required': 'Yes', 'Description': 'Valid MongoDB Group ID from your system' },
      { 'Field': 'Contact Number', 'Required': 'No', 'Description': '10-digit phone number' },
      { 'Field': 'Address', 'Required': 'No', 'Description': 'Full address' }
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);

    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    return wb;
  }

  // Generate questions Excel template
  static generateQuestionsTemplate() {
    const template = [
      {
        'Question': 'What is 2+2?',
        'Option A': '3',
        'Option B': '4',
        'Option C': '5',
        'Option D': '6',
        'Correct Answer': 'B',
        'Marks': 5,
        'Explanation': '2+2 equals 4',
        'Difficulty': 'easy'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    const instructions = [
      { 'Field': 'Question', 'Required': 'Yes', 'Description': 'Question text' },
      { 'Field': 'Option A', 'Required': 'Yes', 'Description': 'Option A text' },
      { 'Field': 'Option B', 'Required': 'Yes', 'Description': 'Option B text' },
      { 'Field': 'Option C', 'Required': 'Yes', 'Description': 'Option C text' },
      { 'Field': 'Option D', 'Required': 'Yes', 'Description': 'Option D text' },
      { 'Field': 'Correct Answer', 'Required': 'Yes', 'Description': 'Must be A, B, C, or D' },
      { 'Field': 'Marks', 'Required': 'Yes', 'Description': 'Positive number' },
      { 'Field': 'Explanation', 'Required': 'No', 'Description': 'Explanation for the answer' },
      { 'Field': 'Difficulty', 'Required': 'No', 'Description': 'easy, medium, or hard' }
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);

    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    return wb;
  }

  // Generate exam results Excel
  static generateExamResults(exam, results) {
    const reportData = results.map((result, index) => ({
      'Rank': index + 1,
      'Student Name': result.student?.name || 'N/A',
      'Roll Number': result.student?.rollNumber || 'N/A',
      'Email': result.student?.email || 'N/A',
      'Marks Obtained': result.marksObtained,
      'Total Marks': result.totalMarks,
      'Percentage': `${result.percentage.toFixed(2)}%`,
      'Result': result.isPass ? 'PASS' : 'FAIL',
      'Grade': result.grade || 'N/A',
      'Published': result.isPublished ? 'Yes' : 'No'
    }));

    const summary = [
      { 'Metric': 'Exam Name', 'Value': exam.name },
      { 'Metric': 'Date', 'Value': new Date(exam.date).toLocaleDateString() },
      { 'Metric': 'Total Students', 'Value': results.length },
      { 'Metric': 'Passed', 'Value': results.filter(r => r.isPass).length },
      { 'Metric': 'Failed', 'Value': results.filter(r => !r.isPass).length },
      { 'Metric': 'Pass Percentage', 'Value': `${((results.filter(r => r.isPass).length / results.length) * 100).toFixed(2)}%` },
      { 'Metric': 'Average Marks', 'Value': (results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length).toFixed(2) },
      { 'Metric': 'Highest Marks', 'Value': Math.max(...results.map(r => r.marksObtained)) },
      { 'Metric': 'Lowest Marks', 'Value': Math.min(...results.map(r => r.marksObtained)) }
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsResults = XLSX.utils.json_to_sheet(reportData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsResults, 'Results');

    return wb;
  }

  // Generate student performance report
  static generateStudentPerformance(student, results) {
    const performanceData = results.map(result => ({
      'Exam Name': result.exam?.name || 'N/A',
      'Date': new Date(result.createdAt).toLocaleDateString(),
      'Marks Obtained': result.marksObtained,
      'Total Marks': result.totalMarks,
      'Percentage': `${result.percentage.toFixed(2)}%`,
      'Result': result.isPass ? 'PASS' : 'FAIL',
      'Grade': result.grade || 'N/A'
    }));

    const summary = [
      { 'Metric': 'Student Name', 'Value': student.name },
      { 'Metric': 'Roll Number', 'Value': student.rollNumber },
      { 'Metric': 'Email', 'Value': student.email },
      { 'Metric': 'Group', 'Value': student.group?.name || 'N/A' },
      { 'Metric': 'Total Exams Taken', 'Value': results.length },
      { 'Metric': 'Exams Passed', 'Value': results.filter(r => r.isPass).length },
      { 'Metric': 'Exams Failed', 'Value': results.filter(r => !r.isPass).length },
      { 'Metric': 'Average Percentage', 'Value': `${(results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)}%` },
      { 'Metric': 'Best Performance', 'Value': `${Math.max(...results.map(r => r.percentage)).toFixed(2)}%` }
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsPerformance = XLSX.utils.json_to_sheet(performanceData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsPerformance, 'Performance');

    return wb;
  }

  // Generate group report
  static generateGroupReport(group, students, exams, results) {
    const studentsSheet = students.map(s => ({
      'Name': s.name,
      'Roll Number': s.rollNumber,
      'Email': s.email,
      'Status': s.isActive ? 'Active' : 'Inactive',
      'Joined': new Date(s.createdAt).toLocaleDateString()
    }));

    const examsSheet = exams.map(e => ({
      'Exam Name': e.exam?.name || 'N/A',
      'Date': new Date(e.assignedAt).toLocaleDateString(),
      'Status': e.status
    }));

    const resultsSheet = results.map(r => ({
      'Student Name': r.student?.name || 'N/A',
      'Exam Name': r.exam?.name || 'N/A',
      'Marks': r.marksObtained,
      'Percentage': `${r.percentage.toFixed(2)}%`,
      'Result': r.isPass ? 'PASS' : 'FAIL'
    }));

    const summary = [
      { 'Metric': 'Group Name', 'Value': group.name },
      { 'Metric': 'Year', 'Value': group.year },
      { 'Metric': 'Batch', 'Value': group.batch },
      { 'Metric': 'Section', 'Value': group.section },
      { 'Metric': 'Department', 'Value': group.department || 'N/A' },
      { 'Metric': 'Total Students', 'Value': students.length },
      { 'Metric': 'Active Students', 'Value': students.filter(s => s.isActive).length },
      { 'Metric': 'Total Exams Assigned', 'Value': exams.length },
      { 'Metric': 'Exams Taken', 'Value': results.length }
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsStudents = XLSX.utils.json_to_sheet(studentsSheet);
    const wsExams = XLSX.utils.json_to_sheet(examsSheet);
    const wsResults = XLSX.utils.json_to_sheet(resultsSheet);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');
    XLSX.utils.book_append_sheet(wb, wsExams, 'Exams');
    XLSX.utils.book_append_sheet(wb, wsResults, 'Results');

    return wb;
  }

  // Save Excel to file
  static async saveToFile(workbook, filename) {
    const uploadDir = 'uploads/reports';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, `${filename}-${Date.now()}.xlsx`);
    XLSX.writeFile(workbook, filepath);
    
    return filepath;
  }

  // Generate Excel buffer for download
  static generateBuffer(workbook) {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Parse uploaded Excel file
  static parseExcelFile(filepath) {
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  // Validate Excel structure
  static validateExcelData(data, requiredFields) {
    const errors = [];
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] && row[field] !== 0) {
          errors.push({
            row: index + 2,
            field,
            message: `Missing required field: ${field}`
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ExcelGenerator;