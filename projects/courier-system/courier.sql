-- courier.sql - PASTE THIS ALL
CREATE DATABASE IF NOT EXISTS courier_system;
USE courier_system;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    parcel_type ENUM('Document', 'Electronics', 'Clothing', 'Books') NOT NULL,
    status ENUM('Pending', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    expected_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- DEFAULT USERS
INSERT INTO users (username, password, role) VALUES 
('admin', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('staff', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');

-- SAMPLE PARCELS
INSERT INTO parcels (tracking_id, sender_name, receiver_name, parcel_type, status, expected_date) VALUES
('TRK001', 'John Doe', 'Jane Smith', 'Document', 'Delivered', '2024-01-15'),
('TRK002', 'Mike Johnson', 'Sarah Wilson', 'Electronics', 'In Transit', '2024-01-20'),
('TRK003', 'Emily Brown', 'Tom Davis', 'Clothing', 'Pending', '2024-01-18'),
('TRK004', 'David Wilson', 'Lisa Chen', 'Books', 'Delivered', '2024-01-16'),
('TRK005', 'Anna Taylor', 'Robert Lee', 'Electronics', 'Pending', '2024-01-22');

INSERT INTO branches (name, location) VALUES
('Main Branch', 'New York, NY'),
('Downtown', 'Los Angeles, CA'),
('Airport', 'Chicago, IL');