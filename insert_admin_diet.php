<?php
session_start();
include "conn.php";

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Get form data
    $name = trim($_POST['meal-name']);
    $type = $_POST['diet-type'];
    $duration = (int)$_POST['preparation_min'];
    $difficulty = $_POST['diet-difficulty'];
    $description = trim($_POST['desc']);
    $directions = trim($_POST['directions']);

    // Parse nutrition IDs from the hidden input
    $nutrition_ids = [];
    if (!empty($_POST['nutrition_ids'])) {
        $nutrition_ids = explode(',', $_POST['nutrition_ids']);
        $nutrition_ids = array_map('intval', $nutrition_ids);
    }

    // Handle image upload
    if (!empty($_FILES["meal_picture"]["name"])) {
        $targetDir = "./uploads/diet/";
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $fileName = basename($_FILES["meal_picture"]["name"]);
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $newFileName = uniqid("meal_", true) . "." . $fileType;
        $targetFilePath = $targetDir . $newFileName;

        if (move_uploaded_file($_FILES["meal_picture"]["tmp_name"], $targetFilePath)) {
            $meal_picture = $newFileName;
        } else {
            $dieterrors[] = "Error: Failed to upload image.";
        }
    }

    // Format directions as a string
    $directions_array = array_map('trim', explode("\n", $directions));
    $directions_array = array_filter($directions_array, fn($step) => !empty($step));
    $directions_str = implode(";", $directions_array);

    // Insert data into the `diet` table
    $insertStmt = $dbConn->prepare("INSERT INTO diet (diet_name, description, diet_type, preparation_min, difficulty, picture, directions, date_registered) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())");
    $insertStmt->bind_param("sssisss", $name, $description, $type, $duration, $difficulty, $meal_picture, $directions_str);

    if ($insertStmt->execute()) {
        $diet_id = $insertStmt->insert_id; // Get the last inserted diet ID

        $insertNutritionStmt = $dbConn->prepare("INSERT INTO diet_nutrition (diet_id, nutrition_id) VALUES (?, ?)");

        foreach ($nutrition_ids as $nutrition_id) {
            $insertNutritionStmt->bind_param("ii", $diet_id, $nutrition_id);
            $insertNutritionStmt->execute();
        }

        $insertNutritionStmt->close();

        header("Location: admin_diet.php");
        exit();
    } else {
        $dieterrors[] = "Error adding meal: " . $dbConn->error;
    }

    $insertStmt->close();
}
?>
<script src="js/admin_diet.js"></script>