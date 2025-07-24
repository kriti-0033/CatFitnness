<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mewfit Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
    <link rel="icon" type="./assets/image/x-icon" href="./assets/icons/cat-logo-tabs.png">
    <link rel="stylesheet" href="./css/admin_diet.css">
    <link rel="stylesheet" href="./css/navigation_bar.css">
    <script src="js/navigation_bar.js"></script>
    <script src="js/data_validation.js"></script>
</head>

<!-- ---------------------------------INSERT NUTRITION TO TABLE------------------------ -->
<?php
include "conn.php";
session_start();
if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = $_POST['nutrition-name'] ?? '';
    $calories = $_POST['calories'] ?? 0;
    $fat = $_POST['fat'] ?? 0;
    $protein = $_POST['protein'] ?? 0;
    $carbohydrate = $_POST['carb'] ?? 0;

    $insertStmt = $dbConn->prepare("INSERT INTO nutrition (nutrition_name, calories, fat, protein, carbohydrate, date_registered) VALUES (?, ?, ?, ?, ?, CURDATE())");
    $insertStmt->bind_param("sdddd", $name, $calories, $fat, $protein, $carbohydrate);

    if ($insertStmt->execute()) {
        header("Location: admin_diet.php#nutrition");
        exit();
    } else {
        echo "Error adding nutrition data: " . $dbConn->error;
    }
}
?>

