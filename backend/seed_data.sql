-- Insert articles for each department
INSERT INTO article (name, department_id) VALUES
  -- Vegetables (Gemüse)
  ('Carrots', 4),
  ('Broccoli', 4),
  ('Spinach', 4),
  ('Tomatoes', 4),
  ('Potatoes', 4),
  ('Onions', 4),
  ('Garlic', 4),
  ('Bell Peppers', 4),
  ('Cucumbers', 4),
  ('Lettuce', 4),

  -- Fruits
  ('Apples', 5),
  ('Bananas', 5),
  ('Oranges', 5),
  ('Strawberries', 5),
  ('Blueberries', 5),
  ('Grapes', 5),
  ('Watermelon', 5),
  ('Lemons', 5),
  ('Avocados', 5),
  ('Mangoes', 5),

  -- Meat & Fish
  ('Chicken Breast', 6),
  ('Ground Beef', 6),
  ('Pork Chops', 6),
  ('Salmon', 6),
  ('Tuna', 6),
  ('Shrimp', 6),
  ('Turkey', 6),
  ('Beef Steak', 6),

  -- Dairy Products
  ('Milk', 7),
  ('Butter', 7),
  ('Cheese', 7),
  ('Yogurt', 7),
  ('Sour Cream', 7),
  ('Eggs', 7),
  ('Cream', 7),

  -- Bakery
  ('Bread', 8),
  ('Rolls', 8),
  ('Croissants', 8),
  ('Bagels', 8),
  ('Muffins', 8),

  -- Beverages
  ('Water', 9),
  ('Orange Juice', 9),
  ('Apple Juice', 9),
  ('Coffee', 9),
  ('Tea', 9),
  ('Milk', 9),
  ('Cola', 9),
  ('Wine', 9),
  ('Beer', 9),

  -- Frozen Food
  ('Frozen Pizza', 10),
  ('Frozen Fries', 10),
  ('Frozen Vegetables', 10),
  ('Ice Cream', 10),
  ('Frozen Fish', 10),
  ('Frozen Chicken Nuggets', 10),

  -- Pantry
  ('Pasta', 11),
  ('Rice', 11),
  ('Bread Crumbs', 11),
  ('Olive Oil', 11),
  ('Salt', 11),
  ('Sugar', 11),
  ('Flour', 11),
  ('Canned Tomatoes', 11),
  ('Canned Beans', 11),
  ('Peanut Butter', 11),
  ('Honey', 11)
ON CONFLICT DO NOTHING;

-- Create some sample shopping lists
INSERT INTO shopping_list (name) VALUES
  ('Weekly Groceries'),
  ('Party Supplies'),
  ('Breakfast Items'),
  ('Dinner Ingredients'),
  ('Dessert Making')
ON CONFLICT DO NOTHING;

-- Add items to lists
INSERT INTO shopping_list_article (shopping_list_id, article_id, quantity) VALUES
  -- Weekly Groceries (List 1)
  (1, 11, 5),    -- Carrots
  (1, 12, 2),    -- Broccoli
  (1, 14, 3),    -- Tomatoes
  (1, 20, 2),    -- Apples
  (1, 21, 3),    -- Bananas
  (1, 31, 1),    -- Chicken Breast
  (1, 37, 1),    -- Milk
  (1, 40, 1),    -- Bread
  (1, 48, 2),    -- Water
  (1, 65, 1),    -- Pasta

  -- Party Supplies (List 2)
  (2, 15, 2),    -- Strawberries
  (2, 30, 1),    -- Lemons
  (2, 54, 3),    -- Frozen Pizza
  (2, 52, 1),    -- Cola
  (2, 60, 2),    -- Beer
  (2, 61, 2),    -- Ice Cream

  -- Breakfast Items (List 3)
  (3, 38, 1),    -- Eggs
  (3, 40, 2),    -- Bread
  (3, 41, 1),    -- Rolls
  (3, 37, 1),    -- Milk
  (3, 43, 1),    -- Coffee

  -- Dinner Ingredients (List 4)
  (4, 11, 3),    -- Carrots
  (4, 12, 2),    -- Broccoli
  (4, 14, 2),    -- Tomatoes
  (4, 31, 2),    -- Chicken Breast
  (4, 65, 2),    -- Pasta
  (4, 69, 1),    -- Olive Oil

  -- Dessert Making (List 5)
  (5, 20, 1),    -- Apples
  (5, 37, 1),    -- Eggs
  (5, 71, 1),    -- Flour
  (5, 72, 1),    -- Sugar
  (5, 75, 1)     -- Honey
ON CONFLICT DO NOTHING;

