document.addEventListener("DOMContentLoaded", function () {
  const records = document.querySelectorAll(".workout-record");

  records.forEach((record) => {
    record.addEventListener("click", function () {
      const dietId = this.getAttribute("data-diet-id");
      const mealType = this.getAttribute("data-meal-type");

      if (dietId && mealType !== "custom") {
        window.location.href = `subdiet_page.php?diet_id=${dietId}`;
      }
    });
  });
});

function type_filter() {
  let selectedType = document.getElementById("type-filter").value.toLowerCase();
  let records = document.querySelectorAll(".record-wrapper");
  let no_records = document.querySelectorAll(".no-filtered-records");

  let exist_records = false;

  records.forEach((wrapper) => {
    let record = wrapper.querySelector(".workout-record");
    let mealType = record.getAttribute("data-meal-type").toLowerCase().trim();

    if (selectedType === "all" || mealType === selectedType) {
      wrapper.style.display = "block";
      exist_records = true;
    } else {
      wrapper.style.display = "none";
    }
  });

  if (!exist_records) {
    no_records.style.display = "block";
  } else {
    no_records.style.display = "none";
  }
}

const previousBtn = document.querySelector(".previous");

previousBtn.addEventListener("click", function () {
  window.history.back();
});

document.addEventListener("DOMContentLoaded", () => {
  if (typeof workoutsData !== "undefined" && workoutsData) {
    window.workouts = JSON.parse(workoutsData);
    console.log("Loaded workouts:", window.workouts);
  } else {
    console.warn("No workouts data found");
  }

  setupWorkoutHistoryCards();
  setupPopupCloseHandlers();
  setupFilters();
});

/**
 * Setup filter functionality for workout history
 */
function setupFilters() {
  const allFilterButton = document.getElementById("all-filter");
  const dateRangeButton = document.getElementById("date-range-filter");
  const resetDateFilterBtn = document.getElementById("reset-date-filter");

  // Set up All filter dropdown
  if (allFilterButton) {
    allFilterButton.addEventListener("click", () => {
      toggleFilterDropdown("activity-types-dropdown");
    });

    // Setup activity type filter handlers
    document.querySelectorAll(".activity-type-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        const selectedType = e.target.getAttribute("data-type");
        filterByActivityType(selectedType);

        // Update button text to show selected filter
        const buttonText = allFilterButton.querySelector(".filter-text");
        buttonText.textContent = selectedType;

        // Hide dropdown
        document
          .getElementById("activity-types-dropdown")
          .classList.remove("show");
      });
    });
  }

  // Set up Date Range picker
  if (dateRangeButton) {
    dateRangeButton.addEventListener("click", () => {
      toggleDateRangePicker();
    });

    // Apply date filter button
    const applyDateButton = document.getElementById("apply-date-filter");
    if (applyDateButton) {
      applyDateButton.addEventListener("click", () => {
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;

        if (startDate && endDate) {
          filterByDateRange(startDate, endDate);

          // Update button text to show selected date range
          const startFormatted = formatShortDate(startDate);
          const endFormatted = formatShortDate(endDate);
          const buttonText = dateRangeButton.querySelector(".filter-text");
          buttonText.textContent = `${startFormatted} - ${endFormatted}`;

          // Hide date picker
          document.getElementById("date-range-picker").classList.remove("show");
        }
      });
    }

    if (resetDateFilterBtn) {
      resetDateFilterBtn.addEventListener("click", function () {
        // Clear the date inputs
        document.getElementById("start-date").value = "";
        document.getElementById("end-date").value = "";

        // Reset the filter text to default
        document.querySelector("#date-range-filter .filter-text").textContent =
          "Date Range";

        // Show all workout records
        const workoutRecords = document.querySelectorAll(".workout-record");
        const workoutDates = document.querySelectorAll(".workout-date");

        workoutRecords.forEach((record) => {
          record.style.display = "grid";
        });

        workoutDates.forEach((date) => {
          date.style.display = "block";
        });

        // Close the date picker dropdown (using the same method as other dropdowns)
        document.getElementById("date-range-picker").classList.remove("show");

        // Update any visible indicators that filtering is active
        document
          .getElementById("date-range-filter")
          .classList.remove("active-filter");

        const noRecordsMsg = document.querySelector(".no-filtered-records");
        if (noRecordsMsg) {
          noRecordsMsg.style.display = "none";
        }
      });
    }

    // Close date picker button
    const closeDatePicker = document.getElementById("close-date-picker");
    if (closeDatePicker) {
      closeDatePicker.addEventListener("click", () => {
        document.getElementById("date-range-picker").classList.remove("show");
      });
    }
  }
}

