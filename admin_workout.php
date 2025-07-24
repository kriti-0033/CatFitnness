<?php
$jsonFile = file_get_contents('./exercises.json');


$exercises = json_decode($jsonFile, true);

include "conn.php";
session_start();

if (!isset($_SESSION["logged_in"]) || $_SESSION["logged_in"] !== true) {
    header("Location: index.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MewFit Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/x-icon" href="./assets/icons/cat-logo-tabs.png">
    <link rel="stylesheet" href="./css/admin_workout.css">
    <link rel="stylesheet" href="./css/navigation_bar.css">
    <script src="./js/navigation_bar.js"></script>
    <script src="js/data_validation.js"></script>
</head>

<body>
    <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
            <img src="./assets/icons/mewfit-admin-logo.svg" alt="logo" class="nav-logo" id="nav-logo">
            <span class="admin-dashboard"><a href="admin_homepage.php">DASHBOARD</a></span>
            <span class="admin-user"><a href="admin_user_page.php">USER</a></span>
            <span class="admin-workout"><a href="#" class="active">WORKOUT</a></span>
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
        <h2 class="title"> WORKOUT <span>PROFILE</span></h2>
    </div>

    <div class="content">
        <div class="container">
            <!-- Workout Table -->
            <div class="section1">
                <input type="text" class="search-bar" placeholder="Search">
                <div class="box">
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Difficulty</th>
                            <th>Calories</th>
                            <th>Duration</th>
                            <th>Image</th>
                            <th>Description</th>
                            <th>Long Description</th>
                            <th>Sets</th>
                            <th>Exercise Checklist</th>
                            <th>Date Registered</th>
                        </tr>
                        <?php
                        include "conn.php";

                        $sql = "SELECT * FROM workout";
                        $result = mysqli_query($dbConn, $sql);
                        if (mysqli_num_rows($result) <= 0) {
                            echo "<tr><td colspan='11'>No workout data found</td></tr>";
                        } else {
                            while ($rows = mysqli_fetch_array($result)) {
                                echo "<tr workout-id='" . $rows['workout_id'] . "'>";
                                echo "<td>" . (isset($rows['workout_id']) ? $rows['workout_id'] : '') . "</td>";
                                echo "<td>" . (isset($rows['workout_name']) ? $rows['workout_name'] : '') . "</td>";
                                echo "<td>" . (isset($rows['workout_type']) ? $rows['workout_type'] : '') . "</td>";
                                echo "<td>" . (isset($rows['difficulty']) ? $rows['difficulty'] : '') . "</td>";
                                echo "<td>" . (isset($rows['calories']) ? $rows['calories'] : '') . "</td>";
                                echo "<td>" . (isset($rows['duration']) ? $rows['duration'] : '') . "</td>";
                                if (!empty($rows['image'])) {
                                    echo "<td><img src='./assets/workout_pics/" . basename($rows['image']) . "' alt='" . $rows['workout_name'] . "' width='100' loading='lazy'></td>";
                                } else {
                                    echo "<td>No image available</td>";
                                }
                                echo "<td>" . (isset($rows['description']) ? $rows['description'] : '') . "</td>";
                                echo "<td>" . (isset($rows['long_description']) ? $rows['long_description'] : '') . "</td>";
                                echo "<td>" . (isset($rows['sets']) ? $rows['sets'] : '') . "</td>";
                                echo "<td>" . (isset($rows['exercise_checklist']) ? $rows['exercise_checklist'] : '') . "</td>";
                                echo "<td>" . (isset($rows['date_registered']) ? $rows['date_registered'] : '') . "</td>";
                                echo "</tr>";
                            }
                        }
                        ?>
                    </table>
                </div>
                <div class="table-option">
                    <button id="edit-btn" disabled>Edit</button>
                    <button id="delete-btn" disabled>Delete</button>
                </div>
            </div>

            <!-- Add New Workout Form -->
            <div class="add-profile" id="dadd-profile">
                <center>
                    <h2>Add New <span>Workout</span></h2>
                </center>
                <form action="" method="POST" enctype="multipart/form-data">
                    <div class="form-columns">
                        <div class="column">
                            <label for="workout-name">Workout Name</label>
                            <input type="text" id="workout-name" name="workout-name" oninput="checkUniqueName(this, document.getElementById('workout-name-feedback'), 'Workout Name already exists', 'workout', 'workout_name', document.getElementById('add-profile-btn'));" required>
                            <p id="workout-name-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="workout-type">Workout Type</label>
                            <select id="workout-type" name="workout-type" required>
                                <option value="">Select Type</option>
                                <option value="Cardio">Cardio</option>
                                <option value="Yoga">Yoga</option>
                                <option value="Weighted">Weighted</option>
                                <option value="Weight-free">Weight-free</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-columns">
                        <div class="column">
                            <label for="workout-difficulty">Difficulty</label>
                            <select id="workout-difficulty" name="workout-difficulty" required>
                                <option value="">Select Difficulty</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div class="column">
                            <label for="calories">Calories Burned</label>
                            <input type="number" id="calories" name="calories" oninput="checkNumber(this, document.getElementById('calories-feedback'), 'Please enter a non-negative number');" required>
                            <p id="calories-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="duration">Duration (minutes)</label>
                            <input type="number" id="duration" name="duration" oninput="checkNumber(this, document.getElementById('duration-feedback'), 'Please enter a non-negative number');" required>
                            <p id="duration-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="sets">Sets</label>
                            <input type="number" id="sets" name="sets" oninput="checkNumber(this, document.getElementById('sets-feedback'), 'Please enter a non-negative number');" required>
                            <p id="sets-feedback" class="feedback"></p>
                        </div>
                    </div>

                    <label for="exercise_id">Exercises Checklist</label>
                    <div class="exercise-select-container"></div>

                    <div class="form-columns">
                        <div class="column">
                            <label for="workout_picture">Workout Picture</label>
                            <div class="picture" onclick="document.getElementById('workout_picture').click()">
                                <p id="words">Click To Upload Workout Picture Here</p>
                                <input type="file" name="workout_picture" id="workout_picture" accept="image/*" hidden required>
                                <img id="imagePreview" src="" alt="Image Preview" style="display: none; width: 200px; height: 200px;">
                            </div>
                        </div>
                        <div class="column">
                            <label for="desc">Description</label>
                            <textarea id="desc" name="desc" rows="4" placeholder="Describe the workout.." required></textarea>
                        </div>
                    </div>

                    <label for="long_description">Long Description</label>
                    <textarea id="long_description" name="long_description" rows="4" placeholder="Detailed workout description..." required></textarea>

                    <div style="display:flex;justify-content: center;white-space: nowrap;">
                        <button type="submit" id="add-profile-btn" disabled>Create New</button>
                    </div>
                </form>
                <script>
                    function validateForm() {
                        const workoutNameFeedback = document.getElementById('workout-name-feedback').textContent.trim();
                        const caloriesFeedback = document.getElementById('calories-feedback').textContent.trim();
                        const durationFeedback = document.getElementById('duration-feedback').textContent.trim();
                        const setsFeedback = document.getElementById('sets-feedback').textContent.trim();

                        const workoutName = document.getElementById('workout-name').value.trim();
                        const workoutType = document.getElementById('workout-type').value.trim();
                        const difficulty = document.getElementById('workout-difficulty').value.trim();
                        const calories = document.getElementById('calories').value.trim();
                        const duration = document.getElementById('duration').value.trim();
                        const sets = document.getElementById('sets').value.trim();
                        const workoutPicture = document.getElementById('workout_picture').files.length > 0;
                        const description = document.getElementById('desc').value.trim();
                        const longDescription = document.getElementById('long_description').value.trim();
                        const exerciseChecklist = document.getElementById('exercise_ids').value.trim();

                        const allFieldsFilled = workoutName && workoutType && difficulty && calories && duration && sets && workoutPicture && description && longDescription && exerciseChecklist;
                        const noValidationErrors = !workoutNameFeedback && !caloriesFeedback && !durationFeedback && !setsFeedback;

                        document.getElementById('add-profile-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('workout-name').addEventListener('input', validateForm);
                    document.getElementById('workout-type').addEventListener('change', validateForm);
                    document.getElementById('workout-difficulty').addEventListener('change', validateForm);
                    document.getElementById('calories').addEventListener('input', validateForm);
                    document.getElementById('duration').addEventListener('input', validateForm);
                    document.getElementById('sets').addEventListener('input', validateForm);
                    document.getElementById('desc').addEventListener('input', validateForm);
                    document.getElementById('long_description').addEventListener('input', validateForm);
                    document.getElementById('exercise_checklist').addEventListener('input', validateForm);
                </script>
            </div>
            <?php
            if ($_SERVER['REQUEST_METHOD'] == 'POST') {
                include "conn.php";

                $name = $_POST['workout-name'] ?? '';
                $type = $_POST['workout-type'] ?? '';
                $sets = $_POST['sets'] ?? 0;
                $difficulty = $_POST['workout-difficulty'] ?? '';
                $calories = $_POST['calories'] ?? 0;
                $duration = $_POST['duration'] ?? 0;
                $description = $_POST['desc'] ?? '';
                $long_description = $_POST['long_description'] ?? '';

                $image = '';
                if (isset($_FILES['workout_picture']) && $_FILES['workout_picture']['error'] === 0) {
                    $target_dir = "./assets/workout_pics/";
                    $file_extension = pathinfo($_FILES['workout_picture']['name'], PATHINFO_EXTENSION);
                    $filename = strtolower(str_replace(' ', '_', $name)) . "." . $file_extension;
                    $target_file = $target_dir . $filename;

                    if (move_uploaded_file($_FILES['workout_picture']['tmp_name'], $target_file)) {
                        $image = $target_file;
                    }
                }

                $exercise_checklist = [];
                if (isset($_POST['exercise_ids'])) {
                    $exercise_checklist = explode(',', $_POST['exercise_ids']); // Convert string to array
                }

                $formatted_exercise_list = "[" . implode(", ", $exercise_checklist) . "]";

                $date_registered = date('Y-m-d');

                // Insert data into workout table
                $sql = "INSERT INTO workout (workout_name, workout_type, difficulty, calories, duration, image, description, long_description, sets, exercise_checklist, date_registered)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                $stmt = $dbConn->prepare($sql);
                $stmt->bind_param("sssiisssiss", $name, $type, $difficulty, $calories, $duration, $filename, $description, $long_description, $sets, $formatted_exercise_list, $date_registered);

                if ($stmt->execute()) {
                    echo "<script>alert('Successfully inserted workout data');</script>";
                    echo "<script>window.location.href = 'admin_workout.php';</script>";
                } else {
                    echo "<script>alert('Failed to insert data: " . $stmt->error . "');</script>";
                }

                $stmt->close();
                $dbConn->close();
            }
            ?>

            <!-- Edit Workout Form -->
            <div class="edit-profile" id="dedit-profile" enctype="multipart/form-data">
                <center>
                    <h2>Edit <span>Workout</span></h2>
                </center>
                <form action="edit.php" method="POST" id="workout" enctype="multipart/form-data">
                    <input type="hidden" id="selectedWorkoutId" name="selectedWorkoutId" value="<?php echo $_GET['workout_id'] ?? ''; ?>">
                    <input type="hidden" id="table" name="table" value="workout">
                    <label for="eworkout-name">Workout Name</label>
                    <input type="text" id="eworkout-name" name="eworkout-name"
                        oninput="checkUniqueName(this, document.getElementById('eworkout-name-feedback'), 
            'Workout Name already exists', 
            'workout', 
            'workout_name', 
            document.getElementById('confirm-btn'), 
            document.getElementById('selectedWorkoutId').value);">
                    <p id="eworkout-name-feedback" class="feedback"></p>

                    <div class="form-columns">
                        <div class="column">
                            <label for="eworkout-type">Workout Type</label>
                            <select id="eworkout-type" name="eworkout-type" required>
                                <option value="">Select Type</option>
                                <option value="Cardio">Cardio</option>
                                <option value="Yoga">Yoga</option>
                                <option value="Weighted">Weighted</option>
                                <option value="Weight-free">Weight-free</option>
                            </select>
                        </div>
                        <div class="column">
                            <label for="eworkout-difficulty">Difficulty</label>
                            <select id="eworkout-difficulty" name="eworkout-difficulty" required>
                                <option value="">Select Difficulty</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-columns">
                        <div class="column">
                            <label for="ecalories">Calories Burned</label>
                            <input type="number" id="ecalories" name="ecalories" oninput="checkNumber(this, document.getElementById('ecalories-feedback'), 'Please enter a non-negative number');" required>
                            <p id="ecalories-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="eduration">Duration (minutes)</label>
                            <input type="number" id="eduration" name="eduration" oninput="checkNumber(this, document.getElementById('eduration-feedback'), 'Please enter a non-negative number');" required>
                            <p id="eduration-feedback" class="feedback"></p>
                        </div>
                        <div class="column">
                            <label for="esets">Sets</label>
                            <input type="number" id="esets" name="esets" oninput="checkNumber(this, document.getElementById('esets-feedback'), 'Please enter a non-negative number');" required>
                            <p id="esets-feedback" class="feedback"></p>
                        </div>
                    </div>

                    <label for="exercise_id">Exercises Checklist</label>
                    <div class="exercise-select-container"></div>

                    <div class="form-columns">
                        <div class="column">
                            <label for="eworkout_picture">Workout Picture</label>
                            <div class="picture" onclick="document.getElementById('eworkout_picture').click()">
                                <p id="ewords">Click To Upload Workout Picture Here</p>
                                <input type="file" name="eworkout_picture" id="eworkout_picture" accept="image/*" style="display: none;">
                                <img id="eimagePreview" src="./assets/workout_pics/" alt="Image Preview">
                            </div>
                        </div>
                        <div class="column">
                            <label for="edesc">Description</label>
                            <textarea id="edesc" name="edesc" rows="4" placeholder="Describe the workout.." required></textarea>
                        </div>
                    </div>

                    <label for="elong_description">Long Description</label>
                    <textarea id="elong_description" name="elong_description" rows="4" placeholder="Detailed workout description..." required></textarea>

                    <div class="table-option">
                        <button type="button" id="discard-btn">Discard Changes</button>
                        <button type="submit" id="confirm-btn">Update Changes</button>
                    </div>
                </form>
                <script>
                    function editValidateForm() {
                        const workoutNameFeedback = document.getElementById('eworkout-name-feedback').textContent.trim();
                        const caloriesFeedback = document.getElementById('ecalories-feedback').textContent.trim();
                        const durationFeedback = document.getElementById('eduration-feedback').textContent.trim();
                        const setsFeedback = document.getElementById('esets-feedback').textContent.trim();

                        const workoutName = document.getElementById('eworkout-name').value.trim();
                        const workoutType = document.getElementById('eworkout-type').value.trim();
                        const difficulty = document.getElementById('eworkout-difficulty').value.trim();
                        const calories = document.getElementById('ecalories').value.trim();
                        const duration = document.getElementById('eduration').value.trim();
                        const sets = document.getElementById('esets').value.trim();
                        const description = document.getElementById('edesc').value.trim();
                        const longDescription = document.getElementById('elong_description').value.trim();
                        const exerciseIds = document.getElementById('eexercise_ids').value.trim();

                        const allFieldsFilled = workoutName && workoutType && difficulty && calories && duration &&
                            sets && description && longDescription && exerciseIds;
                        const noValidationErrors = !workoutNameFeedback && !caloriesFeedback && !durationFeedback && !setsFeedback;

                        document.getElementById('confirm-btn').disabled = !(allFieldsFilled && noValidationErrors);
                    }

                    document.getElementById('eworkout-name').addEventListener('input', editValidateForm);
                    document.getElementById('eworkout-type').addEventListener('change', editValidateForm);
                    document.getElementById('eworkout-difficulty').addEventListener('change', editValidateForm);
                    document.getElementById('eworkout_picture').addEventListener('change', editValidateForm);
                    document.getElementById('ecalories').addEventListener('input', editValidateForm);
                    document.getElementById('eduration').addEventListener('input', editValidateForm);
                    document.getElementById('esets').addEventListener('input', editValidateForm);
                    document.getElementById('edesc').addEventListener('input', editValidateForm);
                    document.getElementById('elong_description').addEventListener('input', editValidateForm);
                    document.querySelector('.edit-profile .exercise-select-container').addEventListener('click', editValidateForm);
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
    </div>

</body>



</html>
<?php
$jsonFile = file_get_contents('./exercises.json');
?>


<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load exercise data
        const exerciseData = <?php echo $jsonFile; ?>;

        // Create exercise tag input for both add and edit forms
        createExerciseTagInput('add-profile', exerciseData);
        createExerciseTagInput('edit-profile', exerciseData);

        // Initialize form validation
        validateForm();
        if (typeof editValidateForm === 'function') {
            editValidateForm();
        }
    });

    function createExerciseTagInput(formClass, exerciseData) {
        const container = document.querySelector(`.${formClass} .exercise-select-container`);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create the tag input container
        const tagInputContainer = document.createElement('div');
        tagInputContainer.className = 'exercise-tag-input-container';

        // Create the tag display area
        const tagDisplay = document.createElement('div');
        tagDisplay.className = 'exercise-tag-display';
        tagDisplay.addEventListener('click', function() {
            checklistDropdown.style.display = 'block';
            searchBox.focus();
        });

        // Create hidden input to store selected exercise IDs
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = formClass === 'add-profile' ? 'exercise_ids' : 'eexercise_ids';
        hiddenInput.id = hiddenInput.name;

        // Create the checklist dropdown
        const checklistDropdown = document.createElement('div');
        checklistDropdown.className = 'exercise-checklist-dropdown';
        checklistDropdown.style.display = 'none';

        // Add search box
        const searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.className = 'exercise-search';
        searchBox.placeholder = 'Search exercises...';
        checklistDropdown.appendChild(searchBox);

        // Create exercise list
        const exerciseList = document.createElement('div');
        exerciseList.className = 'exercise-list';

        // Add exercises
        exerciseData.forEach(exercise => {
            const exerciseLabel = document.createElement('label');
            exerciseLabel.className = 'exercise-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'exercise-checkbox';
            checkbox.value = exercise.id;
            checkbox.dataset.name = exercise.exercise; // Store name in dataset

            exerciseLabel.appendChild(checkbox);
            exerciseLabel.appendChild(document.createTextNode(`${exercise.id} - ${exercise.exercise}`)); // Display only ID & Name
            exerciseList.appendChild(exerciseLabel);
        });

        checklistDropdown.appendChild(exerciseList);

        // Append all elements to the container
        tagInputContainer.appendChild(tagDisplay);
        tagInputContainer.appendChild(hiddenInput);
        tagInputContainer.appendChild(checklistDropdown);
        container.appendChild(tagInputContainer);

        // Add event listeners
        setupExerciseTagInputEvents(formClass);
    }

    function setupExerciseTagInputEvents(formClass) {
        const container = document.querySelector(`.${formClass} .exercise-select-container`);
        if (!container) return;

        const tagDisplay = container.querySelector('.exercise-tag-display');
        const checklistDropdown = container.querySelector('.exercise-checklist-dropdown');
        const searchBox = container.querySelector('.exercise-search');
        const selectAllCheckbox = container.querySelector('.select-all input');
        const exerciseCheckboxes = container.querySelectorAll('.exercise-checkbox');
        const hiddenInput = container.querySelector('input[type="hidden"]');

        document.addEventListener('click', function(event) {
            const isClickInside = container.contains(event.target);
            if (!isClickInside) {
                checklistDropdown.style.display = 'none';
            }
        });

        // Search functionality
        searchBox.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();

            exerciseCheckboxes.forEach(checkbox => {
                const label = checkbox.parentElement;
                const exerciseName = checkbox.dataset.name.toLowerCase();

                if (exerciseName.includes(searchTerm)) {
                    label.style.display = 'block';
                } else {
                    label.style.display = 'none';
                }
            });
        });

        // Individual checkbox functionality
        exerciseCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateTags();
            });
        });

        // Update tags and hidden input
        function updateTags() {
            tagDisplay.innerHTML = '';

            const selectedExercises = Array.from(exerciseCheckboxes)
                .filter(checkbox => checkbox.checked);

            if (selectedExercises.length === 0) {
                tagDisplay.textContent = 'Select exercises...';
            } else {
                selectedExercises.forEach(checkbox => {
                    const tag = document.createElement('span');
                    tag.className = 'exercise-tag';
                    tag.textContent = checkbox.dataset.name;

                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'tag-remove';
                    removeBtn.textContent = '×';
                    removeBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        checkbox.checked = false;
                        updateTags();
                        updateSelectAllCheckbox();
                    });

                    tag.appendChild(removeBtn);
                    tagDisplay.appendChild(tag);
                });
            }

            // Update hidden input
            const selectedIds = selectedExercises.map(checkbox => checkbox.value);
            hiddenInput.value = selectedIds.join(',');

            // Trigger form validation
            if (formClass === 'add-profile' && typeof validateForm === 'function') {
                validateForm();
            } else if (formClass === 'edit-profile' && typeof editValidateForm === 'function') {
                editValidateForm();
            }
        }

        // Initialize tags
        updateTags();
    }

    // Function to pre-select exercises in edit form
    function setSelectedExerciseIds(exerciseIds) {
        if (!exerciseIds || !exerciseIds.length) return;

        const editContainer = document.querySelector('.edit-profile .exercise-select-container');
        if (!editContainer) return;

        const checkboxes = editContainer.querySelectorAll('.exercise-checkbox');
        const hiddenInput = editContainer.querySelector('input[type="hidden"]');

        // Clear all existing selections
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Check the corresponding checkboxes
        exerciseIds.forEach(id => {
            const checkbox = editContainer.querySelector(`.exercise-checkbox[value="${id}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        // Update hidden input and tags
        if (hiddenInput) {
            hiddenInput.value = exerciseIds.join(',');
        }

        // Update display tags
        const tagDisplay = editContainer.querySelector('.exercise-tag-display');
        if (tagDisplay) {
            tagDisplay.innerHTML = '';

            const selectedCheckboxes = Array.from(checkboxes).filter(checkbox => checkbox.checked);

            if (selectedCheckboxes.length === 0) {
                tagDisplay.textContent = 'Select exercises...';
            } else {
                selectedCheckboxes.forEach(checkbox => {
                    const tag = document.createElement('span');
                    tag.className = 'exercise-tag';
                    tag.textContent = checkbox.dataset.name;

                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'tag-remove';
                    removeBtn.textContent = '×';
                    removeBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        checkbox.checked = false;

                        // Update tags and hidden input
                        const selectedIds = Array.from(checkboxes)
                            .filter(cb => cb.checked)
                            .map(cb => cb.value);

                        hiddenInput.value = selectedIds.join(',');

                        // Remove this tag
                        tag.remove();

                        if (selectedIds.length === 0) {
                            tagDisplay.textContent = 'Select exercises...';
                        }

                        // Trigger validation
                        if (typeof editValidateForm === 'function') {
                            editValidateForm();
                        }
                    });

                    tag.appendChild(removeBtn);
                    tagDisplay.appendChild(tag);
                });
            }
        }
    }

    // Update the file input change event listener
    document.getElementById("workout_picture").addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log("image attached");
                const img = document.getElementById("imagePreview");
                img.src = e.target.result;
                img.style.display = "block";

                const words = document.getElementById("words");
                words.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("eworkout_picture").addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log("image attached");
                const img = document.getElementById("eimagePreview");
                img.src = e.target.result;
                img.style.display = "block";

                const words = document.getElementById("ewords");
                words.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    });


    //------------------------select row--------------------------
    let isEditing = false;
    const rows = document.querySelectorAll('table tr:not(:first-child)');
    const editBtn = document.getElementById("edit-btn");
    const deleteBtn = document.getElementById("delete-btn");
    let selectedRow = null;
    document.querySelectorAll(".container tr").forEach(row => {
        row.addEventListener('click', function(event) {
            if (isEditing) return;
            if (this.classList.contains('no-data')) return;

            event.stopPropagation();
            rows.forEach(r => r.classList.remove('selected'));
            selectedRow = this;
            this.classList.add('selected');
            console.log(selectedRow);

            editBtn.disabled = false;
            deleteBtn.disabled = false;
        });
    });

    //------------------------------deselect------------------
    document.addEventListener("click", function(event) {
        const table = document.querySelector(".box table");
        const tableOptions = document.querySelectorAll('.table-option');
        tableOptions.forEach(tableOption => {
            if (table.contains(event.target) && tableOption.contains(event.target)) {
                if (isEditing) return;
                if (selectedRow) {
                    selectedRow.classList.remove('selected');
                    selectedRow = null;
                }
                editBtn.disabled = true;
                deleteBtn.disabled = true;
            }
        });
    }, true);

    //-----------------------------edit data-----------------------
    const addProfile = document.getElementById("dadd-profile");
    const editProfile = document.getElementById("dedit-profile");
    editBtn.addEventListener("click", function() {
        if (!selectedRow) return;

        isEditing = true;
        addProfile.style.display = "none";
        editProfile.style.display = "block";
        editBtn.disabled = true;
        deleteBtn.disabled = true;

        const workoutId = selectedRow.getAttribute("workout-id");

        fetch(`fetch_workout_data.php?workout_id=${workoutId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById("selectedWorkoutId").value = data.workout_id;
                document.getElementById("eworkout-name").value = data.workout_name;
                document.getElementById("edesc").value = data.description;
                document.getElementById("eworkout-type").value = data.workout_type;
                document.getElementById("eworkout-difficulty").value = data.difficulty;
                document.getElementById("ecalories").value = data.calories;
                document.getElementById("eduration").value = data.duration;
                document.getElementById("esets").value = data.sets;
                document.getElementById("elong_description").value = data.long_description;
                document.getElementById("eexercise_ids").value = data.exercise_checklist;

                let exerciseIds = [];
                if (data.exercise_checklist) {
                    exerciseIds = data.exercise_checklist.replace(/[\[\]]/g, '').split(',')
                        .map(id => id.trim())
                        .filter(id => id !== '');
                }
                setSelectedExerciseIds(exerciseIds);

                if (data.image) {
                    const imagePath = `./assets/workout_pics/${data.image}`;
                    const imagePreview = document.getElementById("eimagePreview");
                    imagePreview.src = imagePath;
                    imagePreview.style.display = "block";
                    document.getElementById("ewords").style.display = "none";
                }
            })
            .catch(error => {
                console.error("Error fetching workout data:", error);
                alert("Failed to fetch workout data. Check the console for details.");
            });
    });


    //--------------------------discard changes button---------------------------------------
    document.getElementById("discard-btn").addEventListener("click", () => {
        addProfile.style.display = "block";
        editProfile.style.display = "none";
        isEditing = false;
    });

    //----------------------delete data------------------------
    let id = null;
    let table = null;
    deleteBtn.addEventListener("click", () => {
        if (!selectedRow) return;

        let popUp = document.getElementById("popup");
        popUp.style.display = "flex";
        id = selectedRow.getAttribute("workout-id");
        table = "workout";
        console.log(`ID: ${id}, Table: ${table}`);
    });

    document.querySelector(".content").addEventListener("click", function(event) {
        if (event.target.classList.contains("confirmDelete")) {

            fetch("delete.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`
                })
                .then(res => res.text())
                .then(() => location.reload())
                .catch(console.error);

            document.getElementById("popup").style.display = "none";
        }

        // Cancel buttons (for both popups)
        if (event.target.classList.contains("cancelDelete")) {
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
</script>