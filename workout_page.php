<?php
// Include database connection
require_once 'conn.php';
session_start();

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

// Function to fetch all workouts from the database
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

// Function to fetch exercises based on exercise IDs
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

function fetchRecentWorkouts($dbConn, $memberId , $limit = 6) {
    $query = "SELECT 
                workout_history.workout_history_id,
                workout_history.date,
                workout_history.workout_id,
                workout.workout_name,
                workout.workout_type,
                workout.calories,
                workout.duration,
                workout.image,
                workout.difficulty
                FROM workout_history 
                INNER JOIN workout 
                ON workout_history.workout_id = workout.workout_id
                WHERE workout_history.member_id = ?
                ORDER BY workout_history.date DESC
                LIMIT ?";
                
    $stmt = mysqli_prepare($dbConn, $query);
    mysqli_stmt_bind_param($stmt, "ii", $memberId , $limit);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    $recentWorkouts = [];
    
    if ($result && mysqli_num_rows($result) > 0) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Create workout object similar to the format used in your existing code
            $workout = [
                'id' => $row['workout_id'],
                'title' => $row['workout_name'],
                'type' => explode(',', $row['workout_type']),
                'level' => $row['difficulty'],
                'calories' => $row['calories'] . ' kcal',
                'duration' => $row['duration'] . ' min',
                'image' => $row['image'], // Use image or thumbnail
                'date' => $row['date']
            ];
            
            $recentWorkouts[] = $workout;
        }
    }
    
    return $recentWorkouts;
}

// Check if user is logged in
$recentUserWorkouts = [];
if (isset($_SESSION['member id'])) {
    $memberId = $_SESSION['member id'];
    $recentUserWorkouts = fetchRecentWorkouts($dbConn, $memberId );
}

function getCarouselWorkouts($workouts) {
    // Define the activity types
    $activityTypes = ['Cardio', 'Weighted', 'Weight-free', 'Yoga'];
    $carouselWorkouts = [];
    
    // For each activity type, find one random workout
    foreach ($activityTypes as $type) {
        $typeWorkouts = array_filter($workouts, function($workout) use ($type) {
            return in_array($type, $workout['type']);
        });
        
        if (!empty($typeWorkouts)) {
            $randomIndex = array_rand($typeWorkouts);
            $carouselWorkouts[] = $typeWorkouts[$randomIndex];
        }
    }
    
    // If we don't have enough workouts, fill remaining slots with random ones
    while (count($carouselWorkouts) < 4 && !empty($workouts)) {
        $randomIndex = array_rand($workouts);
        // Check if this workout is already in our carousel list
        $isDuplicate = false;
        foreach ($carouselWorkouts as $existing) {
            if ($existing['id'] == $workouts[$randomIndex]['id']) {
                $isDuplicate = true;
                break;
            }
        }
        
        if (!$isDuplicate) {
            $carouselWorkouts[] = $workouts[$randomIndex];
        }
    }
    
    return $carouselWorkouts;
}

// Fetch all workouts
$workouts = fetchWorkouts($dbConn);

// Get carousel workouts
$carouselWorkouts = getCarouselWorkouts($workouts);

// Get user profile info if logged in
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

// Close the database connection
mysqli_close($dbConn);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mewfit</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css">
    <link rel="icon" type="image/x-icon" href="./assets/icons/cat-logo-tabs.png">
    <link rel="stylesheet" href="./css/workout_page.css">
    <link rel="stylesheet" href="./css/navigation_bar.css">
    <link rel="stylesheet" href="./css/gemini_chatbot.css">
