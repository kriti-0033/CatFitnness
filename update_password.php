<?php
header("Content-Type: application/json");

include "conn.php";

$email = $_POST['email'] ?? "";
$newPass = password_hash($_POST['newPass'] ?? "", PASSWORD_DEFAULT);

$stmt = $dbConn->prepare("UPDATE member SET password = ? WHERE email_address = ?");
$stmt->bind_param("ss", $newPass, $email);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["message" => "Password updated"]);
} else {
    echo json_encode(["message" => "No record found with that name"]);
}

$stmt->close();
$dbConn->close();
?>