<?php
session_start();
if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

include "conn.php";

$member_id = $_SESSION['member id'];
$sqlMember = "SELECT email_address FROM member WHERE member_id = ?";
$stmtMember = $dbConn->prepare($sqlMember);
$stmtMember->bind_param("i", $member_id);
$stmtMember->execute();
$resultMember = $stmtMember->get_result();
$member = $resultMember->fetch_assoc();
$email_address = $member['email_address'];

// Main diets query - this appears to be for the general diet page
$sql = "SELECT d.diet_id, d.diet_name, d.description, d.picture, d.difficulty, d.preparation_min, 
        d.diet_type, MAX(dh.date) as latest_date
        FROM diet d
        LEFT JOIN diet_history dh ON dh.diet_id = d.diet_id AND dh.member_id = ?
        GROUP BY d.diet_id, d.diet_name, d.description, d.picture, d.difficulty, d.preparation_min, d.diet_type
        ORDER BY latest_date DESC, d.diet_id DESC";

$stmt = $dbConn->prepare($sql);
$stmt->bind_param("i", $member_id);
$stmt->execute();
$result = $stmt->get_result();

$diets = [];
while ($row = $result->fetch_assoc()) {
    // Get calories for this diet
    $sqlCalories = "SELECT SUM(n.calories) AS total_calories 
                   FROM diet_nutrition dn
                   JOIN nutrition n ON n.nutrition_id = dn.nutrition_id
                   WHERE dn.diet_id = ?";
    $stmtCalories = $dbConn->prepare($sqlCalories);
    $stmtCalories->bind_param("i", $row['diet_id']);
    $stmtCalories->execute();
    $calories = $stmtCalories->get_result()->fetch_assoc();

    // Format the diet data
    $diets[] = [
        'diet_id' => $row['diet_id'],
        'title' => $row['diet_name'],
        'description' => $row['description'] ?? 'No description available',
        'level' => $row['difficulty'],
        'duration' => $row['preparation_min'] . ' min',
        'calories' => ($calories['total_calories'] ?? 0) . ' kcal',
        'type' => [$row['diet_type']],
        'image' => "./uploads/diet/{$row['picture']}"
    ];
}

$response = [
    'diets' => !empty($diets) ? $diets : ['no_data' => true]
];

// Query to get the recent diet history for this member
$sqlRecentDiets = "SELECT 
        diet_history.diet_history_id,
        diet_history.date,
        diet_history.diet_id,
        diet.diet_name,
        diet.diet_type,
        diet.preparation_min,
        diet.picture
        FROM diet_history 
        INNER JOIN diet 
        ON diet_history.diet_id = diet.diet_id
        WHERE diet_history.member_id = ?
        ORDER BY diet_history.date DESC
        LIMIT 3"; 

$stmtRecentDiets = $dbConn->prepare($sqlRecentDiets);
$stmtRecentDiets->bind_param("i", $member_id);
$stmtRecentDiets->execute();
$resultRecentDiets = $stmtRecentDiets->get_result();