/**
 * Toggle display of the filter dropdown
 */
function toggleFilterDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.classList.toggle("show");

    // Close other dropdowns
    if (dropdownId === "activity-types-dropdown") {
      document.getElementById("date-range-picker")?.classList.remove("show");
    } else if (dropdownId === "date-range-picker") {
      document
        .getElementById("activity-types-dropdown")
        ?.classList.remove("show");
    }
  }
}

/**
 * Toggle display of the date range picker
 */
function toggleDateRangePicker() {
  const dateRangePicker = document.getElementById("date-range-picker");
  dateRangePicker.classList.toggle("show");

  // Close the other dropdown if it's open
  document.getElementById("activity-types-dropdown").classList.remove("show");
}

/**
 * Format date for display in button
 */
function formatShortDate(dateString) {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

/**
 * Filter workout records by date range
 */
function filterByDateRange(startDate, endDate) {
  const workoutRecords = document.querySelectorAll(".workout-record");
  const workoutDateHeaders = document.querySelectorAll(".workout-date");
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59); // Set to end of day
  let visibleCount = 0;

  // First, hide all date headers
  workoutDateHeaders.forEach((header) => {
    header.style.display = "none";
  });

  // Create a map to store date -> records
  const dateMap = new Map();

  // Process records
  workoutRecords.forEach((record) => {
    // Get date from previous date header
    const prevElement = record.previousElementSibling;
    if (!prevElement || !prevElement.classList.contains("workout-date")) {
      record.style.display = "none";
      return;
    }

    let dateText = prevElement.querySelector("p").textContent;
    let recordDate;

    // Convert display text to actual date
    if (dateText === "Today") {
      recordDate = new Date();
    } else if (dateText === "Yesterday") {
      recordDate = new Date();
      recordDate.setDate(recordDate.getDate() - 1);
    } else {
      recordDate = new Date(dateText);
    }

    // Check if within range
    const inRange = recordDate >= start && recordDate <= end;

    if (inRange) {
      record.style.display = "grid";
      prevElement.style.display = "block";
      visibleCount++;
    } else {
      record.style.display = "none";
    }
  });

  // Show "no records" message if no results
  checkAndDisplayNoRecordsMessage(visibleCount);
}

/**
 * Check if there are no visible records and display message
 */
function checkAndDisplayNoRecordsMessage(visibleCount) {
  const container = document.querySelector(".main-content");
  let noRecordsMsg = document.querySelector(".no-filtered-records");

  if (visibleCount === 0) {
    if (!noRecordsMsg) {
      noRecordsMsg = document.createElement("div");
      noRecordsMsg.className = "no-filtered-records";
      noRecordsMsg.innerHTML =
        "<p>Workout history still not available. Let's have a workout!</p>";
      container.appendChild(noRecordsMsg);
    }
    noRecordsMsg.style.display = "block";
  } else if (noRecordsMsg) {
    noRecordsMsg.style.display = "none";
  }
}

// Global variable to store the selected workout
// let selectedWorkout = null;
// let globalCurrentlyPlaying = null;

/**
 * Setup click handlers for workout history records
 */
function setupWorkoutHistoryCards() {
  document.querySelectorAll(".workout-record").forEach((card) => {
    card.addEventListener("click", () => {
      // Extract workout details from the clicked card
      const workoutName = card.querySelector(".name").textContent;
      const workoutType = card.querySelector(".type").textContent;
      const workoutCalories = card.querySelector(".kcal").textContent;
      const workoutDuration = card.querySelector(".time").textContent;
      const workoutImage = card.querySelector(".picture").getAttribute("src");
      const workoutId = card.getAttribute("data-workout-id");

      // Try to fetch full workout details if available in the workouts array
      let workout = null;

      // Make sure workouts is defined and accessible
      if (
        typeof window.workouts !== "undefined" &&
        window.workouts &&
        window.workouts.length > 0
      ) {
        workout = window.workouts.find((w) => w.id === workoutId);
        console.log("Found workout in global array:", workout);
      } else {
        console.warn("Global workouts array not found or empty");
      }

      if (!workout) {
        // Create a basic workout object from card data
        console.warn("Could not find workout with ID:", workoutId);
        workout = {
          id: workoutId,
          title: workoutName,
          type: workoutType,
          description: "Full-body endurance with weights.",
          calories: workoutCalories,
          duration: workoutDuration,
          image: workoutImage,
          level: "intermediate",
          exercises: [],
        };
      }

      // Store the selected workout
      window.selectedWorkout = workout;
    });
  });
}

