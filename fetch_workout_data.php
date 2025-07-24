<?php
header("Content-Type: application/json");
include 'conn.php'; 

if (!isset($_GET['workout_id'])) {
    echo json_encode(["error" => "Workout ID is required"]);
    exit;
}

$workout_id = intval($_GET['workout_id']);

$sql = "SELECT * FROM workout WHERE workout_id = ?";
$stmt = $dbConn->prepare($sql);
$stmt->bind_param("i", $workout_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode(["error" => "Workout not found"]);
}

$stmt->close();
?>
