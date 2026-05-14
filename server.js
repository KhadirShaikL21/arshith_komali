const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const uploadDir = path.join(rootDir, 'uploads', 'resumes');

fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(rootDir));

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  connectionLimit: 10,
  waitForConnections: true,
};

const databaseName = process.env.DB_NAME || 'arshith_group';

const applicationPool = mysql.createPool({
  ...dbConfig,
  database: databaseName,
});

let databaseReady = false;

const schemaSql = `
CREATE TABLE IF NOT EXISTS internship_applications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_page VARCHAR(20) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  college_name VARCHAR(190) NOT NULL,
  degree VARCHAR(120) NOT NULL,
  branch_specialization VARCHAR(160) NOT NULL,
  current_year VARCHAR(20) NOT NULL,
  domain_role VARCHAR(160) NOT NULL,
  internship_duration_months INT NOT NULL,
  payment_type ENUM('Paid', 'Unpaid') NOT NULL,
  skills TEXT NOT NULL,
  resume_original_name VARCHAR(255) NOT NULL,
  resume_stored_name VARCHAR(255) NOT NULL,
  resume_path VARCHAR(255) NOT NULL,
  linkedin_profile VARCHAR(255),
  github_profile VARCHAR(255),
  why_internship TEXT NOT NULL,
  available_start_date DATE NOT NULL,
  preferred_mode ENUM('Remote', 'Hybrid', 'Onsite') NOT NULL,
  comments TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

async function ensureDatabase() {
  const adminPool = mysql.createPool({
    ...dbConfig,
    connectionLimit: 1,
  });

  await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await adminPool.query(`USE \`${databaseName}\``);
  await adminPool.query(schemaSql);
  await adminPool.end();
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
    callback(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error('Only PDF, DOC, and DOCX files are allowed.'));
    }

    callback(null, true);
  },
});

function getFormPage(sourcePage) {
  if (sourcePage === 'careers') {
    return 'careers';
  }

  return 'internship';
}

function getRedirectPath(sourcePage, applicationStatus) {
  const pageName = getFormPage(sourcePage);
  return `/${pageName}.html?application=${applicationStatus}#apply`;
}

function removeUploadedFile(filePath) {
  if (!filePath) {
    return;
  }

  fs.unlink(filePath, () => {});
}

app.post('/api/applications', upload.single('resume'), async (req, res) => {
  const {
    sourcePage,
    fullName,
    email,
    phoneNumber,
    collegeName,
    degree,
    branchSpecialization,
    currentYear,
    domainRole,
    internshipDurationMonths,
    paymentType,
    skills,
    linkedinProfile,
    githubProfile,
    whyInternship,
    availableStartDate,
    preferredMode,
    comments,
  } = req.body;

  const resumeFile = req.file;
  const redirectPage = getFormPage(sourcePage);

  const requiredFields = [
    fullName,
    email,
    phoneNumber,
    collegeName,
    degree,
    branchSpecialization,
    currentYear,
    domainRole,
    internshipDurationMonths,
    paymentType,
    skills,
    whyInternship,
    availableStartDate,
    preferredMode,
  ];

  if (requiredFields.some((field) => !field || !String(field).trim()) || !resumeFile) {
    removeUploadedFile(resumeFile && resumeFile.path);
    return res.redirect(303, getRedirectPath(redirectPage, 'error'));
  }

  if (!databaseReady) {
    removeUploadedFile(resumeFile.path);
    return res.redirect(303, getRedirectPath(redirectPage, 'error'));
  }

  try {
    await applicationPool.query(
      `INSERT INTO internship_applications (
        source_page,
        full_name,
        email,
        phone_number,
        college_name,
        degree,
        branch_specialization,
        current_year,
        domain_role,
        internship_duration_months,
        payment_type,
        skills,
        resume_original_name,
        resume_stored_name,
        resume_path,
        linkedin_profile,
        github_profile,
        why_internship,
        available_start_date,
        preferred_mode,
        comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        redirectPage,
        fullName.trim(),
        email.trim(),
        phoneNumber.trim(),
        collegeName.trim(),
        degree.trim(),
        branchSpecialization.trim(),
        currentYear.trim(),
        domainRole.trim(),
        Number(internshipDurationMonths),
        paymentType.trim(),
        skills.trim(),
        resumeFile.originalname,
        resumeFile.filename,
        path.join('uploads', 'resumes', resumeFile.filename),
        linkedinProfile ? linkedinProfile.trim() : null,
        githubProfile ? githubProfile.trim() : null,
        whyInternship.trim(),
        availableStartDate,
        preferredMode.trim(),
        comments ? comments.trim() : null,
      ]
    );

    return res.redirect(303, getRedirectPath(redirectPage, 'success'));
  } catch (error) {
    removeUploadedFile(resumeFile.path);
    console.error('Failed to save internship application:', error);
    return res.redirect(303, getRedirectPath(redirectPage, 'error'));
  }
});

app.get('/api/health', async (req, res) => {
  try {
    if (databaseReady) {
      await applicationPool.query('SELECT 1');
    }

    res.json({
      status: databaseReady ? 'ok' : 'degraded',
      databaseReady,
    });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message) {
    const page = getFormPage(req.body && req.body.sourcePage);
    return res.redirect(303, getRedirectPath(page, 'error'));
  }

  next(error);
});

ensureDatabase()
  .then(() => {
    databaseReady = true;
    console.log('Database initialized successfully.');
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    console.error('Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in .env to enable submissions.');
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });