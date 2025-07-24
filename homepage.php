<?php
session_start();
include "conn.php";

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

$member_id = $_SESSION['member id'];
$current_date = date('Y-m-d');
$current_day_of_week = date('w', strtotime($current_date));
$current_day_of_week = ($current_day_of_week == 0) ? 7 : $current_day_of_week;
$start_of_current_week = date('Y-m-d', strtotime($current_date . ' -' . ($current_day_of_week - 1) . ' days'));
$end_of_current_week = date('Y-m-d', strtotime($start_of_current_week . ' +6 days'));

$query = "SELECT * FROM member_performance 
          WHERE member_id = ? AND weeks_date_mon = ?";
$stmt = $dbConn->prepare($query);
$stmt->bind_param("is", $member_id, $start_of_current_week);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    $diet_history_count = 0;
    $workout_history_count = 0;

    $insert_query = "INSERT INTO member_performance 
                     (member_id, weeks_date_mon, diet_history_count, workout_history_count) 
                     VALUES (?, ?, ?, ?)";
    $insert_stmt = $dbConn->prepare($insert_query);
    $insert_stmt->bind_param("isii", $member_id, $start_of_current_week, $diet_history_count, $workout_history_count);
    $insert_stmt->execute();
    $insert_stmt->close();
}

$sqlMember = "SELECT email_address,weight, height, target_weight,fitness_goal, gender, age, day_streak_starting_date, last_session_date, level 
              FROM member WHERE member_id = ?";
$stmtMember = $dbConn->prepare($sqlMember);
$stmtMember->bind_param("i", $member_id);
$stmtMember->execute();
$resultMember = $stmtMember->get_result();
$member = $resultMember->fetch_assoc();

$email_address = $member['email_address'];
$weight = $member['weight'];
$height = $member['height'];
$target_weight = $member['target_weight'];
$gender = $member['gender'];
$age = $member['age'];
$level = $member['level'];
$fitness_goal = $member['fitness_goal'];

$today = new DateTime();
$yesterday = (clone $today)->modify('-1 day');
$last_session_date = new DateTime($member['last_session_date']);
$day_streak_starting_date = new DateTime($member['day_streak_starting_date'] ?? date('Y-m-d'));

if (
    $last_session_date->format('Y-m-d') === $today->format('Y-m-d') ||
    $last_session_date->format('Y-m-d') === $yesterday->format('Y-m-d')
) {
} else {
    $day_streak_starting_date = $today;
}

$updateSql = "UPDATE member SET day_streak_starting_date = ?, last_session_date = ? WHERE member_id = ?";
$updateStmt = $dbConn->prepare($updateSql);
$formattedToday = $today->format('Y-m-d');
$formattedStreakStart = $day_streak_starting_date->format('Y-m-d');
$updateStmt->bind_param("ssi", $formattedStreakStart, $formattedToday, $member_id);
$updateStmt->execute();

$day_streak = $day_streak_starting_date->diff($today)->days + 1;

// Fetch total calories burned from workouts today
$sqlWorkout = "SELECT SUM(w.calories) AS total_workout_burned 
               FROM workout_history wh 
               JOIN workout w ON wh.workout_id = w.workout_id
               WHERE wh.member_id = ? AND DATE(wh.date) = CURDATE()";
$stmtWorkout = $dbConn->prepare($sqlWorkout);
$stmtWorkout->bind_param("i", $member_id);
$stmtWorkout->execute();
$resultWorkout = $stmtWorkout->get_result();
$workoutData = $resultWorkout->fetch_assoc();
$total_workout_calories_burned = $workoutData['total_workout_burned'] ?? 0;

// Fetch total calories consumed from diet today
$sqlDiet = "
    SELECT SUM(total_calories) AS total_diet_calories 
    FROM (
        -- Calories from predefined diets
        SELECT SUM(n.calories) AS total_calories
        FROM diet_history dh 
        JOIN diet d ON dh.diet_id = d.diet_id
        JOIN diet_nutrition dn ON d.diet_id = dn.diet_id
        JOIN nutrition n ON dn.nutrition_id = n.nutrition_id
        WHERE dh.member_id = ? AND DATE(dh.date) = CURDATE()
        
        UNION ALL
        
        -- Calories from custom diets
        SELECT SUM(cd.calories) AS total_calories
        FROM custom_diet cd
        WHERE cd.member_id = ? AND DATE(cd.date) = CURDATE()
    ) AS combined_calories;
";

$stmtDiet = $dbConn->prepare($sqlDiet);
$stmtDiet->bind_param("ii", $member_id, $member_id);
$stmtDiet->execute();
$resultDiet = $stmtDiet->get_result();
$dietData = $resultDiet->fetch_assoc();
$total_diet_calories = $dietData['total_diet_calories'] ?? 0;


// Fetch total workout duration
$sqlWorkoutTime = "SELECT SUM(w.duration) AS total_duration 
                   FROM workout_history wh 
                   JOIN workout w ON wh.workout_id = w.workout_id
                   WHERE wh.member_id = ? AND DATE(wh.date) = CURDATE()";
$stmtWorkoutTime = $dbConn->prepare($sqlWorkoutTime);
$stmtWorkoutTime->bind_param("i", $member_id);
$stmtWorkoutTime->execute();
$resultWorkoutTime = $stmtWorkoutTime->get_result();
$workoutTimeData = $resultWorkoutTime->fetch_assoc();
$total_workout_time = $workoutTimeData['total_duration'] ?? 0;

if (strtolower($gender) === 'male') {
    $bmr = 88.362 + (13.397 * $weight) + (4.799 * $height) - (5.677 * $age);
} else {
    $bmr = 447.593 + (9.247 * $weight) + (3.098 * $height) - (4.330 * $age);
}

$activity_level = 1.55;
$required_calories = $bmr * $activity_level;


$weight_difference = $target_weight - $weight;
$calories_per_kg = 7700;
$calories_required_monthly = $weight_difference * $calories_per_kg;

$calories_required_daily = $calories_required_monthly / 30;

$required_calories += $calories_required_daily;

// Calculate required calories to be burned through workouts daily (excluding BMR)
$required_workout_calories = max(0, $total_diet_calories - $required_calories);

$total_calories = round($total_diet_calories - $total_workout_calories_burned);
if ($total_calories <= 0) {
    $total_calories = 0;
}

// Calculate target day streak based on level
$target_day_streak = min(10 * ceil($level / 10), 50);

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["level_up"])) {
    $new_level = $level + 1;

    $new_streak_start_date = (new DateTime($day_streak_starting_date->format('Y-m-d')))
        ->modify("+$target_day_streak days")
        ->format('Y-m-d');

    $updateQuery = "UPDATE member SET level = ?, day_streak_starting_date = ? WHERE member_id = ?";
    $updateStmt = $dbConn->prepare($updateQuery);
    $updateStmt->bind_param("isi", $new_level, $new_streak_start_date, $member_id);
    $updateStmt->execute();

    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        echo json_encode(['success' => true, 'new_level' => $new_level]);
        exit;
    } else {
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    }
}


?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MewFit</title>
    <link rel="icon" type="./assets/image/x-icon" href="./assets/icons/cat-logo-tabs.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css">
    <link rel="stylesheet" href="./css/homepage.css">
    <link rel="stylesheet" href="./css/navigation_bar.css">
    <link rel="stylesheet" href="./css/gemini_chatbot.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/admin_homepage.js"></script>
    <script src="./js/navigation_bar.js"></script>
    <script src="./js/gemini_chatbot.js"></script>
    <style>
        .no-history {
            height: 250px;
            display: flex;
            flex: 1;
            justify-content: center;
            align-items: center;
            font-size: 18px;
            color: #666;
            text-align: center;
        }

        #recordWeight,
        #recordCalorie {
            width: 50%;
        }

        #recordWeight h6,
        #recordCalorie h6 {
            font-size: 18px;
            text-align: center;
            margin: 10px;
            font-weight: bold;
        }

        #recordWeight label,
        #recordCalorie label {
            font-size: 14px;
            margin: 15px;
        }

        .column {
            display: flex;
            width: 100%;
        }

        input {
            width: 70%;
            margin: 15px 0px 15px 0px;
            border: 3px solid #FFAD84;
            border-radius: 16px;
        }

        @media screen and (max-width: 935px) {

            #recordWeight h6,
            #recordCalorie h6 {
                font-size: 3.5vw;
            }

            #recordWeight label,
            #recordCalorie label {
                font-size: 3vw;
                margin: 15px;
            }

            .column {
                display: flex;
                width: 100%;
            }

            input {
                width: 70%;
                margin: 15px 0px 15px 0px;
                border: 3px solid #FFAD84;
                border-radius: 16px;
            }
        }
    </style>
