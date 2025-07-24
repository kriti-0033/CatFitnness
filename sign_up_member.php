<?php
session_start();
include "conn.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $error = false;
    $errorMessage = "";

    $username = trim($_POST['username']);
    $email = trim($_POST['e-mail']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $age = (int)$_POST['age'];
    $gender = $_POST['gender'];
    $weight = (float)$_POST['weight'];
    $height = (float)$_POST['height'];
    $fitness_goal = $_POST['fitness-goal'];
    $target_weight = (float)$_POST['target-weight'];
    $start_streak = date('Y-m-d');

    foreach ($_POST as $key => $value) {
        if (empty(trim($value)) || (!isset($fitness_goal) || !isset($gender))) {
            $_SESSION['error_message'] = 'Please fill in all the required fields.';
            header("Location: sign_up_page.php");
            exit;
        }
    }

    if (($target_weight - $weight > 4) || ($weight - $target_weight > 4)) {
        $_SESSION['error_message'] = "Please enter a target weight range that is less that 4 gap";
        header("Location: sign_up_page.php");
        exit;
    } else if ((($weight < 0) || $target_weight < 0) || $height < 0) {
        $_SESSION['error_message'] = "Please enter an appropriate weight and height";
        header("Location: sign_up_page.php");
        exit;
    } else if ($age < 0 || $age > 100) {
        $_SESSION['error_message'] = "Please enter an appropriate age";
        header("Location: sign_up_page.php");
        exit;
    }

    $sql = "SELECT username FROM member WHERE username = '$username' 
            UNION 
            SELECT username FROM administrator WHERE username = '$username'";
    $result = $dbConn->query($sql);

    if ($result->num_rows > 0) {
        $_SESSION['error_message'] = "Username already taken, please choose another one.";
        header("Location: sign_up_page.php");
        exit;
    } 

    $sql = "SELECT email_address FROM member WHERE email_address = '$email'
            UNION
            SELECT email_address FROM administrator WHERE email_address = '$email'";
    $result = $dbConn->query($sql);

    if ($result->num_rows > 0) {
        $_SESSION['error_message'] = "Email is already in use, please use another e-mail";
        header("Location: sign_up_page.php");
        exit;
    } 

    $sql = "INSERT INTO member (`member_pic`, `username`, `email_address`, `password`, `level`, `height`, `weight`, `age`, `fitness_goal`, `target_weight`, `gender`, `day_streak_starting_date`, `last_session_date`, `weight_registered_date`, `date_registered`)
            VALUES ('Unknown_acc-removebg.png', '$username', '$email', '$password', 1, '$height',  '$weight', '$age', '$fitness_goal', '$target_weight', '$gender', '$start_streak', '$start_streak', '$start_streak', '$start_streak')";

    if ($dbConn->query($sql)) {
        echo '<script>
                alert("Account added successfully!");
                window.location.href = "login_page.php";
              </script>';
    } else {
        $_SESSION['error_message'] = "Error: " . $dbConn->error;
        header("Location: sign_up_page.php");
        exit;
    }
}

$dbConn->close();
?>
