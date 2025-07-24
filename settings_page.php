<?php
session_start();
if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
  header("Location: index.php");
  exit;
}

include "conn.php";

$member_id = $_SESSION['member id'];
$sqlMember = "SELECT email_address, height, weight, target_weight, fitness_goal FROM member WHERE member_id = ?";
$stmtMember = $dbConn->prepare($sqlMember);
$stmtMember->bind_param("i", $member_id);
$stmtMember->execute();
$resultMember = $stmtMember->get_result();
$member = $resultMember->fetch_assoc();
$email_address = $member['email_address'];
$height = $member['height'];
$weight = $member['weight'];
$target_weight = $member['target_weight'];
$fitness_goal = $member['fitness_goal'];
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mewfit</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css" />
  <link rel="icon" type="image/x-icon" href="./assets/icons/cat-logo-tabs.png">
  <link rel="stylesheet" href="./css/settings_page.css" />
  <link rel="stylesheet" href="./css/gemini_chatbot.css">
  <link rel="stylesheet" href="./css/navigation_bar.css" />
  <style>
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
    }

    .modal-content {
      background-color: var(--background-color);
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      padding: 20px 30px;
      width: 90%;
      max-width: 800px;
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .modal-content h3 {
      margin: 20px 0px;
      font-size: 22px;
      color: var(--text-color);
    }

    .modal-content p {
      margin: 10px 0;
      color: var(--text-color);
    }

    .modal-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 30px;
    }

    .cancel-btn,
    .delete-confirm-btn,
    .save-btn {
      padding: 10px 20px;
      border-radius: 20px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .cancel-btn {
      background-color: #e0e0e0;
      color: #333;
    }

    .delete-confirm-btn {
      background-color: #ff4d4d;
      color: white;
    }

    .save-btn {
      background-color: var(--primary-color);
      color: white;
    }

    .cancel-btn:hover {
      background-color: #d0d0d0;
    }

    .delete-confirm-btn:hover {
      background-color: #ff3333;
    }

    .save-btn:hover {
      opacity: 0.9;
    }

    /* Form Styles */
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }

    .form-left,
    .form-right {
      flex: 1;
    }

    .form-group {
      margin-bottom: 15px;
      text-align: left;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: var(--text-color);
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background-color: var(--background-color);
      color: var(--text-color);
    }

    /* Goal button styles */
    .goal-switch {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-top: 20px;
    }

    .goal-btn {
      flex: 1;
      padding: 12px;
      background-color: transparent;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--text-color);
    }

    .goal-btn.active {
      background-color: rgba(255, 173, 132, 0.2);
      border-color: var(--primary-color);
    }

    .goal-icon {
      font-size: 1.25rem;
      margin-bottom: 8px;
      color: var(--primary-color);
    }

    /* Dark mode form input styles */
    html.dark-mode .form-group input {
      background-color: #4e4e4e;
      color: white;
      border-color: #666;
    }

    html.dark-mode .form-group label {
      color: white;
    }

    /* Media queries for responsive layout */
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .modal-content {
        max-width: 95%;
        padding: 15px;
      }
    }
  </style>
</head>