</head>

<body>
    <div class="no-select">
        <!-- navigation bar -->
        <nav class="navbar" id="navbar">
            <div class="nav-links" id="nav-links">
                <span class="workout-home"><a href="#" class="active">HOME</a></span>
                <span class="workout-navbar"><a href="workout_page.php">WORKOUT</a></span>
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
                <div>
                    <?php
                    echo "
                        <img src=\"./uploads/member/{$_SESSION["member pic"]}\" alt=\"Profile\" id=\"profile-pic\">
                        ";
                    ?>
                </div>

                <div class="profile-dropdown" id="profile-dropdown">
                    <div class="profile-info">
                        <?php
                        echo "
                                <img src=\"./uploads/member/{$_SESSION["member pic"]}\" alt=\"Profile\" id=\"profile-pic\">
                                <div>
                                    <h3>{$_SESSION["username"]}</h3>
                                    <p>{$email_address}</p>
                                </div>
                                ";
                        ?>
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

        <!-- content -->
        <div class="content">
            <!-- ---------------------------------section 1-------------------------------- -->
            <section class="section1">
                <div class="s1-words">
                    <div class="greetings" style="display:flex;">
                        <h2 id='type'>Hello, <span style='color:#FF946E'><?php echo $_SESSION['username']; ?></span></h2>
                        <h2 class='cursor'>|</h2>
                    </div>

                    <p>Today is the workout time that you have long awaited for. <br>
                        Let's hit the workout time goal to get a mew mew! </p>

                    <div class="s1-icon">
                        <img src="assets/icons/calories or streak.svg" id="day-streak">
                        <p><?php echo $day_streak; ?></p>

                        <img src="assets/icons/level.svg" id="level">
                        <p>LV. <span id="level-num"><?php echo $level; ?></span></p>
                    </div>
                </div>
                <div id="cat-tower-section">
                    <img src="assets/icons/cat tower.svg" class="cat-tower">
                </div>
            </section>

            <!-- ----------------------------------section 2------------------------------- -->
            <section>
                <div class="section2-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                        <path d="M543.8 287.6c17 0 32-14 32-32.1c1-9-3-17-11-24L309.5 7c-6-5-14-7-21-7s-15 1-22 8L10 231.5c-7 7-10 15-10 24c0 18 14 32.1 32 32.1l32 0 0 160.4c0 35.3 28.7 64 64 64l320.4 0c35.5 0 64.2-28.8 64-64.3l-.7-160.2 32 0zM256 208c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 48 48 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-48 0 0 48c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-48-48 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l48 0 0-48z" />
                    </svg>
                    <h3>Fitness Summary</h3>
                </div>
                <div class="section2-containers">
                    <div class="section2-each-container">
                        <div class="fitness-summary-container" style="border: 2px solid rgb(255, 226, 120);">
                            <div style="display:flex;">
                                <img src="./assets/icons/total calories.svg">
                                <h4>Total Calories</h4>
                            </div>
                            <div class="section2-value"><span class="count-up"><?php echo $total_calories ?> </span>
                                <span style="color:#515151; font-size:14px;padding-top:10px;">
                                    / <?php echo round($required_calories); ?> kcal
                                </span>
                            </div>
                            <p>Including calories burnt</p>
                        </div>

                        <!-- Second Container: Calories Burnt from Workouts -->
                        <div class="fitness-summary-container" style="border: 2px solid #FFCBB1; animation-delay: 0.5s;">
                            <div style="display:flex;">
                                <img src="./assets/icons/calories or streak.svg" style="width:15px;">
                                <h4>Calories Burnt</h4>
                            </div>
                            <div class="section2-value"><span class="count-up"><?php echo $total_workout_calories_burned; ?></span>
                                <span style="color:#515151; font-size:14px;padding-top:10px;">
                                    / <?php echo round($required_workout_calories); ?> kcal
                                </span>
                            </div>
                            <p>Calories burnt from workout</p>
                        </div>
                    </div>

                    <div class="section2-each-container">
                        <!-- Third Container: Workout Time -->
                        <div class="fitness-summary-container" style="border: 2px solid #9ECBF5; animation-delay: 1s;">
                            <div style="display:flex;">
                                <img src="./assets/icons/workout time.svg" style="width:15px;">
                                <h4>Workout Time</h4>
                            </div>
                            <div class="section2-value"><span class="count-up"><?php echo round($total_workout_time); ?></span>
                                <span style="color:#515151; font-size:14px;padding-top:10px;">/30 min</span>
                            </div>
                            <p>Recommended minutes for workout today</p>
                        </div>

                        <!-- Fourth Container: Day Streaks -->
                        <div class="fitness-summary-container" style="border: 2px solid #BBF3AA; animation-delay: 1.5s;">
                            <div style="display:flex;">
                                <img src="./assets/icons/day streaks.svg" style="width:15px;">
                                <h4>Day Streaks</h4>
                            </div>
                            <div class="section2-value"><span class="count-up"><?php echo $day_streak; ?> </span>
                                <span style="color:#515151; font-size:14px;padding-top:10px;">/<?php echo $target_day_streak; ?> days</span>
                            </div>
                            <p>Days of consistency</p>
                        </div>
                    </div>
                </div>
                <?php
                $data2 = [
                    'total_diet_calories' => $total_diet_calories,
                    'total_workout_calories_burned' => $total_workout_calories_burned,
                    'required_calories' => $required_calories,
                    'required_workout_calories' => $required_workout_calories,
                    'total_workout_time' => $total_workout_time,
                    'day_streak' => $day_streak,
                    'target_day_streak' => $target_day_streak
                ];
                ?>
                <script>
                    const phpData = <?php echo json_encode($data2); ?>;
                    document.addEventListener("DOMContentLoaded", function() {
                        const containers = document.querySelectorAll(".fitness-summary-container");

                        containers.forEach(container => {
                            const h6 = container.querySelector(".section2-value");

                            if (h6) {
                                const metric = container.querySelector("h4").textContent.trim().toLowerCase();
                                const {
                                    value,
                                    target
                                } = getMetricValues(metric);

                                // Update background color based on value and target
                                updateBackgroundColor(container, value, target);
                            }
                        });

                        function getMetricValues(metric) {
                            switch (metric) {
                                case "total calories":
                                    return {
                                        value: phpData.total_diet_calories - phpData.total_workout_calories_burned,
                                            target: phpData.required_calories
                                    };
                                case "calories burnt":
                                    return {
                                        value: phpData.total_workout_calories_burned,
                                            target: phpData.required_workout_calories
                                    };
                                case "workout time":
                                    return {
                                        value: phpData.total_workout_time,
                                            target: 30 // Hardcoded target for workout time
                                    };
                                case "day streaks":
                                    return {
                                        value: phpData.day_streak,
                                            target: phpData.target_day_streak
                                    };
                                default:
                                    return {
                                        value: 0, target: 0
                                    };
                            }
                        }

                        function updateBackgroundColor(container, value, target) {
                            if (!isNaN(value) && !isNaN(target) && value >= target) {
                                let borderColor = window.getComputedStyle(container).borderColor || "rgb(255, 226, 120)"; // Default fallback
                                container.style.backgroundColor = borderColorToRGBA(borderColor, 0.5);
                            } else {
                                container.style.backgroundColor = ""; // Reset background color
                            }
                        }

                        function borderColorToRGBA(color, opacity) {
                            let rgb = color.match(/\d+/g);
                            if (rgb && rgb.length >= 3) {
                                return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
                            }
                            return color;
                        }
                    });
                </script>
            </section>

            <!-- -----------------------------------section 2a----------------------------- -->
            <!-- chart and details -->
            <?php
            //----------------------chart 1
            $sql2 = "
    SELECT
        DATE_FORMAT(MIN(weeks_date_mon), '%d %b %Y') AS period_label,
        AVG(current_weight) AS avg_weight
    FROM member_performance 
    WHERE member_id = ?
        AND weeks_date_mon >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
    GROUP BY YEAR(weeks_date_mon), WEEK(weeks_date_mon)
    ORDER BY MIN(weeks_date_mon) ASC;
