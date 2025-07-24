<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

require_once 'conn.php';
session_start();

// Debug session information
$sessionInfo = [
    'session_id' => session_id(),
    'session_status' => session_status(),
    'session_contents' => $_SESSION,
    'member_id_set' => isset($_SESSION['member id']),
    'member_id_value' => $_SESSION['member id'] ?? 'not set'
];

if (!$dbConn) {
    $response = [
        'error' => 'Database connection failed: ' . mysqli_connect_error(),
        'isLoggedIn' => false
    ];
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// If member_id is not set in session, return error immediately
if (!isset($_SESSION['member id'])) {
    $response = [
        'error' => 'Session member_id not found',
        'isLoggedIn' => false,
        'debug' => $sessionInfo
    ];
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

$memberId = $_SESSION['member id'];
$response = [];

try {
    // Get member basic info
    $query = "SELECT member_id, username, email_address, member_pic, height, weight, 
              fitness_goal, level, age, gender, target_weight, 
              day_streak_starting_date, last_session_date 
              FROM member WHERE member_id = ?";
    $stmt = mysqli_prepare($dbConn, $query);
    mysqli_stmt_bind_param($stmt, "i", $memberId);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if ($row = mysqli_fetch_assoc($result)) {
        $memberData = [
            "username" => $row["username"],
            "email" => $row["email_address"],
            "profile_pic" => $row["member_pic"],
            "height" => (float)($row["height"] ?? 0),
            "weight" => (float)($row["weight"] ?? 0),
            "target_weight" => (float)($row["target_weight"] ?? 0),
            "fitness_goal" => $row["fitness_goal"] ?? "Maintain",
            "level" => (int)($row["level"] ?? 1),
            "age" => (int)($row["age"] ?? 0),
            "gender" => $row["gender"] ?? "",
            "day_streak" => [
                "starting_date" => $row["day_streak_starting_date"] ?? "",
                "last_session" => $row["last_session_date"] ?? ""
            ]
        ];
        
        // Get performance data
        $perfQuery = "SELECT current_weight, workout_history_count, diet_history_count 
                      FROM member_performance 
                      WHERE member_id = ? 
                      ORDER BY weeks_date_mon DESC LIMIT 1";
        $perfStmt = mysqli_prepare($dbConn, $perfQuery);
        mysqli_stmt_bind_param($perfStmt, "i", $memberId);
        mysqli_stmt_execute($perfStmt);
        $perfResult = mysqli_stmt_get_result($perfStmt);
        
        $memberData['performance'] = mysqli_fetch_assoc($perfResult) ?? null;

        // Get workout history
        $workoutQuery = "SELECT wh.date, w.workout_name, w.duration, w.calories, 
                        w.difficulty, w.workout_type 
                        FROM workout_history wh
                        JOIN workout w ON wh.workout_id = w.workout_id
                        WHERE wh.member_id = ?
                        ORDER BY wh.date DESC LIMIT 5";
        $workoutStmt = mysqli_prepare($dbConn, $workoutQuery);
        mysqli_stmt_bind_param($workoutStmt, "i", $memberId);
        mysqli_stmt_execute($workoutStmt);
        $memberData['workout_history'] = mysqli_fetch_all(mysqli_stmt_get_result($workoutStmt), MYSQLI_ASSOC);

        // Get diet history
        $dietQuery = "SELECT dh.date, dh.diet_id, d.diet_name, d.diet_type
             FROM diet_history dh
             JOIN diet d ON dh.diet_id = d.diet_id
             WHERE dh.member_id = ?
             ORDER BY dh.date DESC LIMIT 5";
        $dietStmt = mysqli_prepare($dbConn, $dietQuery);
        mysqli_stmt_bind_param($dietStmt, "i", $memberId);
        mysqli_stmt_execute($dietStmt);
        $memberData['diet_history'] = mysqli_fetch_all(mysqli_stmt_get_result($dietStmt), MYSQLI_ASSOC);

        // Get custom diets
        $customDietQuery = "SELECT date, custom_diet_name AS diet_name, calories 
                           FROM custom_diet
                           WHERE member_id = ?
                           ORDER BY date DESC LIMIT 5";
        $customDietStmt = mysqli_prepare($dbConn, $customDietQuery);
        mysqli_stmt_bind_param($customDietStmt, "i", $memberId);
        mysqli_stmt_execute($customDietStmt);
        $memberData['custom_diets'] = mysqli_fetch_all(mysqli_stmt_get_result($customDietStmt), MYSQLI_ASSOC);

        // Get nutrition data (from diet_nutrition table)
        $nutritionQuery = "SELECT dn.nutrition_id, n.nutrition_name, n.calories, 
                          n.fat, n.protein, n.carbohydrate 
                          FROM diet_nutrition dn
                          JOIN nutrition n ON dn.nutrition_id = n.nutrition_id
                          WHERE dn.diet_id IN (
                              SELECT diet_id FROM diet_history WHERE member_id = ?
                          ) ORDER BY dn.diet_id DESC LIMIT 7";
        $nutritionStmt = mysqli_prepare($dbConn, $nutritionQuery);
        mysqli_stmt_bind_param($nutritionStmt, "i", $memberId);
        mysqli_stmt_execute($nutritionStmt);
        $memberData['nutrition'] = mysqli_fetch_all(mysqli_stmt_get_result($nutritionStmt), MYSQLI_ASSOC);

        $response = [
            'isLoggedIn' => true,
            'memberData' => $memberData
        ];
    } else {
        $response = [
            'error' => 'Member not found',
            'isLoggedIn' => false
        ];
    }
} catch (Exception $e) {
    $response = [
        'error' => 'Database error: ' . $e->getMessage(),
        'isLoggedIn' => false
    ];
} finally {
    mysqli_close($dbConn);
}

ob_clean();
header('Content-Type: application/json');
echo json_encode($response);
?>