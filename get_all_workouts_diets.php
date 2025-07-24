<?php

require_once 'conn.php';
session_start();

$response = [];

try {
    // Get all workouts
    $workoutQuery = "SELECT workout_id, workout_name, duration, calories, 
                    difficulty, workout_type, description 
                    FROM workouts";
    $workoutResult = mysqli_query($dbConn, $workoutQuery);
    
    $workouts = [];
    while ($row = mysqli_fetch_assoc($workoutResult)) {
        $workouts[] = [
            'workout_id' => $row['workout_id'],
            'workout_name' => $row['workout_name'],
            'duration' => $row['duration'],
            'calories' => $row['calories'],
            'difficulty' => $row['difficulty'],
            'workout_type' => $row['workout_type'],
            'description' => $row['description']
        ];
    }
    
    // Get all diets
    $dietQuery = "SELECT diet_id, diet_name, preparation_min, calories, 
                 diet_type, description 
                 FROM diets";
    $dietResult = mysqli_query($dbConn, $dietQuery);
    
    $diets = [];
    while ($row = mysqli_fetch_assoc($dietResult)) {
        $diets[] = [
            'diet_id' => $row['diet_id'],
            'diet_name' => $row['diet_name'],
            'preparation_min' => $row['preparation_min'],
            'calories' => $row['calories'],
            'diet_type' => $row['diet_type'],
            'description' => $row['description']
        ];
    }
    
    // Get all nutritional values
    $nutritionQuery = "SELECT food_id, food_name, calories, protein, carbs, fats 
                      FROM nutritional_values";
    $nutritionResult = mysqli_query($dbConn, $nutritionQuery);
    
    $nutritionalValues = [];
    while ($row = mysqli_fetch_assoc($nutritionResult)) {
        $nutritionalValues[] = [
            'food_id' => $row['food_id'],
            'food_name' => $row['food_name'],
            'calories' => $row['calories'],
            'protein' => $row['protein'],
            'carbs' => $row['carbs'],
            'fats' => $row['fats']
        ];
    }
    
    $response = [
        'workouts' => $workouts,
        'diets' => $diets,
        'nutritional_values' => $nutritionalValues
    ];
    
} catch (Exception $e) {
    $response = [
        'error' => 'Database error: ' . $e->getMessage()
    ];
} finally {
    // Close the database connection
    mysqli_close($dbConn);
}

// Return the data as JSON
header('Content-Type: application/json');
echo json_encode($response);
?>