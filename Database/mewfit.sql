-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 30, 2025 at 02:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mewfit`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrator`
--

CREATE TABLE `administrator` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `email_address` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `date_registered` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `administrator`
--

INSERT INTO `administrator` (`admin_id`, `username`, `password`, `name`, `gender`, `email_address`, `phone_number`, `date_registered`) VALUES
(1, 'Default admin', 'Strong Password', 'Admin', 'male', 'Admin@gmail.com', '0129226399', '2025-01-13');

-- --------------------------------------------------------

--
-- Table structure for table `custom_diet`
--

CREATE TABLE `custom_diet` (
  `custom_diet_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `custom_diet_name` varchar(100) NOT NULL,
  `calories` int(11) NOT NULL,
  `member_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `custom_diet`
--

INSERT INTO `custom_diet` (`custom_diet_id`, `date`, `custom_diet_name`, `calories`, `member_id`) VALUES
(1, '2024-03-01', 'Caseoh special', 450, 1),
(2, '2025-02-05', 'Heart attack burger', 950, 5),
(3, '2025-03-26', 'Sweet mountain', 1130, 1),
(4, '2025-02-27', 'Spicy chicken sandwich', 600, 5),
(5, '2025-03-28', 'Taco Bell', 650, 1),
(6, '2025-03-25', 'KFC', 843, 5),
(7, '2025-03-01', 'Sushi Fest', 1235, 5),
(8, '2025-03-28', 'Matcha ice cream', 110, 5),
(9, '2025-03-30', 'KFC', 673, 5),
(10, '2025-03-30', 'Taco Bell', 420, 5),
(11, '2025-03-30', 'Xue hua piao piao', 1000, 5);

-- --------------------------------------------------------

--
-- Table structure for table `diet`
--

CREATE TABLE `diet` (
  `diet_id` int(11) NOT NULL,
  `diet_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `diet_type` varchar(20) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `preparation_min` int(11) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `directions` text DEFAULT NULL,
  `date_registered` date DEFAULT NULL,
  `nutrition_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diet`
--

INSERT INTO `diet` (`diet_id`, `diet_name`, `description`, `diet_type`, `difficulty`, `preparation_min`, `picture`, `directions`, `date_registered`, `nutrition_id`) VALUES
(1, 'Grilled Chicken Breast', 'High protein meal for building muscle and losing weight.', 'meat', 'Beginner', 25, 'meal_67e3b31e390225.16803958.jpg', 'Seasoning: Season the chicken breast with salt and pepper and let it rest for 3 minutes; Cooking: Then sear it in a pan until the internal temperature reaches 75 degree celsius;', '2025-03-23', 1),
(2, 'Beef Steak with butter', 'High protein &amp;amp;amp;amp; calorie meal for building muscle', 'meat', 'Advanced', 25, 'meal_67e3b32f428ac4.26427527.jpg', 'Season: Season the with salt and let it rest for 5 mins; Cooking: Sear the pan in a pan with high-smoke point oil with 5 min on each, put some butter and pepper in the pan and baste it, the steak should be done after internal temperature reaches 64 Celsius;', '2025-03-23', 2),
(3, 'Pork Chop with Garlic Butter', 'Flavorful pork with high protein', 'meat', 'Intermediate', 20, 'meal_67e3b343bfc7d7.97983001.jpg', 'Season: Season the pork with salt and pepper; Cooking: Cook until the internal temperature reaches 70 celsius;', '2025-03-26', 0),
(4, 'Baked Salmon with lemon', 'High protein meal for fish lovers', 'meat', 'Beginner', 15, 'meal_67e3b3667594e2.23643441.jpg', 'Season: Season the fillet with salt and pepper; Cooking: Cook the salmon skin side down in a pan with olive oil, wait until the skin is crispy and flip it and cook the other side until internal temperature reaches 65 Celsius;', '2024-12-12', 0),
(5, 'Lamb chops with herbs', 'Herbaceous lamb chops', 'meat', 'Intermediate', 35, 'meal_67e3b37c645aa7.51051116.jpg', 'Season: Rub lamb chops with salt, pepper, and chopped rosemary or thyme; Sear: Heat oil in a pan over medium-high heat. Sear chops for 3-4 minutes per side; Rest: Remove from heat, let rest for 5 minutes, then serve;', '2025-03-26', 0),
(6, 'Turkey breast stir-fry', 'A quick and flavorful turkey breast stir-fry with tender slices of turkey, crisp vegetables, and a savory sauce, perfect for a healthy and satisfying meal.', 'meat', 'Beginner', 10, 'meal_67e3b38d663b85.37586600.jpg', 'Slice: Cut turkey breast into thin strips and season with salt and pepper; Sear: Heat oil in a pan and cook turkey for 3-4 minutes until browned, then remove; Stir-fry: In the same pan, sauté garlic, bell peppers, and broccoli for 2-3 minutes; Combine: Return turkey to the pan, add soy sauce and a splash of honey, then stir well; Serve: Cook for another minute, then serve hot over rice or noodles;', '2024-05-30', 0),
(7, 'Grilled duck breast', 'A succulent grilled duck breast with crispy skin and juicy meat.', 'meat', 'Beginner', 25, 'meal_67e3b39d9d1fa9.70465635.jpg', 'Score: Lightly score the skin and season; Sear: Cook skin-side down in a cold pan over medium heat until crispy; Grill: Flip and grill for 3-5 minutes; Rest: Let rest for 5 minutes; Serve: Slice and enjoy;', '2025-03-26', 0),
(8, 'Venison steak with butter', 'A rich and tender venison steak seared to perfection and finished with buttery goodness.', 'meat', 'Intermediate', 32, 'meal_67e3b3ab9f3497.47812646.png', 'Season: Pat steak dry and season with salt and pepper; Sear: Cook in a hot pan for 2-3 minutes per side; Butter: Add butter and baste for extra flavor; Rest: Let rest for 5 minutes; Serve: Slice and enjoy;', '2025-03-26', 0),
(9, 'Bison burger (no bun)', 'A juicy, flavorful bison burger served without a bun for a lean and hearty meal.', 'meat', 'Intermediate', 20, 'meal_67e3b3bf246093.87484049.png', 'Mix: Season ground bison with salt, pepper, and spices; Form: Shape into patties; Sear: Cook in a hot pan for 3-4 minutes per side and a slice of cheese after the first flip; Rest: Let rest for 5 minutes; Serve: Enjoy with veggies or a side of choice;', '2025-03-26', 0),
(10, 'Chicken Liver Sauté', 'A rich and savory chicken liver sauté, cooked to perfection with herbs and aromatics.', 'meat', 'Intermediate', 40, 'meal_67e3b3d154b233.75763433.png', 'Prep: Rinse and pat dry the livers season with salt and pepper; Sear: Cook in hot oil for 2-3 minutes per side; Sauté: Add garlic, onions, and herbs cook until fragrant; Deglaze: Pour in wine or broth simmer briefly; Serve: Plate and enjoy warm;', '2025-03-26', 0),
(11, 'Tuna steak with lemon', 'A fresh and flavorful tuna steak, seared to perfection and finished with a zesty lemon touch.', 'meat', 'Beginner', 30, 'meal_67e3b3e757b3a2.97378361.jpg', 'Season: Rub tuna with salt, pepper, and olive oil; Sear: Cook in a hot pan for 1-2 minutes per side; Lemon: Squeeze fresh lemon juice over the steak; Rest: Let sit for a minute; Serve: Slice and enjoy;', '2025-03-26', 0),
(12, 'Ham and egg scramble', 'A simple and hearty ham and egg scramble, packed with flavor and perfect for any meal.', 'meat', 'Beginner', 5, 'meal_67e3b3fb6660c9.52757677.png', 'Prep: Dice ham and beat eggs with salt and pepper; Sauté: Cook ham in a pan until lightly browned; Cook: Pour in eggs and stir gently; Finish: Cook until eggs are soft and fluffy; Serve: Plate and enjoy;', '2024-09-26', 0),
(13, 'Smoked trout fillet', 'A delicate and flavorful smoked trout fillet, rich in taste and ready to enjoy.', 'meat', 'Intermediate', 20, 'meal_67e3b40f62bc50.49088646.jpg', 'Prep: Pat fillet dry and season lightly; Smoke: Place in a smoker at 175°F for 1-2 hours; Check: Ensure fish is tender and flaky; Rest: Let cool slightly; Serve: Enjoy as is or with sides;', '2024-06-18', 0),
(14, 'Roasted quail', 'A tender and flavorful roasted quail with crispy skin and juicy meat.', 'meat', 'Advanced', 35, 'meal_67e3b425148d55.26709843.png', 'Prep: Pat quail dry and season with salt, pepper, and herbs; Sear: Brown in a hot pan with oil; Roast: Cook in a 400°F oven for 15-20 minutes; Rest: Let sit for 5 minutes; Serve: Plate and enjoy;', '2025-03-26', 0),
(15, 'Sardines in olive oil', 'Tender and flavorful sardines preserved in rich olive oil for a simple yet delicious dish.', 'meat', 'Advanced', 12, 'meal_67e3b4362ad059.33137496.png', 'Clean: Gut and rinse the sardines; Season: Sprinkle with salt and let sit; Cook: Simmer in olive oil over low heat for 10-15 minutes; Cool: Let the sardines absorb the flavors; Serve: Enjoy with bread or salad;', '2025-03-26', 0),
(16, 'Chickpea and spinach curry', 'A hearty and flavorful chickpea and spinach curry, rich in spices and perfect for a comforting meal.', 'vegan', 'Intermediate', 30, 'meal_67e3b44d9a4dc4.34240263.png', 'Sauté: Cook onions, garlic, and ginger in oil; Spice: Add curry powder, cumin, and turmeric; Simmer: Stir in chickpeas, tomatoes, and coconut milk; Add: Mix in spinach and cook until wilted;', '2025-03-26', 0),
(17, 'Tofu stir-fry with vege', 'A quick and tasty tofu stir-fry with fresh vegetables and a savory sauce.', 'vegan', 'Beginner', 10, 'meal_67e3b45e1af8a2.92979944.png', 'Prep: Cut tofu into cubes and chop vegetables; Sear: Pan-fry tofu until golden; Stir-fry: Cook garlic and vegetables in oil; Combine: Add tofu and toss with soy sauce;', '2025-03-26', 0),
(18, 'Lentil soup', 'A hearty and nutritious lentil soup, packed with flavor and warmth.', 'vegan', 'Intermediate', 40, 'meal_67e3b4729bcb92.13558581.jpg', 'Sauté: Cook onions, garlic, and carrots in oil; Spice: Add cumin, paprika, and salt; Simmer: Stir in lentils, tomatoes, and broth; Cook: Let simmer until lentils are tender;', '2024-04-30', 0),
(19, 'Avocado and quinoa salad', 'A fresh and nutritious avocado and quinoa salad, packed with vibrant flavors.', 'vegan', 'Beginner', 5, 'meal_67e3b48a2b0618.74999596.png', 'Cook: Prepare quinoa and let it cool; Chop: Dice avocado and other vegetables; Mix: Combine all ingredients in a bowl; Dress: Toss with lemon juice and olive oil;', '2025-03-26', 0),
(20, 'Vegan mushroom stroganoff', 'A creamy and savory vegan mushroom stroganoff, full of rich flavors and hearty textures.', 'vegan', 'Intermediate', 20, 'meal_67e3b4a4cca575.18851828.jpg', 'Sauté: Cook onions and garlic in oil; Add: Stir in mushrooms and cook until soft; Simmer: Pour in vegetable broth and plant-based cream; Mix: Stir in cooked pasta and season to taste;', '2025-03-26', 0),
(21, 'Black bean and corn tacos', 'Flavorful and hearty black bean and corn tacos, packed with spices and fresh toppings.', 'vegan', 'Beginner', 25, 'meal_67e3b4b787aa31.68199650.png', 'Sauté: Cook onions and garlic in oil; Add: Stir in black beans, corn, and spices; Warm: Heat tortillas until soft; Fill: Spoon mixture into tortillas and top as desired;', '2025-03-26', 0),
(22, 'Peanut butter and banana oatmeal', 'A creamy and nutritious peanut butter and banana oatmeal, perfect for a hearty breakfast.', 'vegan', 'Beginner', 3, 'meal_67e3b4cf223417.41684234.png', 'Cook: Simmer oats in milk or water until soft; Mix: Stir in peanut butter until smooth; Add: Slice banana and mix into the oatmeal; Top: Garnish with extra banana or nuts;', '2025-03-26', 0),
(23, 'Roasted chickpea snack', 'A crunchy and flavorful roasted chickpea snack, perfect for healthy munching.', 'vegan', 'Beginner', 12, 'meal_67e3b4e4bcdaf2.17647432.png', 'Rinse: Drain and dry chickpeas; Season: Toss with oil, salt, and spices; Roast: Bake at 400°F for 25-30 minutes; Cool: Let sit for extra crunch;', '2025-03-26', 0),
(24, 'Vegan chia pudding', 'A creamy and nutritious vegan chia pudding, perfect for a healthy snack or breakfast.', 'vegan', 'Intermediate', 130, 'meal_67e3b4f8813ea1.42368046.png', 'Mix: Combine chia seeds with plant-based milk and sweetener; Stir: Let sit for 5 minutes, then stir again; Chill: Refrigerate for at least 2 hours; Top: Add fruits, nuts, or toppings of choice;', '2025-03-26', 0),
(25, 'Sweet potato and black bean bowl', 'A hearty and nutritious sweet potato and black bean bowl, packed with flavor and wholesome ingredients.', 'vegan', 'Intermediate', 20, 'meal_67e3b50f8c6b42.30785231.jpg', 'Roast: Bake 250g sweet potato cubes at 200°C until tender; Sauté: Cook 150g black beans with garlic and spices; Assemble: Layer sweet potatoes and beans in a bowl; Top: Add avocado, salsa, or toppings of choice;', '2025-03-26', 0),
(26, 'Spinach and Ricotta Stuffed Peppers', 'Flavorful bell peppers stuffed with a creamy spinach and ricotta filling, baked to perfection.', 'vegetarian', 'Beginner', 30, 'meal_67e3b52acf6fe8.55382367.png', 'Prep: Halve and deseed 2 bell peppers; Mix: Combine 200g ricotta with 100g spinach, salt, and pepper; Fill: Stuff the peppers with the ricotta mixture; Bake: Cook at 180°C for 25 minutes;', '2025-03-26', 0),
(27, 'Egg and Cheese Breakfast Muffins', 'Savory and protein-packed egg and cheese breakfast muffins, perfect for a quick meal.', 'vegetarian', 'Intermediate', 25, 'meal_67e3b53f8d85f9.05019104.png', 'Whisk: Beat 6 eggs with salt and pepper; Mix: Stir in 100g grated cheese and optional veggies; Fill: Pour into greased muffin tins; Bake: Cook at 180°C for 20 minutes;', '2025-03-26', 0),
(28, 'Paneer tikka', 'A flavorful and smoky Indian dish with marinated paneer grilled to perfection.', 'vegetarian', 'Advanced', 35, 'meal_67e3b54f472044.01001044.png', 'Mix: Combine 200g paneer cubes with yogurt, spices, and lemon juice; Marinate: Let sit for at least 30 minutes; Skewer: Thread paneer onto skewers with veggies; Grill: Cook at 200°C for 15 minutes, turning occasionally;', '2025-03-26', 0),
(29, 'Greek Salad with Feta Cheese', 'A refreshing Greek salad with crisp vegetables, briny olives, and creamy feta cheese.', 'vegetarian', 'Beginner', 5, 'meal_67e3b566e22238.59133573.png', 'Chop: Cut 2 tomatoes, 1 cucumber, and ½ red onion into chunks; Add: Mix with 50g olives and 100g feta cheese; Dress: Drizzle with olive oil, lemon juice, and oregano; Toss: Gently mix and serve;', '2025-03-26', 0),
(30, 'Mushroom and Cheese omelette', 'A fluffy and savory omelette filled with sautéed mushrooms and melted cheese.', 'vegetarian', 'Intermediate', 10, 'meal_67e3b57cf034a6.03318553.png', 'Sauté: Cook 50g sliced mushrooms in a pan; Whisk: Beat 3 eggs with salt and pepper; Cook: Pour eggs into the pan and let set; Fill: Add 50g grated cheese, fold, and serve;', '2025-03-26', 0),
(31, 'Cottage Cheese and Walnut salad', 'A fresh and crunchy salad with creamy cottage cheese and toasted walnuts.', 'vegetarian', 'Beginner', 5, 'meal_67e3b58fee9893.81461637.png', 'Chop: Cut 1 cucumber and 1 tomato into chunks; Mix: Combine with 100g cottage cheese and 50g walnuts; Dress: Drizzle with olive oil and lemon juice; Toss: Gently mix and serve;', '2025-03-26', 0),
(32, 'Zucchini and Cheese fritters', 'Crispy and savory zucchini and cheese fritters, perfect as a snack or side dish.', 'vegetarian', 'Advanced', 30, 'meal_67e3b59fa6cb98.94257974.png', 'Grate: Shred 200g zucchini and squeeze out excess water; Mix: Combine with 50g cheese, 1 egg, and 30g flour; Form: Shape into small patties; Fry: Cook in a pan until golden brown on both sides;', '2025-03-26', 0),
(33, 'Broccoli and Cheddar soup', 'A creamy and comforting broccoli and cheddar soup, rich in flavor and warmth.', 'vegetarian', 'Intermediate', 20, 'meal_67e3b5b1355e36.98193166.png', 'Sauté: Cook 1 chopped onion and 2 minced garlic cloves in butter; Simmer: Add 500ml vegetable broth and 300g broccoli cook until tender; Blend: Puree until smooth; Stir: Mix in 150g grated cheddar and let melt;', '2025-03-26', 0),
(34, 'Spinach and cheese quesadilla', 'A crispy and cheesy quesadilla filled with sautéed spinach and melted cheese.', 'vegetarian', 'Intermediate', 15, 'meal_67e3b5c429b855.90859910.png', 'Sauté: Cook 100g spinach in a pan until wilted; Assemble: Place spinach and 100g cheese on a tortilla; Cook: Fold and toast in a pan until golden; Slice: Cut into wedges and serve;', '2025-03-26', 0),
(35, 'Tomato and basil pasta', 'A simple and flavorful pasta dish with fresh tomatoes and fragrant basil.', 'vegetarian', 'Intermediate', 15, 'meal_67e3b5d44d3ef2.27068509.png', 'Cook: Boil 200g pasta until al dente; Sauté: Cook 2 minced garlic cloves in olive oil; Add: Stir in 300g chopped tomatoes and simmer; Mix: Toss in drained pasta and 10g fresh basil;', '2025-03-26', 0),
(36, 'Grilled Chicken with quinoa and vegetable', 'A healthy and balanced meal with grilled chicken, fluffy quinoa, and sautéed vegetables.', 'all', 'Intermediate', 20, 'meal_67e3b5e7c2c026.92104697.png', 'Season: Rub 200g chicken breast with salt, pepper, and spices; Grill: Cook on medium heat for 6-8 minutes per side; Cook: Boil 100g quinoa until tender; Sauté: Cook mixed vegetables in olive oil;', '2025-03-26', 0),
(37, 'Salmon with brown rice and broccoli', 'A nutritious and well-balanced meal with tender salmon, wholesome brown rice, and steamed broccoli.', 'all', 'Advanced', 30, 'meal_67e3b5fd2de007.61135413.png', 'Season: Rub 200g salmon with salt, pepper, and lemon juice; Bake: Cook at 200°C for 12-15 minutes; Cook: Boil 100g brown rice until tender; Steam: Cook 150g broccoli until soft;', '2025-03-26', 0),
(38, 'Lean beef stir-fry with vegetables', 'A high-protein, flavorful stir-fry with lean beef and crisp vegetables.', 'all', 'Intermediate', 15, 'meal_67e3b610714fa8.67053514.png', 'Slice: Cut 200g lean beef into thin strips; Sauté: Cook beef in a hot pan with oil until browned; Add: Stir in 150g mixed vegetables and cook until tender; Season: Toss with soy sauce, garlic, and ginger;', '2025-03-26', 0),
(39, 'Shrimp and avocado salad', 'A light and refreshing salad with juicy shrimp and creamy avocado.', 'all', 'Intermediate', 20, 'meal_67e3b623132a30.73053574.png', 'Cook: Sauté 150g shrimp until pink; Chop: Dice 1 avocado and 1 cucumber; Mix: Combine shrimp, avocado, and vegetables in a bowl; Dress: Drizzle with olive oil and lemon juice;', '2025-03-26', 0),
(40, 'Chicken and sweet potato bowl', 'A nutritious and satisfying bowl with tender chicken, roasted sweet potatoes, and fresh ingredients.', 'all', 'Intermediate', 15, 'meal_67e3b63ccc8d46.45637360.jpg', 'Roast: Bake 200g sweet potato cubes at 200°C until tender; Grill: Cook 200g chicken breast until golden and juicy; Assemble: Slice chicken and layer with sweet potatoes in a bowl; Top: Add greens, avocado, or dressing of choice;', '2025-03-26', 0),
(41, 'Greek yogurt with berries and nuts', 'A creamy and nutritious snack with protein-rich Greek yogurt, fresh berries, and crunchy nuts.', 'all', 'Beginner', 5, 'meal_67e3b64e5ca033.59786953.png', 'Scoop: Add 200g Greek yogurt to a bowl; Top: Add 100g mixed berries; Sprinkle: Add 30g chopped nuts; Drizzle: Finish with honey or maple syrup if desired;', '2025-03-26', 0),
(42, 'Tuna and whole wheat crackers', 'A simple and protein-packed snack with flavorful tuna and crispy whole wheat crackers.', 'all', 'Intermediate', 10, 'meal_67e3b663e0a419.54170482.png', 'Mix: Combine 150g tuna with 1 tbsp olive oil or yogurt; Season: Add salt, pepper, and optional herbs; Scoop: Place tuna mixture onto whole wheat crackers; Serve: Enjoy as a light snack or meal;', '2025-03-26', 0),
(43, 'Turkey and spinach wrap', 'A light and nutritious wrap filled with lean turkey, fresh spinach, and tasty seasonings.', 'all', 'Intermediate', 10, 'meal_67e3b676997633.45238657.png', 'Lay: Place a whole wheat tortilla on a flat surface; Fill: Add 100g sliced turkey and 50g fresh spinach; Dress: Drizzle with mustard or yogurt sauce; Wrap: Roll tightly and slice in half;', '2025-03-26', 0),
(44, 'Cottage cheese and pineapple bowl', 'A refreshing and protein-rich bowl with creamy cottage cheese and sweet pineapple.', 'all', 'Beginner', 5, 'meal_67e3b687cbb9c2.63574313.png', 'Scoop: Add cottage cheese to a bowl; Add: Top with 100g diced pineapple; Sprinkle: Optionally add nuts or seeds; Enjoy: Mix gently and serve;', '2025-03-26', 0),
(45, 'Baked cod with asparagus', 'A light and flavorful dish with tender baked cod and roasted asparagus.', 'all', 'Intermediate', 25, 'meal_67e3b6970e5530.01423864.png', 'Season: Rub 200g cod fillet with salt, pepper, and lemon juice; Bake: Cook at 200°C for 12-15 minutes; Roast: Toss 150g asparagus with olive oil and bake alongside; Serve: Plate together and enjoy;', '2025-03-26', 0),
(46, 'Egg and avocado toast', 'A simple and nutritious toast topped with creamy avocado and a perfectly cooked egg.', 'all', 'Beginner', 5, 'meal_67e3b6a957dff8.82762828.png', 'Toast: Lightly crisp a slice of whole-grain bread; Mash: Spread ½ mashed avocado on top; Cook: Fry or poach 1 egg to preference; Assemble: Place egg on avocado toast and season;', '2025-03-26', 0),
(47, 'Beef and lentil soup', 'A hearty and protein-rich soup with tender beef and nutritious lentils.', 'all', 'Advanced', 30, 'meal_67e3b6b918d3b6.94361145.png', 'Sauté: Cook 1 chopped onion and 2 minced garlic cloves in oil; Brown: Add 200g diced beef and sear; Simmer: Stir in 100g lentils, 500ml broth, and spices; Cook: Let simmer until beef and lentils are tender;', '2025-03-26', 0),
(48, 'Chicken and brown rice bowl', 'A balanced and nutritious bowl with lean chicken, wholesome brown rice, and fresh ingredients.', 'all', 'Advanced', 35, 'meal_67e3b6c85f9822.66504914.png', 'Cook: Boil 100g brown rice until tender; Grill: Season and cook 200g chicken breast until golden; Slice: Cut chicken into strips; Assemble: Layer rice, chicken, and optional veggies in a bowl;', '2025-03-26', 0),
(49, 'Tofu and stir-fried vegetables', 'A flavorful and healthy dish with crispy tofu and stir-fried vegetables in a savory sauce.', 'all', 'Intermediate', 20, 'meal_67e3b6d5a9d450.79372267.png', 'Cube: Cut 200g tofu into bite-sized pieces; Sear: Pan-fry tofu until golden brown; Stir-fry: Cook 150g mixed vegetables in oil; Combine: Add tofu and toss with soy sauce and spices;', '2025-03-26', 0),
(50, 'Oatmeal with peanut butter and banana', 'A creamy and energy-boosting oatmeal with peanut butter and sweet banana.', 'all', 'Beginner', 5, 'meal_67e3b6e47a5495.34007809.png', 'Cook: Simmer 50g oats in 250ml milk or water; Stir: Mix in 1 tbsp peanut butter until smooth; Slice: Add 1 sliced banana on top; Finish: Sprinkle with cinnamon or nuts if desired;', '2025-03-26', 0);

-- --------------------------------------------------------

--
-- Table structure for table `diet_history`
--

CREATE TABLE `diet_history` (
  `diet_history_id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `member_id` int(11) NOT NULL,
  `diet_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diet_history`
--

INSERT INTO `diet_history` (`diet_history_id`, `date`, `member_id`, `diet_id`) VALUES
(2, '2025-03-26', 1, 2),
(3, '2025-02-22', 1, 1),
(4, '2024-01-16', 2, 37),
(5, '2025-03-26', 1, 1),
(6, '2024-01-12', 5, 50),
(7, '2025-03-28', 5, 15),
(8, '2025-03-28', 5, 9),
(9, '2024-11-25', 1, 35),
(10, '2024-03-18', 5, 14),
(11, '2024-02-29', 13, 37),
(12, '2024-09-11', 5, 24),
(13, '2024-07-28', 13, 27),
(14, '2025-03-28', 13, 36),
(15, '2024-06-30', 5, 20),
(16, '2025-03-29', 5, 33),
(17, '2025-03-29', 5, 36),
(18, '2025-03-29', 5, 21),
(19, '2024-08-15', 5, 23);

-- --------------------------------------------------------

--
-- Table structure for table `diet_nutrition`
--

CREATE TABLE `diet_nutrition` (
  `diet_id` int(11) NOT NULL,
  `nutrition_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diet_nutrition`
--

INSERT INTO `diet_nutrition` (`diet_id`, `nutrition_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 3),
(2, 4),
(2, 5),
(3, 5),
(3, 6),
(3, 24),
(4, 2),
(4, 7),
(4, 8),
(5, 2),
(5, 9),
(5, 10),
(6, 2),
(6, 24),
(6, 25),
(7, 3),
(7, 11),
(8, 5),
(8, 12),
(9, 13),
(9, 14),
(10, 5),
(10, 15),
(10, 24),
(11, 2),
(11, 8),
(11, 16),
(12, 5),
(12, 17),
(12, 18),
(13, 3),
(13, 19),
(14, 5),
(14, 20),
(15, 2),
(15, 21),
(16, 22),
(16, 23),
(16, 24),
(16, 26),
(16, 27),
(16, 28),
(17, 29),
(17, 30),
(17, 31),
(17, 32),
(17, 33),
(18, 27),
(18, 34),
(18, 35),
(18, 36),
(18, 37),
(19, 2),
(19, 38),
(19, 39),
(19, 40),
(20, 24),
(20, 27),
(20, 41),
(20, 42),
(20, 43),
(21, 39),
(21, 44),
(21, 45),
(21, 46),
(22, 47),
(22, 48),
(22, 49),
(23, 2),
(23, 22),
(23, 50),
(24, 42),
(24, 51),
(24, 52),
(25, 2),
(25, 44),
(25, 53),
(26, 2),
(26, 23),
(26, 30),
(26, 54),
(27, 14),
(27, 18),
(27, 23),
(27, 78),
(28, 2),
(28, 30),
(28, 55),
(28, 56),
(29, 2),
(29, 40),
(29, 57),
(29, 58),
(30, 5),
(30, 14),
(30, 18),
(30, 41),
(31, 2),
(31, 23),
(31, 59),
(31, 60),
(32, 2),
(32, 18),
(32, 61),
(32, 62),
(33, 5),
(33, 14),
(33, 31),
(33, 37),
(34, 2),
(34, 23),
(34, 63),
(34, 64),
(35, 2),
(35, 40),
(35, 43),
(35, 65),
(36, 1),
(36, 2),
(36, 30),
(36, 38),
(37, 7),
(37, 31),
(37, 66),
(38, 30),
(38, 32),
(38, 35),
(38, 67),
(39, 2),
(39, 39),
(39, 68),
(39, 69),
(40, 1),
(40, 2),
(40, 53),
(41, 70),
(41, 71),
(41, 72),
(42, 73),
(42, 74),
(43, 23),
(43, 25),
(43, 64),
(44, 59),
(44, 75),
(45, 2),
(45, 76),
(45, 77),
(46, 18),
(46, 39),
(46, 78),
(47, 34),
(47, 35),
(47, 36),
(47, 67),
(48, 1),
(48, 31),
(48, 66),
(49, 2),
(49, 29),
(49, 30),
(50, 47),
(50, 48),
(50, 49);

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `member_id` int(11) NOT NULL,
  `member_pic` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `email_address` varchar(180) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `height` decimal(4,1) NOT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `fitness_goal` varchar(20) NOT NULL,
  `target_weight` decimal(5,2) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `day_streak_starting_date` date DEFAULT NULL,
  `last_session_date` date DEFAULT NULL,
  `weight_registered_date` date DEFAULT NULL,
  `date_registered` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`member_id`, `member_pic`, `username`, `email_address`, `password`, `level`, `height`, `weight`, `age`, `fitness_goal`, `target_weight`, `gender`, `day_streak_starting_date`, `last_session_date`, `weight_registered_date`, `date_registered`) VALUES
(1, 'Unknown_acc-removebg.png', 'Rathalos', 'Rath@outlook.com', '$2y$10$bqJMU8oTE7MeVzY7yz/yJ.DB.63koNEBfbwKmaSN/dQ5Ayvx5m0D.', 16, 169.0, 68.00, 60, 'Lose weight', 64.00, 'male', '2025-03-26', '2025-03-29', '2025-03-23', '2025-01-23'),
(2, 'Unknown_acc-removebg.png', 'Rathian', 'Rathi@gmail.com', '$2y$10$h8xPQeY0KKlYp9nrJaQ2g.iwWy6H00X3Tw6VToL7O5.iXswAurHeW', 8, 155.0, 56.00, 24, 'Gain muscle', 57.00, 'female', '2025-03-28', '2025-03-28', '2025-03-23', '2025-03-23'),
(3, 'Unknown_acc-removebg.png', 'Zinogre', 'Zinogre@gmail.com', '$2y$10$R8o4Bef5YnI1EoVUfkPcqeR15fEWyT9jQnjwfFwdhF/Advlu5mvgW', 25, 160.0, 63.00, 42, 'Lose weight', 60.00, 'male', '2024-12-13', '2024-12-31', '2024-11-14', '2024-11-20'),
(4, 'Unknown_acc-removebg.png', 'Yian', 'Yian@gmail.com', '$2y$10$1RiSwuEEaIghSCHV8DOCYOp3h35lJXh.f7q.8uxcz5zNY6vTf0D2q', 50, 175.0, 61.00, 19, 'Lose weight', 60.00, 'female', '2025-03-11', '2025-03-23', '2025-03-23', '2025-03-23'),
(5, 'user_5_1743249394.jpg', 'Gen', 'Gen@outlook.com', '$2y$10$jUBSDy1m08hb9I5RYcJNGedQ5rZ3IiiV7NkTpAJzxELOTntPA3JpG', 22, 159.0, 63.00, 31, 'Gain muscle', 65.00, 'male', '2025-03-20', '2025-03-30', '2024-05-10', '2024-04-30'),
(6, 'Unknown_acc-removebg.png', 'Girros', 'Girros@gmail.com', '$2y$10$XAzSCjPh7fXJnueZLFPtBulIZgSghUBdTqPeT9q0NiaYmDjwYmjWO', 3, 160.0, 50.00, 55, 'Gain muscle', 52.00, 'female', '2025-03-28', '2025-03-28', '2025-03-28', '2025-03-28'),
(7, 'Unknown_acc-removebg.png', 'MewFit', 'mewfitoffical@gmail.com', '$2y$10$h34Gpcr.57BuCarzxQne9.HmiSXcKc.qQePjr.8SOEAyfiREaGz/a', 18, 190.0, 88.00, 30, 'Lose weight', 87.00, 'male', '2025-03-28', '2025-03-28', '2025-03-28', '2025-03-28'),
(8, 'Unknown_acc-removebg.png', 'Luna', 'Luna@live.com', '$2y$10$e/9JWClLIzESgf8xkFXcWe2Je8ZbOs/UGqb9DbihXtQGVWMduzcBy', 34, 168.0, 62.00, 16, 'Lose weight', 60.00, 'female', '2025-03-28', '2025-03-28', '2025-03-28', '2025-03-28'),
(9, 'Unknown_acc-removebg.png', 'Teo', 'Teostra@outlook.com', '$2y$10$w8Zj4gpvB6xUj17nvr1qh.OGqfkaQF5afWKSQPVn92IL3MixYGVMO', 49, 190.0, 80.00, 30, 'Gain muscle', 84.00, 'male', '2025-03-29', '2025-03-29', '2024-11-25', '2024-10-12'),
(10, 'Unknown_acc-removebg.png', 'Xeno', 'Xenojiva@gmail.com', '$2y$10$erldA/y99EnDIl6cZdJ3JeaZ4WnBZ7DHHfS5WdemHsLnP7q18Vf1C', 18, 174.0, 69.00, 15, 'Gain muscle', 70.00, 'female', '2025-03-28', '2025-03-28', '2025-03-20', '2025-01-31'),
(11, 'Unknown_acc-removebg.png', 'Nate', 'Nate@outlook.com', '$2y$10$qoe9Ksf07tEiRbLfOO8BTOsZRTpaDghXgdtz/h93Iu3wH5eUBkufu', 26, 168.0, 120.00, 77, 'Lose weight', 119.00, 'male', '2025-03-28', '2025-03-28', '2025-03-28', '2025-03-28'),
(12, 'Unknown_acc-removebg.png', 'Ura', 'Uragaan@gmail.com', '$2y$10$qUAlRWGQWq4P8IVxALmphOOiYbm4UjF2VkQqytcgFowexYMcen5ay', 1, 180.0, 57.00, 45, 'Gain muscle', 60.00, 'male', '2025-03-28', '2025-03-28', '2025-03-28', '2025-03-28'),
(13, 'Unknown_acc-removebg.png', 'Jagras', 'Jagras@outlook.com', '$2y$10$uvVFdCnH1UVO1f7986he7.0EP0eN0alS8G.JeMScCGQ5fmbsJHSU.', 1, 190.0, 101.00, 77, 'Lose weight', 100.00, 'female', '2025-03-28', '2025-03-29', '2025-03-28', '2025-03-28'),
(15, 'Unknown_acc-removebg.png', 'JOE', 'Lian@gmail.com', '$2y$10$tKlDrr75BvUV.h392WDrsOqhD5TP2C/J7BH9XE3E2hU6DeHDPN1AO', 1, 160.0, 60.00, 70, 'Lose weight', 56.00, 'female', '2025-03-29', '2025-03-29', '2025-03-29', '2025-03-29');

-- --------------------------------------------------------

--
-- Table structure for table `member_performance`
--

CREATE TABLE `member_performance` (
  `performance_id` int(11) NOT NULL,
  `weeks_date_mon` date DEFAULT NULL,
  `current_weight` decimal(5,2) DEFAULT NULL,
  `workout_history_count` int(3) DEFAULT NULL,
  `diet_history_count` int(3) DEFAULT NULL,
  `member_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member_performance`
--

INSERT INTO `member_performance` (`performance_id`, `weeks_date_mon`, `current_weight`, `workout_history_count`, `diet_history_count`, `member_id`) VALUES
(1, '2024-09-17', 67.00, 100, 10, 5),
(2, '2024-11-17', 67.00, 0, 5, 1),
(3, '2024-08-22', 65.00, 0, 5, 1),
(4, '2025-01-24', 58.00, 0, 1, 2),
(5, '2024-06-15', 65.00, 0, 10, 5),
(6, '2025-01-01', 58.50, 0, 0, 2),
(7, '2024-07-18', 88.00, 0, 10, 5),
(8, '2025-03-24', 65.00, 0, 7, 5),
(9, '2025-01-24', 67.00, 5, 9, 5),
(10, '2025-01-30', 67.50, 6, 10, 5),
(11, '2025-01-26', 66.00, 7, 11, 5),
(12, '2025-01-27', 66.00, 8, 12, 5),
(13, '2025-03-24', 66.00, 0, 0, 1),
(14, '2025-03-24', 99.00, 0, 3, 13),
(15, '2025-03-24', NULL, 0, 0, 9),
(17, '2025-03-30', 63.00, 8, 10, 5),
(18, '2025-03-30', 63.00, 9, 10, 5),
(19, '2025-03-30', 63.00, 10, 10, 5),
(20, '2025-03-30', 63.00, 11, 10, 5),
(21, '2025-03-30', 63.00, 12, 10, 5);

-- --------------------------------------------------------

--
-- Table structure for table `nutrition`
--

CREATE TABLE `nutrition` (
  `nutrition_id` int(11) NOT NULL,
  `nutrition_name` varchar(100) DEFAULT NULL,
  `calories` int(11) DEFAULT NULL,
  `fat` decimal(5,2) DEFAULT NULL,
  `protein` decimal(5,2) DEFAULT NULL,
  `carbohydrate` decimal(5,2) DEFAULT NULL,
  `date_registered` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nutrition`
--

INSERT INTO `nutrition` (`nutrition_id`, `nutrition_name`, `calories`, `fat`, `protein`, `carbohydrate`, `date_registered`) VALUES
(1, 'Chicken Breast (200)', 330, 7.00, 40.00, 0.00, '2024-08-20'),
(2, 'Olive Oil (14)', 120, 14.00, 0.10, 0.10, '2024-08-14'),
(3, 'Salt, pepper (1)', 1, 0.10, 0.10, 0.10, '2025-03-23'),
(4, 'Ribeye Steak (250)', 680, 55.00, 55.00, 0.00, '2025-03-23'),
(5, 'Unsalted butter (14)', 100, 12.00, 0.10, 0.10, '2025-03-23'),
(6, 'Pork Chops (200)', 520, 35.00, 45.00, 0.00, '2025-03-23'),
(7, 'Salmon fillet (200)', 400, 22.00, 42.00, 0.00, '2024-04-19'),
(8, 'Lemon juice (14)', 4, 0.10, 0.10, 1.00, '2025-03-23'),
(9, 'Lamb Chops (200)', 550, 38.00, 46.00, 0.00, '2025-03-23'),
(10, 'Rosmary, Thyme (12)', 1, 0.10, 0.10, 0.10, '2025-03-23'),
(11, 'Duck Breast (200)', 450, 34.00, 38.00, 0.10, '2025-03-23'),
(12, 'Venison Steak (200)', 360, 18.00, 44.00, 0.10, '2025-03-23'),
(13, 'Ground Bisen (200)', 480, 32.00, 44.00, 0.00, '2025-03-23'),
(14, 'Cheddar Cheese (30)', 120, 10.00, 70.00, 1.00, '2025-03-23'),
(15, 'Chicken Liver (200)', 280, 6.00, 42.00, 0.00, '2025-06-23'),
(16, 'Tuna Steak (200)', 360, 18.00, 44.00, 0.10, '2025-03-23'),
(17, 'Ham (100)', 150, 7.00, 20.00, 1.00, '2025-03-23'),
(18, 'Eggs (100)', 140, 10.00, 12.00, 1.00, '2024-01-01'),
(19, 'Trout Fillet (200)', 380, 22.00, 44.00, 0.00, '2025-03-23'),
(20, 'Quail (200)', 430, 28.00, 42.00, 0.00, '2025-03-23'),
(21, 'Sardines (200)', 420, 24.00, 44.00, 0.00, '2025-03-23'),
(22, 'Chickpeas (164)', 270, 4.00, 15.00, 45.00, '2024-07-23'),
(23, 'Spinach (30)', 7, 0.00, 1.00, 1.00, '2024-09-30'),
(24, 'Garlic (10)', 8, 0.10, 0.10, 2.00, '2025-03-23'),
(25, 'Turkey Breast (200)', 330, 7.00, 42.00, 0.10, '2025-03-23'),
(26, 'Coconut milk (360)', 200, 20.00, 2.00, 3.00, '2024-09-21'),
(27, 'Onion (300)', 30, 0.10, 1.00, 7.00, '2024-02-12'),
(28, 'Curry Powder (6)', 20, 0.10, 1.00, 4.00, '2025-03-23'),
(29, 'Firm Tofu (200)', 180, 10.00, 20.00, 4.00, '2024-07-25'),
(30, 'Bell Peppers (142)', 46, 0.10, 1.00, 9.00, '2024-04-26'),
(31, 'Broccoli (91)', 55, 0.50, 5.00, 11.00, '2025-03-23'),
(32, 'Soy sauce (15)', 10, 0.10, 2.00, 1.00, '2024-08-16'),
(33, 'Sesame Oil (14)', 120, 14.00, 0.10, 0.10, '2025-03-23'),
(34, 'Lentils (200)', 230, 1.00, 18.00, 40.00, '2025-03-23'),
(35, 'Carrots (192)', 25, 0.10, 1.00, 6.00, '2025-03-23'),
(36, 'Tomatoes (190)', 30, 0.10, 1.00, 7.00, '2025-03-23'),
(37, 'Vegetable Broth (480)', 20, 0.10, 2.00, 5.00, '2025-03-23'),
(38, 'Quinoa (270)', 110, 2.00, 4.00, 20.00, '2025-03-23'),
(39, 'Avocado (200)', 240, 22.00, 3.00, 12.00, '2024-01-24'),
(40, 'Cherry Tomatoes (225)', 15, 0.10, 1.00, 0.10, '2024-04-25'),
(41, 'Mushrooms (150)', 15, 0.10, 2.00, 3.00, '2025-03-23'),
(42, 'Almond Milk (360)', 15, 1.00, 0.50, 2.00, '2025-03-23'),
(43, 'Whole wheat pasta (160)', 175, 1.00, 7.00, 37.00, '2024-05-07'),
(44, 'Black Beans (172)', 220, 1.00, 15.00, 40.00, '2025-03-23'),
(45, 'Corn tortillas (62)', 104, 2.00, 2.00, 22.00, '2025-03-23'),
(46, 'Salsa (36)', 10, 0.10, 0.10, 2.00, '2025-03-23'),
(47, 'Rolled oats (127)', 150, 3.00, 5.00, 27.00, '2025-03-23'),
(48, 'Bananan (118)', 105, 0.10, 1.00, 27.00, '2025-03-23'),
(49, 'Peanut butter (16)', 90, 8.00, 4.00, 3.00, '2024-05-13'),
(50, 'Paprika (9)', 6, 0.10, 0.30, 1.30, '2025-03-23'),
(51, 'Chia seeds (28)', 138, 9.00, 5.00, 12.00, '2025-03-23'),
(52, 'Maple Syrup (50)', 17, 0.10, 0.10, 4.00, '2025-03-23'),
(53, 'Sweet potato (140)', 112, 0.10, 2.00, 26.00, '2025-03-23'),
(54, 'Ricotta Cheese (371)', 180, 13.00, 14.00, 6.00, '2025-03-23'),
(55, 'Paneer (150)', 200, 16.00, 14.00, 2.00, '2025-03-23'),
(56, 'Yogurt (58)', 40, 1.50, 4.00, 3.00, '2024-03-31'),
(57, 'Cucumber (52)', 8, 0.10, 0.50, 2.00, '2025-03-23'),
(58, 'Feta Cheese (28)', 100, 8.00, 5.00, 1.00, '2025-03-23'),
(59, 'Cottage Cheese (112)', 110, 5.00, 13.00, 4.00, '2025-03-23'),
(60, 'Walnuts (28)', 200, 20.00, 5.00, 4.00, '2024-12-12'),
(61, 'Zucchini (124)', 20, 0.10, 1.50, 4.00, '2025-03-23'),
(62, 'Parmesan Cheese (25)', 110, 8.00, 10.00, 1.00, '2025-03-23'),
(63, 'Mozzarella Cheese (56)', 80, 6.00, 6.00, 1.00, '2024-05-30'),
(64, 'Whole wheat tortilla (34)', 150, 3.00, 5.00, 30.00, '2025-03-23'),
(65, 'Basil (3)', 2, 0.10, 0.20, 0.50, '2025-03-23'),
(66, 'Brown Rice (85)', 109, 0.90, 2.50, 23.00, '2025-03-23'),
(67, 'Lean beef (150)', 210, 9.00, 32.00, 0.10, '2025-03-23'),
(68, 'Shrimp (100)', 99, 0.30, 24.00, 0.10, '2025-03-23'),
(69, 'Mixed greens (85)', 10, 0.10, 1.00, 2.00, '2025-03-23'),
(70, 'Greek yogurt (230)', 150, 4.00, 15.00, 9.00, '2025-03-23'),
(71, 'Blueberries (74) ', 42, 0.10, 0.50, 11.00, '2025-03-23'),
(72, 'Almonds (12)', 70, 0.10, 0.50, 2.50, '2025-03-23'),
(73, 'Canned tuna (100)', 116, 1.00, 25.00, 0.10, '2025-03-23'),
(74, 'Whole wheat crackers (15)', 100, 3.00, 3.00, 15.00, '2025-03-23'),
(75, 'PIneapple (450)', 41, 0.10, 0.50, 10.00, '2025-03-23'),
(76, 'Cod fillet (150)', 90, 0.50, 20.00, 0.10, '2025-03-23'),
(77, 'Asparagus (134)', 27, 0.10, 3.00, 5.00, '2025-03-23'),
(78, 'Whole grain bread (30)', 69, 1.00, 3.00, 12.00, '2025-03-23');

-- --------------------------------------------------------

--
-- Table structure for table `workout`
--

CREATE TABLE `workout` (
  `workout_id` int(11) NOT NULL,
  `workout_name` varchar(100) DEFAULT NULL,
  `workout_type` varchar(100) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `calories` int(11) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `long_description` text DEFAULT NULL,
  `sets` int(11) DEFAULT NULL,
  `exercise_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`exercise_checklist`)),
  `date_registered` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workout`
--

INSERT INTO `workout` (`workout_id`, `workout_name`, `workout_type`, `difficulty`, `calories`, `duration`, `image`, `description`, `long_description`, `sets`, `exercise_checklist`, `date_registered`) VALUES
(1, 'Jumpstart Cardio', 'Cardio', 'Beginner', 130, 12, './assets/workout_pics/jump.jpg', 'Simple moves to get your heart pumping.', 'This workout is perfect for beginners looking to ease into cardio exercises. It features a series of simple yet effective moves to elevate your heart rate and improve cardiovascular health.', 3, '[1, 2, 3, 4]', '2025-03-14'),
(2, 'Power HIIT Cardio', 'Cardio', 'Advanced', 220, 20, './assets/workout_pics/Power_HIIT.jpg', 'High-intensity intervals for explosive results.', 'Get ready for an intense workout that combines high-energy movements and explosive intervals to burn calories and build endurance. This session is ideal for those seeking a challenge.', 4, '[5, 6, 7, 8]', '2025-03-14'),
(3, 'Stepper Cardio Blast', 'Cardio', 'Intermediate', 180, 18, './assets/workout_pics/Stepper_cardio.jpg', 'Use a stepper for dynamic movements.', 'This intermediate workout uses a stepper to add intensity to classic cardio moves. Perfect for those wanting to improve lower-body strength while keeping their heart rate elevated.', 3, '[9, 10, 11]', '2025-03-14'),
(4, 'Punch & Burn', 'Cardio', 'Intermediate', 150, 15, './assets/workout_pics/punchnburn.jpg', 'Cardio with boxing-inspired moves.', 'Combine cardio with boxing-inspired drills to boost endurance and coordination. This intermediate workout alternates between explosive punches and lower-body movements, offering a fun way to burn calories while relieving stress.', 2, '[12, 13, 14]', '2025-03-14'),
(5, 'Low Impact Steady State', 'Cardio', 'Beginner', 160, 25, './assets/workout_pics/Low_Impact.jpg', 'Gentle cardio for joint-friendly sweating.', 'A joint-friendly cardio session designed for beginners or active recovery days. The steady-paced movements keep your heart rate in a fat-burning zone without stressing joints, making it ideal for long-term consistency.', 1, '[15, 16, 17]', '2025-03-14'),
(6, 'Full-Body Cardio Fusion', 'Cardio', 'Intermediate', 200, 20, './assets/workout_pics/Full_Body.jpg', 'Mix of jumps and agility drills.', 'This intermediate routine blends agility drills, jumps, and sprints to challenge your entire body. Improve speed, coordination, and cardiovascular health with movements inspired by athletic training.', 3, '[18, 19, 20]', '2025-03-14'),
(7, 'Step-Up Challenge', 'Cardio', 'Intermediate', 140, 15, './assets/workout_pics/Step_up.jpg', 'Elevate your heart rate with step-ups.', 'Elevate your fitness (literally!) with step-ups and plyometric variations. This intermediate workout builds lower-body power and endurance while keeping your heart rate soaring.', 4, '[21, 22, 23]', '2025-03-14'),
(8, 'Dance Cardio Groove', 'Cardio', 'Beginner', 180, 20, './assets/workout_pics/Dance_cardio.jpg', 'Fun moves to keep you moving.', 'Shake off the stress with upbeat, dance-inspired moves. Perfect for beginners, this workout makes cardio feel like a party while improving rhythm and coordination.', 1, '[24, 25, 26]', '2025-03-14'),
(9, 'HIIT & Core Combo', 'Cardio', 'Advanced', 240, 25, './assets/workout_pics/HIIT&Core.jpg', 'Blast fat while engaging your core.', 'An advanced session that pairs heart-pounding HIIT with core-centric exercises. Torch calories while strengthening your abs, obliques, and stability muscles for a double-duty challenge.', 4, '[27, 28, 29]', '2025-03-14'),
(10, 'Quick Morning Cardio', 'Cardio', 'Beginner', 90, 10, './assets/workout_pics/Morning_Cardio.jpg', 'Fast routine to kickstart your day.', 'Jumpstart your day with this fast-paced, beginner-friendly routine. Simple moves like jogging and punches boost energy and metabolism without overwhelming your schedule.', 1, '[30, 31, 32]', '2025-03-14'),
(11, 'Full-Body Dumbbell Burn', 'Weighted', 'Intermediate', 250, 30, './assets/workout_pics/FullBody_Dumbbell.jpg', 'Compound lifts for total strength.', 'Push your limits with a balanced mix of compound lifts to build full-body strength and coordination. Perfect for burning calories and boosting muscle tone.', 3, '[33, 34, 35, 36]', '2025-03-14'),
(12, 'Upper Body Sculpt', 'Weighted', 'Intermediate', 200, 25, './assets/workout_pics/UpperBody_Sculpt.jpg', 'Target arms, shoulders, and back.', 'Zero in on your upper body with targeted exercises for your arms, shoulders, and back. Build strength and definition while improving posture.', 3, '[37, 38, 39, 40]', '2025-03-14'),
(13, 'Leg Day Strength', 'Weighted', 'Intermediate', 220, 25, './assets/workout_pics/LegDay_Strength.jpg', 'Build lower body power.', 'Strengthen and tone your lower body with lunges, squats, and deadlifts. This workout is all about building stability, power, and endurance.', 3, '[41, 42, 43, 44]', '2025-03-14'),
(14, 'Functional Strength', 'Weighted', 'Intermediate', 180, 20, './assets/workout_pics/Functional_Strength.jpg', 'Real-world movement patterns.', 'Move smarter with real-world functional exercises. Perfect for enhancing balance, flexibility, and overall strength in just 20 minutes.', 3, '[45, 46, 47, 48]', '2025-03-14'),
(15, 'Back & Shoulders Focus', 'Weighted', 'Advanced', 190, 25, './assets/workout_pics/Back&Shoulders_Focus.jpg', 'Strengthen posterior chain.', 'Refine your upper body with a focus on back and shoulder muscles. Improve strength, posture, and stability with controlled movements.', 3, '[49, 50, 51, 52]', '2025-03-14'),
(16, 'Stepper Strength', 'Weighted', 'Intermediate', 170, 20, './assets/workout_pics/Stepper_Strength.jpg', 'Use a stepper for resistance.', 'Incorporate a stepper for added resistance and variety. This workout is perfect for building lower body strength and cardiovascular endurance.', 3, '[53, 54, 55]', '2025-03-14'),
(17, 'Total Body Dumbbell', 'Weighted', 'Advanced', 240, 30, './assets/workout_pics/TotalBody_Dumbbell.jpg', 'Full-body endurance with weights.', 'Tackle this dynamic, advanced-level workout that combines power, endurance, and strength. A full-body challenge to test your limits.', 4, '[56, 57, 58, 59]', '2025-03-14'),
(18, 'Arm & Core Combo', 'Weighted', 'Intermediate', 160, 20, './assets/workout_pics/Arm&Core.jpg', 'Strengthen arms and abs.', 'Focus on your arms and core with a mix of targeted exercises. Tone and strengthen key muscle groups for a leaner, more defined look.', 3, '[60, 61, 62]', '2025-03-14'),
(19, 'Power Endurance', 'Weighted', 'Advanced', 210, 25, './assets/workout_pics/Power_Endurance.jpg', 'Build stamina with weights.', 'Combine strength and stamina in this high-intensity session. Perfect for building explosive power and long-lasting endurance.', 4, '[63, 64, 65, 66]', '2025-03-14'),
(20, 'Functional Mobility', 'Weighted', 'Intermediate', 150, 20, './assets/workout_pics/Funtional_Mobility.jpg', 'Improve movement quality.', 'Enhance joint range and movement patterns with rotational and overhead exercises. Ideal for intermediate lifters looking to improve workout efficiency and reduce injury risk.', 3, '[67, 68, 69]', '2025-03-14'),
(21, 'Core Crusher', 'Weight-free', 'Intermediate', 150, 20, './assets/workout_pics/Core_Crusher.jpg', 'Target abs with no equipment.', 'No equipment needed just relentless ab work. This intermediate routine uses planks, twists, and leg raises to target every inch of your core.', 3, '[70, 71, 72, 73]', '2025-03-14'),
(22, 'Low Impact Strength', 'Weight-free', 'Beginner', 160, 25, './assets/workout_pics/Low_impact.jpg', 'Gentle moves for joint health.', 'Gentle on joints but tough on muscles. Perfect for beginners, this workout uses chair-assisted moves to build foundational strength safely.', 3, '[74, 75, 76, 77]', '2025-03-14'),
(23, 'Total Body Bodyweight', 'Weight-free', 'Intermediate', 200, 30, './assets/workout_pics/Full_Body.jpg', 'No equipment, full-body focus.', 'A versatile, equipment-free routine targeting all major muscle groups. Push-ups, squats, and supermans build endurance and functional fitness.', 3, '[78, 79, 80, 81]', '2025-03-14'),
(24, 'Dynamic Core', 'Weight-free', 'Advanced', 170, 20, './assets/workout_pics/Dynamic_Core.jpg', 'Advanced ab challenges.', 'Advanced ab drills that challenge stability and control. Windshield wipers and up-down planks push your core to its limits for athletic performance.', 3, '[82, 83, 84]', '2025-03-14'),
(25, 'Lower Body Burn', 'Weight-free', 'Intermediate', 180, 25, './assets/workout_pics/Lower_Body_Burn.jpg', 'Focus on legs and glutes.', 'Fire up your legs and glutes with pulses, raises, and lunges. This intermediate workout emphasizes muscle endurance for toning and definition.', 3, '[85, 86, 87, 88]', '2025-03-14'),
(26, 'Mobility & Stability', 'Weight-free', 'Beginner', 140, 20, './assets/workout_pics/Mobility&Stability.jpg', 'Improve balance and control.', 'Improve balance and joint health with controlled bodyweight movements. Ideal for beginners or active recovery days.', 2, '[89, 90, 91]', '2025-03-14'),
(27, 'Push-Up Progression', 'Weight-free', 'Intermediate', 160, 20, './assets/workout_pics/Push-Up_Progression.jpg', 'Master push-up variations.', 'Master push-ups from knees to advanced variations. Build upper-body strength and core stability progressively.', 3, '[92, 93, 94]', '2025-03-14'),
(28, 'Functional Flexibility', 'Weight-free', 'Beginner', 150, 25, './assets/workout_pics/Functional_Flexibility.jpg', 'Enhance movement range.', 'Increase range of motion with stretches that mimic daily movements. Perfect for post-workout cooldowns or rest-day active recovery.', 2, '[95, 96, 97]', '2025-03-14'),
(29, 'Total Body Tone', 'Weight-free', 'Advanced', 220, 30, './assets/workout_pics/Total_Body_Tone.jpg', 'High-effort bodyweight moves.', 'High-intensity bodyweight moves like burpees and sprinter tucks. Advanced users will torch calories while improving agility and power.', 4, '[98, 99, 100]', '2025-03-14'),
(30, 'Balance & Coordination', 'Weight-free', 'Beginner', 130, 20, './assets/workout_pics/Balance&Coordination.jpg', 'Improve stability.', 'Beginner-friendly drills to enhance stability and body awareness. Single-leg bridges and assisted lunges build confidence in movement.', 2, '[101, 102, 103]', '2025-03-14'),
(31, 'Post-Workout Stretch', 'Yoga', 'Beginner', 60, 15, './assets/workout_pics/Post_Workout_Stretch.jpg', 'Relax and recover.', 'Gentle stretches to release muscle tension and improve flexibility after exercise. Focuses on hips, hamstrings, and lower back for recovery.', 1, '[104, 105, 106]', '2025-03-14'),
(32, 'Flexibility Flow', 'Yoga', 'Intermediate', 80, 20, './assets/workout_pics/Flexibility_Flow.jpg', 'Improve mobility and posture.', 'Dynamic stretches to improve posture and mobility. Ideal for desk workers or anyone seeking fluid, pain-free movement.', 1, '[107, 108, 109]', '2025-03-14'),
(33, 'Spine & Back Relief', 'Yoga', 'Intermediate', 70, 20, './assets/workout_pics/Spine&Back_Relief.jpg', 'Ease back stiffness.', 'Alleviate stiffness with yoga-inspired stretches for the spine and lower back. Cobra poses and twists promote spinal health.', 1, '[110, 111, 112]', '2025-03-14'),
(34, 'Neck & Shoulder Relaxation', 'Yoga', 'Beginner', 30, 10, './assets/workout_pics/Neck&Shoulder_Relaxation.jpg', 'Release upper body tension.', 'Release tension from sedentary habits or stress. Gentle stretches target tight neck, shoulders, and chest muscles.', 1, '[113, 114, 115]', '2025-03-14'),
(35, 'Morning Mobility', 'Yoga', 'Beginner', 40, 15, './assets/workout_pics/Morning_Mobility.jpg', 'Wake up your body gently.', 'Wake up your body with gentle stretches and joint circles. Prepares you for the day by improving circulation and range of motion.', 1, '[116, 117, 118]', '2025-03-14'),
(36, 'Active Stretch Flow', 'Yoga', 'Intermediate', 80, 25, './assets/workout_pics/Active_Stretch_Flow.jpg', 'Dynamic stretching for athletes.', 'Dynamic stretches for athletes or pre-workout priming. Enhances performance and reduces injury risk with movement-based flexibility.', 1, '[119, 120, 121]', '2025-03-14'),
(37, 'Evening Wind-Down', 'Yoga', 'Beginner', 40, 15, './assets/workout_pics/Evening_Wind-Down.jpg', 'Unwind before bed.', 'Calm your mind and body before bed with restorative poses. Focuses on relaxation and stress relief for better sleep quality.', 1, '[122, 123, 124]', '2025-03-14');

-- --------------------------------------------------------

--
-- Table structure for table `workout_history`
--

CREATE TABLE `workout_history` (
  `workout_history_id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `member_id` int(11) DEFAULT NULL,
  `workout_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workout_history`
--

INSERT INTO `workout_history` (`workout_history_id`, `date`, `member_id`, `workout_id`) VALUES
(3, '2024-11-17', 6, 14),
(4, '2024-12-27', 20, 35),
(7, '2024-10-03', 6, 15),
(8, '2024-10-20', 15, 31),
(9, '2025-01-17', 11, 15),
(10, '2025-02-09', 11, 32),
(11, '2025-01-19', 17, 33),
(13, '2024-11-10', 5, 35),
(14, '2024-12-12', 13, 35),
(16, '2024-12-09', 9, 37),
(19, '2024-11-03', 8, 18),
(20, '2025-01-31', 8, 21),
(22, '2024-10-26', 5, 18),
(39, '2024-10-07', 8, 8),
(44, '2025-02-10', 19, 6),
(46, '2025-02-08', 15, 3),
(50, '2024-10-01', 7, 1),
(52, '2024-11-11', 13, 5),
(53, '2025-01-27', 9, 10),
(54, '2025-02-06', 7, 5),
(55, '2025-02-27', 12, 37),
(56, '2025-01-20', 18, 12),
(57, '2025-01-15', 15, 14),
(58, '2025-02-05', 18, 19),
(59, '2024-10-02', 13, 11),
(60, '2024-10-16', 8, 9),
(61, '2025-02-25', 20, 17),
(62, '2025-02-13', 4, 9),
(63, '2024-11-07', 2, 28),
(64, '2025-01-12', 13, 4),
(65, '2024-09-11', 9, 35),
(66, '2024-11-09', 15, 13),
(67, '2024-10-01', 12, 4),
(68, '2025-01-14', 18, 10),
(69, '2024-10-26', 6, 5),
(70, '2025-01-27', 10, 13),
(71, '2024-10-17', 1, 37),
(72, '2025-02-15', 1, 17),
(73, '2025-03-05', 13, 20),
(74, '2025-02-05', 17, 15),
(75, '2025-03-06', 19, 12),
(76, '2025-02-16', 17, 17),
(77, '2024-11-30', 7, 19),
(78, '2024-11-21', 5, 9),
(79, '2024-12-05', 5, 23),
(80, '2025-01-15', 13, 8),
(81, '2024-10-09', 3, 26),
(82, '2024-10-20', 17, 16),
(83, '2025-01-03', 10, 7),
(84, '2025-02-08', 17, 14),
(85, '2024-09-10', 18, 7),
(87, '2024-12-02', 19, 25),
(88, '2024-12-12', 5, 14),
(89, '2024-11-16', 3, 18),
(90, '2024-10-01', 16, 7),
(91, '2025-01-16', 9, 5),
(92, '2024-09-22', 19, 16),
(93, '2025-02-01', 12, 8),
(94, '2025-01-28', 18, 36),
(95, '2025-01-28', 15, 2),
(96, '2025-02-10', 10, 20),
(97, '2024-12-23', 4, 12),
(98, '2024-12-25', 6, 4),
(99, '2025-03-03', 13, 1),
(100, '2025-01-22', 4, 3),
(128, '2024-12-13', 13, 19),
(130, '2024-12-31', 20, 8),
(131, '2025-01-17', 6, 16),
(132, '2024-04-21', 5, 18),
(133, '2024-09-23', 4, 5),
(134, '2024-10-19', 9, 5),
(135, '2025-01-14', 13, 11),
(136, '2025-01-19', 15, 25),
(137, '2024-10-09', 3, 18),
(138, '2025-01-30', 19, 1),
(139, '2024-06-17', 7, 17),
(140, '2024-03-29', 18, 4),
(141, '2024-06-08', 16, 1),
(142, '2025-02-01', 9, 8),
(143, '2024-11-16', 7, 10),
(144, '2024-07-04', 6, 9),
(145, '2024-07-01', 6, 36),
(146, '2024-11-17', 20, 14),
(147, '2024-08-09', 4, 11),
(148, '2024-04-06', 18, 26),
(150, '2024-10-20', 18, 23),
(151, '2024-04-07', 16, 28),
(152, '2024-05-07', 15, 34),
(153, '2024-05-30', 19, 20),
(154, '2025-02-22', 20, 30),
(155, '2024-04-11', 10, 29),
(157, '2024-12-23', 10, 20),
(159, '2024-07-08', 1, 25),
(166, '2024-11-04', 3, 33),
(168, '2024-07-26', 4, 35),
(177, '2024-12-05', 5, 30),
(220, '2024-07-03', 20, 20),
(225, '2024-11-18', 4, 32),
(226, '2024-11-02', 16, 31),
(228, '2025-03-05', 7, 30),
(229, '2024-01-01', 13, 21),
(230, '2025-03-30', 5, 0),
(231, '2025-03-30', 5, 0),
(232, '2025-03-30', 5, 0),
(233, '2025-03-30', 5, 0),
(234, '2025-03-30', 5, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrator`
--
ALTER TABLE `administrator`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`,`email_address`,`phone_number`);

--
-- Indexes for table `custom_diet`
--
ALTER TABLE `custom_diet`
  ADD PRIMARY KEY (`custom_diet_id`),
  ADD KEY `fk_member_id` (`member_id`);

--
-- Indexes for table `diet`
--
ALTER TABLE `diet`
  ADD PRIMARY KEY (`diet_id`),
  ADD UNIQUE KEY `diet_name` (`diet_name`),
  ADD KEY `nutrition_id` (`nutrition_id`);

--
-- Indexes for table `diet_history`
--
ALTER TABLE `diet_history`
  ADD PRIMARY KEY (`diet_history_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `meal_id` (`diet_id`);

--
-- Indexes for table `diet_nutrition`
--
ALTER TABLE `diet_nutrition`
  ADD PRIMARY KEY (`diet_id`,`nutrition_id`),
  ADD KEY `nutrition_id` (`nutrition_id`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email_address` (`email_address`);

--
-- Indexes for table `member_performance`
--
ALTER TABLE `member_performance`
  ADD PRIMARY KEY (`performance_id`),
  ADD KEY `member_id` (`member_id`) USING BTREE;

--
-- Indexes for table `nutrition`
--
ALTER TABLE `nutrition`
  ADD PRIMARY KEY (`nutrition_id`),
  ADD UNIQUE KEY `nutrition_name` (`nutrition_name`);

--
-- Indexes for table `workout`
--
ALTER TABLE `workout`
  ADD PRIMARY KEY (`workout_id`),
  ADD UNIQUE KEY `workout_name` (`workout_name`);

--
-- Indexes for table `workout_history`
--
ALTER TABLE `workout_history`
  ADD PRIMARY KEY (`workout_history_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `workout_id` (`workout_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `administrator`
--
ALTER TABLE `administrator`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `custom_diet`
--
ALTER TABLE `custom_diet`
  MODIFY `custom_diet_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `diet`
--
ALTER TABLE `diet`
  MODIFY `diet_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `diet_history`
--
ALTER TABLE `diet_history`
  MODIFY `diet_history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `member`
--
ALTER TABLE `member`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `member_performance`
--
ALTER TABLE `member_performance`
  MODIFY `performance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `nutrition`
--
ALTER TABLE `nutrition`
  MODIFY `nutrition_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `workout`
--
ALTER TABLE `workout`
  MODIFY `workout_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `workout_history`
--
ALTER TABLE `workout_history`
  MODIFY `workout_history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=235;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `custom_diet`
--
ALTER TABLE `custom_diet`
  ADD CONSTRAINT `fk_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`);

--
-- Constraints for table `diet_history`
--
ALTER TABLE `diet_history`
  ADD CONSTRAINT `diet_history_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  ADD CONSTRAINT `diet_history_ibfk_2` FOREIGN KEY (`diet_id`) REFERENCES `diet` (`diet_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