<body>
  <div class="no-select">
    <nav class="navbar" id="navbar">
      <div class="nav-links" id="nav-links">
        <span class="workout-home"><a href="homepage.php">HOME</a></span>
        <span class="workout-navbar"><a href="workout_page.php">WORKOUT</a></span>
        <img src="./assets/icons/logo.svg" alt="logo" class="nav-logo" id="nav-logo">
        <span class="workout-dietplan"><a href="diet_page.php">DIET PLAN</a></span>
        <span class="workout-settings"><a href="#" class="active">SETTINGS</a></span>
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
            <li><a href="#" class="settings-profile"><i class="fas fa-cog"></i>Settings</a></li>
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

    <div class="boxes-container">
      <div class="transparent-box">
        <h2>Settings</h2>
      </div>
      <button class="logout-btn" id="logout-settings">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>Log Out
      </button>
    </div>

    <div class="main-container">
      <div class="left-frame">
        <div class="profile-section">
          <?php

          $sql = "SELECT * FROM member";
          $result = $dbConn->query($sql);

          while ($row = $result->fetch_assoc()) {
            if ($member_id == $row['member_id']) {
              echo "
                      <img src=\"./uploads/member/{$_SESSION["member pic"]}\" alt=\"Profile\" class=\"profile-photo\">
                      <div class=\"profile-info-settings\">
                      <h2>{$row['username']}</h2>
                      <button class=\"change-photo\">Change profile photo</button>
                      </div>
                    ";
            }
          }

          ?>
        </div>
      </div>

      <div class="middle-frame">
        <div class="settings-group">
          <h3>Account Settings</h3>
          <ul>
            <li>
              <a href="#" class="setting-item" id="update-personal-info">
                Update personal information
                <span class="cheval-left">></span>
              </a>
            </li>
            <li>
              <label class="toggle-item">
                Dark Mode
                <input type="checkbox" class="toggle-switch" id="settings-darkmode-toggle" />
                <span class="slider-settings"></span>
              </label>
            </li>
            <li>
              <div class="setting-item" id="delete-account">
                <div class="danger">
                  Delete Account
                  <img src="./assets/icons/delete.png" alt="Delete" class="delete-icon" />
                </div>
                <span class="cheval-left">></span>
              </div>
            </li>
          </ul>
        </div>

        <div class="settings-group more-middle">
          <h3>More</h3>
          <ul>
            <li>
              <a href="FAQ_page.html" class="setting-item">
                FAQ
                <span class="cheval-left">></span>
              </a>
            </li>
            <li>
              <a href="privacy_policy_page.html" class="setting-item">
                Privacy Policy
                <span class="cheval-left">></span>
              </a>
            </li>
            <li>
              <a href="terms_condition_page.html" class="setting-item">
                Terms and Conditions
                <span class="cheval-left">></span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="right-frame">
        <div class="settings-group">
          <h3>More</h3>
          <ul>
            <li>
              <a href="FAQ_page.html" class="setting-item">
                FAQ
                <span class="cheval-left">></span>
              </a>
            </li>
            <li>
              <a href="privacy_policy_page.html" class="setting-item">
                Privacy Policy
                <span class="cheval-left">></span>
              </a>
            </li>
            <li>
              <a href="terms_condition_page.html" class="setting-item">
                Terms and Conditions
                <span class="cheval-left">></span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Update Personal Information Modal -->
    <div class="modal" id="update-info-modal">
      <div class="modal-content">
        <h3>Update Personal Information</h3>
        <form id="update-info-form">
          <div class="form-row">
            <div class="form-left">
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" value="<?php echo $_SESSION['username']; ?>">
              </div>
              <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" value="<?php echo $email_address; ?>">
              </div>
              <div class="form-group">
                <label for="current-password">Current Password</label>
                <input type="password" id="current-password" name="current-password" placeholder="Enter current password" required>
              </div>
              <div class="form-group">
                <label for="new-password">New Password (leave blank if unchanged)</label>
                <input type="password" id="new-password" name="new-password" placeholder="Enter new password">
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <input type="password" id="confirm-password" name="confirm-password" placeholder="Confirm new password">
              </div>
            </div>
            <div class="form-right">
              <!-- Fitness Metrics Section -->
              <div class="metrics-card">
                <div class="fitness-metrics-title">
                  <i class="fas fa-dumbbell"></i> Fitness Metrics
                </div>

                <div class="input-grid">
                  <div class="metric-group">
                    <label for="target_weight">
                      <i class="fas fa-bullseye"></i>
                      Target Weight (kg)
                    </label>
                    <input type="number" id="target_weight" name="target_weight"
                      value="<?php echo $target_weight; ?>"
                      placeholder="Enter target weight" required>
                  </div>

                  <div class="metric-group">
                    <label for="weight">
                      <i class="fas fa-weight-scale"></i>
                      Current Weight (kg)
                    </label>
                    <input type="number" id="weight" name="weight"
                      value="<?php echo $weight; ?>"
                      placeholder="Enter current weight" required>
                  </div>

                  <div class="metric-group">
                    <label for="height">
                      <i class="fas fa-ruler-vertical"></i>
                      Height (cm)
                    </label>
                    <input type="number" id="height" name="height"
                      value="<?php echo $height; ?>"
                      placeholder="Enter height" required>
                  </div>
                </div>

                <div class="goal-switch">
                  <button type="button" class="goal-btn <?php echo $fitness_goal === 'Loss Weight' ? 'active' : '' ?>"
                    data-value="Loss Weight">
                    <i class="fas fa-running goal-icon"></i>
                    Lose Weight
                  </button>
                  <button type="button" class="goal-btn <?php echo $fitness_goal === 'Gain Weight' ? 'active' : '' ?>"
                    data-value="Gain Weight">
                    <i class="fas fa-dumbbell goal-icon"></i>
                    Gain Weight
                  </button>
                </div>
                <input type="hidden" id="fitness_goal" name="fitness_goal"
                  value="<?php echo $fitness_goal; ?>">
              </div>
            </div>
          </div>

          <div class="modal-buttons">
            <button type="submit" class="save-btn">Save Changes</button>
            <button type="button" class="cancel-btn" id="cancel-update">Cancel</button>
          </div>
        </form>
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

    <!-- Delete Account Confirmation Modal -->
    <div class="modal" id="delete-account-modal">
      <div class="modal-content">
        <h3>Delete Account</h3>
        <p>Are you sure you want to delete your account? </p>
        <p style="color: red;">This action cannot be undone and all your data will be permanently removed.</p>
        <div class="modal-buttons">
          <button class="delete-confirm-btn" id="confirm-delete">Delete Account</button>
          <button class="cancel-btn" id="cancel-delete">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</body>
