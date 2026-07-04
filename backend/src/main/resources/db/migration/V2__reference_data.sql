-- =====================================================================
-- Reference & baseline data (applied in ALL environments, incl. prod demo).
-- BCrypt hashes are pre-generated constants — never regenerate to "verify".
--   admin@hotel-erp.dev        / Admin123!
--   manager@hotel-erp.dev      / Manager123!
--   reception@hotel-erp.dev    / Reception123!
--   client@hotel-erp.dev       / Client123!
-- =====================================================================

-- Categories
INSERT INTO category (id, name, star_rating, description) VALUES
    (1, 'Luxury 5 Stars', 5, 'Premium hotels with full-service amenities'),
    (2, 'Business 4 Stars', 4, 'Comfortable hotels for business travellers'),
    (3, 'Standard 3 Stars', 3, 'Well-equipped mid-range hotels'),
    (4, 'Boutique', 4, 'Small design-led hotels with character');
SELECT setval(pg_get_serial_sequence('category', 'id'), (SELECT max(id) FROM category));

-- Hotels
INSERT INTO hotel (id, name, address, city, country, phone, email, description, image_url, active, category_id) VALUES
    (1, 'Alhambra Palace', 'Plaza Arquitecto Garcia de Paredes 1', 'Granada', 'Spain',
        '+34 958 221 468', 'info@alhambrapalace.example', 'Moorish-inspired luxury overlooking the Alhambra.',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', TRUE, 1),
    (2, 'Marrakech Riad Andalus', 'Derb Sidi Bouloukat 12', 'Marrakech', 'Morocco',
        '+212 524 391 234', 'contact@riadandalus.example', 'Traditional riad with arabesque courtyards and rooftop terrace.',
        'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200', TRUE, 4),
    (3, 'Barcelona Business Tower', 'Avinguda Diagonal 640', 'Barcelona', 'Spain',
        '+34 934 052 000', 'stay@bcntower.example', 'Modern business hotel in the heart of the city.',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', TRUE, 2);
SELECT setval(pg_get_serial_sequence('hotel', 'id'), (SELECT max(id) FROM hotel));

-- Rooms (a representative spread per hotel)
INSERT INTO room (number, floor, type, status, capacity, description, price_per_night, half_board_supplement, full_board_supplement, hotel_id) VALUES
    ('101', 1, 'SINGLE', 'AVAILABLE', 1, 'Cozy single with garden view',            85.00, 15.00, 28.00, 1),
    ('102', 1, 'DOUBLE', 'AVAILABLE', 2, 'Double room with Alhambra view',          140.00, 20.00, 36.00, 1),
    ('201', 2, 'DOUBLE', 'AVAILABLE', 2, 'Superior double with balcony',            165.00, 20.00, 36.00, 1),
    ('301', 3, 'SUITE',  'AVAILABLE', 4, 'Royal suite with private terrace',        420.00, 35.00, 60.00, 1),
    ('R1',  0, 'DOUBLE', 'AVAILABLE', 2, 'Riad double around the central courtyard', 110.00, 18.00, 30.00, 2),
    ('R2',  0, 'TRIPLE', 'AVAILABLE', 3, 'Family riad room with mosaic details',    150.00, 22.00, 38.00, 2),
    ('R3',  1, 'SUITE',  'AVAILABLE', 4, 'Terrace suite with plunge pool',          280.00, 30.00, 50.00, 2),
    ('1201',12, 'SINGLE','AVAILABLE', 1, 'Executive single, city view',              95.00, 16.00, 29.00, 3),
    ('1202',12, 'DOUBLE','AVAILABLE', 2, 'Executive double, city view',             130.00, 18.00, 32.00, 3),
    ('1501',15, 'SUITE', 'MAINTENANCE',4,'Panoramic suite (under maintenance)',     350.00, 30.00, 55.00, 3);

-- Users (roles: ADMIN, MANAGER, RECEPTIONIST, CLIENT)
INSERT INTO app_user (id, email, password_hash, role, enabled) VALUES
    (1, 'admin@hotel-erp.dev',     '$2a$10$fYLkTAFhw1iZIBJs9kWqUekxsuzT5OMdcM.jrOHpxnar3dwW.tlia', 'ADMIN',        TRUE),
    (2, 'manager@hotel-erp.dev',   '$2a$10$Br/1JsUjnzaFHhCtbafM.OelBHdq8B4tmisVcvWLbqA4H79fyG3Qe', 'MANAGER',      TRUE),
    (3, 'reception@hotel-erp.dev', '$2a$10$m76TsriUEqxfFu5RGDRSdOHXVCdBaXJZydksvgiIB.sKtvJNYDjj6', 'RECEPTIONIST', TRUE),
    (4, 'client@hotel-erp.dev',    '$2a$10$326M2HUgn0LCNGTM4yIrquPctg1LiR7rbM9i5X5853d6H0WI22rC.', 'CLIENT',       TRUE);
SELECT setval(pg_get_serial_sequence('app_user', 'id'), (SELECT max(id) FROM app_user));

-- Employees linked to staff users
INSERT INTO employee (id, first_name, last_name, document_id, birth_date, phone, address, position, status, hired_at, gross_salary, hotel_id, user_id) VALUES
    (1, 'Nadia',  'El Amrani', 'EMP-0001', '1988-04-12', '+34 600 111 222', 'Granada', 'MANAGER',      'ACTIVE', '2021-03-01', 3800.00, 1, 2),
    (2, 'Luis',   'Fernandez', 'EMP-0002', '1995-09-30', '+34 600 333 444', 'Granada', 'RECEPTIONIST', 'ACTIVE', '2022-06-15', 2100.00, 1, 3),
    (3, 'Yassine','Berrada',   'EMP-0003', '1990-01-20', '+212 600 555 666','Marrakech','HOUSEKEEPER',  'ACTIVE', '2020-11-10', 1500.00, 2, NULL);
SELECT setval(pg_get_serial_sequence('employee', 'id'), (SELECT max(id) FROM employee));

-- Client linked to the demo client user
INSERT INTO client (id, first_name, last_name, document_id, birth_date, phone, address, client_type, registered_at, user_id) VALUES
    (1, 'Ayman', 'Charoui', 'CLI-0001', '1999-07-04', '+34 600 777 888', 'Barcelona', 'VIP', now(), 4);
SELECT setval(pg_get_serial_sequence('client', 'id'), (SELECT max(id) FROM client));
