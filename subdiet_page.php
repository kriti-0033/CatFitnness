<?php
session_start();
include "conn.php";

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

$diet_name = "Recipe Not Found"; 
$member_id = $_SESSION['member id'];
$sqlMember = "SELECT email_address FROM member WHERE member_id = ?";
$stmtMember = $dbConn->prepare($sqlMember);
$stmtMember->bind_param("i", $member_id);
$stmtMember->execute();
$resultMember = $stmtMember->get_result();
$member = $resultMember->fetch_assoc();
$email_address = $member['email_address'];

$diet_id = isset($_GET['diet_id']) ? intval($_GET['diet_id']) : 0;

// get diet
$sql = "SELECT 
            d.diet_id, d.diet_name, d.description, d.diet_type, d.difficulty, 
            d.preparation_min, d.picture, d.directions,
            SUM(n.calories) AS total_calories,
            SUM(n.fat) AS total_fat,
            SUM(n.protein) AS total_protein,
            SUM(n.carbohydrate) AS total_carbohydrate
        FROM diet d
        LEFT JOIN `diet_nutrition` dn ON d.diet_id = dn.diet_id
        LEFT JOIN nutrition n ON dn.nutrition_id = n.nutrition_id
        WHERE d.diet_id = ?
        GROUP BY d.diet_id";

$stmt = $dbConn->prepare($sql);
$stmt->bind_param("i", $diet_id);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    $diet_id = $row['diet_id'];
    $diet_name = $row['diet_name'];
    $description = $row['description'];
    $diet_type = $row['diet_type'];
    $difficulty = $row['difficulty'];
    $preparation_min = $row['preparation_min'];
    $picture = $row['picture'];
    $directions = $row['directions'];
    $total_calories = $row['total_calories'];
    $total_fat = $row['total_fat'];
    $total_protein = $row['total_protein'];
    $total_carbohydrate = $row['total_carbohydrate'];
}

$stmt->close();

// get ingredients
$sql = "SELECT n.nutrition_id, n.nutrition_name, n.calories, n.fat, n.protein, n.carbohydrate 
        FROM nutrition n
        JOIN `diet_nutrition` dn ON n.nutrition_id = dn.nutrition_id
        WHERE dn.diet_id = ?";

$stmt = $dbConn->prepare($sql);
$stmt->bind_param("i", $diet_id);
$stmt->execute();
$result = $stmt->get_result();

$ingredients = [];
while ($row = $result->fetch_assoc()) {
    preg_match('/(.*)\s\(([^)]+)\)$/', $row['nutrition_name'], $matches);

    $ingredient_name = isset($matches[1]) ? trim($matches[1]) : $row['nutrition_name'];
    $weight = isset($matches[2]) ? trim($matches[2]) : '';

    $ingredients[] = [
        'nutrition_id' => $row['nutrition_id'],
        'name' => $ingredient_name,
        'weight' => $weight,
        'calories' => $row['calories'],
        'fat' => $row['fat'],
        'protein' => $row['protein'],
        'carbs' => $row['carbohydrate']
    ];
}
$stmt->close();

//get other recipes
$sql = "SELECT diet_id, diet_name, picture 
        FROM diet 
        WHERE diet_type = (SELECT diet_type FROM diet WHERE diet_id = ?) 
        AND diet_id != ?
        ORDER BY RAND() 
        LIMIT 3";

$stmt = $dbConn->prepare($sql);
$stmt->bind_param("ii", $diet_id, $diet_id);
$stmt->execute();
$result = $stmt->get_result();

$other_recipes = [];
while ($row = $result->fetch_assoc()) {
    $other_recipes[] = $row;
}

$stmt->close();

//process I'll eat this
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $diet_id = isset($_POST['diet_id']) ? intval($_POST['diet_id']) : 0;
    $member_id = isset($_POST['member_id']) ? intval($_POST['member_id']) : 0;
    $current_date = date('Y-m-d');
    $modified = isset($_POST['modified']) ? ($_POST['modified'] === 'true') : false;
    $custom_calories = isset($_POST['custom_calories']) ? floatval($_POST['custom_calories']) : 0;

    if ($diet_id > 0 && $member_id > 0) {
        if ($modified) {

            // Insert into custom_diet table
            $custom_diet_name = "Custom " . $diet_name;
            $sql = "INSERT INTO custom_diet (date, custom_diet_name, calories, member_id) VALUES (?, ?, ?, ?)";
            $stmt = $dbConn->prepare($sql);
            $stmt->bind_param("ssdi", $current_date, $custom_diet_name, $custom_calories, $member_id);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Custom diet added to history!"]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        } else {
            // Insert into diet_history table
            $sql = "INSERT INTO diet_history (date, diet_id, member_id) VALUES (?, ?, ?)";
            $stmt = $dbConn->prepare($sql);
            $stmt->bind_param("sii", $current_date, $diet_id, $member_id);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Diet added to history!"]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
        $stmt->close();

        // Update the member performance (diet history count)
        $sql = "UPDATE member_performance SET diet_history_count = diet_history_count + 1 WHERE member_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $member_id);
        $stmt->execute();

        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "Invalid input"]);
    }
    exit();
}


