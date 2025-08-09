-- ===============================================
-- Paradise Bakes & Cafe - Seed Data
-- ===============================================
-- This file pre-populates the database with initial
-- admin users, recipes, and equipment.
-- NOTE: All passwords here are bcrypt hashes of `pAradise1!`
--       Change immediately in production.
-- ===============================================

USE tcp_database;

-- -------------------------------
-- Seed: Admin Users
-- -------------------------------
INSERT INTO tcp_admin_users (username, email, password_hash, role)
VALUES
('tcp_shakil', 'tcp_shakil@paradisebakescafe.com', '$2b$10$VKnz.YT0SEo6gf.PmwbnLelRMT1hVZq4nYEzZVt99eqifSdY3/nr6', 'admin'),
('tcp_aslam',  'tcp_aslam@paradisebakescafe.com',  '$2b$10$VKnz.YT0SEo6gf.PmwbnLelRMT1hVZq4nYEzZVt99eqifSdY3/nr6', 'admin'),
('tcp_imran',  'tcp_imran@paradisebakescafe.com',  '$2b$10$VKnz.YT0SEo6gf.PmwbnLelRMT1hVZq4nYEzZVt99eqifSdY3/nr6', 'admin');

-- -------------------------------
-- Seed: Equipment (9 entries)
-- -------------------------------
INSERT INTO tcp_equipment (name, diagram_path, instructions_hinglish, maintenance_checklist, troubleshooting)
VALUES
('Oven', '/seed/images/placeholder-1.jpg', 'Preheat before use. Set temperature per recipe.', 'Clean trays daily; check thermostat weekly.', 'If not heating, check power & thermostat.'),
('Mixer', '/seed/images/placeholder-2.jpg', 'Load ingredients gradually.', 'Lubricate monthly; check blades weekly.', 'If noisy, check bearings.'),
('Refrigerator', '/seed/images/placeholder-1.jpg', 'Keep below 5°C.', 'Clean coils monthly; defrost when needed.', 'If warm, check door seals.'),
('Pizza Stone', '/seed/images/placeholder-2.jpg', 'Preheat stone in oven.', 'Scrape clean after use.', 'If cracked, replace.'),
('Cake Mould', '/seed/images/placeholder-1.jpg', 'Grease before batter.', 'Wash after use.', 'Replace if bent.'),
('Pastry Bag', '/seed/images/placeholder-2.jpg', 'Fill halfway for control.', 'Wash after each use.', 'Replace if torn.'),
('Sandwich Grill', '/seed/images/placeholder-1.jpg', 'Preheat before loading bread.', 'Clean plates after each use.', 'If uneven heating, check element.'),
('Rolling Pin', '/seed/images/placeholder-2.jpg', 'Flour before rolling dough.', 'Clean after use.', 'Replace if cracked.'),
('Measuring Scale', '/seed/images/placeholder-1.jpg', 'Calibrate monthly.', 'Keep clean & dry.', 'Replace if inaccurate.');

