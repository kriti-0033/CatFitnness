<?php
require_once 'conn.php';
session_start(); 

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

$member_id = $_SESSION["member id"];

$workout_id = isset($_GET['workout_id']) ? intval($_GET['workout_id']) : 0;

// Get workout details
$workout_name = "Default Workout";
$workout_exercises = [];

if ($workout_id > 0) {
    // Get workout name and details
    $sql = "SELECT workout_name FROM workout WHERE workout_id = ?";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("i", $workout_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $workout_name = $row["workout_name"];
    }
    
    // Get workout exercises
    $sql = "SELECT * FROM workout WHERE workout_id = ? ORDER BY exercise_checklist";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("i", $workout_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $workout_exercises[] = $row;
    }
}

// Get user performance data
$sql = "SELECT * FROM member_performance WHERE member_id = ? ORDER BY performance_id DESC LIMIT 1";
$stmt = $dbConn->prepare($sql);
$stmt->bind_param("i", $member_id);
$stmt->execute();
$performance_result = $stmt->get_result();
$current_performance = $performance_result->fetch_assoc();

// Get user profile data
$sql = "SELECT * FROM member WHERE member_id = ?";
$stmt = $dbConn->prepare($sql);
$stmt->bind_param("i", $member_id);
$stmt->execute();
$member_result = $stmt->get_result();
$member_data = $member_result->fetch_assoc();
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mewfit</title>
        <link rel="stylesheet" href="./css/subworkout_page.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css">
        <link rel="icon" type="image/x-icon" href="./assets/icons/cat-logo-tabs.png">
        
        <!-- Real-time pose detection -->
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter"></script> -->
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"></script>
    </head>
    <body>
        <div class="header">
            <div class="timer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
                <div class="timer-text">0:00</div>
            </div>
            <div class="workout-details">
                <div class="workout-name">Workout Name</div>
                <div class="workout-round">1/20</div>
            </div>
            <div id="close-btn" class="close-btn">
                <i id="close-btn-icon" class="fa-solid fa-xmark"></i>
            </div>
        </div>
        <div class="workout-container">
            <div class="workout-guide">
            </div>
            <div class="workout-user"></div>
            <button class="switch-view-btn" onclick="toggleCameraView()">Switch to Camera</button> 
        </div>
        <div class="bottom">
            <div class="control-panel">
                <div class="pause">
                    <i id="pause-btn-icon" class="fa-solid fa-pause"></i>
                    <p class="pause-text">Pause</p>
                </div>
                <div class="skip">
                    <i class="fa-solid fa-forward"></i>
                </div>
            </div>
            <div class="workout-settings">
                <div id="music" class="music music-btn">
                    <i class="fa-solid fa-music"></i>
                </div>
                <div id="more" class="more">
                    <i class="fa-solid fa-ellipsis"></i>
                </div>
            </div>
        </div>

        <!-- Popup container -->
        <div id="popup-container" class="popup-container">
            <div id="popup-container" class="popup-content">
                <h2 id="popup-title"></h2>
                <div id="popup-body"></div>
            </div>
        </div>

        <div id="form-feedback" class="form-feedback-container">
            <!-- Feedback alerts will be inserted here -->
        </div>

        <div id="popup-container-more" class="popup-container-more"></div>

    </body>
    <script>
        const workoutData = <?php echo json_encode($workout_exercises); ?>;
        const memberData = <?php echo json_encode($member_data); ?>;
        const performanceData = <?php echo json_encode($current_performance); ?>;
        const workoutId = <?php echo $workout_id; ?>;
        const memberId = <?php echo $member_id; ?>;
    </script>
    <script src="./js/darkmode.js"></script>
    <script src="./js/subworkout_page.js"></script>
    <script src="https://code.responsivevoice.org/responsivevoice.js?key=PkV2hzuC"></script>
</html>