?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MewFit</title>
    <link rel="icon" type="./assets/image/x-icon" href="./assets/icons/cat-logo-tabs.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css">
    <link rel="stylesheet" href="./css/subdiet_page.css">
    <link rel="stylesheet" href="./css/navigation_bar.css">
    <link rel="stylesheet" href="./css/gemini_chatbot.css">
    <script src="./js/navigation_bar.js"></script>
    <script src="./js/gemini_chatbot.js"></script>
    <script src="./js/subdiet_page.js"></script>
    <style>
        .other-recipes a {
            text-decoration: none !important;
            color: black !important;
            display: flex;
            align-items: center;
        }

        .other-recipes h5 {
            font-size: 20px;
            padding-left: 2vw;
            margin: auto;
            width: 50%;
            color: black !important;
            text-decoration: none !important;
        }
    </style>
    <script>
        // Store ingredient nutrition data in JavaScript
        const ingredientData = <?php echo json_encode($ingredients); ?>;
        const originalWeights = {};
        let ingredientsModified = false;
        let currentCalories = <?php echo $total_calories ?: 0; ?>;

        // Store original weights for comparison
        document.addEventListener('DOMContentLoaded', function() {
            ingredientData.forEach(ingredient => {
                originalWeights[ingredient.nutrition_id] = ingredient.weight;
            });

            // Initialize nutrition facts on page load
            updateNutrition();

            // Add event listeners to all weight inputs
            ingredientData.forEach(ingredient => {
                const inputElement = document.getElementById('weight-' + ingredient.nutrition_id);
                if (inputElement) {
                    inputElement.addEventListener('input', function() {
                        checkIfModified();
                        updateNutrition();
                    });
                }
            });
        });

        // Check if any ingredient weights have been modified
        function checkIfModified() {
            ingredientsModified = false;

            ingredientData.forEach(ingredient => {
                const inputElement = document.getElementById('weight-' + ingredient.nutrition_id);
                if (inputElement) {
                    const currentWeight = parseFloat(inputElement.value) || 0;
                    const originalWeight = parseFloat(originalWeights[ingredient.nutrition_id]) || 0;

                    // Check if the weight has changed
                    if (Math.abs(currentWeight - originalWeight) > 0.01) {
                        ingredientsModified = true;
                    }
                }
            });

            console.log("Ingredients modified:", ingredientsModified);
            return ingredientsModified;
        }

        // Function to calculate the total nutrition facts based on the current input values
        function updateNutrition() {
            let totalCalories = 0;
            let totalFat = 0;
            let totalProtein = 0;
            let totalCarbs = 0;

            // Loop through each ingredient and calculate nutrition based on weight
            ingredientData.forEach(ingredient => {
                const inputElement = document.getElementById('weight-' + ingredient.nutrition_id);
                if (inputElement) {
                    const weight = parseFloat(inputElement.value) || 0;

                    // Calculate nutrition based on the weight entered by the user
                    totalCalories += (weight / 100) * ingredient.calories;
                    totalFat += (weight / 100) * ingredient.fat;
                    totalProtein += (weight / 100) * ingredient.protein;
                    totalCarbs += (weight / 100) * ingredient.carbs;
                }
            });

            // Update the nutrition values in the HTML
            document.getElementById('calories').textContent = totalCalories.toFixed(2) + ' kcal';
            document.getElementById('fat').textContent = totalFat.toFixed(2) + ' g';
            document.getElementById('protein').textContent = totalProtein.toFixed(2) + ' g';
            document.getElementById('carbs').textContent = totalCarbs.toFixed(2) + ' g';

            // Store current calories for the custom diet
            currentCalories = totalCalories;
        }

        // I will eat this button
        function eatThis() {
            let dietId = <?php echo json_encode($diet_id); ?>;
            let memberId = <?php echo json_encode($member_id); ?>;
            let modified = checkIfModified();

            fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `diet_id=${dietId}&member_id=${memberId}&modified=${modified}&custom_calories=${currentCalories}`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert("Diet history recorded successfully!");
                        window.location.href = `diet_page.php`;
                    } else {
                        alert("Failed to log diet: " + (data.error || "Unknown error"));
                    }
                })
                .catch(error => console.error('Error:', error));
        }
    </script>
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MewFit</title>
        <link rel="icon" type="image/x-icon" href="./assets/icons/cat-logo-tabs.png">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css">
        <link rel="stylesheet" href="./css/subdiet_page.css">
        <link rel="stylesheet" href="./css/navigation_bar.css">
        <link rel="stylesheet" href="./css/gemini_chatbot.css">
        <script src="./js/navigation_bar.js"></script>
        <script src="./js/gemini_chatbot.js"></script>
        <script src="./js/subdiet_page.js"></script>
        <style>
            .other-recipes a {
                text-decoration: none !important;
                color: black !important;
                display: flex;
                align-items: center;
            }

            .other-recipes h5 {
                font-size: 20px;
                padding-left: 2vw;
                margin: auto;
                width: 50%;
                color: black !important;
                text-decoration: none !important;

            }
        </style>
    </head>

