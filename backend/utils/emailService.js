const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Exam Platform" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (user, password) => {
  const html = `
    <h2>Welcome to Online Exam Platform</h2>
    <p>Hello ${user.name},</p>
    <p>Your account has been created successfully.</p>
    <p><strong>Login Credentials:</strong></p>
    <ul>
      <li>Roll Number: ${user.rollNumber}</li>
      <li>Password: ${password}</li>
    </ul>
    <p>Please login and change your password immediately.</p>
    <p>Best regards,<br>Exam Platform Team</p>
  `;

  return sendEmail(user.email, 'Welcome to Exam Platform', html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hello ${user.name},</p>
    <p>You requested to reset your password.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>Exam Platform Team</p>
  `;

  return sendEmail(user.email, 'Password Reset Request', html);
};

const sendExamReminder = async (user, exam) => {
  const examDate = new Date(exam.date);
  const html = `
    <h2>Exam Reminder</h2>
    <p>Hello ${user.name},</p>
    <p>This is a reminder for your upcoming exam:</p>
    <ul>
      <li><strong>Exam:</strong> ${exam.name}</li>
      <li><strong>Date:</strong> ${exam.date.toLocaleDateString()}</li>
      <li><strong>Time:</strong> ${exam.startTime}</li>
      <li><strong>Duration:</strong> ${exam.duration} minutes</li>
    </ul>
    <p>Please login to the platform before the exam starts.</p>
    <p>Best regards,<br>Exam Platform Team</p>
  `;

  return sendEmail(user.email, 'Exam Reminder', html);
};

const sendResultEmail = async (user, result) => {
  const html = `
    <h2>Exam Result Published</h2>
    <p>Hello ${user.name},</p>
    <p>Your result for ${result.exam.name} has been published.</p>
    <ul>
      <li><strong>Marks Obtained:</strong> ${result.marksObtained}</li>
      <li><strong>Total Marks:</strong> ${result.totalMarks}</li>
      <li><strong>Percentage:</strong> ${result.percentage.toFixed(2)}%</li>
      <li><strong>Result:</strong> ${result.isPass ? 'PASS' : 'FAIL'}</li>
    </ul>
    <p>Login to view detailed analysis.</p>
    <p>Best regards,<br>Exam Platform Team</p>
  `;

  return sendEmail(user.email, 'Exam Result Published', html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendExamReminder,
  sendResultEmail
};