/**
 * Display workout popup with details and exercises
 */
function displayWorkoutPopup(workout) {
  // Create popup if it doesn't exist yet
  if (!document.getElementById("popup-container")) {
    createDetailedPopupElement();
  }

  const popup = document.getElementById("popup-container");

  // Update popup content
  document.getElementById("popup-title").textContent =
    workout.title.toUpperCase();
  document.getElementById("popup-desc").textContent =
    workout.description || "Full-body workout routine";

  // Extract numbers only for measurements
  let durationNum = "30";
  let caloriesNum = "240";

  if (workout.duration) {
    const durationMatch = workout.duration.match(/\d+/);
    if (durationMatch) durationNum = durationMatch[0];
  }

  if (workout.calories) {
    const caloriesMatch = workout.calories.match(/\d+/);
    if (caloriesMatch) caloriesNum = caloriesMatch[0];
  }

  document.getElementById("popup-duration").textContent = durationNum;
  document.getElementById("popup-calories").textContent = caloriesNum;

  // Update level indicator
  updatePopupLevel(workout.level || "intermediate");

  // Update image
  const workoutImage = document.getElementById("popup-workout-image");
  if (workout.image) {
    workoutImage.src = workout.image;
    workoutImage.alt = `${workout.title} Image`;
    workoutImage.style.objectFit = "cover";
  } else {
    workoutImage.src = "./assets/icons/error.svg";
    workoutImage.alt = "Workout Image Not Found";
    workoutImage.style.objectFit = "contain";
    workoutImage.style.width = "60%";
    workoutImage.style.height = "auto";
  }

  // Update exercise list
  updateExerciseList(workout);

  // Show popup
  popup.classList.add("active");
}

/**
 * Create detailed popup HTML element (matching Image 2)
 */
function createDetailedPopupElement() {
  const popupHTML = `
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
        </div>`;

  // Add the popup to the document
  document.body.insertAdjacentHTML("beforeend", popupHTML);

  // // Add event listener for the Start button
  // document.querySelector('.popup-start-button').addEventListener('click', () => {
  //   if (selectedWorkout) {
  //     // Store the workout in localStorage to use in workout page
  //     localStorage.setItem('currentWorkout', JSON.stringify([selectedWorkout]));
  //     // Navigate to the workout page
  //     window.location.href = 'subworkout_page.php';
  //   }
  // });

  document
    .querySelector(".popup-start-button")
    .addEventListener("click", () => {
      if (selectedWorkout) {
        localStorage.setItem(
          "currentWorkout",
          JSON.stringify([selectedWorkout])
        );
        window.location.href = "subworkout_page.php";
      } else {
        console.error("No workout selected");
      }
    });
}

/**
 * Setup handlers to close the popup
 */
function setupPopupCloseHandlers() {
  // Use event delegation since popup may not exist at load time
  document.body.addEventListener("click", (e) => {
    const popup = document.getElementById("popup-container");
    if (!popup) return;

    if (
      e.target.classList.contains("popup-close") ||
      (e.target.classList.contains("popup-container") && e.target === popup)
    ) {
      popup.classList.remove("active");
      stopAllVideos();
      selectedWorkout = null;
    }
  });
}

/**
 * Update level indicator in popup
 */
function updatePopupLevel(level) {
  const popupLevel = document.getElementById("popup-level");
  if (!popupLevel) return;

  const currentMeter = popupLevel.querySelector(".difficulty-meter");

  if (currentMeter) {
    currentMeter.remove();
  }

  const meterContainer = document.createElement("div");
  meterContainer.className = `difficulty-meter ${level.toLowerCase()}`;

  // Create three bars for the difficulty meter
  for (let i = 0; i < 3; i++) {
    const bar = document.createElement("div");
    bar.className = "difficulty-bar";
    meterContainer.appendChild(bar);
  }

  // Set active bars based on level
  const bars = meterContainer.querySelectorAll(".difficulty-bar");
  const activeBars =
    level.toLowerCase() === "beginner"
      ? 1
      : level.toLowerCase() === "intermediate"
      ? 2
      : 3;

  for (let i = 0; i < activeBars; i++) {
    bars[i].classList.add("active");
  }

  popupLevel.innerHTML = "";
  popupLevel.appendChild(meterContainer);
}

