<?php
session_start();

$servername = "localhost";
$username = "root";
$password = "Mangari2007!";
$dbname = "mewfit";

$conn = new mysqli($servername, $username, $password, $dbname);

$admin_page = "admin_homepage.php";
$homepage = "homepage.php";
$login = false;

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  
  $username = $_POST['username'];
  $password = $_POST['password'];

  $sql = "SELECT * FROM administrator";
  $result = $conn->query($sql);

  if (!$result) {
    die("Query failed: " . $conn->error);
  } else {

    while ($row = $result->fetch_assoc()) {
      if (($row['username'] == $username) && ($row['password'] == $password) || (($row['email_address'] == $username) && ($row['passowrd'] == $password))) {
        $login = true;
        
        $_SESSION["logged_in"] = true;
        $_SESSION["admin id"] = $row['admin_id'];
        $_SESSION["admin username"] = $row['username'];
        
        header("Location: " . $admin_page);
        exit();
      }
    }

  }

  $sql = "SELECT * FROM member";
  $result = $conn->query($sql);

  if (!$result) {
    die("Query failed: " . $conn->error);
  } else {

    while ($row = $result->fetch_assoc()) {
      if ((($row['username'] == $username) && password_verify($password, $row['password'])) || (($row['email_address'] == $username) && password_verify($password, $row['password']))) {
        $login = true;
        
        $_SESSION["logged_in"] = true;
        $_SESSION["member id"] = $row['member_id'];
        $_SESSION["username"] = $row['username'];
        $_SESSION["member pic"] = $row['member_pic'];
        $_SESSION["email"] = $row['email_address'];
        
        header("Location: " . $homepage);
        exit();
      }
    }
    
  }

  if (!$login) {
    echo '  <script>
            alert("Invalid username or password");
            window.location.href = "login_page.php";
            </script>
        ';
  }

}
?>