";

            $stmt = $dbConn->prepare($sql2);
            $stmt->bind_param("i", $member_id);
            $stmt->execute();
            $result = $stmt->get_result();

            $labels = [];
            $weights = [];
            $hasValidWeights = false;

            if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $labels[] = $row["period_label"];
                    $weights[] = $row["avg_weight"];

                    if ($row["avg_weight"] !== null) {
                        $hasValidWeights = true;
                    }
                }
            }

            if ($result->num_rows == 0 || !$hasValidWeights) {
                $labels = [];
                $weights = [];

                $sqlFallback = "
        SELECT weight, DATE_FORMAT(weight_registered_date, '%d %b %Y') AS period_label
        FROM member
        WHERE member_id = ?
    ";

                $stmtFallback = $dbConn->prepare($sqlFallback);
                $stmtFallback->bind_param("i", $member_id);
                $stmtFallback->execute();
                $resultFallback = $stmtFallback->get_result();

                if ($resultFallback->num_rows > 0) {
                    while ($row = $resultFallback->fetch_assoc()) {
                        $labels[] = $row["period_label"];
                        $weights[] = $row["weight"];
                    }
                } else {
                    $labels[] = "No data available";
                    $weights[] = null;
                }
            }

            //chart 2
            $query = "
                    SELECT 
                        DATE_FORMAT(DATE_SUB(MIN(week_dates.week_start), INTERVAL WEEKDAY(MIN(week_dates.week_start)) DAY), '%d %b %Y') AS week_start_date,  
                        AVG(week_dates.total_calories) AS average_calories
                    FROM (
                        -- Calories from predefined diets
                        SELECT dh.date AS week_start, nutr.calories AS total_calories
                        FROM diet_history dh
                        JOIN diet_nutrition dn ON dh.diet_id = dn.diet_id
                        JOIN nutrition nutr ON dn.nutrition_id = nutr.nutrition_id
                        WHERE dh.member_id = ? 
                            AND dh.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)  

                        UNION ALL
                        
                        -- Calories from custom diets
                        SELECT cd.date AS week_start, cd.calories AS total_calories
                        FROM custom_diet cd
                        WHERE cd.member_id = ? 
                            AND cd.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                    ) AS week_dates
                    GROUP BY YEAR(week_dates.week_start), WEEK(week_dates.week_start)
                    ORDER BY MIN(week_dates.week_start) ASC;
                ";

            $stmt = $dbConn->prepare($query);
            $stmt->bind_param("ii", $member_id, $member_id);
            $stmt->execute();
            $result = $stmt->get_result();

            $nutritionData = [];
            while ($row = $result->fetch_assoc()) {
                $nutritionData[] = $row;
            }

            //-------------------------label for chart 1
            // target weight
            $sql_target = "SELECT weight, weight_registered_date, target_weight FROM member WHERE member_id = $member_id";
            $result_target = $dbConn->query($sql_target);
            $target_weight = 0;
            $registered_weight = 0;
            $weight_registered_date = "";

            if ($result_target->num_rows > 0) {
                while ($row_target = $result_target->fetch_assoc()) {
                    $target_weight = $row_target['target_weight'];
                    $registered_weight = $row_target['weight'];
                    $weight_registered_date = $row_target['weight_registered_date'];
                }
            }

            $current_weight = "-";
            $last_performance_weight = "-";
            $last_performance_date = "-";

            // Fetch last week's weight
            $start_of_last_week = date('Y-m-d', strtotime($start_of_current_week . ' -7 days'));
            $end_of_last_week = date('Y-m-d', strtotime($start_of_last_week . ' +6 days'));
            $sql_last_week = "SELECT current_weight FROM member_performance 
WHERE member_id = $member_id 
AND weeks_date_mon BETWEEN '$start_of_last_week' AND '$end_of_last_week' 
ORDER BY weeks_date_mon DESC LIMIT 1";
            $result_last_week = $dbConn->query($sql_last_week);
            $last_week_weight = "-";

            if ($result_last_week->num_rows > 0) {
                $row_last_week = $result_last_week->fetch_assoc();
                $last_week_weight = $row_last_week['current_weight'];
            }


            $latest_weight_query = "
