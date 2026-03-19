const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  // Generate student admit card
  static async generateAdmitCard(student, exam) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Add border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();

        // Header
        doc.fontSize(20).text('EXAM ADMIT CARD', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('Online Exam Platform', { align: 'center' });
        doc.moveDown(2);

        // Institution info
        doc.fontSize(10).text('123 Education Street, Knowledge City', { align: 'center' });
        doc.text('Phone: +1 234 567 890 | Email: info@examplatform.com', { align: 'center' });
        doc.moveDown(2);

        // Draw line
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
        doc.moveDown();

        // Student Information
        doc.fontSize(14).text('Student Information', { underline: true });
        doc.moveDown(0.5);
        
        const studentInfo = [
          ['Name:', student.name],
          ['Roll Number:', student.rollNumber],
          ['Email:', student.email],
          ['Group:', student.group?.name || 'N/A'],
          ['Date of Birth:', student.dob || 'N/A']
        ];

        studentInfo.forEach(([label, value]) => {
          doc.fontSize(11).text(`${label} ${value}`, { continued: false });
        });

        doc.moveDown();

        // Exam Information
        doc.fontSize(14).text('Exam Information', { underline: true });
        doc.moveDown(0.5);

        const examStartTime = new Date(exam.date);
        const [hours, minutes] = exam.startTime.split(':');
        examStartTime.setHours(parseInt(hours), parseInt(minutes), 0);

        const examInfo = [
          ['Exam Name:', exam.name],
          ['Date:', examStartTime.toLocaleDateString()],
          ['Time:', `${exam.startTime} (${exam.duration} minutes)`],
          ['Duration:', `${exam.duration} minutes`],
          ['Total Marks:', exam.totalMarks],
          ['Pass Marks:', exam.passMark],
          ['Venue:', 'Online - Remote Proctored']
        ];

        examInfo.forEach(([label, value]) => {
          doc.fontSize(11).text(`${label} ${value}`, { continued: false });
        });

        doc.moveDown(2);

        // Instructions
        doc.fontSize(14).text('Important Instructions', { underline: true });
        doc.moveDown(0.5);
        
        const instructions = [
          '1. Login 15 minutes before the exam starts',
          '2. Ensure stable internet connection',
          '3. Keep your camera on during the exam',
          '4. Do not switch tabs or minimize browser',
          '5. The exam will auto-submit if you violate rules',
          '6. Results will be published after admin approval'
        ];

        instructions.forEach(instruction => {
          doc.fontSize(10).text(instruction, { continued: false });
        });

        doc.moveDown(2);

        // Signature section
        doc.text('_________________________', { align: 'left' });
        doc.text('Student Signature', { align: 'left' });

        doc.text('_________________________', { align: 'right' });
        doc.text('Authorized Signature', { align: 'right' });

        // Footer
        doc.fontSize(8).text('This is a computer generated admit card. No signature required.', { align: 'center', y: doc.page.height - 50 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate exam certificate
  static async generateCertificate(result) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Add decorative border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

        // Add certificate border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();

        // Certificate title
        doc.fontSize(40).text('CERTIFICATE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text('OF ACHIEVEMENT', { align: 'center' });
        doc.moveDown(2);

        // Award text
        doc.fontSize(14).text('This is to certify that', { align: 'center' });
        doc.moveDown();
        doc.fontSize(24).text(result.student.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Roll Number: ${result.student.rollNumber}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).text('has successfully completed the examination for', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text(result.exam.name, { align: 'center' });
        doc.moveDown(2);

        // Score details
        doc.fontSize(14).text(`with a score of ${result.marksObtained} out of ${result.totalMarks}`, { align: 'center' });
        doc.text(`(${result.percentage.toFixed(2)}%)`, { align: 'center' });
        doc.text(`Grade: ${result.grade}`, { align: 'center' });
        doc.moveDown(2);
        doc.text(`Result: ${result.isPass ? 'PASS' : 'FAIL'}`, { align: 'center' });
        doc.moveDown(4);

        // Date and signature
        doc.fontSize(12).text(`Date: ${new Date(result.createdAt).toLocaleDateString()}`, { align: 'left' });
        doc.text('_________________________', { align: 'right' });
        doc.text('Authorized Signature', { align: 'right' });

        // Seal
        doc.circle(doc.page.width / 2, doc.page.height - 100, 40).stroke();
        doc.fontSize(10).text('OFFICIAL SEAL', doc.page.width / 2 - 25, doc.page.height - 110);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate exam report
  static async generateExamReport(exam, results, statistics) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4' });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text('Exam Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(exam.name, { align: 'center' });
        doc.moveDown();

        // Exam details
        doc.fontSize(12).text(`Date: ${new Date(exam.date).toLocaleDateString()}`);
        doc.text(`Duration: ${exam.duration} minutes`);
        doc.text(`Total Marks: ${exam.totalMarks}`);
        doc.text(`Pass Mark: ${exam.passMark}`);
        doc.moveDown();

        // Statistics
        doc.fontSize(14).text('Statistics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Total Students: ${statistics.totalStudents}`);
        doc.text(`Passed: ${statistics.passed}`);
        doc.text(`Failed: ${statistics.failed}`);
        doc.text(`Pass Percentage: ${((statistics.passed / statistics.totalStudents) * 100).toFixed(2)}%`);
        doc.text(`Average Marks: ${statistics.averageMarks.toFixed(2)}`);
        doc.text(`Highest Marks: ${statistics.highestMarks}`);
        doc.text(`Lowest Marks: ${statistics.lowestMarks}`);
        doc.moveDown(2);

        // Top Performers
        doc.fontSize(14).text('Top Performers', { underline: true });
        doc.moveDown(0.5);

        const topPerformers = results.sort((a, b) => b.marksObtained - a.marksObtained).slice(0, 10);
        
        topPerformers.forEach((result, index) => {
          doc.fontSize(11).text(`${index + 1}. ${result.student?.name} - ${result.marksObtained} marks (${result.percentage.toFixed(2)}%)`);
        });
        doc.moveDown(2);

        // Marks distribution
        doc.fontSize(14).text('Marks Distribution', { underline: true });
        doc.moveDown(0.5);

        const distribution = {
          '90-100%': results.filter(r => r.percentage >= 90).length,
          '80-89%': results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
          '70-79%': results.filter(r => r.percentage >= 70 && r.percentage < 80).length,
          '60-69%': results.filter(r => r.percentage >= 60 && r.percentage < 70).length,
          '50-59%': results.filter(r => r.percentage >= 50 && r.percentage < 60).length,
          '40-49%': results.filter(r => r.percentage >= 40 && r.percentage < 50).length,
          'Below 40%': results.filter(r => r.percentage < 40).length
        };

        Object.entries(distribution).forEach(([range, count]) => {
          doc.fontSize(11).text(`${range}: ${count} students`);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate student performance report
  static async generateStudentPerformanceReport(student, results) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4' });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text('Student Performance Report', { align: 'center' });
        doc.moveDown(2);

        // Student details
        doc.fontSize(14).text('Student Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Name: ${student.name}`);
        doc.text(`Roll Number: ${student.rollNumber}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`Group: ${student.group?.name || 'N/A'}`);
        doc.moveDown();

        // Statistics
        const passed = results.filter(r => r.isPass).length;
        const average = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

        doc.fontSize(14).text('Statistics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Total Exams Taken: ${results.length}`);
        doc.text(`Exams Passed: ${passed}`);
        doc.text(`Exams Failed: ${results.length - passed}`);
        doc.text(`Pass Percentage: ${((passed / results.length) * 100).toFixed(2)}%`);
        doc.text(`Average Score: ${average.toFixed(2)}%`);
        doc.text(`Best Score: ${Math.max(...results.map(r => r.percentage)).toFixed(2)}%`);
        doc.text(`Worst Score: ${Math.min(...results.map(r => r.percentage)).toFixed(2)}%`);
        doc.moveDown();

        // Detailed results
        doc.fontSize(14).text('Exam History', { underline: true });
        doc.moveDown(0.5);

        results.forEach((result, index) => {
          doc.fontSize(11).text(`${index + 1}. ${result.exam.name}`);
          doc.fontSize(10).text(`   Date: ${new Date(result.createdAt).toLocaleDateString()}`);
          doc.fontSize(10).text(`   Score: ${result.marksObtained}/${result.totalMarks} (${result.percentage.toFixed(2)}%)`);
          doc.fontSize(10).text(`   Result: ${result.isPass ? 'PASS' : 'FAIL'}`);
          doc.moveDown(0.3);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate answer key
  static async generateAnswerKey(exam) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4' });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text('Answer Key', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(exam.name, { align: 'center' });
        doc.moveDown(2);

        // Exam details
        doc.fontSize(12).text(`Total Questions: ${exam.questions.length}`);
        doc.text(`Total Marks: ${exam.totalMarks}`);
        doc.text(`Pass Mark: ${exam.passMark}`);
        doc.moveDown(2);

        // Questions and answers
        exam.questions.forEach((q, index) => {
          doc.fontSize(11).text(`Q${index + 1}. ${q.question}`);
          doc.fontSize(10).text(`   A) ${q.options.A}`);
          doc.fontSize(10).text(`   B) ${q.options.B}`);
          doc.fontSize(10).text(`   C) ${q.options.C}`);
          doc.fontSize(10).text(`   D) ${q.options.D}`);
          doc.fontSize(10).text(`   Correct Answer: ${q.correctAnswer}`);
          doc.fontSize(10).text(`   Marks: ${q.marks}`);
          if (q.explanation) {
            doc.fontSize(9).text(`   Explanation: ${q.explanation}`);
          }
          doc.moveDown(0.5);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Save PDF to file
  static async saveToFile(pdfBuffer, filename) {
    const uploadDir = 'uploads/reports';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, `${filename}-${Date.now()}.pdf`);
    fs.writeFileSync(filepath, pdfBuffer);
    
    return filepath;
  }
}

module.exports = PDFGenerator;