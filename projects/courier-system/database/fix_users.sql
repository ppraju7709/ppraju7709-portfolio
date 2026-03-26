
SET SQL_SAFE_UPDATES = 0;

USE courier_system;

-- DELETE old users (safe now)
DELETE FROM users;

-- ADD SIMPLE PASSWORDS
INSERT INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin'),
('staff', 'admin123', 'staff');

-- Verify
SELECT * FROM users;
