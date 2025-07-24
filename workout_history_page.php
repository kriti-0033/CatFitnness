<?php

require_once 'conn.php';
$workouts = fetchWorkouts($dbConn);
session_start();  

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

function fetchWorkouts($dbConn) {
  $query = "SELECT * FROM workout ORDER BY date_registered DESC";
  $result = mysqli_query($dbConn, $query);
  
  $workouts = [];
  
  if ($result && mysqli_num_rows($result) > 0) {
      while ($row = mysqli_fetch_assoc($result)) {
          // Convert exercise_checklist from JSON string to array of IDs
          $exerciseIds = json_decode($row['exercise_checklist']);
          
          // Fetch the exercises for this workout
          $exercises = fetchExercisesForWorkout($exerciseIds);
          
          // Create workout object
          $workout = [
              'id' => $row['workout_id'],
              'title' => $row['workout_name'],
              'type' => explode(',', $row['workout_type']),
              'level' => $row['difficulty'],
              'calories' => $row['calories'] . ' kcal',
              'duration' => $row['duration'] . ' min',
              'description' => $row['description'],
              'long_description' => $row['long_description'],
              'sets' => $row['sets'],
              'image' => $row['image'],
              'exercises' => $exercises
          ];
          
          $workouts[] = $workout;
      }
  }
  
  return $workouts;
}

function fetchExercisesForWorkout($exerciseIds) {
  // Load the exercises from the JSON file
  $exercisesJson = file_get_contents('exercises.json');
  $allExercises = json_decode($exercisesJson, true);
  
  $workoutExercises = [];
  
  foreach ($exerciseIds as $id) {
      // Find the exercise with matching ID
      foreach ($allExercises as $exercise) {
          if ($exercise['id'] == $id) {
              $workoutExercises[] = $exercise;
              break;
          }
      }
  }
  
  return $workoutExercises;
}

$userProfile = [
  'name' => 'unknown',
  'email' => 'unknown',
  'image' => 'Unknown_acc-removebg.png'
];

