<?php 
// update_profile.php 
session_start(); 
if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) { 
    // Return JSON response for AJAX request 
    header('Content-Type: application/json'); 
    echo json_encode(['success' => false, 'message' => 'Not logged in']); 
    exit; 
}
include "conn.php"; 
$response = ['success' => false, 'message' => ''];

// Get member_id from session 
$member_id = $_SESSION['member id'];

// Get form data 
$username = $_POST['username']; 
$email = $_POST['email']; 
$current_password = $_POST['current-password']; 
$new_password = $_POST['new-password']; 
$height = $_POST['height']; 
$weight = $_POST['weight']; 
$target_weight = $_POST['target_weight']; 
$fitness_goal = $_POST['fitness_goal'];

// Verify current password 
$sql = "SELECT password FROM member WHERE member_id = ?"; 
$stmt = $dbConn->prepare($sql); 
$stmt->bind_param("i", $member_id); 
$stmt->execute(); 
$result = $stmt->get_result();

if ($result->num_rows > 0) { 
    $row = $result->fetch_assoc(); 
    $stored_password = $row['password'];

    // Verify password (assuming you're using password_hash/password_verify) 
    // If you're using a different hashing method, adjust accordingly 
    if (password_verify($current_password, $stored_password) || $current_password === $stored_password) { 
        // Password is correct, proceed with update
        
        // Start with basic updates including fitness metrics 
        $update_sql = "UPDATE member SET username = ?, email_address = ?, height = ?, weight = ?, target_weight = ?, fitness_goal = ? WHERE member_id = ?"; 
        $update_stmt = $dbConn->prepare($update_sql); 
        $update_stmt->bind_param("ssddssi", $username, $email, $height, $weight, $target_weight, $fitness_goal, $member_id); 
        $update_success = $update_stmt->execute();
        
        // If new password is provided, update it too 
        if (!empty($new_password)) { 
            // Check if your system uses password_hash or direct storage 
            // Adjust this based on your existing authentication method 
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT); 
            // Alternative if you're not using password_hash: 
            // $hashed_password = $new_password;
            
            $pwd_sql = "UPDATE member SET password = ? WHERE member_id = ?"; 
            $pwd_stmt = $dbConn->prepare($pwd_sql); 
            $pwd_stmt->bind_param("si", $hashed_password, $member_id); 
            $pwd_success = $pwd_stmt->execute();
            
            if (!$pwd_success) { 
                $response['message'] = 'Error updating password: ' . $dbConn->error; 
                echo json_encode($response); 
                exit; 
            } 
        }
        
        if ($update_success) { 
            // Update session variables 
            $_SESSION['username'] = $username;
            
            $response['success'] = true; 
            $response['message'] = 'Profile updated successfully'; 
        } else { 
            $response['message'] = 'Error updating profile: ' . $dbConn->error; 
        } 
    } else { 
        $response['message'] = 'Current password is incorrect'; 
    } 
} else { 
    $response['message'] = 'User not found'; 
}

// Return JSON response 
header('Content-Type: application/json'); 
echo json_encode($response); 
?>