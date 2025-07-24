<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MewFit Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
    <link rel="icon" type="./assets/image/x-icon" href="./assets/icons/cat-logo-tabs.png">
    <link rel="stylesheet" href="./css/admin_user_page.css">
    <link rel="stylesheet" href="./css/navigation_bar.css">
    <script src="./js/navigation_bar.js"></script>
    <script src="./js/data_validation.js"></script>
    <style>
        #add-profile-btn:disabled,
        #confirm-btn:disabled {
            opacity: 0.5 !important;
        }
    </style>
</head>
<?php
include "conn.php";
session_start();

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}

// enter new data

if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    $username = trim($_POST['username']);
    $password = trim($_POST['password']);
    $name = trim($_POST['name']);
    $gender = trim($_POST['gender']);
    $email = trim($_POST['email']);
    $phone_num = trim($_POST['phonenum']);

    $stmt = $dbConn->prepare("INSERT INTO administrator (username, password, name, gender, email_address, phone_number, date_registered) 
                                      VALUES (?, ?, ?, ?, ?, ?, CURDATE())");
    $stmt->bind_param("ssssss", $username, $password, $name, $gender, $email, $phone_num);

    if ($stmt->execute()) {
        header("Location: admin_user_page.php");
        exit();
    } else {
        die("Failed to update admin table");
    }
}
?>