/**
 * Function to create exercise item (from your reference code)
 */
function createExerciseItem(exercise) {
  // Validate input
  if (!exercise || typeof exercise !== "object") {
    console.error("Invalid exercise object:", exercise);
    return "";
  }

  // Ensure required properties exist with fallbacks
  const exerciseName = exercise.exercise || exercise.name || "unknown-exercise";
  const videoSrc = exercise.video || "";

  // Determine if we have reps or duration
  const detailText = exercise.reps
    ? `${exercise.reps} reps`
    : exercise.duration
    ? exercise.duration
    : exercise.time || "5 minutes";

  // Create a unique ID for the video element
  const videoId = `video-${exerciseName
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")}-${Date.now()}`;

  return `
    <div class="exercise-item" data-video="${videoSrc}" data-exercise="${exerciseName}" data-video-id="${videoId}">
      <div class="exercise-video-container">
        <video id="${videoId}" class="exercise-video" preload="metadata">
          <source src="${videoSrc}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div class="video-overlay">
          <button class="play-button">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>
      <div class="exercise-info">
        <div class="exercise-name">${exerciseName}</div>
        <div class="exercise-details">${detailText}</div>
      </div>
    </div>
  `;
}

/**
 * Update the exercise list in the popup
 */
function updateExerciseList(workout) {
  console.log("Updating exercise list with:", workout);
  const container = document.getElementById("exercise-list-container");

  if (!container) {
    console.error("Exercise list container not found");
    return;
  }

  // First stop any currently playing videos
  stopAllVideos();

  // Clear existing content
  container.innerHTML = "";

  // If workout has no exercises or they're not properly defined, add placeholders
  if (
    !workout.exercises ||
    !Array.isArray(workout.exercises) ||
    workout.exercises.length === 0
  ) {
    console.warn("No exercises found in workout, using placeholders");
    // Add some placeholder exercises
    const placeholderExercises = [
      {
        exercise: "Burpees with Dumbbell Press",
        reps: "10 reps",
        video: "",
      },
      {
        exercise: "Dumbbells High Pulls",
        reps: "12 reps",
        video: "",
      },
    ];

    placeholderExercises.forEach((exercise) => {
      container.innerHTML += createExerciseItem(exercise);
    });
  } else {
    console.log("Found exercises to display:", workout.exercises.length);
    // Add the actual exercises
    workout.exercises.forEach((exercise) => {
      // Ensure exercise has all required properties
      if (!exercise.exercise && exercise.name) {
        exercise.exercise = exercise.name;
      } else if (!exercise.exercise) {
        exercise.exercise = "Unknown Exercise";
      }

      container.innerHTML += createExerciseItem(exercise);
    });
  }

  // Initialize videos after DOM is updated
  setTimeout(() => {
    initializeExerciseVideos();

    // Initialize the scroll arrows
    forceArrowCheck();
    setupExerciseListArrows();
  }, 300);
}

/**
 * Stop all playing videos
 */
function stopAllVideos() {
  console.log("Stopping all videos");

  // Reset the global playing state
  globalCurrentlyPlaying = null;

  // Stop all videos and reset UI
  document.querySelectorAll(".exercise-video").forEach((video) => {
    if (!video.paused) {
      console.log("Pausing video:", video.id);
      video.pause();
      video.currentTime = 0;
    }
  });

  // Reset all UI elements
  document.querySelectorAll(".video-overlay").forEach((overlay) => {
    overlay.style.display = "flex";
  });

  document.querySelectorAll(".play-button i").forEach((icon) => {
    icon.className = "fas fa-play";
  });
}

/**
 * Initialize exercise videos
 */