SELECT current_weight, weeks_date_mon 
FROM member_performance 
WHERE member_id = ? AND current_weight IS NOT NULL
ORDER BY weeks_date_mon DESC 
LIMIT 1
";

            $latest_stmt = $dbConn->prepare($latest_weight_query);
            if ($latest_stmt) {
                $latest_stmt->bind_param("i", $member_id);
                $latest_stmt->execute();
                $latest_result = $latest_stmt->get_result();

                if ($latest_result->num_rows > 0) {
                    $latest_record = $latest_result->fetch_assoc();
                    $last_performance_weight = $latest_record['current_weight'];
                    $last_performance_date = $latest_record['weeks_date_mon'];
                }
                $latest_stmt->close();
            }

            if (!empty($last_performance_weight)) {
                $is_same_week = (
                    strtotime($weight_registered_date) >= strtotime($last_performance_date) &&
                    strtotime($weight_registered_date) < strtotime($last_performance_date . ' +6 days')
                );

                if ($is_same_week) {
                    $current_weight = $last_performance_weight;
                } else {
                    if (strtotime($weight_registered_date) >= strtotime($last_performance_date)) {
                        $current_weight = $registered_weight;
                    } else {
                        $current_weight = $last_performance_weight;
                    }
                }
            }

            if ($current_weight == "-" || $current_weight == 0) {
                $current_weight = $registered_weight;
            }

            function checkWeightGoal($currentWeight, $targetWeight, $fitnessGoal)
            {
                $currentWeight = floatval($currentWeight);
                $targetWeight = floatval($targetWeight);
                $fitnessGoal = strtolower($fitnessGoal);

                if ($fitnessGoal === "lose weight" && $currentWeight <= $targetWeight) {
                    return true;
                }

                if ($fitnessGoal === "gain muscle" && $currentWeight >= $targetWeight) {
                    return true;
                }

                return false;
            }

            // Weekly target calculation
            $weekly_target = "-";
            $registration_timestamp = strtotime($weight_registered_date);
            $current_timestamp = strtotime($current_date);
            $weeks_since_registration = floor(($current_timestamp - $registration_timestamp) / (7 * 24 * 60 * 60));

            $total_weeks_for_target = 4;
            $weeks_remaining = max(0, $total_weeks_for_target - $weeks_since_registration);

            if (!checkWeightGoal($current_weight, $target_weight, $fitness_goal)) {
                if ($weeks_remaining <= 1) {
                    $weekly_target = $target_weight;
                } else {
                    $remaining_weight_to_lose = floatval($current_weight) - floatval($target_weight);
                    $weekly_weight_loss = $remaining_weight_to_lose / $weeks_remaining;
                    $weekly_target = floatval($current_weight) - $weekly_weight_loss;
                }
            } else {
                $weekly_target = "-";
            }


            if ($current_weight != "-") {
                $current_weight = floatval($current_weight);
            }

            if ($last_week_weight != "-") {
                $last_week_weight = floatval($last_week_weight);
            }

            if ($weekly_target != "-") {
                $weekly_target = number_format(floatval($weekly_target), 2);
            }

            //-------------------------label for chart 2

            $queryToday = "
                    SELECT SUM(total_calories) AS total_calories_today
                    FROM (
                        -- Calories from predefined diets
                        SELECT SUM(nutr.calories) AS total_calories
                        FROM diet_history dh
                        JOIN diet_nutrition dn ON dh.diet_id = dn.diet_id
                        JOIN nutrition nutr ON dn.nutrition_id = nutr.nutrition_id
                        WHERE dh.member_id = ? AND DATE(dh.date) = CURDATE()
                        
                        UNION ALL
                        
                        -- Calories from custom diets
                        SELECT SUM(cd.calories) AS total_calories
                        FROM custom_diet cd
                        WHERE cd.member_id = ? AND DATE(cd.date) = CURDATE()
                    ) AS combined_calories;
                ";

            $stmt = $dbConn->prepare($queryToday);
            if ($stmt) {
                $stmt->bind_param("ii", $member_id, $member_id);

                $stmt->execute();
                $stmt->bind_result($totalCaloriesToday);
                $stmt->fetch();
                $stmt->close();
            }

            // average calories for this week
            $queryThisWeek = "
                    SELECT AVG(total_calories) AS avg_calories_this_week
                    FROM (
                        -- Calories from predefined diets
                        SELECT nutr.calories AS total_calories
                        FROM diet_history dh
                        JOIN diet_nutrition dn ON dh.diet_id = dn.diet_id
                        JOIN nutrition nutr ON dn.nutrition_id = nutr.nutrition_id
                        WHERE dh.member_id = ? AND dh.date BETWEEN ? AND ?
                        
                        UNION ALL
                        
                        -- Calories from custom diets
                        SELECT cd.calories AS total_calories
                        FROM custom_diet cd
                        WHERE cd.member_id = ? AND cd.date BETWEEN ? AND ?
                    ) AS combined_calories;
                ";

            $stmt = $dbConn->prepare($queryThisWeek);
            if ($stmt) {
                $stmt->bind_param("ississ", $member_id, $start_of_current_week, $end_of_current_week, $member_id, $start_of_current_week, $end_of_current_week);
                $stmt->execute();
                $stmt->bind_result($avgCaloriesThisWeek);
                $stmt->fetch();
                $stmt->close();
            }

            // Average calories for last week (including custom_diet)
            $queryLastWeek = "
                    SELECT AVG(total_calories) AS avg_calories_last_week
                    FROM (
                        -- Calories from predefined diets
                        SELECT nutr.calories AS total_calories
                        FROM diet_history dh
                        JOIN diet_nutrition dn ON dh.diet_id = dn.diet_id
                        JOIN nutrition nutr ON dn.nutrition_id = nutr.nutrition_id
                        WHERE dh.member_id = ? AND dh.date BETWEEN ? AND ?
                        
                        UNION ALL
                        
                        -- Calories from custom diets
                        SELECT cd.calories AS total_calories
                        FROM custom_diet cd
                        WHERE cd.member_id = ? AND cd.date BETWEEN ? AND ?
                    ) AS combined_calories;
                ";

            $stmt = $dbConn->prepare($queryLastWeek);
            if ($stmt) {
                $stmt->bind_param("ississ", $member_id, $start_of_last_week, $end_of_last_week, $member_id, $start_of_last_week, $end_of_last_week);
                $stmt->execute();
                $stmt->bind_result($avgCaloriesLastWeek);
                $stmt->fetch();
                $stmt->close();
            }

            $required_calories = $required_calories !==null? round($required_calories):0;
            $avgCaloriesThisWeek =$avgCaloriesThisWeek !==null? round($avgCaloriesThisWeek):0;
            $avgCaloriesLastWeek =$avgCaloriesLastWeek !==null? round($avgCaloriesLastWeek):0;

            $totalCaloriesToday = ($totalCaloriesToday === NULL || $totalCaloriesToday == 0) ? "-" : $totalCaloriesToday;
            $avgCaloriesThisWeek = ($avgCaloriesThisWeek === NULL || $avgCaloriesThisWeek == 0) ? "-" : $avgCaloriesThisWeek;
            $avgCaloriesLastWeek = ($avgCaloriesLastWeek === NULL || $avgCaloriesLastWeek == 0) ? "-" : $avgCaloriesLastWeek;
            ?>
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    const labels = <?php echo json_encode($labels); ?>;
                    const weights = <?php echo json_encode($weights); ?>;
                    const nutritionData = <?php echo json_encode($nutritionData); ?>;

                    const weightChart = document.getElementById("weightChart");
                    const dietChart = document.getElementById("dietChart");
                    const noChart1 = document.querySelector(".no-chart1");
                    const noChart2 = document.querySelector(".no-chart2");

                    if (labels.length > 0 && weights.length > 0) {
                        weightChart.style.display = "block";
                        noChart1.style.display = "none";

                        const ctx = weightChart.getContext("2d");
                        const minWeight = Math.min(...weights);
                        const weightYMin = minWeight === 0 ? 0 : Math.floor(minWeight) - 5;

                        new Chart(ctx, {
                            type: "bar",
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: "Weight (kg)",
                                    data: weights,
                                    backgroundColor: createGradient(ctx),
                                    borderColor: "#FFAD84",
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: false,
                                        min: weightYMin,
                                        title: {
                                            display: true,
                                            text: "Weight Progress (kg)"
                                        }
                                    },
                                    x: {
                                        title: {
                                            display: true,
                                            text: "Date"
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        weightChart.style.display = "none";
                        noChart1.style.display = "block";
                    }

                    if (nutritionData && nutritionData.length > 0) {
                        dietChart.style.display = "block";
                        noChart2.style.display = "none";

                        const ctxDiet = dietChart.getContext("2d");

                        const labels = nutritionData.map(item => item.week_start_date);
                        const avgCaloriesArray = nutritionData.map(item => item.average_calories);
                        const minCalories = Math.min(...avgCaloriesArray);
                        const caloriesYMin = minCalories === 0 ? 0 : Math.floor(minCalories) - 5;

                        new Chart(ctxDiet, {
                            type: "bar",
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: "Average Calories (kcal)",
                                    data: avgCaloriesArray,
                                    backgroundColor: createGradient(ctxDiet),
                                    borderColor: "#FFAD84",
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: false,
                                        min: caloriesYMin,
                                        title: {
                                            display: true,
                                            text: "Diet Progress (kcal)"
                                        }
                                    },
                                    x: {
                                        title: {
                                            display: true,
                                            text: "Date"
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        dietChart.style.display = "none";
                        noChart2.style.display = "block";
                    }

                    function createGradient(ctx) {
                        const gradient = ctx.createLinearGradient(0, 0, 0, 120);
                        gradient.addColorStop(0.5, "#FFAD84");
                        gradient.addColorStop(1, "rgb(255, 233, 212)");
                        return gradient;
                    }
                });
            </script>

            <!-- enter data -->
            <?php
            //enter calories
            $message = "";

            if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["meal_name"]) && isset($_POST["calorie"])) {
                $meal_name = trim($_POST["meal_name"]);
                $calorie = floatval($_POST["calorie"]);
                $date = date("Y-m-d");

                if (!empty($meal_name) && $calorie > 0) {
                    $query = "
                            INSERT INTO custom_diet (date, custom_diet_name, calories, member_id)
                            VALUES (?, ?, ?, ?)
                        ";
                    $stmt = $dbConn->prepare($query);
                    if ($stmt) {
                        $stmt->bind_param("ssdi", $date, $meal_name, $calorie, $member_id);
                        if ($stmt->execute()) {
                            $message = "Custom meal recorded successfully!";
                        } else {
                            $message = "Error recording custom meal: " . $stmt->error;
                        }
                        $stmt->close();
                    } else {
                        $message = "Prepare failed: " . $dbConn->error;
                    }
                } else {
                    $message = "Invalid input! Please provide a valid meal name and calorie value.";
                }
            }

            //enter weight
            if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["newweight"])) {
                $newWeight = floatval($_POST['newweight']);
                $currentWeekMonday = date('Y-m-d', strtotime('monday this week'));

                // Check if an entry for the current week exists
                $sql = "SELECT * FROM member_performance WHERE weeks_date_mon = ? AND member_id = ?";
                $stmt = $dbConn->prepare($sql);
                $stmt->bind_param("si", $currentWeekMonday, $member_id);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    // If the record exists, update it
                    $sql = "UPDATE member_performance SET current_weight = ? WHERE weeks_date_mon = ? AND member_id = ?";
                    $stmt = $dbConn->prepare($sql);
                    $stmt->bind_param("dsi", $newWeight, $currentWeekMonday, $member_id);
                }

                // Execute the query
                if ($stmt->execute()) {
                    echo json_encode(["status" => "success", "message" => "Weight recorded successfully!"]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Error: " . $stmt->error]);
                }

                exit();
            }

            ?>
            <script>
                function recordWeight() {
                    document.getElementById("displayWeight").style.display = "none";
                    document.getElementById("recordWeight").style.display = "block";
                }

                function goBackWeight() {
                    document.getElementById("recordWeight").style.display = "none";
                    document.getElementById("displayWeight").style.display = "block";
                }

                function recordWeightDone() {
                    const newweight = document.getElementById("newweight").value;

                    if (newweight !== "" && newweight > 0) {
                        const formData = new FormData();
                        formData.append("newweight", newweight);

                        fetch(window.location.href, {
                                method: "POST",
                                body: formData
                            })
                            .then(response => response.text())
                            .then(data => {
                                alert("New weight recorded!");
                                goBackWeight();
                                location.reload();
                            })
                            .catch(error => {
                                console.error("Error:", error);
                            });
                    } else {
                        alert("Please enter a valid weight!");
                    }
                }

                function recordCalorie() {
                    document.getElementById("displayCalorie").style.display = "none";
                    document.getElementById("recordCalorie").style.display = "block";
                }

                function goBackCalorie() {
                    document.getElementById("recordCalorie").style.display = "none";
                    document.getElementById("displayCalorie").style.display = "block";
                }

                function recordCalorieDone() {
                    const mealName = document.getElementById("meal_name").value;
                    const calorie = document.getElementById("calorie").value;

                    if (mealName.trim() !== "" && calorie > 0) {
                        const formData = new FormData();
                        formData.append("meal_name", mealName);
                        formData.append("calorie", calorie);

                        fetch(window.location.href, {
                                method: "POST",
                                body: formData
                            })
                            .then(response => response.text())
                            .then(data => {
                                alert("Meal recorded!");
                                document.getElementById("recordCalorie").style.display = "none";
                                document.getElementById("displayCalorie").style.display = "block";
                                location.reload();
                            })
                            .catch(error => {
                                console.error("Error:", error);
                            });
                    } else {
                        alert("Please enter a valid meal name and calorie value!");
                    }
                }
            </script>

            <!-- level up-->
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    // Pass PHP variables safely using json_encode
                    let dayStreak = <?php echo json_encode($day_streak); ?>;
                    let targetDayStreak = <?php echo json_encode($target_day_streak); ?>;
                    let level = <?php echo json_encode($level); ?>;
                    let currentWeight = <?php echo json_encode($current_weight); ?>;
                    let targetWeight = <?php echo json_encode($target_weight); ?>;
                    let fitnessGoal = <?php echo json_encode($fitness_goal); ?>;

                    // Weight goal check function
                    function checkWeight(currentWeight, targetWeight, goal) {
                        goal = goal.toLowerCase();
                        if (
                            (goal === "lose weight" && currentWeight <= targetWeight) ||
                            (goal === "gain muscle" && currentWeight >= targetWeight)
                        ) {
                            return "You have reached your target weight. Please update your personal info for your next target.";
                        }
                        return null;
                    }

                    // Check weight goal
                    const weightMessage = checkWeight(currentWeight, targetWeight, fitnessGoal);
                    if (weightMessage) {
                        alert(weightMessage);
                    }

                    // Streak and level up check
                    if (dayStreak >= targetDayStreak && level <= 50) {
                        if (confirm("🎉 Congratulations! You've reached your streak goal. Do you want to level up?")) {
                            let form = document.createElement('form');
                            form.method = 'POST';
                            form.action = window.location.href;

                            let levelInput = document.createElement('input');
                            levelInput.type = 'hidden';
                            levelInput.name = 'level_up';
                            levelInput.value = 'true';

                            form.appendChild(levelInput);
                            document.body.appendChild(form);
                            form.submit();
                        }
                    }

                    // Optional: Debug logging
                    console.log({
                        dayStreak,
                        targetDayStreak,
                        level,
                        currentWeight,
                        targetWeight,
                        fitnessGoal
                    });
                });
            </script>

            <section class="section2a">
                <div class="box" style="animation-delay:2s;">
                    <div style="display:flex;">
                        <img src="./assets/icons/your weight.png">
                        <h4> Your Weight</h4>
                    </div>
                    <div style="display:flex; justify-content: space-evenly;">
                        <div id="chart">
                            <p class="no-chart1">Oops! No Data Available. <br>Please try again later.</p>
                            <canvas id="weightChart"></canvas>
                        </div>

                        <div id="displayWeight">
                            <h5>Current Weight</h5>
                            <h6 id="currentWeight"><?= $current_weight ?> <span style="color:#868686;font-size:15px;">kg</span></h6>

                            <div class="section2a-description">
                                <h3>Overall Target</h3>
                                <p class="data-details" id="overallTarget"><?= $target_weight ?> <span>kg</span></p>
                            </div>

                            <div class="section2a-description">
                                <h3>Target This Week</h3>
                                <p class="data-details" id="targetThisWeek"> <?= $weekly_target ?><span> kg</span></p>
                            </div>

                            <div class="section2a-description">
                                <h3>Weight Last Week</h3>
                                <p class="data-details" id="averageLastWeek"><?= $last_week_weight ?> <span>kg</span></p>
                            </div>

                            <button onclick="recordWeight()">Record Weight</button>
                        </div>
                        <div id="recordWeight" style="display: none;">
                            <span style="color:#868686" onclick="goBackWeight()">
                                < Back</span>
                                    <div>
                                        <h6>Record New Weight</h6>
                                        <label>Current: <span><?= $current_weight ?></span></label>
                                        <div class="column">
                                            <label>New:</label>
                                            <input type="number" id="newweight" name="newweight" required step="0.01">
                                        </div>
                                    </div>
                                    <button onclick="recordWeightDone()">Record Weight</button>
                        </div>
                    </div>
                </div>
                <div class="box" style="animation-delay:2.5s;">
                    <div style="display:flex;">
                        <img src="./assets/icons/diet calories.png">
                        <h4> Diet Calories Today</h4>
                    </div>
                    <div style="display:flex;justify-content: space-evenly;">
                        <div id="chart">
                            <p class="no-chart2">Oops! No Data Available. <br>Please try again later.</p>
                            <canvas id="dietChart"></canvas>
                        </div>
                        <div id="displayCalorie">
                            <h5>Current Calorie Today</h5>
                            <h6><?= $totalCaloriesToday ?><span style="color:#868686;font-size:15px;"> kcal</span></h6>
                            <div class="section2a-description">
                                <h3>Target today</h3>
                                <p class="data-details"><?php echo $required_calories; ?><span> kcal</span></p>
                            </div>
                            <div class="section2a-description">
                                <h3>Average this week</h3>
                                <p class="data-details"><?php echo $avgCaloriesThisWeek ?><span> kcal</span></p>
                            </div>
                            <div class="section2a-description">
                                <h3>Average last week</h3>
                                <p class="data-details"><?php echo $avgCaloriesLastWeek ?><span> kcal</span></p>
                            </div>
                            <button onclick="recordCalorie()">Record Calorie Today</button>
                        </div>
                        <div id="recordCalorie" style="display: none;">
                            <span style="color:#868686" onclick="goBackCalorie()">
                                < Back</span>
                                    <div>
                                        <h6>New Custom Meal</h6>
                                        <div class="column">
                                            <label>Name:</label>
                                            <input type="text" id="meal_name" name="meal_name" required>
                                        </div>
                                        <div class="column">
                                            <label>Calorie:</label>
                                            <input type="number" id="calorie" name="calorie" required>
                                        </div>
                                    </div>
                                    <button onclick="recordCalorieDone()">Record Meal</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- workout history -->
        <section>
            <div class="section3">
                <h3 class="section2-title"><img src="https://static.thenounproject.com/png/2216254-200.png">Workout history</h3>
                <h4>
                    <a href="workout_history_page.php" style="text-decoration: none; color: inherit;">
                        View More <span style="padding-left: 20px;">></span>
                    </a>
                </h4>
            </div>
            <div class="workout-history-grid"></div>
        </section>

        <!-- diet history -->
        <section>
            <div class="section3">
                <h3 class="section2-title"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:24px;">
                        <path fill="#272020" d="M416 0C400 0 288 32 288 176l0 112c0 35.3 28.7 64 64 64l32 0 0 128c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 0-112 0-208c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 .1S34.2 4.6 32.4 12.5L2.1 148.8C.7 155.1 0 161.5 0 167.9c0 45.9 35.1 83.6 80 87.7L80 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-224.4c44.9-4.1 80-41.8 80-87.7c0-6.4-.7-12.8-2.1-19.1L191.6 12.5c-1.8-8-9.3-13.3-17.4-12.4S160 7.8 160 16l0 134.2c0 5.4-4.4 9.8-9.8 9.8c-5.1 0-9.3-3.9-9.8-9L127.9 14.6C127.2 6.3 120.3 0 112 0s-15.2 6.3-15.9 14.6L83.7 151c-.5 5.1-4.7 9-9.8 9c-5.4 0-9.8-4.4-9.8-9.8L64 16zm48.3 152l-.3 0-.3 0 .3-.7 .3 .7z" />
                    </svg>
                    Diet history</h3>
                <h4>
                    <a href="diet_history_page.php" style="text-decoration: none; color: inherit;">
                        View More <span style="padding-left: 20px;">></span>
                    </a>
                </h4>
            </div>
            <div class="diet-history-grid"></div>
        </section>

        <!-- load workout and diet history -->
        <?php
        $sql = "
                SELECT w.*
                FROM workout_history wh
                JOIN workout w ON wh.workout_id = w.workout_id
                WHERE wh.member_id = ?
                ORDER BY wh.date DESC
                LIMIT 6
            ";

        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $member_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $workouts = [];
        while ($row = $result->fetch_assoc()) {
            $workouts[] = $row;
        }

        // Fetch the latest 6 diets and sum the calories from the nutrition table
        $sql = "SELECT diet_id, diet_name, difficulty, preparation_min, total_calories, diet_type, date, picture
