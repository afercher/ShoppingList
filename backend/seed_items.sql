-- Clear conflicting data first
DELETE FROM shopping_list_article;

-- Add items to lists with correct IDs
INSERT INTO shopping_list_article (shopping_list_id, article_id, quantity) VALUES
  -- Weekly Groceries (List 2)
  (2, 5, 5),     -- Carrots
  (2, 6, 2),     -- Broccoli
  (2, 8, 3),     -- Tomatoes
  (2, 1, 2),     -- Apfel (Äpfel)
  (2, 2, 3),     -- Banane
  (2, 3, 1),     -- Milch
  (2, 4, 2),     -- Wasser

  -- Party Supplies (List 3)
  (3, 48, 2),    -- Strawberries
  (3, 9, 2),     -- Potatoes
  (3, 4, 3),     -- Wasser

  -- Breakfast Items (List 4)
  (4, 11, 1),    -- Eggs
  (4, 3, 1),     -- Milch
  (4, 4, 2),     -- Wasser

  -- Dinner Ingredients (List 5)
  (5, 5, 3),     -- Carrots
  (5, 6, 2),     -- Broccoli
  (5, 8, 2),     -- Tomatoes
  (5, 12, 2),    -- Chicken/Geflügel
  (5, 30, 1),    -- Pasta/Getreide
  (5, 1, 1),     -- Apfel

  -- Dessert Making (List 6)
  (6, 1, 1),     -- Apfel
  (6, 11, 1),    -- Eggs
  (6, 3, 1)      -- Milch
ON CONFLICT DO NOTHING;

-- Show the result
SELECT COUNT(*) as "Total Items Added" FROM shopping_list_article;
SELECT COUNT(*) as "Total Articles" FROM article;
SELECT COUNT(*) as "Total Lists" FROM shopping_list;

