<?php
$servername = "localhost";
$username = "root"; 
$password = "Mangari2007!"; 
$dbname = "mewfit"; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (isset($_GET['username'])) {
    $user = trim($_GET['username']);

    $sql = "SELECT username FROM member WHERE username = ? 
            UNION 
            SELECT username FROM administrator WHERE username = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $user, $user);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo "<span style='color:red;'>(Username already taken)</span>";
    } else {
        echo "<span style='color:green;'>(Username available)</span>";
    }

    $stmt->close();
}
$conn->close();
?>
