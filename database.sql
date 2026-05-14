CREATE DATABASE IF NOT EXISTS arshith_group;
USE arshith_group;

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
);