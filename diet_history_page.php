<?php
session_start();  

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
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
    <script defer src="./js/diet_history_page.js"></script>
  </head>
  <body>
    <div class="no-select">
      <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
          <span class="workout-home"><a href="homepage.php" class="active">HOME</a></span
          >
          <span class="workout-navbar"><a href="workout_page.php">WORKOUT</a></span>
          <img
            src="./assets/icons/logo.svg"
            alt="logo"
            class="nav-logo"
            id="nav-logo"
          />
          <span class="workout-dietplan"
            ><a href="diet_page.php">DIET PLAN</a></span
          >
          <span class="workout-settings"
            ><a href="settings_page.php">SETTINGS</a></span
          >
        </div>
        <div class="header-right">
          <button id="hamburger-menu" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <img
          src="./assets/icons/logo.svg"
          alt="logo"
          class="nav-logo-responsive"
          id="nav-logo-responsive"
        />
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
                      <p>{$_SESSION["email"]}</p>
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
      <header class="page-header">
        <button class="previous"><i class="bx bxs-chevron-left"></i></button>
        <h1>Diet</h1>
      </header>

      <div class="filter-controls">
        <!-- Activity Types Dropdown -->
        <select id="type-filter" name="type-filter" onchange="type_filter()">
          <option value="All">All</option>
          <option value="Meat">Meat</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Vegan">Vegan</option>
          <option value="Custom">Custom</option>
        </select>

        <button id="date-range-filter" class="filter-button">
          <span class="filter-text">Date Range</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        
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

      <?php
        include "conn.php";

        function formatDate($date) {
          if ($date == date("Y-m-d")) {
              return "Today";
          } else if ($date == date("Y-m-d", strtotime("-1 day"))) {
              return "Yesterday";
          } else {
              return date('d F Y', strtotime($date)); 
          }
        }

        $sql = "
        (
            SELECT 
                dh.diet_history_id AS entry_id,  -- Use this for ordering
                d.diet_id AS diet_id,  
                dh.date,
                d.diet_name,
                d.diet_type,
                d.preparation_min,
                d.picture,
                IFNULL(SUM(n.calories), 0) AS total_calories,
                'regular' AS meal_type
            FROM diet_history dh
            JOIN diet d ON dh.diet_id = d.diet_id
            LEFT JOIN diet_nutrition dn ON d.diet_id = dn.diet_id
            LEFT JOIN nutrition n ON dn.nutrition_id = n.nutrition_id
            WHERE dh.member_id = ?
            GROUP BY dh.diet_history_id, d.diet_id, dh.date, d.diet_name, d.diet_type, d.preparation_min, d.picture
        )
        UNION ALL
        (
            SELECT 
                cd.custom_diet_id AS entry_id,  
                cd.custom_diet_id AS diet_id,  
                cd.date,
                cd.custom_diet_name AS diet_name,
                'custom' AS diet_type,
                NULL AS preparation_min,
                NULL AS picture,
                cd.calories AS total_calories,
                'custom' AS meal_type
            FROM custom_diet cd
            WHERE cd.member_id = ?
        )
        ORDER BY date DESC, entry_id DESC";

        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("ii", $_SESSION['member id'], $_SESSION['member id']);
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result) {
            die("Query Error: " . $stmt->error);
        }

        if ($result->num_rows == 0) {
            echo "<div class=\"no-filtered-records\">
                    <p>Diet history still not available. Let's have a meal!</p>
                  </div>";;
        } else {
            while ($row = $result->fetch_assoc()) {
              
              $diet_id = $row['diet_id'];  // Now correctly storing diet_id
              $diet_name = $row['diet_name'];
              $diet_type = $row['diet_type']; 
              $preparation_min = isset($row['preparation_min']) ? "{$row['preparation_min']} min" : "N/A";
              $total_calories = $row['total_calories'];
              $picture = !empty($row['picture']) ? "./uploads/diet/{$row['picture']}" : "./assets/icons/error.svg";
              $meal_date = formatDate($row['date']);

              echo "
              <div class='record-wrapper'>
                <div class='workout-date'>
                    <p>{$meal_date}</p>
                </div>
                <div class='workout-record' data-diet-id='{$diet_id}' data-meal-type='{$diet_type}'>
                    <img class='picture' src='{$picture}' alt='{$diet_name}' />
                    <p class='name'>{$diet_name}</p>
                    <p class='type'>{$diet_type}</p>
                    <p class='time'>{$total_calories} kcal</p>
                    <p class='kcal'>{$preparation_min}</p>
                </div>
              </div>";         
            }

        }
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
  <script src="./js/navigation_bar.js"></script>
  <script src="./js/gemini_chatbot.js"></script>
  <script src="./js/darkmode.js"></script>
</html>
