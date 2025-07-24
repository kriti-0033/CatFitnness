<?php
$servername = "localhost";
$username = "root"; 
$password = "Mangari2007!"; 
$dbname = "mewfit"; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (isset($_GET['email'])) {
    $user = trim($_GET['email']);

    $sql = "SELECT email_address FROM member WHERE email_address = ? 
            UNION 
            SELECT email_address FROM administrator WHERE email_address = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $user, $user);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo "<span style='color:red;'>(E-mail is already in use)</span>";
    }

    $stmt->close();
}
$conn->close();
?>
