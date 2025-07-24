<?php
require_once 'conn.php';
session_start();

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

if (!isset($_POST['workout_id']) || !isset($_POST['member_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

// Get parameters
$workout_id = intval($_POST['workout_id']);
$member_id = intval($_POST['member_id']);
$current_date = date('Y-m-d');

// Verify member_id matches session user
if ($member_id != $_SESSION["member id"]) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($workout_id <= 0) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid workout ID']);
    exit;
}

// Insert workout history record
$sql = "INSERT INTO workout_history (date, member_id, workout_id) VALUES (?, ?, ?)";
$stmt = $dbConn->prepare($sql);
$stmt->bind_param("sii", $current_date, $member_id, $workout_id);

if ($stmt->execute()) {
    // Update performance metrics
    updatePerformanceMetrics($dbConn, $member_id);
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Failed to save workout history']);
}

$stmt->close();
$dbConn->close();

/**
 * Update performance metrics for the user
 */
function updatePerformanceMetrics($dbConn, $member_id) {
    // Get current date
    $current_date = date('Y-m-d');
    
    // Get current weight from member table
    $sql = "SELECT weight FROM member WHERE member_id = ?";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("i", $member_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $current_weight = $row['weight'];
    
    // Count workout history
    $sql = "SELECT COUNT(*) as workout_count FROM workout_history WHERE member_id = ?";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("i", $member_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $workout_count = $row['workout_count'];
    
    $diet_count = 0;
    if ($dbConn->query("SHOW TABLES LIKE 'diet_history'")->num_rows > 0) {
        $sql = "SELECT COUNT(*) as diet_count FROM diet_history WHERE member_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $member_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $diet_count = $row['diet_count'];
    }

    $sql = "INSERT INTO member_performance (weeks_date_mon, current_weight, workout_history_count, diet_history_count, member_id) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("sdiii", $current_date, $current_weight, $workout_count, $diet_count, $member_id);
    $stmt->execute();
}
?>