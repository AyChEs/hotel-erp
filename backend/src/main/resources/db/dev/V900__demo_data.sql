-- =====================================================================
-- Demo transactional data — DEV PROFILE ONLY (db/dev location).
-- Shows the booking lifecycle and an issued invoice for a nice first run.
-- =====================================================================

-- A past, checked-out booking for room 102 (Alhambra) + its invoice
INSERT INTO booking (id, code, check_in_date, check_out_date, guests, board_type, status, total_price, notes, room_id, client_id) VALUES
    (1, 'BK-2026-000001', DATE '2026-06-10', DATE '2026-06-13', 2, 'HALF_BOARD', 'CHECKED_OUT', 480.00, 'Anniversary stay', 2, 1);

-- Subtotal 480.00, VAT 10% -> 48.00, total 528.00
INSERT INTO invoice (id, invoice_number, issued_at, subtotal, vat_rate, vat_amount, total, payment_method, status, booking_id, client_id) VALUES
    (1, 'INV-2026-0001', TIMESTAMPTZ '2026-06-13 11:00:00+00', 480.00, 0.1000, 48.00, 528.00, 'CARD', 'PAID', 1, 1);

-- An upcoming confirmed booking for the riad suite
INSERT INTO booking (id, code, check_in_date, check_out_date, guests, board_type, status, total_price, notes, room_id, client_id) VALUES
    (2, 'BK-2026-000002', DATE '2026-08-20', DATE '2026-08-25', 3, 'FULL_BOARD', 'CONFIRMED', 1650.00, 'Summer holiday', 7, 1);

SELECT setval(pg_get_serial_sequence('booking', 'id'), (SELECT max(id) FROM booking));
SELECT setval(pg_get_serial_sequence('invoice', 'id'), (SELECT max(id) FROM invoice));

-- Housekeeping tasks
INSERT INTO task (title, description, type, status, priority, due_date, room_id, hotel_id) VALUES
    ('Deep clean suite 301', 'Full turndown and restock minibar', 'CLEANING', 'PENDING', 'HIGH', DATE '2026-07-06', 4, 1),
    ('Fix AC in room 1501', 'Air conditioning not cooling', 'MAINTENANCE', 'IN_PROGRESS', 'URGENT', DATE '2026-07-05', 10, 3);

-- Assign the housekeeper to the cleaning task
INSERT INTO task_assignee (task_id, employee_id)
SELECT t.id, 3 FROM task t WHERE t.title = 'Deep clean suite 301';