FROM (
    SELECT d.diet_id, d.diet_name, d.difficulty, d.preparation_min, 
           SUM(n.calories) AS total_calories, 'standard' AS diet_type, 
           dh.date, d.picture
    FROM diet_history dh
    JOIN diet d ON dh.diet_id = d.diet_id
    LEFT JOIN diet_nutrition dn ON dn.diet_id = d.diet_id
    LEFT JOIN nutrition n ON n.nutrition_id = dn.nutrition_id
    WHERE dh.member_id = ?
    GROUP BY d.diet_id, dh.date, d.picture
    
    UNION ALL
    
    -- Fetch custom diets
    SELECT cd.custom_diet_id AS diet_id, 
           cd.custom_diet_name AS diet_name, 
           NULL AS difficulty, 
           NULL AS preparation_min, 
           cd.calories AS total_calories, 
           'custom' AS diet_type, 
           cd.date, 
           NULL AS picture
    FROM custom_diet cd
    WHERE cd.member_id = ?
) AS combined_diets
ORDER BY date DESC, COALESCE(diet_id) DESC
LIMIT 6";

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


        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("ii", $member_id, $member_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $diets = [];
        while ($row = $result->fetch_assoc()) {
            $diets[] = $row;
        }

        // Combine both datasets into a single array
        $response = [
            'workouts' => !empty($workouts) ? $workouts : ['no_data' => true],
            'diets' => !empty($diets) ? $diets : ['no_data' => true]
        ];

        json_encode($response);

        ?>

        <script>
            const response = <?php echo json_encode($response); ?>;
            const workoutsData = '<?php echo addslashes(json_encode($workouts)); ?>';
            let workouts = response.workouts || [];
            let selectedWorkout = null;

            const createCard = (item, type) => {
                const cardId = type === 'workout' ? item.workout_id : item.diet_id;

                if (type === 'workout') {
                    const imageSrc = item.image || './assets/icons/error.svg';
                    return `
                    <div class="workout-card-content" data-id="${cardId}" data-workout-title="${item.workout_name}">
                        <div>
                            <img src="${imageSrc}" alt="${item.workout_name}" class="workout-image">
                        </div>
                        <div class="workout-info">
                            <h3 class="workout-title">${item.workout_name}</h3>
                            <span class="workout-level">${item.difficulty || ''}</span>
                            <div class="workout-stats">
                                <span><i class="fas fa-clock"></i> ${item.duration || ''} min</span>
                                <span><i class="fas fa-fire"></i> ${item.calories || 0} kcal</span>
                            </div>
                        </div>
                    </div>
                `;
                } else if (type === 'diet') {
                    const imageSrc = item.picture ? `./uploads/diet/${item.picture}` : './assets/icons/error.svg';
                    return `
                    <div class="diet-card-content" data-id="${cardId}" data-type="${item.diet_type}">
                        <div>
                            <img src="${imageSrc}" alt="${item.diet_name}" class="diet-image">
                        </div>
                        <div class="diet-info">
                            <h3 class="diet-title">${item.diet_name}</h3>
                            <span class="diet-level">${item.diet_type === 'standard' ? item.difficulty || '' : 'Custom'}</span>
                            <div class="diet-stats">
                                <span><i class="fas fa-clock"></i> ${item.diet_type === 'standard' ? item.preparation_min || '' : '-'}</span>
                                <span><i class="fas fa-fire"></i> ${item.total_calories || 0} kcal</span>
                            </div>
                        </div>
                    </div>
                `;
                }
            };

            const workoutGrid = document.querySelector('.workout-history-grid');
            const dietGrid = document.querySelector('.diet-history-grid');

            if (workoutGrid) {
                if (response.workouts && !response.workouts.no_data) {
                    workoutGrid.innerHTML = response.workouts.map(workout => createCard(workout, 'workout')).join('');
                    
                    workouts = response.workouts.map(workout => ({
                        id: workout.workout_id,
                        title: workout.workout_name,
                        description: workout.description || 'No description available',
                        duration: workout.duration || '0',
                        calories: workout.calories || '0',
                        level: workout.difficulty || 'Beginner',
                        image: workout.image,
                        exercise: workout.exercise_checklist
                    }));
                    
                    setupWorkoutCardClick();
                } else {
                    workoutGrid.innerHTML = '<div class="no-history">No workout available.</div>';
                }
            }

            if (dietGrid) {
                if (response.diets && !response.diets.no_data) {
                    dietGrid.innerHTML = response.diets.map(diet => createCard(diet, 'diet')).join('');

                    const dietCards = dietGrid.querySelectorAll('.diet-card-content');
                    dietCards.forEach(card => {
                        card.addEventListener('click', () => {
                            const dietId = card.getAttribute('data-id');
                            const dietType = card.getAttribute('data-type');

                            if (dietType === 'custom') {
                                // Handle custom diet click
                            } else {
                                window.location.href = `subdiet_page.php?diet_id=${dietId}`;
                            }
                        });
                        card.style.cursor = 'pointer';
                    });
                } else {
                    dietGrid.innerHTML = '<div class="no-history">No diet available.</div>';
                }
            }

            function updatePopupLevel(level) {
                const popupLevel = document.getElementById('popup-level');
                if (!popupLevel) return;

                const currentMeter = popupLevel.querySelector('.difficulty-meter');

                if (currentMeter) {
                    currentMeter.remove();
                }

                const meterContainer = document.createElement('div');
                meterContainer.className = `difficulty-meter ${level.toLowerCase()}`;

                for (let i = 0; i < 3; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'difficulty-bar';
                    meterContainer.appendChild(bar);
                }

                // Set active bars based on level
                const bars = meterContainer.querySelectorAll('.difficulty-bar');
                const activeBars = level.toLowerCase() === 'beginner' ? 1
                    : level.toLowerCase() === 'intermediate' ? 2
                        : 3;

                for (let i = 0; i < activeBars; i++) {
                    bars[i].classList.add('active');
                }

                popupLevel.innerHTML = '';
                popupLevel.appendChild(meterContainer);
            }

            function setupWorkoutCardClick() {
                const cards = document.querySelectorAll('.workout-card-content');
                if (!cards || cards.length === 0) {
                    console.log("No workout cards found");
                    return;
                }
                
                cards.forEach(card => {
                    const cardClone = card.cloneNode(true);
                    card.parentNode.replaceChild(cardClone, card);

                    cardClone.addEventListener('click', () => {
                        const workoutId = cardClone.getAttribute('data-id');
                        const workoutTitle = cardClone.getAttribute('data-workout-title');

                        // Find the workout in the workouts array
                        const workout = workouts.find(w => 
                            (w.id && w.id.toString() === workoutId) || 
                            (w.workout_id && w.workout_id.toString() === workoutId) || 
                            (w.title === workoutTitle) || 
                            (w.workout_name === workoutTitle)
                        );

                        if (!workout) {
                            console.error('Workout not found:', { id: workoutId, title: workoutTitle });
                            console.log('Available workouts:', workouts);
                            return;
                        }

                        selectedWorkout = workout;

                        const popup = document.getElementById('popup-container');
                        if (!popup) {
                            console.error('Popup container not found');
                            return;
                        }

                        const popupTitle = document.getElementById('popup-title');
                        if (popupTitle) {
                            popupTitle.textContent = (workout.title || workout.workout_name || '').toUpperCase();
                        }

                        const popupDesc = document.getElementById('popup-desc');
                        if (popupDesc) {
                            popupDesc.textContent = workout.description || '';
                        }

                        const popupDuration = document.getElementById('popup-duration');
                        if (popupDuration) {
                            const duration = typeof workout.duration === 'string'
                                ? (workout.duration.match(/\d+/) || ['0'])[0]
                                : workout.duration || '0';
                            popupDuration.textContent = duration;
                        }

                        const popupCalories = document.getElementById('popup-calories');
                        if (popupCalories) {
                            const calories = typeof workout.calories === 'string'
                                ? (workout.calories.match(/\d+/) || ['0'])[0]
                                : workout.calories || '0';
                            popupCalories.textContent = calories;
                        }

                        if (typeof updatePopupLevel === 'function') {
                            updatePopupLevel(workout.level || workout.difficulty || 'Beginner');
                        }

                        const workoutImage = document.getElementById('popup-workout-image');
                        if (workoutImage) {
                            if (workout.image) {
                                workoutImage.src = workout.image;
                                workoutImage.alt = `${workout.title || workout.workout_name} Image`;
                                workoutImage.style.objectFit = 'cover';
                            } else {
                                workoutImage.src = './assets/icons/error.svg';
                                workoutImage.alt = 'Workout Image Not Found';
                                workoutImage.style.objectFit = 'contain';
                                workoutImage.style.width = '60%';
                                workoutImage.style.height = 'auto';
                            }
                        }

                        if (typeof updateExerciseList === 'function') {
                            updateExerciseList(workout);
                        }

                        popup.classList.add('active');
                        setupPopupHandlers();
                    });
                });

                function setupPopupHandlers() {
                    const popup = document.getElementById('popup-container');
                    if (!popup) return;
                    
                    const closeButton = popup.querySelector('.popup-close');
                    if (closeButton) {
                        const newCloseButton = closeButton.cloneNode(true);
                        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
                        
                        newCloseButton.addEventListener('click', () => {
                            popup.classList.remove('active');
                            selectedWorkout = null;
                        });
                    }
                    
                    popup.addEventListener('click', (e) => {
                        if (e.target === popup) {
                            popup.classList.remove('active');
                            selectedWorkout = null;
                        }
                    });

                    const startButton = document.querySelector('.popup-start-button');
                    if (startButton) {
                        const newStartButton = startButton.cloneNode(true);
                        startButton.parentNode.replaceChild(newStartButton, startButton);
                        
                        newStartButton.addEventListener('click', () => {
                            if (selectedWorkout) {
                                const workoutForStorage = {
                                    workout_id: selectedWorkout.id || selectedWorkout.workout_id,
                                    workout_name: selectedWorkout.title || selectedWorkout.workout_name,
                                    difficulty: selectedWorkout.level || selectedWorkout.difficulty || 'Beginner',
                                    calories: selectedWorkout.calories || '0',
                                    duration: selectedWorkout.duration || '0',
                                    description: selectedWorkout.description || '',
                                    image: selectedWorkout.image || '',
                                    exercise_checklist: selectedWorkout.exercise_checklist || 
                                        (selectedWorkout.exercises ? JSON.stringify(selectedWorkout.exercises.map(e => e.id)) : '[]')
                                };

                                // Store as a single workout array
                                localStorage.setItem('currentWorkout', JSON.stringify([workoutForStorage]));
                                window.location.href = 'workout_history_page.php';
                            } else {
                                console.error('No workout selected');
                            }
                        });
                    }
                }
                // Setup popup close handlers
                const popup = document.getElementById('popup-container');
                if (popup) {
                    // Remove existing event listeners by cloning
                    const newPopup = popup.cloneNode(true);
                    popup.parentNode.replaceChild(newPopup, popup);
                    
                    // Add click event to the new popup
                    newPopup.addEventListener('click', (e) => {
                        if (e.target.classList.contains('popup-close') || e.target === newPopup) {
                            newPopup.classList.remove('active');
                            selectedWorkout = null;
                        }
                    });
                }

                function setupScrollArrows(grid) {
                    // Remove any existing wrapper and arrows
                    const parent = grid.parentElement;
                    const existingWrapper = parent.querySelector('.grid-wrapper');
                    if (existingWrapper) {
                        // Check if this is already the grid we need
                        const originalGrid = existingWrapper.querySelector(`.${grid.className}`);
                        if (originalGrid) {
                            existingWrapper.replaceWith(originalGrid);
                        }
                    }

                    // Create new wrapper and elements
                    const gridWrapper = document.createElement('div');
                    gridWrapper.className = 'grid-wrapper';
                    parent.insertBefore(gridWrapper, grid);
                    gridWrapper.appendChild(grid);

                    const gradientLeft = document.createElement('div');
                    gradientLeft.className = 'scroll-gradient scroll-gradient-left';
                    
                    const gradientRight = document.createElement('div');
                    gradientRight.className = 'scroll-gradient scroll-gradient-right';

                    const leftArrow = document.createElement('div');
                    leftArrow.className = 'scroll-arrow scroll-arrow-left';
                    leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';

                    const rightArrow = document.createElement('div');
                    rightArrow.className = 'scroll-arrow scroll-arrow-right';
                    rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';

                    gridWrapper.appendChild(gradientLeft);
                    gridWrapper.appendChild(gradientRight);
                    gridWrapper.appendChild(leftArrow);
                    gridWrapper.appendChild(rightArrow);

                    const updateArrowVisibility = () => {
                        const isAtStart = grid.scrollLeft <= 0;
                        const isAtEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1;
                        const hasOverflow = grid.scrollWidth > grid.clientWidth;

                        // Only show arrows and gradients if there's overflow
                        const showControls = hasOverflow && grid.children.length > 0;

                        gradientLeft.style.opacity = showControls && !isAtStart ? '1' : '0';
                        leftArrow.style.display = showControls && !isAtStart ? 'flex' : 'none';

                        gradientRight.style.opacity = showControls && !isAtEnd ? '1' : '0';
                        rightArrow.style.display = showControls && !isAtEnd ? 'flex' : 'none';
                    };

                    // Handle arrow clicks with stopPropagation
                    leftArrow.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        grid.scrollBy({
                            left: -300,
                            behavior: 'smooth'
                        });
                    });

                    rightArrow.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        grid.scrollBy({
                            left: 300,
                            behavior: 'smooth'
                        });
                    });

                    // Update arrow visibility on various events
                    grid.addEventListener('scroll', updateArrowVisibility);
                    window.addEventListener('resize', updateArrowVisibility);

                    // Initial check
                    setTimeout(updateArrowVisibility, 100); // Small delay to ensure content is rendered

                    // Add mutation observer to watch for content changes
                    const observer = new MutationObserver(updateArrowVisibility);
                    observer.observe(grid, { childList: true, subtree: true });

                    return { updateArrowVisibility };
                }

                // Apply scroll arrows to both workout and diet history grids
                function initializeScrollArrows() {
                    console.log('Initializing scroll arrows');
                    
                    // Setup for workout history
                    const workoutGrid = document.querySelector('.workout-history-grid');
                    if (workoutGrid) {
                        console.log('Setting up scroll arrows for workout history');
                        const workoutScroll = setupScrollArrows(workoutGrid);
                        
                        // Force update after content loads
                        if (response && response.workouts && !response.workouts.no_data) {
                            setTimeout(() => {
                                workoutScroll.updateArrowVisibility();
                            }, 300);
                        }
                    } else {
                        console.log('Workout history grid not found');
                    }
                    
                    // Setup for diet history
                    const dietGrid = document.querySelector('.diet-history-grid');
                    if (dietGrid) {
                        console.log('Setting up scroll arrows for diet history');
                        const dietScroll = setupScrollArrows(dietGrid);
                        
                        // Force update after content loads
                        if (response && response.diets && !response.diets.no_data) {
                            setTimeout(() => {
                                dietScroll.updateArrowVisibility();
                            }, 300);
                        }
                    } else {
                        console.log('Diet history grid not found');
                    }
                }

                // Initialize scroll arrows after the rest of the page loads
                if (document.readyState === 'complete') {
                    initializeScrollArrows();
                } else {
                    window.addEventListener('load', initializeScrollArrows);
                }
                
                // Also initialize after the workout and diet data is loaded
                if (typeof response !== 'undefined') {
                    initializeScrollArrows();
                }

                // Modify the existing createCard function to ensure cards have fixed width
                const originalCreateCard = createCard;
                window.createCard = function(item, type) {
                    const cardHTML = originalCreateCard(item, type);
                    return cardHTML;
                };
            }
        </script>


        <!-- Popup container -->
        <div id="popup-container" class="popup-container">
            <div class="popup-content" style="max-width: 800px; max-height: 370px">
                <div class="seperate-workout-pic-details">
                    <div class="popup-workout-pic">
                        <img id="popup-workout-image" src="" alt="Workout Image">
                    </div>
                    <div class="gradient-white"></div>
                    <div id="popup-body">
                        <span class="popup-close">&times;</span>
                        <h2 id="popup-title"></h2>
                        <p id="popup-desc"></p>
                        <div class="popup-stats" style="top:40px">
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
                        <button class="popup-start-button" style="top:40px">See more details</button>
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
</body>

