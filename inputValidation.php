<?php
header("Content-Type: application/json");
include "conn.php";

$table = $_POST['table'] ?? '';
$column = $_POST['column'] ?? '';
$value = $_POST['value'] ?? '';
$id = $_POST['id'] ?? null;

if (empty($table) || empty($column) || empty($value)) {
    echo json_encode(["error" => "Table, column, and value are required"]);
    exit;
}

// Sanitize input to prevent SQL injection
$table = preg_replace("/[^a-zA-Z0-9_]/", "", $table);
$column = preg_replace("/[^a-zA-Z0-9_]/", "", $column);

$id_column = '';
switch ($table) {
    case 'diet':
        $id_column = 'diet_id';
        break;
    case 'nutrition':
        $id_column = 'nutrition_id';
        break;
    case 'workout':
        $id_column = 'workout_id';
        break;
    case 'member':
        $id_column = 'member_id';
        break;
    case 'administrator':
        $id_column = 'admin_id';
        break;
}

try {
    $exists = false;
    
    // First check the requested table
    if ($id) {
        $query = "SELECT COUNT(*) as count FROM `$table` WHERE `$column` = ? AND `$id_column` != ?";
        $stmt = $dbConn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare the SQL statement");
        }
        $stmt->bind_param("si", $value, $id);
    } else {
        $query = "SELECT COUNT(*) as count FROM `$table` WHERE `$column` = ?";
        $stmt = $dbConn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare the SQL statement");
        }
        $stmt->bind_param("s", $value);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $exists = $row['count'] > 0;
    
    // If table is administrator, also check member table
    if ($table === 'administrator' && !$exists && !$column === 'phone_number') {
        $stmt->close(); 
        $query = "SELECT COUNT(*) as count FROM `member` WHERE `$column` = ?";
        if ($id) {
            $query .= " AND `member_id` != ?";
            $stmt = $dbConn->prepare($query);
            if (!$stmt) {
                throw new Exception("Failed to prepare the SQL statement");
            }
            $stmt->bind_param("si", $value, $id);
        } else {
            $stmt = $dbConn->prepare($query);
            if (!$stmt) {
                throw new Exception("Failed to prepare the SQL statement");
            }
            $stmt->bind_param("s", $value);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $exists = $exists || ($row['count'] > 0);
    }
    
    echo json_encode(["exists" => $exists]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    $dbConn->close();
}