</head>
<body>
    <div class="no-select">
        <nav class="navbar" id="navbar">
            <div class="nav-links" id="nav-links">
                <span class="workout-home"><a href="homepage.php">HOME</a></span>
                <span class="workout-navbar"><a href="#" class="active">WORKOUT</a></span>
                <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo" id="nav-logo">
                <span class="workout-dietplan"><a href="diet_page.php">DIET PLAN</a></span>
                <span class="workout-settings"><a href="settings_page.php">SETTINGS</a></span>
            </div>
            <div class="header-right">
                <button id="hamburger-menu" aria-label="Menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo-responsive" id="nav-logo-responsive">
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

        <main class="main-content">
            <div class="content-header">
                <div class="content-title">
                    <h2 class="content-logo-name">MEWFIT</h2><h2 class="content-title-name">Workout Plan</h2>
                </div>
                <div class="search-backdrop"></div>
                <i id="search-close-btn" class="fa-solid fa-xmark"></i>
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search">
                    <div class="search-dropdown"></div>
                </div>
                <div class="search-bar-small" id="search-bar-small">
                    <i class="fas fa-search"></i>
                </div>
            </div>
        </main>

        <div class="workout-carousel">
            <div class="workout-track">
                <div class="workout-slides"></div>
            </div>
        </div>

        <section class="workout-body">
            <h2 class="section-title"><img src="./assets/icons/icons8-lightning-64.png">Activity Types</h2>
            <div class="activity-types">
                <div class="activity-card activity-card-all" id="default-selection">
                    <img src="./assets/icons/all workout.svg" alt="All">
                    <p>All</p>
                </div>
                <div class="activity-card activity-card-cardio">
                    <img src="./assets/icons/cardio.svg" alt="Cardio">
                    <p>Cardio</p>
                </div>
                <div class="activity-card activity-card-weighted">
                    <img src="./assets/icons/weighted.svg" alt="Weighted">
                    <p>Weighted</p>
                </div>
                <div class="activity-card activity-card-weightfree">
                    <img src="./assets/icons/weight free workout.svg" alt="Weight-free">
                    <p>Weight-free</p>
                </div>
                <div class="activity-card activity-card-yoga">
                    <img src="./assets/icons/yoga.svg" alt="Yoga">
                    <p>Yoga</p>
                </div>
                <!-- <div class="activity-card activity-card-meditation">
                    <img src="./assets/icons/meditation.svg" alt="Meditation">
                    <p>Meditation</p>
                </div> -->
            </div>
        </section>

        <section class="workout-body">
            <h2 class="section-title"><img src="./assets/icons/icons8-heart-50.png">Top Picks For You</h2>
            <div class="workout-grid"></div>
        </section>

        <section class="workout-body">
            <div class="workout-recently-title">
                <h2 class="section-title"><img src="./assets/icons/icons8-time-48.png">Recently Workout</h2>
                <a href="workout_history_page.php" style="text-decoration: none; color: inherit;  padding: 1.7rem 3rem 1rem 0">
                    View More <span style="padding-left: 10px;">></span>
                </a>
            </div>
            <div class="workout-grid" id="recently-workout-grid">
                <?php if (empty($recentUserWorkouts)): ?>
                    <div class="no-recent-workouts">
                        <p>You haven't completed any workouts recently yet. </p>
                        <p>Start your fitness journey today!</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($recentUserWorkouts as $workout): ?>
                        <div class="workout-card-recently" data-workout-id="<?php echo htmlspecialchars($workout['id']); ?>">
                            <div class="workout-card-image">
                                <img src="<?php echo htmlspecialchars($workout['image']); ?>" alt="<?php echo htmlspecialchars($workout['title']); ?>">
                            </div>
                            <div class="workout-card-content-recently">
                                <h3 class="workout-card-title"><?php echo htmlspecialchars($workout['title']); ?></h3>
                                <div class="workout-card-type">
                                    <?php foreach ($workout['type'] as $type): ?>
                                        <span><?php echo htmlspecialchars($type); ?></span>
                                    <?php endforeach; ?>
                                </div>
                                <div class="workout-card-stats-recently">
                                    <div class="workout-card-stat">
                                        <i class="fas fa-clock"></i>
                                        <span><?php echo htmlspecialchars(str_replace(' min', '', $workout['duration'])); ?> min</span>
                                    </div>
                                    <div class="workout-card-stat">
                                        <i class="fas fa-fire"></i>
                                        <span><?php echo htmlspecialchars(str_replace(' kcal', '', $workout['calories'])); ?> kcal</span>
                                    </div>
                                    <div class="workout-card-stat">
                                        <i class="fas fa-signal"></i>
                                        <span><?php echo htmlspecialchars($workout['level']); ?></span>
                                    </div>
                                </div>
                                <div class="workout-card-completed">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Completed: <?php echo date('d M Y', strtotime($workout['date'])); ?></span>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>

        <section class="workout-body">
            <h2 class="section-title"><img src="./assets/icons/icons8-cardio-50.png">Cardio</h2>
            <div class="workout-grid"></div>
        </section>

        <section class="workout-body">
            <h2 class="section-title"><img src="./assets/icons/icons8-gym-equipment-50.png">Weighted</h2>
            <div class="workout-grid"></div>
        </section>

        <section class="workout-body">
            <h2 class="section-title"><img src="./assets/icons/icons8-kettlebell-50.png">Weight-free</h2>
            <div class="workout-grid"></div>
        </section>

        <section class="workout-body">
            <h2 class="section-title"><img src="./assets/icons/icons8-yoga-50.png">Yoga</h2>
            <div class="workout-grid"></div>
        </section>

        <!-- Popup container -->
        <div id="popup-container" class="popup-container">
            <div class="popup-content">
                <div class="seperate-workout-pic-details">
                    <div class="popup-workout-pic">
                        <img id="popup-workout-image" src="" alt="Workout Image">
                    </div>
                    <div class="gradient-white"></div>
                    <div id="popup-body">
                        <span class="popup-close">&times;</span>
                        <h2 id="popup-title"></h2>
                        <p id="popup-desc"></p>
                        <!-- Exercise List Section -->
                        <div class="exercise-list-section">
                            <div class="exercise-list-wrapper">
                                <div class="exercise-list-arrow exercise-arrow-left">
                                    <i class="fas fa-chevron-left"></i>
                                </div>
                                <div class="exercise-list-container" id="exercise-list-container">
                                    <!-- Exercise items will be inserted here via JavaScript -->
                                </div>
                                <div class="exercise-list-arrow exercise-arrow-right">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                        <div class="popup-stats">
                            <div class="popup-stat-item">
                                <div class="popup-stat-value" id="popup-duration"></div>
                                <div class="popup-stat-label">Minutes</div>
                            </div>
                            <div class="popup-stat-item">
                                <div class="popup-stat-value" id="popup-calories"></div>
                                <div class="popup-stat-label">Kcal</div>
                            </div>
                            <div class="popup-stat-item">
                                <div class="popup-stat-value" id="popup-level"></div>
                                <div class="popup-stat-label">Level</div>
                            </div>
                        </div>
                        <button class="popup-start-button">Start Workout</button>
                    </div>
                </div>
            </div>
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

        <div class="container-side-transparent-left"></div>
        <div class="container-side-transparent-right"></div>
    </div>

    <!-- Add the workouts data for JavaScript -->
    <script>
        // Pass PHP workout data to JavaScript
        const workouts = <?php echo json_encode($workouts); ?>;
        const carouselWorkouts = <?php echo json_encode($carouselWorkouts); ?>;
        
        // Track currently selected workout
        let selectedWorkout = null;
        
        // Function to stop all videos
        function stopAllVideos() {
            document.querySelectorAll('.exercise-video').forEach(video => {
                if (!video.paused) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
            
            document.querySelectorAll('.video-overlay').forEach(overlay => {
                overlay.style.display = 'flex';
            });
            
            document.querySelectorAll('.play-button i').forEach(icon => {
                icon.className = 'fas fa-play';
            });
            
            globalCurrentlyPlaying = null;
        }
        
        // Function to force check arrows for exercise list
        function forceArrowCheck() {
            const container = document.getElementById('exercise-list-container');
            if (container) {
                const hasOverflow = container.scrollWidth > container.clientWidth;
                const arrowLeft = document.querySelector('.exercise-arrow-left');
                const arrowRight = document.querySelector('.exercise-arrow-right');
                
                if (arrowLeft && arrowRight) {
                    arrowLeft.style.display = hasOverflow ? 'flex' : 'none';
                    arrowRight.style.display = hasOverflow ? 'flex' : 'none';
                }
            }
        }
        
        // Function to setup exercise list arrows
        function setupExerciseListArrows() {
            const container = document.getElementById('exercise-list-container');
            const arrowLeft = document.querySelector('.exercise-arrow-left');
            const arrowRight = document.querySelector('.exercise-arrow-right');
            
            if (container && arrowLeft && arrowRight) {
                arrowLeft.addEventListener('click', () => {
                    container.scrollBy({
                        left: -200,
                        behavior: 'smooth'
                    });
                });
                
                arrowRight.addEventListener('click', () => {
                    container.scrollBy({
                        left: 200,
                        behavior: 'smooth'
                    });
                });
                
                container.addEventListener('scroll', () => {
                    const isAtStart = container.scrollLeft <= 0;
                    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
                    
                    arrowLeft.style.opacity = isAtStart ? '0.5' : '1';
                    arrowRight.style.opacity = isAtEnd ? '0.5' : '1';
                });
            }
        }
    </script>

    <!-- Load JavaScript files -->
    <script src="./js/workout_page.js"></script>
    <script src="./js/navigation_bar.js"></script>
    <script src="./js/gemini_chatbot.js"></script>
    <script src="./js/darkmode.js"></script>
</body>
</html>