<body>
    <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
            <img src="./assets/icons/mewfit-admin-logo.svg" alt="logo" class="nav-logo" id="nav-logo">
            <span class="admin-dashboard"><a href="admin_homepage.php">DASHBOARD</a></span>
            <span class="admin-user"><a href="admin_user_page.php">USER</a></span>
            <span class="admin-workout"><a href="admin_workout.php">WORKOUT</a></span>
            <span class="admin-meals"><a href="#" class="active">MEALS</a></span>
        </div>
        <div class="header-right">
            <button id="hamburger-menu" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
        <image src="./assets/icons/admin_logout.svg" class="logout-profile" id="logout-profile"></image>
    </nav>

    <div id="heading">
        <h2 class="title"> MEAL <span>PROFILE</span></h2>
        <ul class="meal-section">
            <li><a href="#diet" class="diet-link">DIET</a></li>
            <li><a href="#nutrition" class="nutrition-link">NUTRITION</a></li>
        </ul>
    </div>

    <div class="content">
        <div class="diet-container">
            <div class="section1">
                <input type="text" class="search-bar" placeholder="Search Diet Name..">
                <div class="box">
                    <table>
                        <tr>
                            <th>Diet ID</th>
                            <th>Diet Name</th>
                            <th>Diet Type</th>
                            <th>Nutrition IDs</th>
                            <th>Preparation Time (Min)</th>
                            <th>Difficulty</th>
                            <th>Picture</th>
                            <th>Description</th>
                            <th>Directions</th>
                            <th>Registration Date</th>

                        </tr>
                        <?php
                        include "conn.php";

                        $sql = "
                        SELECT d.diet_id, d.diet_name, d.description, d.diet_type, d.preparation_min, d.difficulty ,d.picture, d.directions, d.date_registered,                            
                        GROUP_CONCAT(n.nutrition_id) AS nutrition_ids
                        FROM diet d
                        LEFT JOIN diet_nutrition n ON d.diet_id = n.diet_id
                        GROUP BY d.diet_id
                    ";
                        $result = mysqli_query($dbConn, $sql);

                        if (mysqli_num_rows($result) > 0) {
                            while ($rows = mysqli_fetch_array($result)) {
                                echo "<tr diet-id='" . $rows['diet_id'] . "'>";
                                echo "<td>" . $rows['diet_id'] . "</td>";
                                echo "<td>" . $rows['diet_name'] . "</td>";
                                echo "<td>" . $rows['diet_type'] . "</td>";
                                echo "<td>" . (!empty($rows['nutrition_ids']) ? $rows['nutrition_ids'] : 'No nutrition IDs available') . "</td>";
                                echo "<td>" . $rows['preparation_min'] . "</td>";
                                echo "<td>" . $rows['difficulty'] . "</td>";
                                if (!empty($rows['picture'])) {
                                    echo "<td><img src='./uploads/diet/" . $rows['picture'] . "' alt='" . $rows['diet_name'] . "' width='100' loading='lazy'></td>";
                                } else {
                                    echo "<td>No image available</td>";
                                }
                                echo "<td>" . $rows['description'] . "</td>";
                                echo "<td>" . $rows['directions'] . "</td>";
                                echo "<td>" . $rows['date_registered'] . "</td>";
                                echo "</tr>";
                            }
                        } else {
                            echo "<tr class='no-data'><td colspan='8'>No data available</td></tr>";
                        }
                        ?>
                    </table>
                </div>
                <div class="table-option">
                    <button id="edit-btn" disabled>Edit</button>
                    <button id="delete-btn" disabled>Delete</button>
                </div>
            </div>

            <!--Add New Profile Form -->
            <div class="add-profile" id="dadd-profile">
                <center>
                    <h2>Add New <span>Meal</span></h2>
                </center>
                <form action="insert_admin_diet.php" method="POST" enctype="multipart/form-data">
                    <label for="diet-name">Meal Name</label>
                    <input type="text" id="meal-name" name="meal-name" oninput="checkUniqueName(this, document.getElementById('meal-name-feedback'), 'Meal Name already exists', 'diet', 'diet_name', document.getElementById('add-profile-btn'));" required>
                    <p id="meal-name-feedback" class="feedback"></p>
                    <div class="form-columns">
                        <div class="column">
                            <label for="diet-type">Meal Type</label>
                            <select id="diet-type" name="diet-type" required>
                                <option value="">Select Type</option>
                                <option value="all">All</option>
                                <option value="meat">Meat</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                            </select>
                        </div>
                        <div class="column">
                            <label for="preparation_min">Preparation Time (min)</label>
                            <input
                                type="number" id="preparation_min" name="preparation_min" oninput="checkNumber(this, document.getElementById('preparation-min-feedback'), 'Please enter a non-negative number');" required>
                            <p id="preparation-min-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="diet-difficulty">Difficulty</label>
                            <select id="diet-difficulty" name="diet-difficulty" required>
                                <option value="">Select Difficulty</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <label for="nutrition_id">Ingredients</label>
                    <div class="nutrition-select-container">
                        <div class="custom-select">
                            <div class="select-box">
                                <input type="text" class="tags_input" name="nutrition_ids" hidden value required />
                                <div class="selected-options">
                                    <span class="placeholder">Select nutrition IDs</span>
                                </div>
                            </div>
                        </div>
                        <div class="options">
                            <div class="option-search-tags">
                                <input type="text" class="search-tags" placeholder="Search nutrition IDs..." />
                            </div>
                            <div class="option all-tags" data-value="all">Select All</div>
                        </div>
                        <span class="tag_error_msg">This field is required</span>
                    </div>

                    <div class="form-columns">
                        <div class="column">
                            <label for="meal_picture">Meal Picture</label>
                            <div class="picture" onclick="document.getElementById('meal_picture').click()">
                                <p id="words">Click To Upload Meal Picture Here</p>
                                <input type="file" name="meal_picture" id="meal_picture" accept="image/*" hidden required>
                                <img id="imagePreview" src="" alt="Image Preview">
                            </div>
                        </div>
                        <div class="column">
                            <label for="desc">Description</label>
                            <textarea id="desc" name="desc" rows="4" placeholder="Describe the diet.." required></textarea>
                        </div>
                    </div>

                    <label for="directions">Directions</label>
                    <textarea id="directions" name="directions" rows="4" placeholder="Enter step-by-step following the format (Ex: Main direction: details;)" required oninput="checkDirections('directions', 'directions-feedback');"></textarea>
                    <p id="directions-feedback" class="feedback" style="color: red;"></p>

                    <div style="display:flex;justify-content: center;white-space: nowrap;">
                        <button type="submit" id="add-profile-btn" disabled>Create New</button>
                    </div>
                </form>
                <script>
                    function validateForm() {
                        const mealNameFeedback = document.getElementById('meal-name-feedback').textContent.trim();
                        const preparationMinFeedback = document.getElementById('preparation-min-feedback').textContent.trim();
                        const directionFeedback = document.getElementById('directions-feedback').textContent.trim();

                        const mealName = document.getElementById('meal-name').value.trim();
                        const dietType = document.getElementById('diet-type').value.trim();
                        const difficulty = document.getElementById('diet-difficulty').value.trim();
                        const prepTime = document.getElementById('preparation_min').value.trim();
                        const nutritionIds = document.querySelector('.tags_input').value.trim();
                        const mealPicture = document.getElementById('meal_picture').files.length > 0;
                        const description = document.getElementById('desc').value.trim();
                        const directions = document.getElementById('directions').value.trim();

                        const allFieldsFilled = mealName && dietType && prepTime && nutritionIds && mealPicture && description && directions &&difficulty;
                        const noValidationErrors = !mealNameFeedback && !preparationMinFeedback && !directionFeedback;

                        document.getElementById('add-profile-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('meal-name').addEventListener('input', validateForm);
                    document.getElementById('diet-type').addEventListener('change', validateForm);
                    document.getElementById('preparation_min').addEventListener('input', validateForm);
                    document.getElementById('diet-difficulty').addEventListener('change', validateForm);
                    document.getElementById('desc').addEventListener('input', validateForm);
                    document.getElementById('directions').addEventListener('input', validateForm);
                    document.getElementById('meal_picture').addEventListener('change', validateForm);
                </script>

            </div>
            <div class="edit-profile" id="dedit-profile" enctype="multipart/form-data">
                <center>
                    <h2>Edit <span>Diet</span></h2>
                </center>
                <form action="edit.php" method="POST" id="diet" enctype="multipart/form-data">
                    <input type="hidden" id="selectedDietId" name="selectedDietId" value="<?php echo $_GET['diet_id'] ?? ''; ?>">
                    <input type="hidden" id="table" name="table" value="diet">
                    <label for="ediet-name">Meal Name</label>
                    <input type="text" id="ediet-name" name="ediet-name"
                        oninput="checkUniqueName(this, 
                document.getElementById('ediet-name-feedback'), 
                'Meal Name already exists', 
                'diet', 
                'diet_name', 
                document.getElementById('confirm-btn'), 
                document.getElementById('selectedDietId').value);">
                    <p id="ediet-name-feedback" class="feedback"></p>

                    <div class="form-columns">
                        <div class="column">
                            <label for="ediet-type">Meal Type</label>
                            <select id="ediet-type" name="ediet-type" required>
                                <option value="">Select Type</option>
                                <option value="all">All</option>
                                <option value="meat">Meat</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                            </select>
                        </div>
                        <div class="column">
                            <label for="epreparation_min">Preparation Time (min)</label>
                            <input type="number" id="epreparation_min" name="epreparation_min" oninput="checkNumber(this, document.getElementById('epreparation-min-feedback'), 'Please enter a non-negative number');" required>
                            <p id="epreparation-min-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="ediet-difficulty">Difficulty</label>
                            <select id="ediet-difficulty" name="ediet-difficulty" required>
                                <option value="">Select Difficulty</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <label for="nutrition_id">Ingredients</label>
                    <div class="nutrition-select-container">
                        <div class="custom-select">
                            <div class="select-box">
                                <input type="text" class="tags_input" name="edietnutrition_ids" hidden value required />
                                <div class="selected-options">
                                    <span class="placeholder">Select nutrition IDs</span>
                                </div>
                            </div>
                        </div>
                        <div class="options">
                            <div class="option-search-tags">
                                <input type="text" class="search-tags" placeholder="Search nutrition IDs..." />
                            </div>
                            <div class="option all-tags" data-value="all">Select All</div>
                        </div>
                        <span class="tag_error_msg">This field is required</span>
                    </div>

                    <div class="form-columns">
                        <div class="column">
                            <label for="emeal_picture">Meal Picture</label>
                            <div class="picture" onclick="document.getElementById('emeal_picture').click()">
                                <p id="ewords">Click To Upload Meal Picture Here</p>
                                <input type="file" name="emeal_picture" id="emeal_picture" accept="image/*" style="display: none;">
                                <img id="eimagePreview" src="./uploads/diet/" alt="Image Preview">
                            </div>
                        </div>
                        <div class="column">
                            <label for="edesc">Description</label>
                            <textarea id="edesc" name="edesc" rows="7" placeholder="Describe the diet.." required></textarea>
                        </div>
                    </div>

                    <label for="edirections">Directions</label>
                    <textarea id="edirections" name="edirections" rows="4" placeholder="Enter step-by-step following the format (Ex: Main direction: details;)" required oninput="checkDirections('edirections', 'edirections-feedback');"></textarea>
                    <p id="edirections-feedback" class="feedback" style="color: red;"></p>

                    <div class="table-option">
                        <button type="button" id="discard-btn">Discard Changes</button>
                        <button type="submit" id="confirm-btn">Update Changes</button>
                    </div>
                </form>
                <script>
                    function editValidateForm() {
                        const mealNameFeedback = document.getElementById('ediet-name-feedback').textContent.trim();
                        const preparationMinFeedback = document.getElementById('epreparation-min-feedback').textContent.trim();
                        const directionFeedback = document.getElementById('edirections-feedback').textContent.trim();

                        const mealName = document.getElementById('ediet-name').value.trim();
                        const dietType = document.getElementById('ediet-type').value.trim();
                        const prepTime = document.getElementById('epreparation_min').value.trim();
                        const difficulty = document.getElementById('ediet-difficulty').value.trim();
                        const nutritionIds = document.querySelector('input[name="edietnutrition_ids"]').value.trim();
                        const description = document.getElementById('edesc').value.trim();
                        const directions = document.getElementById('edirections').value.trim();

                        const allFieldsFilled = mealName && dietType && prepTime && nutritionIds && description && directions && difficulty;
                        const noValidationErrors = !mealNameFeedback && !preparationMinFeedback && !directionFeedback;

                        document.getElementById('confirm-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }
                    document.getElementById('ediet-name').addEventListener('input', editValidateForm);
                    document.getElementById('ediet-type').addEventListener('change', editValidateForm);
                    document.getElementById('epreparation_min').addEventListener('input', editValidateForm);
                    document.getElementById('ediet-difficulty').addEventListener('change', editValidateForm);
                    document.getElementById('edesc').addEventListener('input', editValidateForm);
                    document.getElementById('edirections').addEventListener('input', editValidateForm);
                </script>
            </div>
            <div class="popup" id="popup">
                <div class="popup-content">
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete this record?</p>
                    <button class="confirmDelete">Yes, Delete</button>
                    <button class="cancelDelete">Cancel</button>
                </div>
            </div>
        </div>

        <div class="nutrition-container">
            <div class="section1">
                <input type="text" class="search-bar" placeholder="Search Nutrition Name">
                <div class="nutri-box">
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Nutrition Name</th>
                            <th>Calories (kcal)</th>
                            <th>Fat (g)</th>
                            <th>Protein (g)</th>
                            <th>Carbohydrate (g)</th>
                            <th>Registration Date</th>
                        </tr>

                        <?php

                        $sql = "SELECT * FROM nutrition";
                        $result = mysqli_query($dbConn, $sql);

                        if (mysqli_num_rows($result) > 0) {
                            while ($row = mysqli_fetch_assoc($result)) {
                                echo "<tr nutrition-id='" . $row['nutrition_id'] . "'>";
                                echo "<td>" . $row['nutrition_id'] . "</td>";
                                echo "<td>" . $row['nutrition_name'] . "</td>";
                                echo "<td>" . $row['calories'] . "</td>";
                                echo "<td>" . $row['fat'] . "</td>";
                                echo "<td>" . $row['protein'] . "</td>";
                                echo "<td>" . $row['carbohydrate'] . "</td>";
                                echo "<td>" . $row['date_registered'] . "</td>";
                                echo "</tr>";
                            }
                        } else {
                            echo "<tr class='no-data'><td colspan='6'>No data available</td></tr>";
                        }
                        ?>
                    </table>
                </div>
                <div class="table-option">
                    <button id="nutrition-edit-btn" disabled>Edit</button>
                    <button id="nutrition-delete-btn" disabled>Delete</button>
                </div>

            </div>
            <div class="add-profile" id="nadd-profile" style="height:730px;">
                <center>
                    <h2>Add New <span>Nutrition</span></h2>
                </center>
                <form action="" method="POST" id="nutrition-form">
                    <label for="nutrition-name">Nutrition Name</label>
                    <input type="text" id="nutrition-name" name="nutrition-name" required placeholder="Ex: Ingredient Name (gram)"
                        oninput="checkNumberInBrackets(this, document.getElementById('nutrition-name-feedback'), 'The number inside the brackets must be greater than 0.'); 
                        checkUniqueName(this, document.getElementById('nutrition-name-feedback'), 'Nutrition name already exists.', 'nutrition', 'nutrition_name',document.getElementById('nadd-profile-btn'));">
                    <p id="nutrition-name-feedback" class="feedback"></p>

                    <label for="calories">Calories (kcal)</label>
                    <input type="number" id="calories" name="calories" required
                        oninput="checkNumber(this, document.getElementById('calories-feedback'), 'Calories must be a positive number.');">
                    <p id="calories-feedback" class="feedback"></p>

                    <label for="fat">Fat (g)</label>
                    <input type="number" step="0.01" id="fat" name="fat" required
                        oninput="checkNumber(this, document.getElementById('fat-feedback'), 'Fat must be a positive number.');">
                    <p id="fat-feedback" class="feedback"></p>

                    <label for="protein">Protein (g)</label>
                    <input type="number" step="0.01" id="protein" name="protein" required
                        oninput="checkNumber(this, document.getElementById('protein-feedback'), 'Protein must be a positive number.');">
                    <p id="protein-feedback" class="feedback"></p>

                    <label for="carb">Carbohydrate (g)</label>
                    <input type="number" step="0.01" id="carb" name="carb" required
                        oninput="checkNumber(this, document.getElementById('carb-feedback'), 'Carbohydrates must be a positive number.');">
                    <p id="carb-feedback" class="feedback"></p>

                    <div class="table-option">
                        <button type="button" id="discard-btn">Discard</button>
                        <button type="submit" id="nadd-profile-btn" disabled>Create New</button>
                    </div>
                </form>

                <script>
                    function nvalidateForm() {
                        const nutritionNameFeedback = document.getElementById('nutrition-name-feedback').textContent.trim();
                        const caloriesFeedback = document.getElementById('calories-feedback').textContent.trim();
                        const fatFeedback = document.getElementById('fat-feedback').textContent.trim();
                        const proteinFeedback = document.getElementById('protein-feedback').textContent.trim();
                        const carbFeedback = document.getElementById('carb-feedback').textContent.trim();

                        const nutritionName = document.getElementById('nutrition-name').value.trim();
                        const calories = document.getElementById('calories').value.trim();
                        const fat = document.getElementById('fat').value.trim();
                        const protein = document.getElementById('protein').value.trim();
                        const carb = document.getElementById('carb').value.trim();

                        const allFieldsFilled = nutritionName && calories && fat && protein && carb;
                        const noValidationErrors = !nutritionNameFeedback && !caloriesFeedback && !fatFeedback && !proteinFeedback && !carbFeedback;

                        document.getElementById('nadd-profile-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('nutrition-name').addEventListener('input', nvalidateForm);
                    document.getElementById('calories').addEventListener('input', nvalidateForm);
                    document.getElementById('fat').addEventListener('input', nvalidateForm);
                    document.getElementById('protein').addEventListener('input', nvalidateForm);
                    document.getElementById('carb').addEventListener('input', nvalidateForm);
                </script>
            </div>

            <div class="edit-profile" id="nedit-profile" style="height:540px;">
                <center>
                    <h2>Edit <span>Nutrition</span></h2>
                </center>
                <form action="edit.php" method="POST">

                    <input type="hidden" id="selectedNutriId" name="selectedNutriId" value="<?php echo $_GET['nutrition_id'] ?? ''; ?>">
                    <input type="hidden" id="table" name="table" value="nutrition">

                    <label for="nutrition-name">Nutrition Name</label>
                    <input type="text" id="enutrition-name" name="enutrition-name" required placeholder="Ex: Ingredient Name (gram)"
                        oninput="checkNumberInBrackets(this, document.getElementById('efeedbackNutritionName'), 'The number inside the brackets must be greater than 0.'); checkUniqueName(this, document.getElementById('efeedbackNutritionName'), 'Nutrition name already exists.', 'nutrition', 'nutrition_name', document.getElementById('nconfirm-btn'),
                document.getElementById('selectedNutriId').value);">
                    <div id="efeedbackNutritionName"></div>

                    <label for="calories">Calories (kcal)</label>
                    <input type="number" id="ecalories" name="ecalories" required
                        onblur="checkNumber(this, feedbackCalories, 'Calories must be a positive number.');">
                    <div id="feedbackCalories"></div>

                    <label for="fat">Fat (g)</label>
                    <input type="number" step="0.01" id="efat" name="efat" required
                        onblur="checkNumber(this, feedbackFat, 'Fat must be a positive number.');">
                    <div id="feedbackFat"></div>

                    <label for="protein">Protein (g)</label>
                    <input type="number" step="0.01" id="eprotein" name="eprotein" required
                        onblur="checkNumber(this, feedbackProtein, 'Protein must be a positive number.');">
                    <div id="feedbackProtein"></div>

                    <label for="carb">Carbohydrate (g)</label>
                    <input type="number" step="0.01" id="ecarb" name="ecarb" required
                        onblur="checkNumber(this, feedbackCarb, 'Carbohydrates must be a positive number.');">
                    <div id="feedbackCarb"></div>

                    <div class="table-option">
                        <button type="button" id="ndiscard-btn">Discard Changes</button>
                        <button type="submit" id="nconfirm-btn">Update Changes</button>
                    </div>
                </form>
                <script>
                    function envalidateForm() {
                        const nutritionNameFeedback = document.getElementById('efeedbackNutritionName').textContent.trim();
                        const caloriesFeedback = document.getElementById('feedbackCalories').textContent.trim();
                        const fatFeedback = document.getElementById('feedbackFat').textContent.trim();
                        const proteinFeedback = document.getElementById('feedbackProtein').textContent.trim();
                        const carbFeedback = document.getElementById('feedbackCarb').textContent.trim();

                        const nutritionName = document.getElementById('enutrition-name').value.trim();
                        const calories = document.getElementById('ecalories').value.trim();
                        const fat = document.getElementById('efat').value.trim();
                        const protein = document.getElementById('eprotein').value.trim();
                        const carb = document.getElementById('ecarb').value.trim();

                        const allFieldsFilled = nutritionName && calories && fat && protein && carb;
                        const noValidationErrors = !nutritionNameFeedback && !caloriesFeedback && !fatFeedback && !proteinFeedback && !carbFeedback;

                        document.getElementById('nconfirm-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('enutrition-name').addEventListener('input', envalidateForm);
                    document.getElementById('ecalories').addEventListener('input', envalidateForm);
                    document.getElementById('efat').addEventListener('input', envalidateForm);
                    document.getElementById('eprotein').addEventListener('input', envalidateForm);
                    document.getElementById('ecarb').addEventListener('input', envalidateForm);
                </script>
            </div>

            <div class="mpopup" id="mpopup">
                <div class="popup-content">
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete this record?</p>
                    <button class="mconfirmDelete">Yes, Delete</button>
                    <button class="cancelDelete">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    </div>
</body>

</html>
<!-- below is for add diet profile -->
<?php
$sql = "SELECT * FROM nutrition";
$result = mysqli_query($dbConn, $sql);

$nutritionData = [];

if (mysqli_num_rows($result) > 0) {
    while ($row = mysqli_fetch_assoc($result)) {
        $nutritionData[] = $row;
    }
}

$nutritionJson = json_encode($nutritionData);
?>


<script>
    document.addEventListener('DOMContentLoaded', function() {

        validateForm();
        editValidateForm();
        nvalidateForm();


        // Initialize nutrition data for both forms
        const nutritionData = <?php echo $nutritionJson; ?>;

        // Populate nutrition options for both forms
        populateNutritionOptions('.add-profile .options', nutritionData);
        populateNutritionOptions('.edit-profile .options', nutritionData);

        // Initialize custom selects for both forms
        initializeCustomSelects('.add-profile .custom-select');
        initializeCustomSelects('.edit-profile .custom-select');

        // Set up image preview for both forms
        setupImagePreview('meal_picture', 'imagePreview', 'words');
        setupImagePreview('emeal_picture', 'eimagePreview', 'ewords');
    });

    // Function to populate nutrition options in both forms
    function populateNutritionOptions(containerSelector, data) {
        const optionsContainer = document.querySelector(containerSelector);

        // Make sure we don't duplicate options if already populated
        if (optionsContainer && optionsContainer.querySelectorAll('.option:not(.all-tags):not(.option-search-tags)').length === 0) {
            if (data.length > 0) {
                // Create options for each nutrition item
                data.forEach(nutrition => {
                    const option = document.createElement('div');
                    option.classList.add('option');
                    option.dataset.value = nutrition.nutrition_id;
                    option.textContent = `(${nutrition.nutrition_id}) ${nutrition.nutrition_name}`;
                    optionsContainer.appendChild(option);
                });
            } else {
                const noData = document.createElement("div");
                noData.classList.add("no-result-message");
                noData.textContent = "No nutrition data found";
                optionsContainer.appendChild(noData);
            }
        }
    }

    // Function to set up image preview
    function setupImagePreview(inputId, previewId, wordsId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener("change", function(event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.getElementById(previewId);
                        img.src = e.target.result;
                        img.style.display = "block";
                        document.getElementById(wordsId).style.display = "none";
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    function initializeCustomSelects(containerSelector) {
        const customSelects = document.querySelectorAll(containerSelector);

        customSelects.forEach(function(customSelect) {
            const optionsContainer = customSelect.parentNode.querySelector(".options");
            const searchInput = optionsContainer.querySelector(".search-tags");
            const options = optionsContainer.querySelectorAll(".option:not(.all-tags):not(.option-search-tags)");
            const allTagsOption = optionsContainer.querySelector(".option.all-tags");

            // Create no-result message if it doesn't exist
            let noResultMessage = optionsContainer.querySelector(".no-result-message");
            if (!noResultMessage) {
                noResultMessage = document.createElement("div");
                noResultMessage.classList.add("no-result-message");
                noResultMessage.textContent = "No matching options found";
                noResultMessage.style.display = "none";
                optionsContainer.appendChild(noResultMessage);
            }

            // Handle "Select All" functionality if allTagsOption exists
            if (allTagsOption) {
                allTagsOption.addEventListener("click", function(event) {
                    const isActive = allTagsOption.classList.contains("active");
                    allTagsOption.classList.toggle("active");

                    options.forEach(function(option) {
                        if (option.style.display !== "none") { // Only toggle visible options
                            option.classList.toggle("active", !isActive);
                        }
                    });

                    updateSelectedOptions(customSelect);
                    event.stopPropagation();
                });
            }

            // Handle search functionality
            if (searchInput) {
                searchInput.addEventListener("input", function(event) {
                    const searchTerm = searchInput.value.toLowerCase();
                    let anyOptionsMatch = false;

                    options.forEach(function(option) {
                        const optionText = option.textContent.trim().toLowerCase();
                        const shouldShow = optionText.includes(searchTerm);
                        option.style.display = shouldShow ? "block" : "none";
                        if (shouldShow) anyOptionsMatch = true;
                    });

                    noResultMessage.style.display = anyOptionsMatch ? "none" : "block";
                    if (allTagsOption) {
                        allTagsOption.style.display = searchTerm ? "none" : "block";
                    }

                    event.stopPropagation();
                });

                // Prevent closing dropdown when clicking on search
                searchInput.addEventListener("click", function(event) {
                    event.stopPropagation();
                });
            }

            // Handle option selection
            options.forEach(function(option) {
                option.addEventListener("click", function(event) {
                    option.classList.toggle("active");

                    // Update "Select All" state
                    if (allTagsOption) {
                        const allOptionsActive = Array.from(options)
                            .filter(opt => opt.style.display !== "none") // Only consider visible options
                            .every(opt => opt.classList.contains("active"));

                        allTagsOption.classList.toggle("active", allOptionsActive);
                    }

                    updateSelectedOptions(customSelect);
                    event.stopPropagation();
                });
            });

            // Toggle dropdown when clicking the select box
            const selectBox = customSelect.querySelector(".select-box");
            selectBox.addEventListener("click", function(event) {
                // Only toggle if not clicking on a tag's remove button
                if (!event.target.closest(".remove-tag")) {
                    const wasOpen = customSelect.classList.contains("open");

                    // Close all other dropdowns in the same container
                    customSelects.forEach(function(otherSelect) {
                        if (otherSelect !== customSelect) {
                            otherSelect.classList.remove("open");
                        }
                    });

                    // Toggle this dropdown
                    customSelect.classList.toggle("open");

                    // Clear search when opening
                    if (!wasOpen && searchInput) {
                        searchInput.value = "";
                        options.forEach(function(option) {
                            option.style.display = "block";
                        });
                        noResultMessage.style.display = "none";

                        // Focus on search input
                        setTimeout(() => {
                            searchInput.focus();
                        }, 10);
                    }
                }
            });
        });

        // Handle removing tags and closing dropdowns when clicking outside
        document.addEventListener("click", function(event) {
            // Handle removing tags
            const removeTag = event.target.closest(".remove-tag");
            if (removeTag) {
                const customSelect = removeTag.closest(".custom-select");
                const valueToRemove = removeTag.getAttribute("data-value");
                const optionsContainer = customSelect.parentNode.querySelector(".options");
                const optionToRemove = optionsContainer.querySelector(`.option[data-value="${valueToRemove}"]`);

                if (optionToRemove) {
                    optionToRemove.classList.remove("active");

                    const allTagsOption = optionsContainer.querySelector(".option.all-tags");
                    if (allTagsOption) {
                        allTagsOption.classList.remove("active");
                    }

                    updateSelectedOptions(customSelect);
                }

                event.stopPropagation();
            }
            // Close dropdowns when clicking outside
            else if (!event.target.closest(".custom-select") && !event.target.closest(".options")) {
                customSelects.forEach(function(customSelect) {
                    customSelect.classList.remove("open");
                });
            }
        });

        // Initialize all custom selects in the container
        customSelects.forEach(updateSelectedOptions);
    }

    function updateSelectedOptions(customSelect) {
        const optionsContainer = customSelect.parentNode.querySelector(".options");
        const tagsInput = customSelect.querySelector(".tags_input");
        const selectedOptionsContainer = customSelect.querySelector(".selected-options");

        if (!optionsContainer || !tagsInput || !selectedOptionsContainer) return;

        // Get active options
        const selectedOptions = Array.from(
                optionsContainer.querySelectorAll(".option.active:not(.all-tags):not(.option-search-tags)")
            )
            .map(function(option) {
                return {
                    value: option.getAttribute("data-value"),
                    text: option.textContent.trim()
                };
            });

        // Update the hidden input with comma-separated values
        const selectedValues = selectedOptions.map(option => option.value);
        tagsInput.value = selectedValues.join(",");

        // Check if the input is required and has a value
        const tagErrorMsg = customSelect.parentNode.querySelector(".tag_error_msg");
        if (tagErrorMsg) {
            tagErrorMsg.style.display = tagsInput.required && selectedValues.length === 0 ? "block" : "none";
        }

        // Generate the HTML for displaying selected tags
        let tagHTML = "";
        if (selectedOptions.length === 0) {
            tagHTML = '<span class="placeholder">Select nutrition IDs</span>';
        } else {
            const maxTagsToShow = 4;
            let additionalTagsCount = 0;

            selectedOptions.forEach(function(option, index) {
                if (index < maxTagsToShow) {
                    tagHTML += '<span class="tag">' + option.text +
                        '<span class="remove-tag" data-value="' + option.value + '">&times;</span></span>';
                } else {
                    additionalTagsCount++;
                }
            });

            if (additionalTagsCount > 0) {
                tagHTML += '<span class="tag">+' + additionalTagsCount + ' more</span>';
            }
        }

        selectedOptionsContainer.innerHTML = tagHTML;
    }

    // Special function to pre-select nutrition IDs in the edit form
    function setSelectedNutritionIds(nutritionIds) {
        if (!nutritionIds || !nutritionIds.length) return;

        const editCustomSelect = document.querySelector('.edit-profile .custom-select');
        if (!editCustomSelect) return;

        const optionsContainer = editCustomSelect.parentNode.querySelector(".options");
        if (!optionsContainer) return;

        // Clear all existing selections
        optionsContainer.querySelectorAll(".option.active").forEach(option => {
            option.classList.remove("active");
        });

        // Mark the corresponding options as active
        nutritionIds.forEach(id => {
            const option = optionsContainer.querySelector(`.option[data-value="${id}"]`);
            if (option) {
                option.classList.add("active");
            }
        });

        // Update the select box display
        updateSelectedOptions(editCustomSelect);

        // Check if all options are selected and update the "Select All" option
        const allTagsOption = optionsContainer.querySelector(".option.all-tags");
        if (allTagsOption) {
            const options = optionsContainer.querySelectorAll(".option:not(.all-tags):not(.option-search-tags)");
            const allSelected = options.length > 0 &&
                Array.from(options).every(opt => opt.classList.contains("active"));

            if (allSelected) {
                allTagsOption.classList.add("active");
            } else {
                allTagsOption.classList.remove("active");
            }
        }
    }

    //-------------------------navigation------------------------------
    let isEditing = false;

    function showSection() {
        if (isEditing) {
            return;
        }

        const hash = window.location.hash;
        const nutritionContainer = document.querySelector('.nutrition-container');
        const dietContainer = document.querySelector('.diet-container');
        const nutritionLink = document.querySelector('.nutrition-link');
        const dietLink = document.querySelector('.diet-link');

        nutritionContainer.style.display = 'none';
        dietContainer.style.display = 'none';
        nutritionLink.classList.remove('active');
        dietLink.classList.remove('active');

        if (hash === "#nutrition") {
            nutritionContainer.style.display = 'flex';
            nutritionLink.classList.add('active');
        } else if (hash === "#diet") {
            dietContainer.style.display = 'flex';
            dietLink.classList.add('active');
        } else {
            dietContainer.style.display = 'flex';
            dietLink.classList.add('active');
        }
    }

    showSection();
    window.addEventListener('hashchange', showSection);

    //------------------------select row--------------------------
    const rows = document.querySelectorAll('table tr:not(:first-child)');
    const editBtn = document.getElementById("edit-btn");
    const deleteBtn = document.getElementById("delete-btn");
    const nutriDeleteBtn = document.getElementById("nutrition-delete-btn");
    const nutriEditBtn = document.getElementById("nutrition-edit-btn");
    let selectedRow = null;
    let mselectedRow = null;
    document.querySelectorAll(".diet-container tr").forEach(row => {
        row.addEventListener('click', function(event) {
            if (isEditing) return;
            if (this.classList.contains('no-data')) return;

            event.stopPropagation();
            rows.forEach(r => r.classList.remove('selected'));
            selectedRow = this;
            this.classList.add('selected');
            console.log(selectedRow);

            editBtn.disabled = false;
            deleteBtn.disabled = false;
        });
    });

    document.querySelectorAll(".nutrition-container tr").forEach(row => {
        row.addEventListener('click', function(event) {
            if (isEditing) return;
            if (this.classList.contains('no-data')) return;

            event.stopPropagation();
            rows.forEach(r => r.classList.remove('selected'));
            mselectedRow = this;
            this.classList.add('selected');

            nutriDeleteBtn.disabled = false;
            nutriEditBtn.disabled = false;
        });
    });

    //------------------------------deselect------------------
    document.addEventListener("click", function(event) {
        const table = document.querySelector(".box table");
        const table2 = document.querySelector(".nutri-box table");
        const tableOptions = document.querySelectorAll('.table-option');
        tableOptions.forEach(tableOption => {
            if (table.contains(event.target) && tableOption.contains(event.target) && table2.contains(event.target)) {
                if (isEditing) return;
                if (selectedRow) {
                    selectedRow.classList.remove('selected');
                    selectedRow = null;
                }
                if (mselectedRow) {
                    mselectedRow.classList.remove('selected');
                    mselectedRow = null;
                }
                editBtn.disabled = true;
                deleteBtn.disabled = true;
                nutriDeleteBtn.disabled = true;
                nutriEditBtn.disabled = true;
            }
        });
    }, true);

    //-----------------------------edit data-----------------------
    const addProfile = document.getElementById("dadd-profile");
    const editProfile = document.getElementById("dedit-profile");
    const naddProfile = document.getElementById("nadd-profile");
    const neditProfile = document.getElementById("nedit-profile");
    editBtn.addEventListener("click", function() {
        if (!selectedRow) return;
        isEditing = true;
        addProfile.style.display = "none";
        editProfile.style.display = "block";
        editBtn.disabled = true;
        deleteBtn.disabled = true;

        const dietId = selectedRow.getAttribute("diet-id");

        // Fetch diet data and associated nutrition IDs
        fetch(`fetch_diet_data.php?diet_id=${dietId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById("selectedDietId").value = data.diet_id;
                document.getElementById("ediet-name").value = data.diet_name;
                document.getElementById("edesc").value = data.description;
                document.getElementById("ediet-type").value = data.diet_type;
                document.getElementById("epreparation_min").value = data.preparation_min;
                document.getElementById("ediet-difficulty").value = data.difficulty;
                document.getElementById("edirections").value = data.directions;

                if (data.picture) {
                    const imagePath = `./uploads/diet/${data.picture}`;
                    const imagePreview = document.getElementById("eimagePreview");
                    imagePreview.src = imagePath;
                    imagePreview.style.display = "block";
                    document.getElementById("ewords").style.display = "none";
                }

                // Set the value in the hidden input
                const tagsInput = document.querySelector(".edit-profile .tags_input");
                if (tagsInput) {
                    tagsInput.value = data.nutrition_ids.join(",");
                }

                // Use our new function to pre-select the options
                setSelectedNutritionIds(data.nutrition_ids);
            })
            .catch(error => {
                console.error("Error fetching diet data:", error);
                alert("Failed to fetch diet data. Check the console for details.");
            });
    });

    nutriEditBtn.addEventListener("click", function() {
        if (!mselectedRow) return;
        isEditing = true;
        document.getElementById("nutrition-name").value = "";
        document.getElementById("calories").value = "";
        document.getElementById("fat").value = "";
        document.getElementById("protein").value = "";
        document.getElementById("carb").value = "";
        naddProfile.style.display = "none";
        neditProfile.style.display = "block";
        nutriEditBtn.disabled = true;
        nutriDeleteBtn.disabled = true;

        const cells = mselectedRow.getElementsByTagName("td");
        document.getElementById("selectedNutriId").value = cells[0].textContent;
        document.getElementById("enutrition-name").value = cells[1].textContent;
        document.getElementById("ecalories").value = cells[2].textContent;
        document.getElementById("efat").value = cells[3].textContent;
        document.getElementById("eprotein").value = cells[4].textContent;
        document.getElementById("ecarb").value = cells[5].textContent;

    });


    //--------------------------discard changes button---------------------------------------
    document.getElementById("discard-btn").addEventListener("click", () => {
        addProfile.style.display = "block";
        editProfile.style.display = "none";
        isEditing = false;
        showSection();
    });

    document.getElementById("ndiscard-btn").addEventListener("click", () => {
        naddProfile.style.display = "block";
        neditProfile.style.display = "none";
        isEditing = false;
        showSection();
    });

    //----------------------delete data------------------------
    let id = null;
    let table = null;
    deleteBtn.addEventListener("click", () => {
        if (!selectedRow) return;

        let popUp = document.getElementById("popup");
        popUp.style.display = "flex";
        id = selectedRow.getAttribute("diet-id");
        table = "diet";
        console.log(`ID: ${id}, Table: ${table}`);
    });


    document.getElementById("nutrition-delete-btn").addEventListener("click", () => {
        console.log("Selected row:", mselectedRow);
        if (!mselectedRow) return;
        let popUp = document.getElementById("mpopup");

        popUp.style.display = "flex";
        id = mselectedRow.getAttribute("nutrition-id");
        table = "nutrition";
        console.log(`ID: ${id}, Table: ${table}`);
    });

    document.querySelector(".content").addEventListener("click", function(event) {
        // Diet deletion confirmation
        if (event.target.classList.contains("confirmDelete")) {
            console.log("Diet confirmDelete button clicked");

            if (!id || table !== "diet") {
                console.error("Missing or invalid diet ID");
                return;
            }

            fetch("delete.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`
                })
                .then(res => res.text())
                .then(() => location.reload())
                .catch(console.error);

            document.getElementById("popup").style.display = "none";
        }

        // Nutrition deletion confirmation
        if (event.target.classList.contains("mconfirmDelete")) {
            console.log("Nutrition mconfirmDelete button clicked");

            if (!id || table !== "nutrition") {
                console.error("Missing or invalid nutrition ID");
                return;
            }

            fetch("delete.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`
                })
                .then(res => res.text())
                .then(() => location.reload())
                .catch(console.error);

            document.getElementById("mpopup").style.display = "none";
        }

        // Cancel buttons (for both popups)
        if (event.target.classList.contains("cancelDelete")) {
            document.getElementById("popup").style.display = "none";
            document.getElementById("mpopup").style.display = "none";
        }
    });

    //-----------------------------search--------------------------
    document.querySelectorAll(".search-bar").forEach(searchBar => {
        searchBar.addEventListener("keyup", function() {
            const searchValue = this.value.toLowerCase();

            let table = this.closest("div").querySelector("table");
            let rows = table.querySelectorAll("tr:not(:first-child)");

            rows.forEach(row => {
                if (row.classList.contains("no-data")) return;

                const usernameCell = row.cells[1].textContent.toLowerCase();

                if (usernameCell.includes(searchValue)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    });

    //----------------------------tag--------------------------
    const nutritionData = <?php echo $nutritionJson; ?>;

    const optionsContainer = document.querySelector(".options");

    function populateOptions(data) {

        if (data.length > 0) {
            // Create options for each nutrition item
            data.forEach(nutrition => {
                const option = document.createElement('div');
                option.classList.add('option');
                option.dataset.value = nutrition.nutrition_id;
                option.textContent = `(${nutrition.nutrition_id}) ${nutrition.nutrition_name} `;
                optionsContainer.appendChild(option);
            });
        } else {
            const noData = document.createElement("div");
            noData.classList.add("no-result-message");
            noData.textContent = "No nutrition data found";
            optionsContainer.appendChild(noData);
        }
    }
    populateOptions(nutritionData);

    document.getElementById("meal_picture").addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log("image attached");
                const img = document.getElementById("imagePreview");
                img.src = e.target.result;
                img.style.display = "block";

                const words = document.getElementById("words");
                words.style.display = "none";
            };
            reader.readAsDataURL(file);
        }


        const tagsInput = document.querySelector('.tags_input');
        if (tagsInput && tagsInput.value) {
            const selectedValues = tagsInput.value.split(',');
            const optionsContainer = document.querySelector('.options');
            if (optionsContainer) {
                selectedValues.forEach(value => {
                    const option = optionsContainer.querySelector(`.option[data-value="${value}"]`);
                    if (option) {
                        option.classList.add('active');
                    }
                });
                updateSelectedOptions(document.querySelector('.custom-select'));
            }
        }
    });
</script>