$recentUserDiets = [];
if ($resultRecentDiets->num_rows > 0) {
    while($row = $resultRecentDiets->fetch_assoc()) {
        $recentUserDiets[] = [
            'id' => $row['diet_id'],
            'title' => $row['diet_name'],
            'type' => $row['diet_type'],
            'duration' => $row['preparation_min'] . ' min',
            'image' => !empty($row['picture']) ? './uploads/diet/' . $row['picture'] : './assets/icons/error.svg',
            'date' => $row['date']
        ];
    }
}
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mewfit</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css">
        <link rel="icon" type="image/x-icon" href="./assets/icons/cat-logo-tabs.png">
        <link rel="stylesheet" href="./css/diet_page.css">
        <link rel="stylesheet" href="./css/navigation_bar.css">
        <link rel="stylesheet" href="./css/gemini_chatbot.css">
    </head>
    <body>
        <div class="no-select">
            <nav class="navbar" id="navbar">
                <div class="nav-links" id="nav-links">
                    <span class="workout-home"><a href="homepage.php">HOME</a></span>
                    <span class="workout-navbar"><a href="workout_page.php">WORKOUT</a></span>
                    <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo" id="nav-logo">
                    <span class="workout-dietplan"><a href="#" class="active">DIET PLAN</a></span>
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
                        <?php echo "<img src=\"./uploads/member/{$_SESSION["member pic"]}\" alt=\"Profile\" id=\"profile-pic\">"; ?>
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

            <main class="main-content">
                <div class="content-header">
                    <div class="content-title">
                        <h2 class="content-logo-name">MEWFIT</h2>
                        <h2 class="content-title-name">Diet Plan</h2>
                    </div>
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search">
                    </div>
                    <div class="search-bar-small">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
            </main>

            <div class="diet-carousel">
                <div class="diet-track">
                    <div class="diet-slides"></div>
                </div>
            </div>

            <!-- Need to fix -->
            <!-- Categories Section -->
            <section class="diet-body">
                <h2 class="section-title"><img src="./assets/icons/icons8-lightning-64.png">Categories</h2>
                <div class="activity-types">
                    <div class="activity-card activity-card-all" id="default-selection">
                        <img src="./assets/icons/all diet.svg" alt="All">
                        <p>All</p>
                    </div>
                    <div class="activity-card activity-card-vegetarian">
                        <img src="./assets/icons/vegetarian.svg" alt="vegetarian">
                        <p>Vegetarian</p>
                    </div>
                    <div class="activity-card activity-card-vegan">
                        <img src="./assets/icons/vegan.svg" alt="vegan">
                        <p>Vegan</p>
                    </div>
                    <div class="activity-card activity-card-meat">
                        <img src="./assets/icons/meat.svg" alt="meat">
                        <p>Meat</p>
                    </div>
                </div>
            </section>

            <!-- Top Picks Section -->
            <section class="diet-body">
                <h2 class="section-title"><img src="./assets/icons/icons8-heart-50.png">Top Picks For You</h2>
                <div class="diet-grid"></div>
            </section>

            <!-- Recent Meals Section -->
            <!-- <section class="diet-body">
                <div class="diet-recently-title">
                    <h2 class="section-title"><img src="./assets/icons/icons8-time-48.png">Recently Meals</h2>
                    <a href="diet_history_page.php" style="text-decoration: none; color: inherit; padding: 1.7rem 3rem 1rem 0">
                        View More <span style="padding-left: 10px;">></span>
                    </a>
                </div>
                <div class="diet-grid" id="recently-diet-grid">
                    <?php if (empty($recentUserDiets)): ?>
                        <div class="no-recent-diets">
                            <p>You haven't added any meals to your diet history yet.</p>
                            <p>Start your healthy eating journey today!</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($recentUserDiets as $diet): ?>
                            <div class="diet-card-recently" data-diet-id="<?php echo htmlspecialchars($diet['id']); ?>">
                                <div class="diet-card-image">
                                    <img src="<?php echo htmlspecialchars($diet['image']); ?>" alt="<?php echo htmlspecialchars($diet['title']); ?>">
                                </div>
                                <div class="diet-card-content-recently">
                                    <h3 class="diet-card-title"><?php echo htmlspecialchars($diet['title']); ?></h3>
                                    <div class="diet-card-type">
                                        <span><?php echo htmlspecialchars($diet['type']); ?></span>
                                    </div>
                                    <div class="diet-card-stats-recently">
                                        <div class="diet-card-stat">
                                            <i class="fas fa-clock"></i>
                                            <span><?php echo htmlspecialchars(str_replace(' min', '', $diet['duration'])); ?> min</span>
                                        </div>
                                    </div>
                                    <div class="diet-card-completed">
                                        <i class="fas fa-utensils"></i>
                                        <span>Added: <?php echo date('d M Y', strtotime($diet['date'])); ?></span>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </section> -->

            <section class="diet-body">
                <h2 class="section-title"><img src="./assets/icons/vegetable.png">Vegetarian</h2>
                <div class="diet-history-grid"></div>
            </section>

            <section class="diet-body">
                <h2 class="section-title"><img src="./assets/icons/vegan.png">Vegan</h2>
                <div class="diet-history-grid"></div>
            </section>

            <section class="diet-body">
                <h2 class="section-title"><img src="./assets/icons/steak.png">Meat</h2>
                <div class="diet-history-grid"></div>
            </section>
            
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
    <script>
        // Pass diet data to JavaScript once
        const diets = <?php echo json_encode($diets); ?>;
        const response = <?php echo json_encode($response); ?>;
        const recentUserDiets = <?php echo json_encode($recentUserDiets); ?>;
        window.recentUserDiets = <?php echo json_encode($recentUserDiets); ?>;
        // console.log('Recent User Diets:', recentUserDiets);
    </script>
    <script src="./js/diet_page.js"></script>
    <script src="./js/navigation_bar.js"></script>
    <script src="./js/gemini_chatbot.js"></script>
</html>