document.addEventListener("DOMContentLoaded", function () {
    // Get workout data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let workoutId = urlParams.get("workout_id");
    let duration = urlParams.get("duration");
    let calories = urlParams.get("calories");

    console.log("Workout ID from URL:", workoutId);
    console.log("Duration from URL (seconds):", duration);
    console.log("Calories from URL:", calories);

    // Fallback to localStorage if URL params are missing
    if (!duration || !calories) {
        try {
            const workoutStats = JSON.parse(localStorage.getItem("workoutStats"));
            console.log("Retrieved from localStorage:", workoutStats);

            if (workoutStats) {
                if (!duration) duration = workoutStats.duration;
                if (!calories) calories = workoutStats.calories;
            }
        } catch (error) {
            console.error("Error parsing workoutStats from localStorage:", error);
        }
    }

    // Ensure duration and calories are numbers
    duration = parseInt(duration, 10);
    // calories = parseInt(calories, 10);

    // Display stats in the UI
    const durationStat = document.querySelector(".duration-stat");
    // const caloriesStat = document.querySelector(".calories-stat");

    if (duration) {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        durationStat.innerHTML = `<i class="fa-solid fa-stopwatch"></i> ${minutes}m ${seconds}s`;
        console.log("Formatted Duration:", `${minutes}m ${seconds}s`);
    } else {
        durationStat.innerHTML = `<i class="fa-solid fa-stopwatch"></i> --`;
        console.warn("Duration not found.");
    }

    // if (calories) {
    //     caloriesStat.innerHTML = `<i class="fa-solid fa-fire"></i> ${calories} kcal`;
    //     console.log("Displayed Calories:", `${calories} kcal`);
    // } else {
    //     caloriesStat.innerHTML = `</i> --`;
    //     console.warn("Calories not found.");
    // }

    // Function to show feedback messages - moved outside event listener
    function showFeedback(message, type) {
        // Create feedback element if it doesn't exist
        let feedbackContainer = document.getElementById("feedback-container");
        if (!feedbackContainer) {
            feedbackContainer = document.createElement("div");
            feedbackContainer.id = "feedback-container";
            feedbackContainer.style.position = "fixed";
            feedbackContainer.style.top = "20px";
            feedbackContainer.style.left = "50%";
            feedbackContainer.style.transform = "translateX(-50%)";
            feedbackContainer.style.zIndex = "1000";
            document.body.appendChild(feedbackContainer);
        }

        const feedbackDiv = document.createElement("div");
        feedbackDiv.className = `feedback ${type}`;
        feedbackDiv.style.padding = "12px 20px";
        feedbackDiv.style.marginBottom = "10px";
        feedbackDiv.style.borderRadius = "5px";
        feedbackDiv.style.color = "#fff";
        feedbackDiv.style.textAlign = "center";
        feedbackDiv.style.fontWeight = "bold";

        if (type === "success") {
            feedbackDiv.style.backgroundColor = "#4CAF50";
        } else if (type === "error") {
            feedbackDiv.style.backgroundColor = "#F44336";
        }

        feedbackDiv.textContent = message;

        feedbackContainer.appendChild(feedbackDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            feedbackDiv.remove();

            // Remove container if empty
            if (feedbackContainer.children.length === 0) {
                feedbackContainer.remove();
            }
        }, 3000);
    }

    // Handle done button click
    const doneBtn = document.getElementById("done-btn");
    doneBtn.addEventListener("click", function () {
        if (!workoutId) {
            console.error("Workout ID not found");
            showFeedback("Error: Workout ID not found", "error");
            // Still redirect after a delay to avoid trapping user
            setTimeout(() => {
                window.location.href = "workout_page.php";
            }, 3000);
            return;
        }

        // Show loading state
        doneBtn.textContent = "Saving...";
        doneBtn.disabled = true;

        // Create form data to send to server
        const formData = new FormData();
        formData.append("workout_id", workoutId);
        formData.append("member_id", memberId); // From PHP

        // Send AJAX request to save workout history
        fetch("save_workout_history.php", {
            method: "POST",
            body: formData,
        })
            .then((response) => {
                return response.text().then((text) => {
                    console.log("Raw response:", text);
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error("Failed to parse JSON:", e);
                        throw new Error("Server returned invalid response");
                    }
                });
            })
            .then((data) => {
                if (data.success) {
                    // Show success message
                    showFeedback("Workout saved successfully!", "success");

                    // Clear workout stats from localStorage
                    localStorage.removeItem("workoutStats");

                    // Redirect after a brief delay to show the success message
                    setTimeout(() => {
                        window.location.href = "workout_page.php";
                    }, 1500);
                } else {
                    console.error("Failed to save workout:", data.message);
                    // Display error message to user
                    showFeedback("Error: " + data.message, "error");

                    // Reset button state
                    doneBtn.textContent = "Done";
                    doneBtn.disabled = false;
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                showFeedback("Error connecting to server", "error");

                // Reset button state
                doneBtn.textContent = "Done";
                doneBtn.disabled = false;
            });
    });

    // Handle restart button click - moved outside done button event listener
    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) { // Check if the button exists in the DOM
        restartBtn.addEventListener("click", function () {
            if (!workoutId) {
                console.error("Workout ID not found");
                showFeedback("Error: Workout ID not found", "error");
                return;
            }

            // Redirect back to the workout page
            window.location.href = `subworkout_page.php?workout_id=${workoutId}`;
        });
    }
});