function initializeExerciseVideos() {
  console.log("Initializing exercise videos...");

  // Step 1: Make sure all videos are stopped and reset first
  stopAllVideos();

  // Step 2: Attach click handlers to all video elements
  document.querySelectorAll(".exercise-item").forEach((item) => {
    const videoId = item.getAttribute("data-video-id");
    const video = document.getElementById(videoId);
    const overlay = item.querySelector(".video-overlay");
    const playButton = item.querySelector(".play-button");

    if (!video || !overlay || !playButton) {
      console.error("Missing video elements for:", videoId);
      return;
    }

    // Remove any existing event listeners to prevent duplicates
    item.replaceWith(item.cloneNode(true));

    // Get the elements again after cloning
    const updatedItem = document.querySelector(`[data-video-id="${videoId}"]`);
    if (!updatedItem) return;

    const updatedVideo = document.getElementById(videoId);
    const updatedOverlay = updatedItem.querySelector(".video-overlay");
    const updatedPlayButton = updatedItem.querySelector(".play-button");

    if (!updatedVideo || !updatedOverlay || !updatedPlayButton) return;

    // Main click handler for the play button
    updatedPlayButton.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();

      console.log("Play button clicked for:", videoId);

      // If this is already the currently playing video, pause it
      if (globalCurrentlyPlaying === videoId) {
        console.log("Pausing current video:", videoId);
        updatedVideo.pause();
        updatedOverlay.style.display = "flex";
        this.querySelector("i").className = "fas fa-play";
        globalCurrentlyPlaying = null;
      }
      // Otherwise, stop any currently playing video and play this one
      else {
        console.log("Playing new video:", videoId);
        stopAllVideos();

        // Try to play the video
        const playPromise = updatedVideo.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              updatedOverlay.style.display = "none";
              this.querySelector("i").className = "fas fa-pause";
              globalCurrentlyPlaying = videoId;
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              alert("There was an error playing the video. Please try again.");
            });
        }
      }
    });

    // Handle video ended event
    updatedVideo.addEventListener("ended", function () {
      console.log("Video ended:", videoId);
      updatedOverlay.style.display = "flex";
      updatedPlayButton.querySelector("i").className = "fas fa-play";
      globalCurrentlyPlaying = null;
    });
  });

  console.log("Video initialization complete");
}

/**
 * Force check of arrow visibility
 */
function forceArrowCheck() {
  const container = document.getElementById("exercise-list-container");
  const leftArrow = document.querySelector(".exercise-arrow-left");
  const rightArrow = document.querySelector(".exercise-arrow-right");

  if (!container || !leftArrow || !rightArrow) return;

  // Check if container has overflow content
  const hasOverflow = container.scrollWidth > container.clientWidth;
  const isAtStart = container.scrollLeft <= 0;
  const isAtEnd =
    container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

  // Update arrow visibility
  leftArrow.classList.toggle("hidden", isAtStart);
  rightArrow.classList.toggle("hidden", isAtEnd || !hasOverflow);
}

/**
 * Setup exercise list scroll arrows
 */
function setupExerciseListArrows() {
  const container = document.getElementById("exercise-list-container");
  const leftArrow = document.querySelector(".exercise-arrow-left");
  const rightArrow = document.querySelector(".exercise-arrow-right");

  if (!container || !leftArrow || !rightArrow) {
    return;
  }

  // Function to update arrow visibility
  function updateArrowVisibility() {
    // Get the current scroll position and dimensions
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
    const hasOverflow = container.scrollWidth > container.clientWidth;

    // Show/hide arrows based on scroll position and if there's overflow
    leftArrow.classList.toggle("hidden", isAtStart);
    rightArrow.classList.toggle("hidden", isAtEnd);

    // Force arrows to be visible if there's overflow content and we're not at the edge
    if (hasOverflow) {
      if (!isAtStart) leftArrow.classList.remove("hidden");
      if (!isAtEnd) rightArrow.classList.remove("hidden");
    }
  }

  // Initial check - but wait for content to be fully rendered
  setTimeout(updateArrowVisibility, 100);

  // Left arrow click
  leftArrow.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling
    container.scrollBy({
      left: -250,
      behavior: "smooth",
    });
  });

  // Right arrow click
  rightArrow.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling
    container.scrollBy({
      left: 250,
      behavior: "smooth",
    });
  });

  // Update on scroll
  container.addEventListener("scroll", updateArrowVisibility);

  // Update on window resize
  window.addEventListener("resize", updateArrowVisibility);
}