-- -------------------------------
-- Seed: Recipes (36 entries)
-- -------------------------------
-- Format: English name, type, ingredients_hinglish, steps_hindi, tips, cost, equipment, image, storage_notes, reheat_notes
INSERT INTO tcp_recipes (name_en, type, ingredients_hinglish, steps_hindi, chef_tips, cost_per_portion, equipment, image_path, storage_notes, reheat_notes)
VALUES
-- 12 Pizza
('Margherita Pizza', 'Pizza', 'Maida, Cheese, Tomato Sauce, Basil', '1. Oven garam karein. 2. Base par sauce lagayein. 3. Cheese dalein. 4. Bake karein.', 'Use fresh basil.', 120.00, 'Oven, Pizza Stone', '/seed/images/placeholder-1.jpg', 'Store in airtight box 1 day.', 'Reheat in oven 5 min.'),
('Farmhouse Pizza', 'Pizza', 'Maida, Cheese, Capsicum, Onion, Tomato', '1. Sabzi slice karein. 2. Base par sauce lagayein. 3. Sabzi aur cheese dalein.', 'Do not overload toppings.', 150.00, 'Oven, Pizza Stone', '/seed/images/placeholder-2.jpg', 'Store in fridge 1 day.', 'Reheat in oven 5 min.'),
('Peppy Paneer Pizza', 'Pizza', 'Paneer, Maida, Cheese, Sauce', '1. Paneer cubes banayein. 2. Base par sauce lagayein. 3. Paneer aur cheese dalein.', 'Marinate paneer for flavor.', 160.00, 'Oven', '/seed/images/placeholder-1.jpg', 'Store in fridge.', 'Reheat oven.'),
('Mexican Green Wave Pizza', 'Pizza', 'Maida, Cheese, Jalapeno, Capsicum', '1. Jalapeno slice karein. 2. Base par sauce lagayein.', 'Use mild jalapenos.', 170.00, 'Oven', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Oven reheat.'),
('Deluxe Veggie Pizza', 'Pizza', 'Cheese, Maida, Mixed Veg', '1. Base ready karein. 2. Toppings dalein.', 'Balance cheese & veg.', 175.00, 'Oven', '/seed/images/placeholder-1.jpg', 'Store airtight.', 'Reheat oven.'),
('Veggie Paradise Pizza', 'Pizza', 'Maida, Cheese, Corn, Capsicum', '1. Corn boil karein. 2. Base par sauce lagayein.', 'Sweet corn adds crunch.', 160.00, 'Oven', '/seed/images/placeholder-2.jpg', 'Store fridge.', 'Oven reheat.'),
('Paneer Makhani Pizza', 'Pizza', 'Paneer, Makhani Sauce, Cheese', '1. Sauce banayein. 2. Base par lagayein.', 'Use soft paneer.', 180.00, 'Oven', '/seed/images/placeholder-1.jpg', 'Airtight store.', 'Reheat oven.'),
('Cheese N Corn Pizza', 'Pizza', 'Cheese, Corn, Maida', '1. Corn boil karein. 2. Base par cheese dalein.', 'Extra cheese = better.', 155.00, 'Oven', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Oven reheat.'),
('Veg Supreme Pizza', 'Pizza', 'Mixed Veg, Cheese, Sauce', '1. Veg cut karein. 2. Base decorate karein.', 'Balance toppings.', 170.00, 'Oven', '/seed/images/placeholder-1.jpg', 'Store fridge.', 'Reheat oven.'),
('Double Cheese Pizza', 'Pizza', 'Cheese, Maida, Sauce', '1. Double cheese layer karein.', 'Cheddar + Mozzarella.', 180.00, 'Oven', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Oven reheat.'),
('Tandoori Paneer Pizza', 'Pizza', 'Paneer, Tandoori Masala, Cheese', '1. Paneer marinate karein.', 'Use smoky flavor.', 190.00, 'Oven', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Oven reheat.'),
('Italian Delight Pizza', 'Pizza', 'Olives, Cheese, Sauce', '1. Olives slice karein.', 'Use black & green olives.', 200.00, 'Oven', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Oven reheat.'),

-- 12 Burger
('Veggie Burger', 'Burger', 'Bun, Patty, Lettuce, Mayo', '1. Patty fry karein.', 'Crispy patty best.', 80.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Store fridge.', 'Reheat grill.'),
('Paneer Burger', 'Burger', 'Bun, Paneer Patty, Sauce', '1. Paneer patty fry karein.', 'Use soft paneer.', 90.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Cheese Burger', 'Burger', 'Bun, Cheese Slice, Patty', '1. Patty grill karein.', 'Melt cheese.', 85.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Spicy Veg Burger', 'Burger', 'Bun, Spicy Patty, Sauce', '1. Spicy patty fry karein.', 'Serve with cold drink.', 88.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Aloo Tikki Burger', 'Burger', 'Bun, Aloo Tikki, Sauce', '1. Tikki fry karein.', 'Crispy tikki.', 75.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Mushroom Burger', 'Burger', 'Bun, Mushroom Patty, Cheese', '1. Patty grill karein.', 'Use fresh mushrooms.', 95.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Corn Cheese Burger', 'Burger', 'Bun, Corn Patty, Cheese', '1. Patty fry karein.', 'Sweet corn adds flavor.', 90.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('BBQ Veg Burger', 'Burger', 'Bun, BBQ Patty, Sauce', '1. BBQ patty grill karein.', 'Use smoky BBQ sauce.', 100.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Deluxe Veg Burger', 'Burger', 'Bun, Deluxe Patty, Cheese', '1. Patty grill karein.', 'Melt cheese well.', 110.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Paneer Tikka Burger', 'Burger', 'Bun, Paneer Tikka, Sauce', '1. Paneer grill karein.', 'Use tandoor grill.', 120.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Italian Burger', 'Burger', 'Bun, Olives, Patty', '1. Olives slice karein.', 'Add Italian herbs.', 115.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Veg Supreme Burger', 'Burger', 'Bun, Supreme Patty, Cheese', '1. Patty fry karein.', 'Extra cheese.', 130.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),

-- 12 Sandwich
('Veg Sandwich', 'Sandwich', 'Bread, Veggies, Butter', '1. Veg slice karein.', 'Serve fresh.', 50.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Paneer Sandwich', 'Sandwich', 'Bread, Paneer, Butter', '1. Paneer cut karein.', 'Use fresh paneer.', 60.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Cheese Sandwich', 'Sandwich', 'Bread, Cheese, Butter', '1. Cheese grate karein.', 'Melt cheese.', 55.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Corn Sandwich', 'Sandwich', 'Bread, Corn, Mayo', '1. Corn boil karein.', 'Sweet corn adds crunch.', 65.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Club Sandwich', 'Sandwich', 'Bread, Veggies, Cheese', '1. Multi-layer karein.', 'Serve with fries.', 75.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Grilled Veg Sandwich', 'Sandwich', 'Bread, Veggies, Butter', '1. Grill karein.', 'Use fresh veggies.', 70.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Paneer Tikka Sandwich', 'Sandwich', 'Bread, Paneer Tikka', '1. Paneer grill karein.', 'Add mint chutney.', 80.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Italian Sandwich', 'Sandwich', 'Bread, Olives, Veggies', '1. Olives slice karein.', 'Add herbs.', 85.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('Cheese Chilli Sandwich', 'Sandwich', 'Bread, Cheese, Chilli', '1. Chilli chop karein.', 'Adjust spice.', 75.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Veg Mayo Sandwich', 'Sandwich', 'Bread, Veggies, Mayo', '1. Mayo spread karein.', 'Serve cold.', 65.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.'),
('BBQ Paneer Sandwich', 'Sandwich', 'Bread, BBQ Paneer', '1. Paneer grill karein.', 'Use BBQ sauce.', 90.00, 'Grill', '/seed/images/placeholder-1.jpg', 'Fridge store.', 'Reheat grill.'),
('Supreme Sandwich', 'Sandwich', 'Bread, Supreme Filling', '1. Assemble karein.', 'Serve hot.', 95.00, 'Grill', '/seed/images/placeholder-2.jpg', 'Fridge store.', 'Reheat grill.');