</html>
<!-- -------cat tower------- -->
<script>
    // ------------------Cat Tower Stuff-----------------------------
    // Create new cat elements
    let userLevel = parseInt(document.getElementById("level-num")?.textContent, 10);

    const maxLevel = 50;
    const catsPerLevel = 9;
    const catDesigns = [
        './assets/icons/lvl 1 cat.svg',
        './assets/icons/lvl 2 cat.svg',
        './assets/icons/lvl 3 cat.svg',
        './assets/icons/lvl 4 cat.svg',
        './assets/icons/lvl 5 cat.svg',
    ];

    function updateCats() {
        const container = document.getElementById('cat-tower-section');

        let numCats = Math.min(userLevel, catsPerLevel); // Ensure max 9 cats

        let currentDesignIndex = Math.floor(userLevel / 10);
        let prevDesignIndex = Math.max(0, currentDesignIndex - 1);

        let newDesignCount = userLevel % 10;
        if (newDesignCount === 0 && userLevel > 0) {
            newDesignCount = 1;
        }

        let oldDesignCount = catsPerLevel - newDesignCount;

        for (let i = 0; i < numCats; i++) {
            const newCat = document.createElement('img');
            newCat.className = 'cat';

            if (userLevel >= maxLevel) {
                newCat.src = catDesigns[catDesigns.length - 1];
            } else {
                if (i < oldDesignCount) {
                    newCat.src = catDesigns[prevDesignIndex];
                } else {
                    newCat.src = catDesigns[currentDesignIndex];
                }
            }

            // Random position inside container
            const randomX = Math.random() * (container.clientWidth - 50);
            const randomY = Math.random() * (container.clientHeight - 50);
            newCat.style.left = `${randomX}px`;
            newCat.style.top = `${randomY}px`;

            container.appendChild(newCat);
        }

        attachSpeechBubbles();
        move();
    }


    // speech bubbles
    function attachSpeechBubbles() {
        const cats = document.querySelectorAll('.cat');

        cats.forEach(cat => {
            cat.addEventListener('mouseover', (event) => {
                const speech = document.createElement('div');
                speech.className = 'speech-bubble';
                speech.textContent = getRandomSpeech();

                document.body.appendChild(speech);

                // Position the speech bubble above the cat
                const catRect = cat.getBoundingClientRect();
                speech.style.left = `${catRect.left + catRect.width / 2}px`;
                speech.style.top = `${catRect.top - 30}px`;

                setTimeout(() => {
                    speech.remove();
                }, 1500);
            });

            cat.addEventListener('mouseout', () => {
                removeSpeechBubble();
            });

            cat.addEventListener('mousedown', () => {
                removeSpeechBubble();
            });
        });
    }

    function removeSpeechBubble() {
        const existingBubble = document.querySelector('.speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }
    }

    const speechTexts = [
        "Meow!",
        "cHonKy",
        "Leg day bro",
        "Feed me!",
        "Let's play!",
        "Nappy naps",
        "What's up dude?",
        "I'm watching you"
    ];

    function getRandomSpeech() {
        const randomIndex = Math.floor(Math.random() * speechTexts.length);
        return speechTexts[randomIndex];
    }

    // moving any cat
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let selectedElement = null;

    const move = function() {
        const elements = document.querySelectorAll('.cat');
        const container = document.getElementById('cat-tower-section');

        elements.forEach(element => {
            element.addEventListener('mousedown', dragStart);
        });

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            selectedElement = e.target;
            const rect = selectedElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;

            currentX = rect.left - containerRect.left;
            currentY = rect.top - containerRect.top;

            isDragging = true;
        }

        function drag(e) {
            if (!isDragging || !selectedElement) return;

            e.preventDefault();

            const containerRect = container.getBoundingClientRect();

            // Calculate the new position
            let newX = e.clientX - containerRect.left - initialX;
            let newY = e.clientY - containerRect.top - initialY;

            // Apply boundaries
            const maxX = containerRect.width - selectedElement.offsetWidth;
            const maxY = containerRect.height - selectedElement.offsetHeight;

            newX = Math.min(Math.max(0, newX), maxX);
            newY = Math.min(Math.max(0, newY), maxY);

            selectedElement.style.left = `${newX}px`;
            selectedElement.style.top = `${newY}px`;

            currentX = newX;
            currentY = newY;
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            selectedElement = null;
        }
    };

    window.onload = function() {
        updateCats();
    };
</script>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        // Select all workout records
        const records = document.querySelectorAll(".diet-card-content");

        records.forEach(record => {
            record.addEventListener("click", function() {
                const dietId = this.getAttribute("data-diet-id");
                if (dietId) {
                    window.location.href = `subdiet_page.php?diet_id=${dietId}`;
                }
            });
        });
    });
</script>