// Add CSS for the detailed popup
const popupStyles = `
.popup-container {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    z-index: 1000;
    transition: all 0.3s;
}

.popup-container.active {
    display: flex;
}

.popup-workout-pic {
    width: 50%;
    height: 100%;
    border-radius: 16px 0 0 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000000;
    transition: all 0.3s;
}

#popup-workout-image {
    width: 100%;
    height: 100%;
    max-height: 600px;
    object-fit: cover;
    object-position: center;
}

.seperate-workout-pic-details {
    display: flex;
    max-height: 600px;
    height: 100%;
    width: 100%;
}

#popup-body {
    width: 50%;
    padding: 2rem 2rem 2rem 0;
    transition: all 0.3s;
}

.popup-workout-pic::before {
    content: "No Image Available";
    color: white;
    display: none;
    position: absolute;
}

.popup-workout-pic:empty::before {
    display: block;
}

.gradient-white {
    position: relative;
    left: -28px;
    width: 30px;
    max-height: 600px;
    height: 100%;
    background: linear-gradient(to left, white, transparent);
    pointer-events: none;
    z-index: 100;
    transition: all 0.3s;
}

html.dark-mode .gradient-white {
    background: linear-gradient(to left, #393939, transparent);
}

.popup-content {
    background: var(--card-background);
    padding: 0rem;
    border-radius: 16px;
    max-width: 1000px;
    max-height: 600px;
    width: 100%;
    height: 100%;
    box-shadow: var(--box-shadow-light);
    position: relative;
    text-align: center;
    transition: all 0.3s;
}

.popup-close {
    position: absolute;
    top: 1rem;
    right: 1.5rem;
    cursor: pointer;
    font-size: 1.5rem;
    color: var(--text-color);
}

.popup-content h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    margin-top: 2rem;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
}

.popup-content p {
    position: relative;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    margin-top: 1rem;
    color: var(--text-color);
}

html.dark-mode .popup-content h2 {
    color: white;
}

.popup-stats {
    display: flex;
    position: relative;
    top: 60px;
    justify-content: center;
    gap: 2.4rem;
    margin-bottom: 2rem;
}

.popup-stat-item {
    text-align: center;
}

.popup-stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-color);
}

.popup-stat-label {
    font-size: 0.9rem;
    color: var(--secondary-color);
    margin-top: 0.5rem;
}

.popup-start-button {
    width: 100%;
    position: relative;
    top: 60px;
    padding: 0.9rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

.popup-start-button:hover {
    background: #ff9b6a;
}

/* Difficult level graphes */
.difficulty-meter {
    width: 50px;
    display: flex;
    gap: 4px;
    margin-top: 5px;
    margin-bottom: 12px;
}

.difficulty-bar {
    height: 20px;
    flex: 1;
    background-color: #e0e0e0;
    border-radius: 2px;
    transition: background-color 0.3s ease;
}

.difficulty-bar.active {
    background-color: #4CAF50;
}

.beginner .difficulty-bar.active {
    background-color: #4CAF50;
}

.intermediate .difficulty-bar.active {
    background-color: #FFA726;
}

.advanced .difficulty-bar.active {
    background-color: #F44336;
}

/* Exercise List */
.exercise-list-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exercise-list-container {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 10px 0;
  -ms-overflow-style: none;
  scrollbar-width: none;
  gap: 15px;
}

.exercise-list-container::-webkit-scrollbar {
  display: none;
}

.exercise-list-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    position: absolute;
    z-index: 100;
    transition: all 0.3s ease;
}

html.dark-mode .exercise-list-arrow {
    background-color: #4d4d4e;
}

.exercise-list-arrow.hidden {
    opacity: 0;
    pointer-events: none;
    /* Better than display:none as it preserves layout */
}

.exercise-list-arrow i {
    font-size: 16px;
    color: #333;
}

html.dark-mode .exercise-list-arrow i {
    color: #bdbdbd;
}

.exercise-list-arrow:hover {
    background-color: #f0f0f0;
}

.exercise-arrow-left {
    left: -10px;
}

.exercise-arrow-right {
    right: -10px;
}

/* Hide arrows when not needed */
.exercise-list-arrow.hidden {
    display: none;
}

.exercise-item {
  flex: 0 0 auto;
  width: 200px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.exercise-video-container {
  position: relative;
  width: 100%;
  height: 120px;
  background-color: #f0f0f0;
}

.exercise-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.play-button {
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.play-button:hover {
  background-color: white;
  transform: scale(1.1);
}

.exercise-info {
  padding: 10px;
}

.exercise-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.exercise-details {
  color: #666;
  font-size: 14px;
}

/* Make workout records look clickable */
.workout-record {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.workout-record:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Media query for smaller screens */
@media screen and (max-width: 1062px) {
    .popup-workout-pic {
        display: none;
        transition: all 0.3s;
    }

    #popup-body {
        width: 100%;
        padding: 2rem 2rem 2rem 2rem;
        transition: all 0.3s;
    }

    .gradient-white {
        transition: all 0.3s;
        display: none;
    }

    .popup-content {
        max-width: 90%;
        transition: all 0.3s;
    }
}
`;

// Add styles to the document
document.addEventListener("DOMContentLoaded", () => {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = popupStyles;
  document.head.appendChild(styleSheet);
});