if (isset($_SESSION['member id'])) {
  $memberId = $_SESSION['member id'];
  
  // Query the member table with the correct column names from your screenshot
  $query = "SELECT username, email_address, member_pic FROM member WHERE member_id = ?";
  $stmt = mysqli_prepare($dbConn, $query);
  mysqli_stmt_bind_param($stmt, "i", $memberId);
  mysqli_stmt_execute($stmt);
  $result = mysqli_stmt_get_result($stmt);
  
  if ($result && $row = mysqli_fetch_assoc($result)) {
      $userProfile = [
          'name' => $row['username'] ?? 'unknown',
          'email' => $row['email_address'] ?? 'unknown',
          'image' => !empty($row['member_pic']) ? $row['member_pic'] : 'Unknown_acc-removebg.png'
      ];
  }
}
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MewFit</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css"
    />
    <link
      rel="icon"
      type="image/x-icon"
      href="./assets/icons/cat-logo-tabs.png"
    />
    <link href="css/history.css" rel="stylesheet" />
    <link rel="stylesheet" href="./css/navigation_bar.css" />
    <link rel="stylesheet" href="./css/gemini_chatbot.css" />
    <link
      href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
      rel="stylesheet"
    />
    <script defer src="./js/workout_history_page.js"></script>
  </head>
  <body>
    <div class="no-select">
      <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
          <span class="workout-home">
            <a href="homepage.php" class="active">HOME</a>
          </span>
          <span class="workout-navbar"><a href="workout_page.php">WORKOUT</a></span>
          <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo" id="nav-logo"/>
          <span class="workout-dietplan">
            <a href="diet_page.php">DIET PLAN</a>
          </span>
          <span class="workout-settings">
            <a href="settings_page.php">SETTINGS</a>
          </span>
        </div>
        <div class="header-right">
          <button id="hamburger-menu" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo-responsive" id="nav-logo-responsive"/>
        <div class="profile">
          <img src="./uploads/member/<?php echo htmlspecialchars($userProfile['image']); ?>" alt="Profile" id="profile-pic">
          <div class="profile-dropdown" id="profile-dropdown">
              <div class="profile-info">
                  <img src="./uploads/member/<?php echo htmlspecialchars($userProfile['image']); ?>" alt="<?php echo htmlspecialchars($userProfile['name']); ?>">
                  <div>
                      <h3><?php echo htmlspecialchars($userProfile['name']); ?></h3>
                      <p><?php echo htmlspecialchars($userProfile['email']); ?></p>
                  </div>
              </div>
              <ul>
                  <li><a href="settings_page.php" class="settings-profile"><i class="fas fa-cog"></i>Settings</a></li>
                  <li>
                  <i class="fas fa-moon"></i> Dark Mode
                  <label class="switch">
                      <input type="checkbox" name="dark-mode-toggle" id="dark-mode-toggle">
                      <span class="slider round"></span>
                  </label>
                  </li>
                  <li><a href="FAQ_page.html" class="help-center-profile"><i class="fas fa-question-circle"></i>Help </a></li>
                  <li class="logout-profile" id="logout-profile"><i class="fas fa-sign-out-alt"></i> Logout</li>
              </ul>
          </div>
      </div>
      </nav>
      <header class="page-header">
        <button class="previous"><i class="bx bxs-chevron-left"></i></button>
        <h1>Workout</h1>
      </header>

      <div class="filter-controls">
        <button id="all-filter" class="filter-button">
          <span class="filter-text">All</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        
        <button id="date-range-filter" class="filter-button">
          <span class="filter-text">Date Range</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        
        <!-- Activity Types Dropdown -->
        <div id="activity-types-dropdown" class="filter-dropdown">
          <div class="dropdown-content">
            <div class="activity-type-option" data-type="All">All</div>
            <div class="activity-type-option" data-type="Cardio">Cardio</div>
            <div class="activity-type-option" data-type="Weighted">Weighted</div>
            <div class="activity-type-option" data-type="Weight-free">Weight-free</div>
            <div class="activity-type-option" data-type="Yoga">Yoga</div>
          </div>
        </div>
        
        <!-- Date Range Picker -->
        <div id="date-range-picker" class="filter-dropdown date-picker-dropdown">
          <div class="dropdown-content">
            <div class="date-picker-header">
              <h3>Select Date Range</h3>
              <button id="close-date-picker" class="close-button">×</button>
            </div>
            <div class="date-inputs">
              <div class="date-input-group">
                <label for="start-date">From</label>
                <input type="date" id="start-date" name="start-date">
              </div>
              <div class="date-input-group">
                <label for="end-date">To</label>
                <input type="date" id="end-date" name="end-date">
              </div>
            </div>
            <div class="date-filter-buttons">
              <button id="apply-date-filter" class="apply-date-btn">Apply</button>
              <button id="reset-date-filter" class="reset-date-btn">Reset</button>
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <?php
            include "conn.php";

            $exist_record = false;

            $sql = "SELECT 
                    workout_history.workout_history_id,
                    workout_history.date,
                    workout_history.member_id,
                    workout_history.workout_id,
                    workout.workout_name,
                    workout.workout_type,
                    workout.calories,
                    workout.duration,
                    workout.image
                    FROM workout_history 
                    INNER JOIN workout 
                    ON workout_history.workout_id = workout.workout_id
                    ORDER BY workout_history.date DESC"; // connect the workout_history table and workout table

            $result = $dbConn->query($sql); // create a variable and store the sql query result inside it

            function getWorkoutTypes($dbConn) {
              $types = [];
              $sql = "SELECT DISTINCT workout_type FROM workout";
              $result = $dbConn->query($sql);
              
              if ($result && $result->num_rows > 0) {
                  while ($row = $result->fetch_assoc()) {
                      $types[] = $row['workout_type'];
                  }
              }
              
              return $types;
            }

            $workoutTypes = getWorkoutTypes($dbConn);
            
            function formatDate($date) {
              if ($date == date("Y-m-d")) {
                  return "Today";
              } else if ($date == date("Y-m-d", strtotime("-1 day"))) {
                  return "Yesterday";
              } else {
                  return date('d F Y', strtotime($date)); 
              }
            }

            function displayWorkoutRecord($row, $workout_date) {
              $output = "<div class=\"workout-date\">
                        <p>{$workout_date}</p>
                        </div>
                        <div class=\"workout-record\" data-workout-id=\"{$row['workout_id']}\" data-date=\"{$row['date']}\" data-type=\"{$row['workout_type']}\">
                        <img
                        class=\"picture\"
                        src=\"{$row['image']}\"
                        alt=\"{$row['workout_name']}\"
                        />
                        <p class=\"name\">{$row['workout_name']}</p>
                        <p class=\"type\">{$row['workout_type']}</p>
                        <p class=\"kcal\">{$row['calories']}kcal</p>
                        <p class=\"time\">{$row['duration']}min</p>
                        </div>
                      ";
              return $output;
          }

          echo '<div class="main-content">';

          while ($row = $result->fetch_assoc()) {
            $workout_date = formatDate($row['date']);
        
            if ($row['member_id'] == $_SESSION['member id']) {
                $exist_record = true;
                echo displayWorkoutRecord($row, $workout_date);
            }
          }
          
          // If no records found, show message
          if (!$exist_record) {
              echo "<div class=\"no-filtered-records\">
                      <p>Workout history still not available. Let's have a workout!</p>
                    </div>";
          }
          
          // Close the main-content div
          echo '</div>';

          $dbConn->close();
        ?>
      </div>

      <!-- Chatbot Interface -->
      <div class="chatbot-container">
            <div class="chatbot-header">
                <div class="chatbot-header-left">
                    <img src="./assets/icons/cat-logo-tabs.png">
                    <h3>MEWAI</h3>
                </div>
                <button class="close-chat">&times;</button>
            </div>
            <div class="chatbot-transparent-top-down"></div>
            <div class="chatbot-messages"></div>
            <div class="chatbot-input">
                <input type="text" placeholder="Ask me about fitness...">
                <button class="send-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
        <button class="chatbot-toggle">
            <img class="chatbot-img" src="./assets/icons/cat-logo-tabs.png">
        </button>
      </div>

      <div class="container-side-transparent-left"></div>
      <div class="container-side-transparent-right"></div>
    </div>
  </body>
  <script>
    const workoutsData = '<?php echo addslashes(json_encode($workouts)); ?>';
  </script>
  <script src="./js/navigation_bar.js"></script>
  <script src="./js/gemini_chatbot.js"></script>
  <script src="./js/darkmode.js"></script>
</html>
