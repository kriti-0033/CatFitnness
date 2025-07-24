<?php
session_start();
if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

include "conn.php";

$response = ['success' => false, 'message' => ''];

if (!isset($_FILES['profile_pic']) || $_FILES['profile_pic']['error'] !== UPLOAD_ERR_OK) {
    $response['message'] = 'No file uploaded or upload error';
    echo json_encode($response);
    exit;
}

$file = $_FILES['profile_pic'];
$member_id = $_SESSION['member id'];

// 获取用户当前的头像文件名
$old_pic_query = "SELECT member_pic FROM member WHERE member_id = ?";
$stmt = $dbConn->prepare($old_pic_query);
$stmt->bind_param("i", $member_id);
$stmt->execute();
$stmt->bind_result($old_pic);
$stmt->fetch();
$stmt->close();

$allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
if (!in_array($file['type'], $allowed_types)) {
    $response['message'] = 'Only JPG, PNG, and GIF files are allowed';
    echo json_encode($response);
    exit;
}

$max_size = 2 * 1024 * 1024;
if ($file['size'] > $max_size) {
    $response['message'] = 'File size must be less than 2MB';
    echo json_encode($response);
    exit;
}

$filename = 'user_' . $member_id . '_' . time() . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
$upload_dir = './uploads/member/';

if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if (move_uploaded_file($file['tmp_name'], $upload_dir . $filename)) {
    $sql = "UPDATE member SET member_pic = ? WHERE member_id = ?";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("si", $filename, $member_id);
    
    if ($stmt->execute()) {
        // 成功上传新照片且数据库已更新，现在删除旧照片
        if (!empty($old_pic) && $old_pic != $filename && file_exists($upload_dir . $old_pic)) {
            unlink($upload_dir . $old_pic);
        }
        
        $_SESSION["member pic"] = $filename;
        
        $response['success'] = true;
        $response['message'] = 'Profile picture updated successfully';
    } else {
        $response['message'] = 'Database update failed: ' . $dbConn->error;
    }
} else {
    $response['message'] = 'Failed to save the uploaded file';
}

echo json_encode($response);
?>