<?php
session_start();
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    include "conn.php";
    $table = $_POST['table'] ?? null;
    $selectedAdminId = $_POST['selectedAdminId'] ?? null;
    $selectedNutriId = $_POST['selectedNutriId'] ?? null;
    $selectedDietId = $_POST['selectedDietId'] ?? null;

    if ($table === null) {
        echo "table data is missing.";
        exit();
    }

    switch ($table) {

        // --------------------------------------ADMINSTRATOR-----------------------------------------
        case 'administrator':
            $errors = [];
            $username = trim($_POST['eusername']);
            $password = trim($_POST['epassword']);
            $name = trim($_POST['ename']);
            $gender = trim($_POST['egender']);
            $email = trim($_POST['eemail']);
            $phone_num = trim($_POST['ephonenum']);

            $updateStmt = $dbConn->prepare("UPDATE administrator SET username = ?, password = ?, name = ?, gender = ?, email_address = ?, phone_number = ? WHERE admin_id = ?");
            $updateStmt->bind_param("ssssssi", $username, $password, $name, $gender, $email, $phone_num, $selectedAdminId);

            if ($updateStmt->execute()) {
                $_SESSION['success_message'] = "Admin updated successfully!";
                header("Location: admin_user_page.php");
                exit();
            }


            // --------------------------------------NUTRITION-----------------------------------------
        case 'nutrition':

            $nutritionName = $_POST['enutrition-name'];
            $calories = $_POST['ecalories'];
            $fat = $_POST['efat'];
            $protein = $_POST['eprotein'];
            $carb = $_POST['ecarb'];

            $updateStmt = $dbConn->prepare("UPDATE nutrition SET nutrition_name = ?, calories = ?, fat = ?, protein = ?, carbohydrate = ? WHERE nutrition_id = ?");
            $updateStmt->bind_param("sddssi", $nutritionName, $calories, $fat, $protein, $carb, $selectedNutriId);

            if ($updateStmt->execute()) {
                header("Location: admin_diet.php#nutrition");
                exit();
            }

            // --------------------------------------DIET-----------------------------------------
        case 'diet':
            $name = htmlspecialchars(trim($_POST['ediet-name']));
            $type = htmlspecialchars(trim($_POST['ediet-type']));
            $duration = (int)$_POST['epreparation_min'];
            $difficulty = htmlspecialchars(trim($_POST['ediet-difficulty']));
            $description = htmlspecialchars(trim($_POST['edesc']));
            $directions = htmlspecialchars(trim($_POST['edirections']));
            $selectedDietId = (int)$_POST['selectedDietId'];

            $current_picture = '';
            $stmt = $dbConn->prepare("SELECT picture FROM diet WHERE diet_id = ?");
            $stmt->bind_param("i", $selectedDietId);
            $stmt->execute();
            $stmt->bind_result($current_picture);
            $stmt->fetch();
            $stmt->close();

            $nutrition_ids = [];
            if (!empty($_POST['edietnutrition_ids'])) {
                $nutrition_ids = array_map('intval', explode(',', $_POST['edietnutrition_ids']));
            }

            $final_picture = $current_picture;
            if (!empty($_FILES["emeal_picture"]["name"])) {
                if (!empty($current_picture) && file_exists("./uploads/diet/" . $current_picture)) {
                    if (unlink("./uploads/diet/" . $current_picture)) {
                    }
                }

                $targetDir = "./uploads/diet/";
                if (!file_exists($targetDir)) {
                    mkdir($targetDir, 0777, true);
                }

                $fileName = basename($_FILES["emeal_picture"]["name"]);
                $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

                $newFileName = uniqid("meal_", true) . "." . $fileType;
                $targetFilePath = $targetDir . $newFileName;

                if (move_uploaded_file($_FILES["emeal_picture"]["tmp_name"], $targetFilePath)) {
                    $final_picture = $newFileName; // Save the new file name
                }
            }

            // Prepare directions for storage
            $directions_array = array_map('trim', explode("\n", $directions));
            $directions_array = array_filter($directions_array, fn($step) => !empty($step));
            $directions_str = implode(";", $directions_array);

            $updateStmt = $dbConn->prepare("UPDATE diet SET diet_name = ?, description = ?, diet_type = ?, preparation_min = ?, picture = ?, directions = ?, difficulty = ? WHERE diet_id = ?");
            $updateStmt->bind_param("sssisssi", $name, $description, $type, $duration, $final_picture, $directions_str, $difficulty, $selectedDietId);
            if ($updateStmt->execute()) {
                // Delete existing nutrition IDs
                $deleteNutritionStmt = $dbConn->prepare("DELETE FROM diet_nutrition WHERE diet_id = ?");
                $deleteNutritionStmt->bind_param("i", $selectedDietId);
                $deleteNutritionStmt->execute();
                $deleteNutritionStmt->close();

                // Insert new nutrition IDs
                $insertNutritionStmt = $dbConn->prepare("INSERT INTO diet_nutrition (diet_id, nutrition_id) VALUES (?, ?)");
                foreach ($nutrition_ids as $nutrition_id) {
                    $insertNutritionStmt->bind_param("ii", $selectedDietId, $nutrition_id);
                    $insertNutritionStmt->execute();
                }
                $insertNutritionStmt->close();

                header("Location: admin_diet.php");
                exit();
            }
            break;

        // -------------------------------------- WORKOUT -----------------------------------------
        case 'workout':
            $name = htmlspecialchars(trim($_POST['eworkout-name']));
            $type = htmlspecialchars(trim($_POST['eworkout-type']));
            $difficulty = htmlspecialchars(trim($_POST['eworkout-difficulty']));
            $calories = (int)$_POST['ecalories'];
            $duration = (int)$_POST['eduration'];
            $sets = (int)$_POST['esets'];
            $description = htmlspecialchars(trim($_POST['edesc']));
            $long_description = htmlspecialchars(trim($_POST['elong_description']));
            $selectedWorkoutId = (int)$_POST['selectedWorkoutId'];

            $current_image = '';
            $stmt = $dbConn->prepare("SELECT image FROM workout WHERE workout_id = ?");
            $stmt->bind_param("i", $selectedWorkoutId);
            $stmt->execute();
            $stmt->bind_result($current_image);
            $stmt->fetch();
            $stmt->close();

            $final_image = $current_image;
            if (!empty($_FILES["eworkout_picture"]["name"])) {
                // Delete the old file using the filename from the database
                if (!empty($current_image) && file_exists("./assets/workout_pics/" . $current_image)) {
                    if (unlink("./assets/workout_pics/" . $current_image)) {
                        // Successfully deleted old image
                    }
                }

                $targetDir = "./assets/workout_pics/";
                if (!file_exists($targetDir)) {
                    mkdir($targetDir, 0777, true);
                }

                $fileType = strtolower(pathinfo($_FILES["eworkout_picture"]["name"], PATHINFO_EXTENSION));

                // Create new filename based on $name
                $newFileName = $name . "." . $fileType;
                $targetFilePath = $targetDir . $newFileName;

                if (move_uploaded_file($_FILES["eworkout_picture"]["tmp_name"], $targetFilePath)) {
                    $final_image = $newFileName;
                }
            }

            // Process exercise IDs
            $exercise_ids = [];
            if (!empty($_POST['eexercise_ids'])) {
                $exercise_ids = array_map('intval', explode(',', $_POST['eexercise_ids']));
            }

            // Format exercise list as needed for your storage format
            $formatted_exercise_list = "[" . implode(", ", $exercise_ids) . "]";

            $updateStmt = $dbConn->prepare("UPDATE workout SET workout_name = ?, workout_type = ?, difficulty = ?, calories = ?, duration = ?, image = ?, description = ?, long_description = ?, sets = ?, exercise_checklist = ? WHERE workout_id = ?");
            $updateStmt->bind_param("sssiisssisi", $name, $type, $difficulty, $calories, $duration, $final_image, $description, $long_description, $sets, $formatted_exercise_list, $selectedWorkoutId);

            if ($updateStmt->execute()) {
                header("Location: admin_workout.php");
                exit();
            }
            break;
    }
}