<body>
    <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
            <img src="./assets/icons/mewfit-admin-logo.svg" alt="logo" class="nav-logo" id="nav-logo">
            <span class="admin-dashboard"><a href="admin_homepage.php">DASHBOARD</a></span>
            <span class="admin-user"><a href="#" class="active">USER</a></span>
            <span class="admin-workout"><a href="admin_workout.php">WORKOUT</a></span>
            <span class="admin-meals"><a href="admin_diet.php">MEALS</a></span>
        </div>
        <div class="header-right">
            <button id="hamburger-menu" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
        <image src="./assets/icons/admin_logout.svg" class="logout-profile" id="logout-profile"></image>
    </nav>

    <div id="heading">
        <h2 class="title"> USER <span>PROFILE</span></h2>
        <ul class="user-section">
            <li><a href="#admin" class="admin-link">ADMIN</a></li>
            <li><a href="#member" class="member-link">MEMBER</a></li>
        </ul>
    </div>

    <div class="content">
        <div class="admin-container">
            <div class="section1">
                <input type="text" class="search-bar" placeholder="Search Username..">
                <div class="box">
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Password</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Email Address</th>
                            <th>Phone Number</th>
                            <th>Registration Date</th>
                        </tr>
                        <?php
                        $sql = "SELECT * FROM administrator";
                        $result = mysqli_query($dbConn, $sql);
                        if (mysqli_num_rows($result) > 0) {
                            while ($rows = mysqli_fetch_array($result)) {
                                echo "<tr admin-id='" . $rows['admin_id'] . "'>";
                                echo "<td>" . $rows['admin_id'] . "</td>";
                                echo "<td>" . $rows['username'] . "</td>";
                                echo "<td>" . $rows['password'] . "</td>";
                                echo "<td>" . $rows['name'] . "</td>";
                                echo "<td>" . $rows['gender'] . "</td>";
                                echo "<td>" . $rows['email_address'] . "</td>";
                                echo "<td>" . $rows['phone_number'] . "</td>";
                                echo "<td>" . $rows['date_registered'] . "</td>";
                                echo "</tr>";
                            }
                        } else {
                            echo "<tr class='no-data'><td colspan='7'>No data available</td></tr>";
                        }
                        ?>
                    </table>
                </div>
                <div class="table-option">
                    <button id="edit-btn" disabled>Edit</button>
                    <button id="delete-btn" disabled>Delete</button>
                </div>
            </div>

            <!--Add New Profile Form -->
            <div class="add-profile">
                <center>
                    <h2>Add New <span>Profile</span></h2>
                </center>
                <form method="post" action="">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required oninput="checkUniqueName(this, document.getElementById('username-feedback'), 'Username already exists.', 'administrator', 'username', document.getElementById('add-profile-btn')); validateForm();">
                    <p id="username-feedback" class="feedback"></p>

                    <label for="password">Password</label>
                    <input type="text" id="password" name="password" oninput="validatePassword(this, document.getElementById('password-feedback')); validateForm();" required>
                    <p id="password-feedback" class="feedback"></p>

                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" oninput="validateName(this, document.getElementById('name-feedback')); validateForm();" required>
                    <p id="name-feedback" class="feedback"></p>

                    <label for="gender">Gender</label>
                    <select id="gender" name="gender" required style="width:98%;">
                        <option value="">Select Gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                    </select>

                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required oninput="checkUniqueName(this, document.getElementById('email-feedback'), 'Email already exists.', 'administrator', 'email_address', document.getElementById('add-profile-btn')); validateForm();">
                    <p id="email-feedback" class="feedback"></p>

                    <label for="phonenum">Phone Number</label>
                    <input type="text" id="phonenum" name="phonenum" required oninput="validatePhoneNumber(this, document.getElementById('phonenum-feedback'), document.getElementById('add-profile-btn')); validateForm();">
                    <p id="phonenum-feedback" class="feedback"></p>

                    <div style="display:flex;justify-content: flex-end;white-space: nowrap;">
                        <button type="submit" id="add-profile-btn" disabled>Create New</button>
                    </div>
                </form>
                <script>
                    function validateForm() {
                        const usernameFeedback = document.getElementById('username-feedback').textContent.trim();
                        const passwordFeedback = document.getElementById('password-feedback').textContent.trim();
                        const emailFeedback = document.getElementById('email-feedback').textContent.trim();
                        const phonenumFeedback = document.getElementById('phonenum-feedback').textContent.trim();
                        const nameFeedback = document.getElementById('name-feedback').textContent.trim();

                        const username = document.getElementById('username').value.trim();
                        const password = document.getElementById('password').value.trim();
                        const name = document.getElementById('name').value.trim();
                        const gender = document.getElementById('gender').value.trim();
                        const email = document.getElementById('email').value.trim();
                        const phonenum = document.getElementById('phonenum').value.trim();

                        const allFieldsFilled = username && password && name && gender && email && phonenum;
                        const noValidationErrors = !usernameFeedback && !passwordFeedback && !emailFeedback && !phonenumFeedback && !nameFeedback;

                        document.getElementById('add-profile-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('username').addEventListener('input', validateForm);
                    document.getElementById('password').addEventListener('input', validateForm);
                    document.getElementById('name').addEventListener('input', validateForm);
                    document.getElementById('gender').addEventListener('change', validateForm);
                    document.getElementById('email').addEventListener('input', validateForm);
                    document.getElementById('phonenum').addEventListener('input', validateForm);
                </script>
            </div>
            <div class="edit-profile">
                <center>
                    <h2>Edit <span>Profile</span></h2>
                </center>
                <form method="POST" action="edit.php" id="administrator">
                    <input type="hidden" id="selectedAdminId" name="selectedAdminId" value="<?php echo $_GET['admin_id'] ?? ''; ?>">
                    <input type="hidden" id="table" name="table" value="administrator">

                    <label for="eusername">Username</label>
                    <input type="text" id="eusername" name="eusername" oninput="checkUniqueName(this, document.getElementById('eusername-feedback'), 'Username already exists.', 'administrator', 'username', document.getElementById('confirm-btn'), document.getElementById('selectedAdminId').value);" required>
                    <p id="eusername-feedback" class="feedback"></p>

                    <label for="epassword">Password</label>
                    <input type="text" id="epassword" name="epassword" oninput="validatePassword(this, document.getElementById('epassword-feedback')); evalidateForm()" required>
                    <p id="epassword-feedback" class="feedback"></p>

                    <label for="ename">Name</label>
                    <input type="text" id="ename" name="ename" oninput="validateName(this, document.getElementById('ename-feedback'));" required>
                    <p id="ename-feedback" class="feedback"></p>

                    <label for="egender">Gender</label>
                    <select id="egender" name="egender" required style="width:98%;">
                        <option value="">Select Gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                    </select>

                    <label for="eemail">Email Address</label>
                    <input type="email" id="eemail" name="eemail" required oninput="checkUniqueName(this, document.getElementById('eemail-feedback'), 'Email already exists.', 'administrator', 'email_address', document.getElementById('confirm-btn'), document.getElementById('selectedAdminId').value); evalidateForm()">
                    <p id="eemail-feedback" class="feedback"></p>

                    <label for="ephonenum">Phone Number</label>
                    <input type="text" id="ephonenum" name="ephonenum" oninput="validatePhoneNumber(this, document.getElementById('ephonenum-feedback'), document.getElementById('confirm-btn')); evalidateForm()" required>
                    <p id="ephonenum-feedback" class="feedback"></p>

                    <div style="display:flex;justify-content: flex-end;gap:20px;white-space: nowrap;">
                        <button type="button" id="discard-btn">Discard Changes</button>
                        <button type="submit" id="confirm-btn" disabled>Update Changes</button>
                    </div>
                </form>
                <script>
                    function evalidateForm() {
                        const eusernameFeedback = document.getElementById('eusername-feedback').textContent.trim();
                        const epasswordFeedback = document.getElementById('epassword-feedback').textContent.trim();
                        const eemailFeedback = document.getElementById('eemail-feedback').textContent.trim();
                        const ephonenumFeedback = document.getElementById('ephonenum-feedback').textContent.trim();
                        const enameFeedback = document.getElementById('ename-feedback').textContent.trim();

                        const eusername = document.getElementById('eusername').value.trim();
                        const epassword = document.getElementById('epassword').value.trim();
                        const ename = document.getElementById('ename').value.trim();
                        const egender = document.getElementById('egender').value.trim();
                        const eemail = document.getElementById('eemail').value.trim();
                        const ephonenum = document.getElementById('ephonenum').value.trim();

                        const allFieldsFilled = eusername && epassword && ename && egender && eemail && ephonenum;
                        const noValidationErrors = !eusernameFeedback && !epasswordFeedback && !eemailFeedback && !ephonenumFeedback && !enameFeedback;

                        document.getElementById('confirm-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('eusername').addEventListener('input', evalidateForm);
                    document.getElementById('epassword').addEventListener('input', evalidateForm);
                    document.getElementById('ename').addEventListener('input', evalidateForm);
                    document.getElementById('egender').addEventListener('change', evalidateForm);
                    document.getElementById('eemail').addEventListener('input', evalidateForm);
                    document.getElementById('ephonenum').addEventListener('input', evalidateForm);
                </script>
            </div>
            <div class="popup" id="popup">
                <div class="popup-content">
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete this record?</p>
                    <button class="confirmDelete">Yes, Delete</button>
                    <button class="cancelDelete">Cancel</button>
                </div>
            </div>
        </div>
        <div class="member-container">
            <input type="text" class="search-bar" placeholder="Search Username">
            <div class="member-box">
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Picture</th>
                        <th>Email Address</th>
                        <th>Password</th>
                        <th>Level</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Fitness Goal</th>
                        <th>Height</th>
                        <th>Weight</th>
                        <th>Target Weight</th>
                        <th>Registration Date</th>
                    </tr>

                    <?php
                    $sql = "SELECT * FROM member";
                    $result = mysqli_query($dbConn, $sql);

                    if (mysqli_num_rows($result) > 0) {
                        while ($rows = mysqli_fetch_array($result)) {
                            echo "<tr member-id='" . $rows['member_id'] . "'>";
                            echo "<td>" . htmlspecialchars($rows['member_id']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['username']) . "</td>";

                            // Picture Preview
                            echo "<td>";
                            if (!empty($rows['profile_picture'])) {
                                echo "<img src='uploads/member/" . htmlspecialchars($rows['profile_picture']) . "' alt='Profile' width='50' height='50'>";
                            } else {
                                echo "<img src='uploads/member/Unknown_acc-removebg.png' alt='No Image' width='50' height='50'>";
                            }
                            echo "</td>";
                            echo "<td>" . htmlspecialchars($rows['email_address']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['password']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['level']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['age']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['gender']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['fitness_goal']) . "</td>";
                            echo "<td>" . htmlspecialchars($rows['height']) . " cm</td>";
                            echo "<td>" . htmlspecialchars($rows['weight']) . " kg</td>";
                            echo "<td>" . htmlspecialchars($rows['target_weight']) . " kg</td>";
                            echo "<td>" . htmlspecialchars($rows['date_registered']) . "</td>";
                            echo "</tr>";
                        }
                    } else {
                        echo "<tr class='no-data'><td colspan='13'>No data available</td></tr>";
                    }
                    ?>
                </table>
            </div>
            <div class="table-option">
                <button id="member-delete-btn" style="margin-right: 50px; margin-top: 10px;"> Delete</button>
            </div>
            <div class="mpopup" id="mpopup">
                <div class="popup-content">
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete this record?</p>
                    <button class="confirmDelete">Yes, Delete</button>
                    <button class="cancelDelete">Cancel</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        window.onresize = function() {
            if (window.innerWidth > 1200) {
                window.scrollTo(0, 0);
            }
        };
        document.addEventListener("DOMContentLoaded", function() {
            validateForm();
            evalidateForm();

            //-------------------------navigation---------------------------------------
            let isEditing = false;

            function showSection() {
                if (isEditing) {
                    return;
                }

                const hash = window.location.hash;
                const nutritionContainer = document.querySelector('.admin-container');
                const dietContainer = document.querySelector('.member-container');
                const nutritionLink = document.querySelector('.admin-link');
                const dietLink = document.querySelector('.member-link');

                nutritionContainer.style.display = 'none';
                dietContainer.style.display = 'none';
                nutritionLink.classList.remove('active');
                dietLink.classList.remove('active');

                if (hash === "#admin") {
                    nutritionContainer.style.display = 'flex';
                    nutritionLink.classList.add('active');
                } else if (hash === "#member") {
                    dietContainer.style.display = 'block';
                    dietLink.classList.add('active');
                } else {
                    nutritionContainer.style.display = 'flex';
                    nutritionLink.classList.add('active');
                }
            }

            showSection();
            window.addEventListener('hashchange', showSection);

            //------------------------select row--------------------------
            const rows = document.querySelectorAll('table tr:not(:first-child)');
            const editBtn = document.getElementById("edit-btn");
            const deleteBtn = document.getElementById("delete-btn");
            const memberDeleteBtn = document.getElementById("member-delete-btn");
            let selectedRow = null;
            let mselectedRow = null;
            document.querySelectorAll(".admin-container tr").forEach(row => {
                row.addEventListener('click', function(event) {
                    if (isEditing) return;
                    if (this.classList.contains('no-data')) return;

                    event.stopPropagation();
                    rows.forEach(r => r.classList.remove('selected'));
                    selectedRow = this;
                    this.classList.add('selected');

                    editBtn.disabled = false;
                    deleteBtn.disabled = false;

                });
            });

            document.querySelectorAll(".member-container tr:not(:first-child)").forEach(row => {
                row.addEventListener('click', function(event) {
                    if (this.classList.contains('no-data')) return;

                    rows.forEach(r => r.classList.remove('selected'));
                    mselectedRow = this;
                    this.classList.add('selected');
                    console.log(mselectedRow);

                    memberDeleteBtn.disabled = false;
                });
            });

            //------------------------------deselect------------------
            document.addEventListener("click", function(event) {
                const table = document.querySelector(".box table");
                const table2 = document.querySelector(".member-box table");
                const tableOption = document.querySelector('.table-option');
                if (!table.contains(event.target) && !tableOption.contains(event.target) && !table2.contains(event.target) && !memberDeleteBtn.contains(event.target)) {
                    if (isEditing) return;
                    if (selectedRow) {
                        selectedRow.classList.remove('selected');
                        selectedRow = null;
                    }
                    if (mselectedRow) {
                        mselectedRow.classList.remove('selected');
                        mselectedRow = null;
                    }
                    editBtn.disabled = true;
                    deleteBtn.disabled = true;
                    memberDeleteBtn.disabled = true;
                }
            }, true);

            //-----------------------------edit data-----------------------
            let selectedAdminId = null;

            const discardBtn = document.getElementById("discard-btn");
            const confirmBtn = document.getElementById("confirm-btn");
            const addProfile = document.querySelector(".add-profile");
            const editProfile = document.querySelector(".edit-profile");
            editBtn.addEventListener("click", function() {
                if (!selectedRow) return;
                isEditing = true;
                addProfile.style.display = "none";
                editProfile.style.display = "block";
                editBtn.disabled = true;
                deleteBtn.disabled = true;


                const cells = selectedRow.getElementsByTagName("td");
                document.getElementById("selectedAdminId").value = cells[0].textContent;
                document.getElementById("eusername").value = cells[1].textContent;
                document.getElementById("epassword").value = cells[2].textContent;
                document.getElementById("ename").value = cells[3].textContent;
                document.getElementById("egender").value = cells[4].textContent;
                document.getElementById("eemail").value = cells[5].textContent;
                document.getElementById("ephonenum").value = cells[6].textContent;

            });

            //discard changes button
            discardBtn.addEventListener("click", function() {
                document.querySelector(".add-profile form").reset();
                addProfile.style.display = "block";
                editProfile.style.display = "none";
                isEditing = false;
            });

            confirmBtn.addEventListener("click", function() {
                isEditing = false;
                addProfile.style.display = "block";
                editProfile.style.display = "none";
            });

            //----------------------delete data------------------------
            let id = null;
            let table = null;
            deleteBtn.addEventListener("click", () => {
                if (!selectedRow) return;

                let popUp = document.getElementById("popup");
                popUp.style.display = "flex";
                id = selectedRow.getAttribute("admin-id");
                table = "administrator";
                console.log(`ID: ${id}, Table: ${table}`);
            });


            memberDeleteBtn.addEventListener("click", () => {
                console.log("Selected member row:", mselectedRow);
                if (!mselectedRow) {
                    console.log("No member row selected");
                    return;
                }

                let popUp = document.getElementById("mpopup");
                popUp.style.display = "flex";
                id = mselectedRow.getAttribute("member-id");
                table = "member";
                console.log(`Member ID: ${id}, Table: ${table}`);
            });

            document.querySelector(".content").addEventListener("click", function(event) {
                if (event.target.classList.contains("confirmDelete")) {
                    console.log("confirmDelete button detected");

                    if (!id || !table) {
                        console.error("Missing data-id or data-table attribute");
                        return;
                    }

                    fetch("delete.php", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            body: `table=${table}&id=${id}`
                        })
                        .then(res => res.text())
                        .then(() => location.reload())
                        .catch(console.error);

                    document.getElementById("popup").style.display = "none";
                    document.getElementById("mpopup").style.display = "none";
                }
                if (event.target.classList.contains("cancelDelete")) {
                    document.getElementById("mpopup").style.display = "none";
                    document.getElementById("popup").style.display = "none";
                }
            });

            //-----------------------------search--------------------------
            document.querySelectorAll(".search-bar").forEach(searchBar => {
                searchBar.addEventListener("keyup", function() {
                    const searchValue = this.value.toLowerCase();

                    let table = this.closest("div").querySelector("table");
                    let rows = table.querySelectorAll("tr:not(:first-child)");

                    rows.forEach(row => {
                        if (row.classList.contains("no-data")) return;

                        const usernameCell = row.cells[1].textContent.toLowerCase();

                        if (usernameCell.includes(searchValue)) {
                            row.style.display = "";
                        } else {
                            row.style.display = "none";
                        }
                    });
                });
            });
        });
    </script>
</body>

</html>