-- ===============================================
-- Paradise Bakes & Cafe - Database Initialization
-- ===============================================

-- NOTE:
-- This script is for development/initial deployment.
-- In PRODUCTION, change DB user credentials & apply least-privilege.
-- Seed credentials provided here are only for initial setup.

-- -------------------------------
-- Drop & Create Database
-- -------------------------------
DROP DATABASE IF EXISTS tcp_database;
CREATE DATABASE tcp_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -------------------------------
-- Create DB User (DEV ONLY)
-- -------------------------------
DROP USER IF EXISTS 'tcp_shakil'@'localhost';
CREATE USER 'tcp_shakil'@'localhost' IDENTIFIED BY 'Simple4me1!';
GRANT ALL PRIVILEGES ON tcp_database.* TO 'tcp_shakil'@'localhost';
FLUSH PRIVILEGES;

-- -------------------------------
-- Switch to Database
-- -------------------------------
USE tcp_database;

-- -------------------------------
-- Table: Admin Users
-- -------------------------------
CREATE TABLE tcp_admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------
-- Table: Business Entries
-- -------------------------------
CREATE TABLE tcp_business (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    online_revenue DECIMAL(10,2) DEFAULT 0,
    cash_revenue DECIMAL(10,2) DEFAULT 0,
    online_expenses DECIMAL(10,2) DEFAULT 0,
    cash_expenses DECIMAL(10,2) DEFAULT 0,
    total_business DECIMAL(10,2) GENERATED ALWAYS AS (
        online_revenue + cash_revenue + online_expenses + cash_expenses
    ) STORED,
    total_balance DECIMAL(10,2) GENERATED ALWAYS AS (
        (online_revenue + cash_revenue) - (cash_expenses + online_expenses)
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- -------------------------------
-- Table: Recipes
-- -------------------------------
CREATE TABLE tcp_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    ingredients_hinglish TEXT,
    steps_hindi TEXT,
    chef_tips TEXT,
    cost_per_portion DECIMAL(10,2),
    equipment TEXT,
    image_path VARCHAR(255),
    storage_notes TEXT,
    reheat_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------
-- Table: Equipment
-- -------------------------------
CREATE TABLE tcp_equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    diagram_path VARCHAR(255),
    instructions_hinglish TEXT,
    maintenance_checklist TEXT,
    troubleshooting TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------
-- Table: Cleaning Logs
-- -------------------------------
CREATE TABLE tcp_cleaning_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    item_cleaned VARCHAR(255) NOT NULL,
    staff_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------
-- Indexes for Performance
-- -------------------------------
CREATE INDEX idx_business_date ON tcp_business(date);
CREATE INDEX idx_recipe_name ON tcp_recipes(name_en);
CREATE INDEX idx_equipment_name ON tcp_equipment(name);

-- -------------------------------
-- End of Script
-- -------------------------------