<body>
    <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
            <span class="workout-home"><a href="homepage.php">HOME</a></span>
            <span class="workout-navbar"><a href="workout_page.php">WORKOUT</a></span>
            <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo" id="nav-logo">
            <span class="workout-dietplan"><a href="#" class="active">DIET PLAN</a></span>
            <span class="workout-settings"><a href="settings_page.php">SETTINGS</a></span>
        </div>

        <div class="profile">
        <div>
          <?php
          echo "
            <img src=\"./uploads/member/{$_SESSION["member pic"]}\" alt=\"Profile\" id=\"profile-pic\">
            ";
          ?>
        </div>

        <div class="profile-dropdown" id="profile-dropdown">
          <div class="profile-info">
            <?php
            echo "
                <img src=\"./uploads/member/{$_SESSION["member pic"]}\" alt=\"Profile\" id=\"profile-pic\">
                <div>
                    <h3 style = 'padding:0px;'>{$_SESSION["username"]}</h3>
                    <p>{$email_address}</p>
                </div>
                ";
            ?>
          </div>
          <ul>
            <li><a href="settings_page.php" class="settings-profile"><i class="fas fa-cog"></i>Settings</a></li>
            <li>
              <i class="fas fa-moon"></i> Dark Mode
              <label class="switch">
                <input type="checkbox" name="dark-mode-toggle" id="dark-mode-toggle">
                <span class="slider round"></span>
              </label>
            </li>
            <li><a href="FAQ_page.html" class="help-center-profile"><i class="fas fa-question-circle"></i>Help </a></li>
            <li class="logout-profile" id="logout-profile"><i class="fas fa-sign-out-alt"></i> Logout</li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="no-select">
        <section class="section-1">
            <div style="display:flex;">
                <a onclick="goBack()" class="back-button">&lt;</a>
                <h1><?php echo $diet_name?></h1>
            </div>
            <div class="general-info">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                    <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z" />
                </svg>
                <div>
                    <h6>COOK TIME</h6>
                    <p><?php echo $preparation_min ?> min</p>
                </div>
                <div class="vertical-border"></div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                    <path fill="#272020" d="M416 0C400 0 288 32 288 176l0 112c0 35.3 28.7 64 64 64l32 0 0 128c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 0-112 0-208c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 .1S34.2 4.6 32.4 12.5L2.1 148.8C.7 155.1 0 161.5 0 167.9c0 45.9 35.1 83.6 80 87.7L80 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-224.4c44.9-4.1 80-41.8 80-87.7c0-6.4-.7-12.8-2.1-19.1L191.6 12.5c-1.8-8-9.3-13.3-17.4-12.4S160 7.8 160 16l0 134.2c0 5.4-4.4 9.8-9.8 9.8c-5.1 0-9.3-3.9-9.8-9L127.9 14.6C127.2 6.3 120.3 0 112 0s-15.2 6.3-15.9 14.6L83.7 151c-.5 5.1-4.7 9-9.8 9c-5.4 0-9.8-4.4-9.8-9.8L64 16zm48.3 152l-.3 0-.3 0 .3-.7 .3 .7z" />
                </svg>
                <div>
                    <h6>CATEGORY</h6>
                    <p><?php echo $diet_type ?></p>
                </div>
                <div class="vertical-border"></div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                    <path fill="#080707" d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z" />
                </svg>
                <div>
                    <h6>DIFFICULTY</h6>
                    <p><?php echo $difficulty ?></p>
                </div>
            </div>
        </section>
        <section class="big-section">
            <img src="./uploads/diet/<?php echo htmlspecialchars($picture); ?>" class="diet-image" alt="Diet Image">

            <div class="nutrient-box-box">
                <div class="nutrient-box">
                    <h3 style="font-size:25px;margin-bottom:1vw;">Nutrition Information</h3>
                    <div class="nutrient">
                        <h6>Calories</h6>
                        <p id="calories"><?php echo $total_calories ?> kcal</p>
                    </div>
                    <div class="nutrient">
                        <h6>Total Fat</h6>
                        <p id="fat"><?php echo $total_fat ?> g</p>
                    </div>
                    <div class="nutrient">
                        <h6>Protein</h6>
                        <p id="protein"><?php echo $total_protein ?> g</p>
                    </div>
                    <div class="nutrient">
                        <h6>Carbohydrate</h6>
                        <p id="carbs"><?php echo $total_carbohydrate ?> g</p>
                    </div>
                    <p id="nutrient-note">Consult a certified nutritionist or dietitian for personalized diet plans, accurate advice, and ongoing support to meet your unique nutritional needs effectively.</p>
                </div>
                <div class="eat-button" onclick="eatThis()">
                    <p>I'll eat this!</p>
                </div>
            </div>

            <section class="description">
                <?php echo $description ?>
            </section>

            <div class="section-3">
                <h2>INGREDIENTS</h2>
                <div class="ingredient">
                    <div>
                        <ul id="checklist">
                            <?php foreach ($ingredients as $ingredient): ?>
                                <li>
                                    <label>
                                        <input type="checkbox" id="item<?php echo $ingredient['nutrition_id']; ?>">
                                        <span class="custom-checkbox"></span>
                                        <span>
                                            <input type="number" class="custom-input" id="weight-<?php echo $ingredient['nutrition_id']; ?>"
                                                value="<?php echo htmlspecialchars($ingredient['weight']); ?>"> g
                                            <?php echo htmlspecialchars($ingredient['name']); ?>
                                        </span>
                                    </label>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section-3a">
                <h2>OTHER RECIPES</h2>
                <?php foreach ($other_recipes as $recipe): ?>
                    <div class="other-recipes">
                        <a href="subdiet_page.php?diet_id=<?php echo $recipe['diet_id']; ?>">
                            <img src="./uploads/diet/<?php echo htmlspecialchars($recipe['picture']); ?>" alt="<?php echo htmlspecialchars($recipe['diet_name']); ?>">
                            <h5><?php echo htmlspecialchars($recipe['diet_name']); ?></h5>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php
            $direction_list = explode(";", trim($directions));
            ?>

            <section class="section-4">
                <h2>DIRECTION</h2>
                <ol id="direction">
                    <?php foreach ($direction_list as $step): ?>
                        <?php
                        // Ignore empty values (in case the last ";" creates an empty entry)
                        if (trim($step) == "") continue;

                        // Split main direction & details by `,`
                        $parts = explode(":", $step, 2);
                        $main = trim($parts[0]);  // Main direction
                        $details = isset($parts[1]) ? trim($parts[1]) : "";  // Details (if exists)
                        ?>
                        <li>
                            <?php echo htmlspecialchars($main); ?>
                            <?php if (!empty($details)): ?>
                                <p><?php echo htmlspecialchars($details); ?></p>
                            <?php endif; ?>
                        </li>
                    <?php endforeach; ?>
                </ol>
            </section>

            <div class="section-5">
                <h2>OTHER RECIPES</h2>
                <?php foreach ($other_recipes as $recipe): ?>
                    <div class="other-recipes">
                        <a href="subdiet_page.php?diet_id=<?php echo $recipe['diet_id']; ?>">
                            <img src="./uploads/diet/<?php echo htmlspecialchars($recipe['picture']); ?>" alt="<?php echo htmlspecialchars($recipe['diet_name']); ?>">
                            <h5><?php echo htmlspecialchars($recipe['diet_name']); ?></h5>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>
    </div>

    <div class="chatbot-container">
        <div class="chatbot-header">
            <div class="chatbot-header-left">
                <img src="./assets/icons/cat-logo-tabs.png">
                <h3>MEWAI</h3>
            </div>
            <button class="close-chat">&times;</button>
        </div>
        <div class="chatbot-transparent-top-down"></div>
        <div class="chatbot-messages"></div>
        <div class="chatbot-input">
            <input type="text" placeholder="Ask me about fitness...">
            <button class="send-btn"><i class="fas fa-paper-plane"></i></button>
        </div>
    </div>
    <button class="chatbot-toggle">
        <img class="chatbot-img" src="./assets/icons/cat-logo-tabs.png">
    </button>
    
</body>

</html>