<?php
session_start();
include "conn.php";

if (!isset($_GET['diet_id'])) {
    http_response_code(400); 
    echo json_encode(['error' => 'diet_id is required']);
    exit();
}

$dietId = intval($_GET['diet_id']);

// Fetch diet data
$dietStmt = $dbConn->prepare("SELECT * FROM diet WHERE diet_id = ?");
if (!$dietStmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare diet query: ' . $dbConn->error]);
    exit();
}

$dietStmt->bind_param("i", $dietId);
if (!$dietStmt->execute()) {
    http_response_code(500); 
    echo json_encode(['error' => 'Failed to execute diet query: ' . $dietStmt->error]);
    exit();
}

$dietResult = $dietStmt->get_result();
if ($dietResult->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Diet not found']);
    exit();
}

$dietData = $dietResult->fetch_assoc();

// Fetch associated nutrition IDs
$nutritionStmt = $dbConn->prepare("SELECT nutrition_id FROM diet_nutrition WHERE diet_id = ?");
if (!$nutritionStmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare nutrition query: ' . $dbConn->error]);
    exit();
}

$nutritionStmt->bind_param("i", $dietId);
if (!$nutritionStmt->execute()) {
    http_response_code(500); 
    echo json_encode(['error' => 'Failed to execute nutrition query: ' . $nutritionStmt->error]);
    exit();
}

$nutritionResult = $nutritionStmt->get_result();
$nutritionIds = [];

while ($row = $nutritionResult->fetch_assoc()) {
    $nutritionIds[] = $row['nutrition_id'];
}

// Combine diet data and nutrition IDs
$response = [
    'diet_id' => $dietData['diet_id'],
    'diet_name' => $dietData['diet_name'],
    'description' => $dietData['description'],
    'diet_type' => $dietData['diet_type'],
    'preparation_min' => $dietData['preparation_min'],
    'difficulty' => $dietData['difficulty'],
    'directions' => $dietData['directions'],
    'picture' => $dietData['picture'],
    'nutrition_ids' => $nutritionIds
];

header('Content-Type: application/json');
echo json_encode($response);
exit();
?>