<script src="./js/navigation_bar.js"></script>
<script src="./js/settings_page.js"></script>
<script src="./js/darkmode.js"></script>
<script src="./js/gemini_chatbot.js"></script>
<input type="file" id="avatar-upload" hidden accept="image/*">

<script>
  // Delete Account Modal Functionality
  const deleteAccountBtn = document.getElementById('delete-account');
  const deleteModal = document.getElementById('delete-account-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  const confirmDeleteBtn = document.getElementById('confirm-delete');

  // Show modal when delete account is clicked
  deleteAccountBtn.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
  });

  // Hide modal when cancel is clicked
  cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
  });

  confirmDeleteBtn.addEventListener('click', () => {
    const memberId = "<?php echo $member_id; ?>";

    fetch("delete.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `table=member&id=${memberId}`
      })
      .then(res => res.text())
      .then(data => {
        alert('Account has been deleted successfully');
        window.location.href = 'index.php';
      })
      .catch(error => {
        alert('An error occurred, please try again');
        console.error('Fetch Error:', error);
      });
  });


  // Close modal if user clicks outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
      deleteModal.style.display = 'none';
    }
  });

  // Update Personal Information Modal Functionality
  const updateInfoBtn = document.getElementById('update-personal-info');
  const updateModal = document.getElementById('update-info-modal');
  const cancelUpdateBtn = document.getElementById('cancel-update');
  const updateInfoForm = document.getElementById('update-info-form');

  // Fitness goal buttons functionality
  const goalButtons = document.querySelectorAll('.goal-btn');
  const fitnessGoalInput = document.getElementById('fitness_goal');

  goalButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      goalButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      button.classList.add('active');

      // Update hidden input value
      fitnessGoalInput.value = button.getAttribute('data-value');
    });
  });

  // Show modal when update personal information is clicked
  updateInfoBtn.addEventListener('click', () => {
    updateModal.style.display = 'flex';
  });

  // Hide modal when cancel is clicked
  cancelUpdateBtn.addEventListener('click', () => {
    updateModal.style.display = 'none';
    resetPasswordFields();
  });

  // Function to reset password fields
  function resetPasswordFields() {
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  }

  // Handle form submission
  updateInfoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Form validation
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword && newPassword !== '') {
      alert('New passwords do not match');
      return;
    }

    // Create form data for submission
    const formData = new FormData(updateInfoForm);

    // Add fitness goal value
    formData.append('fitness_goal', fitnessGoalInput.value);

    // Send the data to the server
    fetch('update_profile.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Profile updated successfully');
          updateModal.style.display = 'none';
          resetPasswordFields();

          // Update the displayed username if it changed
          const usernameElements = document.querySelectorAll('.profile-info h3, .profile-info-settings h2');
          usernameElements.forEach(el => {
            el.textContent = document.getElementById('username').value;
          });

          const emailElements = document.querySelectorAll('.profile-info p');
          emailElements.forEach(el => {
            el.textContent = document.getElementById('email').value;
          });
        } else {
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        alert('An error occurred. Please try again.');
        console.error('Error:', error);
      });
  });

  // Close update modal if user clicks outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === updateModal) {
      updateModal.style.display = 'none';
      resetPasswordFields();
    }
  });

  // Logout Confirmation Modal Functionality
  const logoutSettingsBtn = document.getElementById('logout-settings');
  const logoutProfileBtn = document.getElementById('logout-profile');
  const logoutModal = document.getElementById('logout-modal');
  const cancelLogoutBtn = document.getElementById('cancel-logout');
  const confirmLogoutBtn = document.getElementById('confirm-logout');

  // Show modal when logout buttons are clicked
  logoutSettingsBtn.addEventListener('click', () => {
    logoutModal.style.display = 'flex';
  });

  logoutProfileBtn.addEventListener('click', () => {
    logoutModal.style.display = 'flex';
  });

  // Hide modal when cancel is clicked
  cancelLogoutBtn.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });

  // Handle logout confirmation
  confirmLogoutBtn.addEventListener('click', () => {
    window.location.href = 'logout.php';
  });

  // Close modal if user clicks outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === logoutModal) {
      logoutModal.style.display = 'none';
    }
  });
</script>

</html>