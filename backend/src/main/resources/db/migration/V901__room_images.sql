-- Demo photography for rooms (Unsplash, free to hotlink under the Unsplash License)
UPDATE room SET image_url = CASE type
    WHEN 'SINGLE' THEN 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900'
    WHEN 'DOUBLE' THEN 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900'
    WHEN 'TRIPLE' THEN 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=900'
    WHEN 'SUITE'  THEN 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900'
END
WHERE image_url IS NULL;
