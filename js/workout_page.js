class WorkoutCarousel {
    constructor() {
        this.carousel = document.querySelector('.workout-carousel');
        this.track = document.querySelector('.workout-slides');
        // We'll use the carouselWorkouts from PHP
        this.slides = this.getWorkoutsForToday();
        this.currentIndex = 0;
        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.autoSlideInterval = null;
        this.autoSlideDelay = 10000;
        this.init();
    }

    getWorkoutsForToday() {
        // Use carouselWorkouts that was passed from PHP
        // This already contains one random workout from each activity type
        const today = new Date();
        const seed = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

        // Create a simple hash from the date string to use as a seed
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }

        // Shuffle the array based on the date seed
        const shuffledWorkouts = [...carouselWorkouts];
        for (let i = shuffledWorkouts.length - 1; i > 0; i--) {
            const j = Math.abs((hash + i) % (i + 1));
            [shuffledWorkouts[i], shuffledWorkouts[j]] = [shuffledWorkouts[j], shuffledWorkouts[i]];
        }

        // Transform the workout data into the format needed for carousel
        return shuffledWorkouts.map(workout => ({
            id: workout.id,
            title: workout.title,
            description: workout.description || "Experience this carefully crafted workout routine designed to enhance your fitness journey.",
            duration: workout.duration,
            long_description: workout.long_description,
            calories: workout.calories,
            image: workout.image || "./assets/workout_pics/workout9.jpg",
            level: workout.level,
            type: workout.type,
            exercises: workout.exercises
        }));
    }

    init() {
        this.createSlides();
        this.createNavigation();
        this.bindEvents();
        this.updateSlidePosition();
        this.updateSlideVisibility();
        this.startAutoSlide();
    }

    startAutoSlide() {
        // Clear any existing interval
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }

        // Start new interval
        this.autoSlideInterval = setInterval(() => {
            if (this.currentIndex < this.slides.length - 1) {
                this.nextSlide();
            } else {
                this.goToSlide(0); // Return to first slide
            }
        }, this.autoSlideDelay);
    }

    pauseAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }

    resumeAutoSlide() {
        // Wait for transition and user interaction to complete before resuming
        setTimeout(() => {
            this.startAutoSlide();
        }, 500);
    }

    createSlides() {
        const slidesHTML = this.slides.map((slide, index) => `
            <div class="workout-slide" data-index="${index}" data-workout-id="${slide.id}" data-workout-index="${index}">
                <div class="workout-card">
                    <div class="card-content">
                        <h3>${slide.title}</h3>
                        <p>${slide.long_description}</p>
                        <div class="workout-meta">
                            <span class="duration">
                                <i class="fas fa-clock"></i> ${slide.duration}
                            </span>
                            <span class="calories">
                                <i class="fas fa-fire"></i> ${slide.calories}
                            </span>
                        </div>
                        <button class="start-workout" data-workout-id="${slide.id}">Start Workout</button>
                    </div>
                    <div class="seperate-workout-transparent"></div>
                    <div class="card-image">
                        <img src="${slide.image}" alt="${slide.title}">
                    </div>
                </div>
            </div>
        `).join('');

        this.track.innerHTML = slidesHTML;
        this.slides = document.querySelectorAll('.workout-slide');

        document.querySelectorAll('.start-workout').forEach(button => {
            button.addEventListener('click', (e) => {
                const clickedButton = e.currentTarget || e.target;
                const workoutId = clickedButton.getAttribute('data-workout-id');

                if (workouts && workouts.length > 0) {
                    const workout = workouts.find(w => w.id == workoutId);
                    if (workout) {
                        selectedWorkout = workout;
                        displayWorkoutPopup(workout);
                    } else {
                        console.error('Workout not found with ID:', workoutId);
                    }
                } else {
                    console.error('Workouts array is empty or undefined');
                }
            });
        });
    }

    createNavigation() {
        const nav = document.createElement('div');
        nav.className = 'carousel-nav';

        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToSlide(index));
            nav.appendChild(dot);
        });

        this.carousel.appendChild(nav);
    }

    bindEvents() {
        // Touch/Trackpad events
        this.carousel.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.pauseAutoSlide();
        });

        this.carousel.addEventListener('touchmove', (e) => {
            if (this.isTransitioning) return;

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;

            // Calculate horizontal and vertical distance moved
            const deltaX = this.touchStartX - touchEndX;
            const deltaY = this.touchStartY - touchEndY;

            // If horizontal movement is greater than vertical movement,
            // prevent default scrolling behavior
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }, { passive: false });

        this.carousel.addEventListener('touchend', (e) => {
            if (this.isTransitioning) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = this.touchStartX - touchEndX;
            const deltaY = this.touchStartY - touchEndY;

            // Only handle horizontal swipes if they're more significant than vertical movement
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }

            this.resumeAutoSlide();
        });

        // Mouse wheel event
        this.carousel.addEventListener('wheel', (e) => {
            // If it's primarily horizontal scrolling (e.g., trackpad gesture)
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();

                if (this.isTransitioning) return;

                this.pauseAutoSlide();

                // Accumulate deltaX until it reaches a threshold
                if (Math.abs(e.deltaX) > 50) {
                    if (e.deltaX > 0) {
                        this.nextSlide();
                    } else {
                        this.previousSlide();
                    }
                }

                this.resumeAutoSlide();
            }
            // If it's primarily vertical scrolling, let the page scroll naturally
        }, { passive: false });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isTransitioning) return;

            if (e.key === 'ArrowRight') {
                this.pauseAutoSlide();
                this.nextSlide();
                this.resumeAutoSlide();
            } else if (e.key === 'ArrowLeft') {
                this.pauseAutoSlide();
                this.previousSlide();
                this.resumeAutoSlide();
            }
        });

        // Navigation dots
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.pauseAutoSlide();
                this.goToSlide(index);
                this.resumeAutoSlide();
            });
        });

        // Pause auto slide when user interacts with carousel
        this.carousel.addEventListener('mouseenter', () => {
            this.pauseAutoSlide();
        });

        // Resume auto slide when user stops interacting with carousel
        this.carousel.addEventListener('mouseleave', () => {
            this.resumeAutoSlide();
        });
    }

    updateSlidePosition() {
        this.isTransitioning = true;

        this.slides.forEach((slide, index) => {
            const offset = (index - this.currentIndex) * 100;
            slide.style.transform = `translateX(${offset}%)`;
        });

        this.updateSlideVisibility();
        this.updateDots();

        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    updateSlideVisibility() {
        this.slides.forEach((slide, index) => {
            const distance = Math.abs(index - this.currentIndex);
            if (distance <= 1) {
                slide.style.opacity = distance === 0 ? '1' : '0.5';
                slide.style.visibility = 'visible';
                slide.style.zIndex = distance === 0 ? '1' : '0';
            } else {
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
            }
        });
    }

    updateDots() {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    goToSlide(index) {
        if (this.isTransitioning) return;
        this.currentIndex = index;
        this.updateSlidePosition();
    }

    nextSlide() {
        if (this.currentIndex < this.slides.length - 1) {
            this.goToSlide(this.currentIndex + 1);
        }
    }

    previousSlide() {
        if (this.currentIndex > 0) {
            this.goToSlide(this.currentIndex - 1);
        }
    }
}

// Helper function to display the workout popup
function displayWorkoutPopup(workout) {
    const popupContainer = document.getElementById('popup-container');

    // Set popup content
    document.getElementById('popup-title').textContent = workout.title;
    document.getElementById('popup-desc').textContent = workout.description;
    document.getElementById('popup-duration').textContent = workout.duration.replace(' min', '');
    document.getElementById('popup-calories').textContent = workout.calories.replace(' kcal', '');

    // Update the difficulty level using the separate function
    if (workout.level) {
        updatePopupLevel(workout.level);
    } else {
        // Fallback if level is not defined
        document.getElementById('popup-level').textContent = 'Beginner';
    }

    document.getElementById('popup-workout-image').src = workout.image;

    // Update exercise list with video capabilities
    updateExerciseList(workout);

    // Show popup
    popupContainer.classList.add('active');
    setTimeout(forceArrowCheck, 100);
    setupExerciseListArrows();

    const startButton = document.querySelector('.popup-start-button');
    if (startButton) {
        const newButton = startButton.cloneNode(true);
        startButton.parentNode.replaceChild(newButton, startButton);

        // Add new event listener
        newButton.addEventListener('click', () => {
            localStorage.setItem('currentWorkout', JSON.stringify([selectedWorkout]));
            window.location.href = 'subworkout_page.php?workout_id=' + selectedWorkout.id;
        });
    }
}

// Filter workouts by type function
function filterWorkouts(type) {
    if (type === 'All') return workouts;
    return workouts.filter(workout => workout.type.includes(type));
}

// Initialize workout grid event listeners
function initWorkoutGrid() {
    // Add click event listeners to workout cards
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', function () {
            const workoutId = this.getAttribute('data-workout-id');
            const workout = workouts.find(w => w.id == workoutId);
            if (workout) {
                selectedWorkout = workout;
                displayWorkoutPopup(workout);
            }
        });
    });
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WorkoutCarousel();

    // Setup popup close button
    const popupContainer = document.getElementById('popup-container');
    const closeButton = document.querySelector('.popup-close');

    if (closeButton && popupContainer) {
        closeButton.addEventListener('click', () => {
            popupContainer.classList.remove('active');
            selectedWorkout = null;
            stopAllVideos();
        });

        // Close popup when clicking outside
        popupContainer.addEventListener('click', (e) => {
            if (e.target === popupContainer) {
                popupContainer.classList.remove('active');
                selectedWorkout = null;
                stopAllVideos();
            }
        });
    }
});

// -------------------------------------------------------------------------------------------------------------------------------------- //
// Activity Types
document.addEventListener('DOMContentLoaded', () => {
    // Dark mode initialization
    const darkModeToggle = document.querySelector('input[name="dark-mode-toggle"]');
    const cards = document.querySelectorAll('.activity-card');
    const defaultSelection = document.getElementById('default-selection');

    function setupActivityTypesScroll() {
        const cardContainer = document.querySelector('.activity-cards-container');
        if (!cardContainer) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        cardContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            cardContainer.style.cursor = 'grabbing';
            startX = e.pageX - cardContainer.offsetLeft;
            scrollLeft = cardContainer.scrollLeft;
            e.preventDefault();
        });

        cardContainer.addEventListener('mouseleave', () => {
            isDown = false;
            cardContainer.style.cursor = 'grab';
        });

        cardContainer.addEventListener('mouseup', () => {
            isDown = false;
            cardContainer.style.cursor = 'grab';
        });

        cardContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - cardContainer.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            cardContainer.scrollLeft = scrollLeft - walk;
        });

        // Touch events
        cardContainer.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - cardContainer.offsetLeft;
            scrollLeft = cardContainer.scrollLeft;
        });

        cardContainer.addEventListener('touchend', () => {
            isDown = false;
        });

        cardContainer.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - cardContainer.offsetLeft;
            const walk = (x - startX) * 1.5;
            cardContainer.scrollLeft = scrollLeft - walk;
            e.preventDefault();
        });
    }

    function applyDarkMode(isDarkMode) {
        document.documentElement.classList.toggle('dark-mode', isDarkMode);

        cards.forEach(card => {
            updateCardStyles(card, card === defaultSelection && card.classList.contains('active'));
        });

        // Dispatch a custom event to notify changes
        const event = new CustomEvent('darkModeChange', { detail: { isDarkMode } });
        window.dispatchEvent(event);
    }

    function checkDarkMode() {
        return document.documentElement.classList.contains('dark-mode');
    }

    function initializeDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = isDarkMode;
        applyDarkMode(isDarkMode);
    }

    function updateCardStyles(card, isActive = false) {
        const isDark = checkDarkMode();

        if (isDark) {
            card.style.background = isActive ? '#ffa07a' : '#4d4d4e';
            card.style.color = isActive ? '#ffffff' : '#E5E7EB';
            card.style.border = isActive ? '2px solid#ea8b47' : '1px solid #374151';
        } else {
            card.style.background = isActive ? '#FFAD84' : '#ffffff';
            card.style.color = isActive ? '#ffffff' : '#000000';
            card.style.border = isActive ? '2px solid #FFAD84' : '1px solid #E5E7EB';
        }
        card.style.transition = 'all 0.3s ease';
    }

    // Toggle dark mode when the checkbox changes
    darkModeToggle.addEventListener('change', (event) => {
        const isDarkMode = event.target.checked;
        localStorage.setItem('darkMode', isDarkMode);
        applyDarkMode(isDarkMode);
    });

    // Add event handlers to all cards
    cards.forEach(card => {
        updateCardStyles(card, card === defaultSelection && card.classList.contains('active'));

        // Click to toggle active state
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            cards.forEach(c => updateCardStyles(c, c.classList.contains('active')));
        });

        // Mouseover (hover) to temporarily highlight the card
        card.addEventListener('mouseover', () => {
            const isDark = checkDarkMode();
            if (!card.classList.contains('active')) {
                card.style.background = isDark ? '#cc916a' : '#FFE4D2';
            }
        });

        // Mouseout to revert the card's style
        card.addEventListener('mouseout', () => {
            if (!card.classList.contains('active')) {
                updateCardStyles(card);
            }
        });

        // Update card styles on dark mode change
        window.addEventListener('darkModeChange', () => {
            updateCardStyles(card, card.classList.contains('active'));
        });
    });

    // Initialize dark mode and activity types scroll
    initializeDarkMode();
    setupActivityTypesScroll();
});

// -------------------------------------------------------------------------------------------------------------------------------------- //
// Top Picks For You
let displayedWorkouts = [];

function getRecommendedWorkouts(userProfile, allWorkouts) {
    const {
        height,
        weight,
        goal,
        fitnessLevel = 'beginner',
        preferences = [],
        completedWorkouts = [],
        healthConditions = []
    } = userProfile;

    const bmi = weight / ((height / 100) ** 2);

    const scoreWorkout = (workout) => {
        let score = 0;

        if (goal === 'lose') {
            if (workout.type.includes('Cardio')) score += 3;
            if (workout.type.includes('Weight-free')) score += 2;

            const calories = parseInt(workout.calories);
            if (calories > 300) score += 3;
            else if (calories > 200) score += 2;
            else if (calories > 100) score += 1;
        }
        else if (goal === 'gain') {
            if (workout.type.includes('Weighted')) score += 3;

            const duration = parseInt(workout.duration);
            if (duration >= 40) score += 2;
            else if (duration >= 25) score += 1;
        }
        else {
            score += 1;

            if (workout.type.length >= 2) score += 1;
        }

        if (workout.level.toLowerCase() === fitnessLevel.toLowerCase()) score += 2;

        if (fitnessLevel === 'beginner' && workout.level === 'Advanced') score -= 3;

        preferences.forEach(pref => {
            if (workout.type.includes(pref)) score += 2;
        });

        if (healthConditions.includes('joint_pain') &&
            (workout.type.includes('Yoga') || workout.description.toLowerCase().includes('low impact'))) {
            score += 2;
        }

        if (userProfile.age > 50) {
            if (workout.description.toLowerCase().includes('low impact')) score += 2;
            if (workout.description.toLowerCase().includes('high intensity') &&
                fitnessLevel !== 'advanced') score -= 1;
        }

        if (completedWorkouts.includes(workout.id)) score -= 2;

        return score;
    };

    const scoredWorkouts = allWorkouts.map(workout => ({
        ...workout,
        score: scoreWorkout(workout)
    }));

    scoredWorkouts.sort((a, b) => b.score - a.score);

    return scoredWorkouts.slice(0, 6);
}

function findTopPicksSection() {
    const sections = document.querySelectorAll('section.workout-body');

    for (const section of sections) {
        const titleElement = section.querySelector('.section-title');
        if (titleElement && titleElement.textContent.includes('Top Picks For You')) {
            return section;
        }
    }
    return null;
}

function updateTopPicksSection(userProfile) {
    const recommendedWorkouts = getRecommendedWorkouts(userProfile, workouts);

    const topPicksSection = findTopPicksSection();
    const workoutGrid = topPicksSection?.querySelector('.workout-grid');

    if (workoutGrid) {
        workoutGrid.innerHTML = '';

        if (recommendedWorkouts.length > 0) {
            workoutGrid.classList.add('scroll-layout');

            workoutGrid.innerHTML = recommendedWorkouts.map((workout, index) => {
                const originalIndex = workouts.findIndex(w => w.id === workout.id);
                return createWorkoutCard(workout, originalIndex);
            }).join('');

            setupScrollArrows(workoutGrid);

            setupWorkoutCardClick();

            topPicksSection.style.display = '';
        } else {
            topPicksSection.style.display = 'none';
        }
    }
}

function loadUserProfile() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'get_user_data.php', true);
        xhr.onload = function () {
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);

                    if (response.isLoggedIn && response.memberData) {
                        resolve(response.memberData);
                    } else {
                        console.log('User not logged in or data not available:', response.error || 'Unknown error');
                        resolve(null);
                    }
                } catch (e) {
                    console.error('Error parsing user profile data:', e);
                    reject(e);
                }
            } else {
                reject(new Error('Failed to load user profile: ' + this.status));
            }
        };
        xhr.onerror = function () {
            reject(new Error('Network error when loading user profile'));
        };
        xhr.send();
    });
}

async function initializeTopPicks() {
    try {
        const userProfile = await loadUserProfile();
        const topPicksSection = findTopPicksSection();
        const workoutGrid = topPicksSection?.querySelector('.workout-grid');

        if (!workoutGrid) return;

        workoutGrid.innerHTML = '';

        let recommendedWorkouts = [];

        if (userProfile) {
            recommendedWorkouts = getRecommendedWorkouts(userProfile, workouts);
        } else {
            recommendedWorkouts = [...workouts]
                .sort(() => 0.5 - Math.random())
                .slice(0, 6);
        }

        if (recommendedWorkouts.length > 0) {
            workoutGrid.classList.add('scroll-layout');

            displayedWorkouts = recommendedWorkouts;

            workoutGrid.innerHTML = recommendedWorkouts.map((workout, position) => {
                return `
                    <div class="workout-card-content" data-workout-id="${workout.id}" data-position="${position}">
                        <div class="workout-image">
                            <img src="${workout.image || './assets/icons/error.svg'}" alt="${workout.title}">
                        </div>
                        <div class="workout-info">
                            <h3 class="workout-title">${workout.title}</h3>
                            <span class="workout-level">${workout.level}</span>
                            <div class="workout-stats">
                                <span><i class="fas fa-clock"></i> ${workout.duration}</span>
                                <span><i class="fas fa-fire"></i> ${workout.calories}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            setupScrollArrows(workoutGrid);

            topPicksSection.style.display = '';
        }

        workoutGrid.querySelectorAll('.workout-card-content').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();

                const workoutId = card.getAttribute('data-workout-id');
                const position = parseInt(card.getAttribute('data-position'));

                const workout = displayedWorkouts[position];

                if (!workout) {
                    console.error('Workout not found in displayedWorkouts array at position', position);
                    return;
                }

                selectedWorkout = workout;

                const popup = document.getElementById('popup-container');

                document.getElementById('popup-title').textContent = workout.title.toUpperCase();
                document.getElementById('popup-desc').textContent = workout.description;

                const durationNum = workout.duration.match(/\d+/)[0];
                document.getElementById('popup-duration').textContent = durationNum;

                const caloriesNum = workout.calories.match(/\d+/)[0];
                document.getElementById('popup-calories').textContent = caloriesNum;

                updatePopupLevel(workout.level);

                const workoutImage = document.getElementById('popup-workout-image');
                if (workout.image) {
                    workoutImage.src = workout.image;
                    workoutImage.alt = `${workout.title} Image`;
                    workoutImage.style.objectFit = 'cover';
                } else {
                    workoutImage.src = './assets/icons/error.svg';
                    workoutImage.alt = 'Workout Image Not Found';
                    workoutImage.style.objectFit = 'contain';
                    workoutImage.style.width = '60%';
                    workoutImage.style.height = 'auto';
                }

                updateExerciseList(workout);

                popup.classList.add('active');
            });
        });
    } catch (error) {
        console.error('Error initializing Top Picks:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeWorkoutSections();
    initializeTopPicks();
    setupRecentWorkoutCards();

    // Apply scroll arrows to recently workout section
    const recentlyWorkoutGrid = document.getElementById('recently-workout-grid');
    if (recentlyWorkoutGrid) {
        setupScrollArrows(recentlyWorkoutGrid);
    }

    const defaultCard = document.querySelector('.activity-card-all');
    if (defaultCard) {
        defaultCard.click();
    }
});

// -------------------------------------------------------------------------------------------------------------------------------------- //
// Workout Card
const createWorkoutCard = (workout, index) => {
    const image = workout.image ? `${workout.image}` : './assets/icons/error.svg';

    return `
        <div class="workout-card-content" data-workout-index="${index}" data-workout-type="${workout.type.join(',')}" data-workout-title="${workout.title}">
            <div class="workout-image">
                <img src="${image}" alt="${workout.title}">
            </div>
            <div class="workout-info">
                <h3 class="workout-title">${workout.title}</h3>
                <span class="workout-level">${workout.level}</span>
                <div class="workout-stats">
                    <span><i class="fas fa-clock"></i> ${workout.duration}</span>
                    <span><i class="fas fa-fire"></i> ${workout.calories}</span>
                </div>
            </div>
        </div>
    `;
};


function filterWorkouts(type) {
    if (type === 'All') return workouts;
    return workouts.filter(workout => workout.type.includes(type));
}

// const styleSheet = document.createElement('style');
// styleSheet.textContent = styles;
// document.head.appendChild(styleSheet);

// Function to update the popup level display
function updatePopupLevel(level) {
    const popupLevel = document.getElementById('popup-level');
    if (!popupLevel) return;

    const currentMeter = popupLevel.querySelector('.difficulty-meter');

    if (currentMeter) {
        currentMeter.remove();
    }

    const meterContainer = document.createElement('div');
    meterContainer.className = `difficulty-meter ${level.toLowerCase()}`;

    // Create three bars for the difficulty meter
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

// Modify your existing setupWorkoutCardClick function
function setupWorkoutCardClick() {
    document.querySelectorAll('.workout-card-content').forEach(card => {
        // Remove any existing click listeners to prevent duplicates
        const cardClone = card.cloneNode(true);
        card.parentNode.replaceChild(cardClone, card);

        cardClone.addEventListener('click', () => {
            // Get the workout title directly from the data attribute
            const workoutTitle = cardClone.getAttribute('data-workout-title');

            // Find the workout by title instead of index
            const workout = workouts.find(w => w.title === workoutTitle);

            if (!workout) {
                console.error('Workout not found with title:', workoutTitle);
                return;
            }

            // Store the selected workout
            selectedWorkout = workout;

            // Update popup content
            const popup = document.getElementById('popup-container');

            document.getElementById('popup-title').textContent = workout.title.toUpperCase();
            document.getElementById('popup-desc').textContent = workout.description;

            // Extract numbers only
            const durationNum = workout.duration.match(/\d+/)[0];
            document.getElementById('popup-duration').textContent = durationNum;

            const caloriesNum = workout.calories.match(/\d+/)[0];
            document.getElementById('popup-calories').textContent = caloriesNum;

            updatePopupLevel(workout.level);

            // Update image
            const workoutImage = document.getElementById('popup-workout-image');
            if (workout.image) {
                workoutImage.src = workout.image;
                workoutImage.alt = `${workout.title} Image`;
                workoutImage.style.objectFit = 'cover';
            } else {
                workoutImage.src = './assets/icons/error.svg';
                workoutImage.alt = 'Workout Image Not Found';
                workoutImage.style.objectFit = 'contain';
                workoutImage.style.width = '60%';
                workoutImage.style.height = 'auto';
            }

            // Update exercise list
            updateExerciseList(workout);

            // Show popup
            popup.classList.add('active');
        });
    });

    // Setup popup close handlers
    const popup = document.getElementById('popup-container');
    const closeHandlers = popup.querySelectorAll('.popup-close');

    // Remove existing event listeners to prevent duplicates
    popup.outerHTML = popup.outerHTML;

    // Re-select popup after replacing it
    const newPopup = document.getElementById('popup-container');

    newPopup.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup-close') || e.target === newPopup) {
            newPopup.classList.remove('active');
            selectedWorkout = null;
        }
    });
}

function setupRecentWorkoutCards() {
    // Select all recently workout cards
    document.querySelectorAll('.workout-card-recently').forEach(card => {
        card.addEventListener('click', () => {
            const workoutId = card.getAttribute('data-workout-id');

            // Find the workout by ID
            const workout = workouts.find(w => w.id === workoutId);

            if (!workout) {
                console.error('Workout not found with ID:', workoutId);
                return;
            }

            // Store the selected workout
            selectedWorkout = workout;

            // Update popup content
            const popup = document.getElementById('popup-container');

            document.getElementById('popup-title').textContent = workout.title.toUpperCase();
            document.getElementById('popup-desc').textContent = workout.description;

            // Extract numbers only
            const durationNum = workout.duration.match(/\d+/)[0];
            document.getElementById('popup-duration').textContent = durationNum;

            const caloriesNum = workout.calories.match(/\d+/)[0];
            document.getElementById('popup-calories').textContent = caloriesNum;

            updatePopupLevel(workout.level);

            // Update image
            const workoutImage = document.getElementById('popup-workout-image');
            if (workout.image) {
                workoutImage.src = workout.image;
                workoutImage.alt = `${workout.title} Image`;
                workoutImage.style.objectFit = 'cover';
            } else {
                workoutImage.src = './assets/icons/error.svg';
                workoutImage.alt = 'Workout Image Not Found';
                workoutImage.style.objectFit = 'contain';
                workoutImage.style.width = '60%';
                workoutImage.style.height = 'auto';
            }

            // Update exercise list
            updateExerciseList(workout);

            // Show popup
            popup.classList.add('active');
        });
    });
}


document.querySelector('.popup-start-button').addEventListener('click', () => {
    if (selectedWorkout) {
        localStorage.setItem('currentWorkout', JSON.stringify([selectedWorkout]));
        window.location.href = 'subworkout_page.php?workout_id=' + selectedWorkout.id;
    } else {
        console.error('No workout selected');
    }
});

function initializeWorkoutSections() {
    document.querySelectorAll('section.workout-body').forEach(section => {
        const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
        const workoutGrid = section.querySelector('.workout-grid');

        if (!workoutGrid) return;

        // Skip Top Picks and Recently Workout sections
        if (sectionTitle === 'Top Picks For You' || sectionTitle === 'Recently Workout') {
            return;
        }

        const sectionType = sectionTitle.replace(/^(🔥|⚡|⏰|❤️|💪|🏋️|🧘‍♀️|🧘)?\s*/, '').trim();
        const filteredWorkouts = filterWorkouts(sectionType);

        // Store section-specific workouts in a data attribute
        section.setAttribute('data-section-workouts', JSON.stringify(filteredWorkouts.map(w => w.id)));

        // Only add scroll layout for non-empty sections
        if (filteredWorkouts.length > 0) {
            workoutGrid.classList.add('scroll-layout');

            // Display the workouts
            workoutGrid.innerHTML = filteredWorkouts.map((workout, index) => {
                return `
                    <div class="workout-card-content" data-workout-id="${workout.id}" data-section-index="${index}"  data-workout-title="${workout.title}">
                        <div class="workout-image">
                            <img src="${workout.image || './assets/icons/error.svg'}" alt="${workout.title}">
                        </div>
                        <div class="workout-info">
                            <h3 class="workout-title">${workout.title}</h3>
                            <span class="workout-level">${workout.level}</span>
                            <div class="workout-stats">
                                <span><i class="fas fa-clock"></i> ${workout.duration}</span>
                                <span><i class="fas fa-fire"></i> ${workout.calories}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            setupScrollArrows(workoutGrid);

            // Add click handlers for each card in this section
            workoutGrid.querySelectorAll('.workout-card-content').forEach(card => {
                card.addEventListener('click', () => {
                    const workoutId = card.getAttribute('data-workout-id');
                    const sectionIndex = parseInt(card.getAttribute('data-section-index'));

                    // Get section's workouts
                    const sectionWorkouts = JSON.parse(section.getAttribute('data-section-workouts'));

                    // Find the workout by ID
                    const workout = workouts.find(w => w.id === workoutId);

                    if (!workout) {
                        console.error('Workout not found with ID:', workoutId);
                        return;
                    }

                    // Store the selected workout
                    selectedWorkout = workout;

                    // Update popup content
                    const popup = document.getElementById('popup-container');

                    document.getElementById('popup-title').textContent = workout.title.toUpperCase();
                    document.getElementById('popup-desc').textContent = workout.description;

                    // Extract numbers only
                    const durationNum = workout.duration.match(/\d+/)[0];
                    document.getElementById('popup-duration').textContent = durationNum;

                    const caloriesNum = workout.calories.match(/\d+/)[0];
                    document.getElementById('popup-calories').textContent = caloriesNum;

                    updatePopupLevel(workout.level);

                    // Update image
                    const workoutImage = document.getElementById('popup-workout-image');
                    if (workout.image) {
                        workoutImage.src = workout.image;
                        workoutImage.alt = `${workout.title} Image`;
                        workoutImage.style.objectFit = 'cover';
                    } else {
                        workoutImage.src = './assets/icons/error.svg';
                        workoutImage.alt = 'Workout Image Not Found';
                        workoutImage.style.objectFit = 'contain';
                        workoutImage.style.width = '60%';
                        workoutImage.style.height = 'auto';
                    }

                    // Update exercise list
                    updateExerciseList(workout);

                    // Show popup
                    popup.classList.add('active');
                });
            });
        }
    });
}

function setupScrollArrows(grid) {
    // Remove any existing wrapper and arrows
    const existingWrapper = grid.parentElement.querySelector('.grid-wrapper');
    if (existingWrapper) {
        const originalGrid = existingWrapper.querySelector('.workout-grid');
        if (originalGrid) {
            existingWrapper.replaceWith(originalGrid);
        }
    }

    // Create new wrapper and elements
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'grid-wrapper';
    grid.parentNode.insertBefore(gridWrapper, grid);
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
    updateArrowVisibility();

    // Add mutation observer to watch for content changes
    const observer = new MutationObserver(updateArrowVisibility);
    observer.observe(grid, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeWorkoutSections();

    const defaultCard = document.querySelector('.activity-card-all');
    if (defaultCard) {
        defaultCard.click();
    }
});

function saveOriginalContent() {
    const specialSections = {};

    document.querySelectorAll('section.workout-body').forEach(section => {
        const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
        if (['Top Picks For You', 'Recently Workout'].includes(sectionTitle)) {
            // Get the original workout cards
            const workoutGrid = section.querySelector('.workout-grid');
            if (workoutGrid) {
                // Store both the HTML content and any workout objects for this section
                specialSections[sectionTitle] = {
                    html: workoutGrid.innerHTML,
                    element: workoutGrid
                };
            }
        }
    });

    return specialSections;
}

// Store the original content when the page loads
let originalSpecialSections;
document.addEventListener('DOMContentLoaded', () => {
    originalSpecialSections = saveOriginalContent();
});

document.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', () => {
        const selectedType = card.querySelector('p').textContent.trim();
        let displayedWorkouts = [];
        let currentIndex = 0;

        document.querySelectorAll('section.workout-body').forEach(section => {
            const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
            const workoutGrid = section.querySelector('.workout-grid');

            if (!workoutGrid) return;

            // Handle special sections differently
            if (['Top Picks For You', 'Recently Workout'].includes(sectionTitle)) {
                if (selectedType === 'All') {
                    section.style.display = selectedType === 'All' ? '' : 'none';

                } else {
                    // Just hide the section but don't clear it
                    section.style.display = 'none';
                }
                return;
            }

            // The rest of the code for handling other sections remains the same
            if (selectedType === 'All' || sectionTitle.includes(selectedType)) {
                section.style.display = '';
                const layout = selectedType === 'All' ? 'scroll-layout' : 'grid-layout';
                workoutGrid.classList.add(layout);
                workoutGrid.classList.remove(layout === 'scroll-layout' ? 'grid-layout' : 'scroll-layout');

                const sectionType = sectionTitle.replace(/^(🔥|⚡|⏰|❤️|💪|🏋️|🧘‍♀️|🧘)?\s*/, '');
                const filteredWorkouts = filterWorkouts(selectedType === 'All' ? sectionType : selectedType);

                filteredWorkouts.forEach(workout => {
                    displayedWorkouts.push({
                        workout: workout,
                        globalIndex: currentIndex
                    });
                    currentIndex++;
                });

                // Create workout cards with correct indices
                workoutGrid.innerHTML = filteredWorkouts.map((workout, index) => {
                    const globalIndex = displayedWorkouts.findIndex(w => w.workout === workout);
                    return createWorkoutCard(workout, globalIndex);
                }).join('');

                setupScrollArrows(workoutGrid);
            } else {
                section.style.display = 'none';
            }
        });

        // Modified setupWorkoutCardClick to use the displayed workouts array
        document.querySelectorAll('.workout-card-content').forEach(card => {
            card.addEventListener('click', () => {
                const workoutIndex = parseInt(card.getAttribute('data-workout-index'));
                const workoutData = displayedWorkouts.find(w => w.globalIndex === workoutIndex);

                if (!workoutData) {
                    console.error('Workout not found for index:', workoutIndex);
                    return;
                }

                const workout = workoutData.workout;
                selectedWorkout = workout;

                // Update popup content
                const popup = document.getElementById('popup-container');

                // Update title
                document.getElementById('popup-title').textContent = workout.title.toUpperCase();

                // Update description
                document.getElementById('popup-desc').textContent = workout.description;

                // Update duration
                document.getElementById('popup-duration').textContent = workout.duration.match(/\d+/)[0];

                // Update calories
                document.getElementById('popup-calories').textContent = workout.calories.match(/\d+/)[0];

                // Update difficulty level
                updatePopupLevel(workout.level);

                // Update image
                const workoutImage = document.getElementById('popup-workout-image');
                if (workout.image) {
                    workoutImage.src = workout.image;
                    workoutImage.alt = `${workout.title} Image`;
                    workoutImage.style.objectFit = 'cover';
                } else {
                    workoutImage.src = './assets/icons/error.svg';
                    workoutImage.alt = 'Workout Image Not Found';
                    workoutImage.style.objectFit = 'contain';
                    workoutImage.style.width = '60%';
                    workoutImage.style.height = 'auto';
                }

                // Update exercise list - NEW
                updateExerciseList(workout);

                // Show popup
                popup.classList.add('active');
            });
        });
    });
});

// -------------------------------------------------------------------------------------------------------------------------------------- //
// Exercise List

// Function to create thumbnail from video path
// function generateThumbnail(exercise) {
//     // Extract exercise name for path building
//     const exerciseName = exercise.exercise;
//     const exerciseNameFormatted = exerciseName.toLowerCase().replace(/\s+/g, '_');

//     // Extract workout category from video path
//     const videoPath = exercise.video;
//     const workoutCategory = videoPath.split('/')[3]; // Assuming format: .assets/workout_video/[Category]/[Exercise].mp4
//     const workoutCategoryFormatted = workoutCategory ? workoutCategory.toLowerCase().replace(/\s+/g, '_') : 'general';

//     // Build potential image paths with fallbacks
//     const possibleImagePaths = [
//         // Primary location - specific exercise thumbnail
//         `./assets/exercise_thumbs/${exerciseNameFormatted}.jpg`,
//         // Secondary location - based on workout category
//         `./assets/workout_thumbs/${workoutCategoryFormatted}/${exerciseNameFormatted}.jpg`,
//         // Tertiary location - workout category thumbnail
//         `./assets/workout_thumbs/${workoutCategoryFormatted}.jpg`,
//         // Final fallback - placeholder
//         './assets/icons/video_placeholder.svg'
//     ];

//     // Generate image tag with fallback chain using onerror
//     let imgTag = `<img src="${possibleImagePaths[0]}"`;

//     // Add fallback chain using onerror
//     for (let i = 1; i < possibleImagePaths.length; i++) {
//         imgTag += ` onerror="if(this.src !== '${possibleImagePaths[i]}') this.src='${possibleImagePaths[i]}';"`;
//     }

//     imgTag += ` alt="${exerciseName}" class="exercise-thumb-img">`;

//     // Return the complete thumbnail HTML
//     return `<div class="exercise-thumbnail">
//         ${imgTag}
//         <i class="fas fa-play-circle exercise-video-icon"></i>
//     </div>`;
// }

let globalCurrentlyPlaying = null;

function initializeExerciseVideos() {
    console.log("Initializing exercise videos...");

    // Step 1: Make sure all videos are stopped and reset first
    stopAllVideos();

    // Step 2: Attach click handlers to all video elements
    document.querySelectorAll('.exercise-item').forEach(item => {
        const videoId = item.getAttribute('data-video-id');
        const video = document.getElementById(videoId);
        const overlay = item.querySelector('.video-overlay');
        const playButton = item.querySelector('.play-button');

        if (!video || !overlay || !playButton) {
            console.error("Missing video elements for:", videoId);
            return;
        }

        // Remove any existing event listeners to prevent duplicates
        item.replaceWith(item.cloneNode(true));

        // Get the elements again after cloning
        const updatedItem = document.querySelector(`[data-video-id="${videoId}"]`);
        const updatedVideo = document.getElementById(videoId);
        const updatedOverlay = updatedItem.querySelector('.video-overlay');
        const updatedPlayButton = updatedItem.querySelector('.play-button');

        // Main click handler for the play button
        updatedPlayButton.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            console.log("Play button clicked for:", videoId);

            // If this is already the currently playing video, pause it
            if (globalCurrentlyPlaying === videoId) {
                console.log("Pausing current video:", videoId);
                updatedVideo.pause();
                updatedOverlay.style.display = 'flex';
                this.querySelector('i').className = 'fas fa-play';
                globalCurrentlyPlaying = null;
            }
            // Otherwise, stop any currently playing video and play this one
            else {
                console.log("Playing new video:", videoId);
                stopAllVideos();

                // Try to play the video
                updatedVideo.play().then(() => {
                    updatedOverlay.style.display = 'none';
                    this.querySelector('i').className = 'fas fa-pause';
                    globalCurrentlyPlaying = videoId;
                }).catch(err => {
                    console.error("Error playing video:", err);
                    alert("There was an error playing the video. Please try again.");
                });
            }
        });

        // Handle video ended event
        updatedVideo.addEventListener('ended', function () {
            console.log("Video ended:", videoId);
            updatedOverlay.style.display = 'flex';
            updatedPlayButton.querySelector('i').className = 'fas fa-play';
            globalCurrentlyPlaying = null;
        });
    });

    console.log("Video initialization complete");
}

function initializeStartWorkoutButtons() {
    document.querySelectorAll('.start-workout').forEach(button => {
        button.addEventListener('click', (e) => {
            const clickedButton = e.currentTarget;
            const workoutId = clickedButton.getAttribute('data-workout-id');

            if (workouts && workouts.length > 0) {
                const workout = workouts.find(w => w.id == workoutId);
                if (workout) {
                    selectedWorkout = workout;
                    displayWorkoutPopup(workout);
                } else {
                    console.error('Workout not found with ID:', workoutId);
                }
            } else {
                console.error('Workouts array is empty or undefined');
            }
        });
    });
}

// Function to create exercise item
function createExerciseItem(exercise) {
    // Validate input
    if (!exercise || typeof exercise !== 'object') {
        console.error('Invalid exercise object:', exercise);
        return '';
    }

    // Ensure required properties exist with fallbacks
    const exerciseName = exercise.exercise || exercise.name || 'unknown-exercise';
    const videoSrc = exercise.video || '';

    // Determine if we have reps or duration
    const detailText = exercise.reps
        ? `${exercise.reps} reps`
        : exercise.duration
            ? exercise.duration
            : (exercise.time || '5 minutes');

    // Create a unique ID for the video element
    const videoId = `video-${exerciseName.toString().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

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

function setupVideoPlayers() {
    // Keep track of currently playing video
    let currentlyPlaying = null;

    // Find all play buttons
    document.querySelectorAll('.exercise-item').forEach(item => {
        const videoId = item.getAttribute('data-video-id');
        const video = document.getElementById(videoId);
        const overlay = item.querySelector('.video-overlay');
        const playButton = item.querySelector('.play-button');

        if (!video || !overlay || !playButton) return;

        // Function to stop all videos
        function stopAllVideos() {
            console.log("Stopping all videos");

            // Reset the global playing state
            globalCurrentlyPlaying = null;

            // Stop all videos and reset UI
            document.querySelectorAll('.exercise-video').forEach(video => {
                if (!video.paused) {
                    console.log("Pausing video:", video.id);
                    video.pause();
                    video.currentTime = 0;
                }
            });

            // Reset all UI elements
            document.querySelectorAll('.video-overlay').forEach(overlay => {
                overlay.style.display = 'flex';
            });

            document.querySelectorAll('.play-button i').forEach(icon => {
                icon.className = 'fas fa-play';
            });
        }

        // Play button click event
        playButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            e.preventDefault();  // Prevent default behavior

            // If this video is already playing, pause it
            if (currentlyPlaying === videoId) {
                video.pause();
                overlay.style.display = 'flex';
                playButton.querySelector('i').className = 'fas fa-play';
                currentlyPlaying = null;
            } else {
                // Stop any currently playing video
                stopAllVideos();

                // Play this video
                video.play().catch(err => {
                    console.error('Error playing video:', err);
                });

                // Hide overlay while playing
                overlay.style.display = 'none';
                playButton.querySelector('i').className = 'fas fa-pause';
                currentlyPlaying = videoId;
            }
        });

        // Make the entire exercise item clickable for video control
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.play-button')) {
                playButton.click();
            }
        });

        // Video ended event
        video.addEventListener('ended', () => {
            // Reset when video ends
            overlay.style.display = 'flex';
            playButton.querySelector('i').className = 'fas fa-play';
            currentlyPlaying = null;
        });

        // Video play event - ensure we're tracking the correct video
        video.addEventListener('play', () => {
            if (currentlyPlaying !== videoId) {
                stopAllVideos();
                currentlyPlaying = videoId;

                // Update UI for this video
                overlay.style.display = 'none';
                playButton.querySelector('i').className = 'fas fa-pause';
            }
        });
    });
}

// Function to update the exercise list in the popup
function updateExerciseList(workout) {
    console.log("Updating exercise list with:", workout);
    const container = document.getElementById('exercise-list-container');

    if (!workout || !workout.exercises || !container) {
        console.error("Missing workout data or container");
        return;
    }

    // First stop any currently playing videos
    stopAllVideos();

    // Clear existing content
    container.innerHTML = '';

    // Add exercise items
    workout.exercises.forEach(exercise => {
        // Ensure exercise has all required properties
        if (!exercise.exercise) {
            console.warn("Exercise is missing 'exercise' property:", exercise);
            exercise.exercise = exercise.name || "Unknown Exercise";
        }

        container.innerHTML += createExerciseItem(exercise);
    });

    // Initialize videos after DOM is updated
    setTimeout(() => {
        initializeExerciseVideos();

        // Initialize the scroll arrows
        forceArrowCheck();
        setupExerciseListArrows();
    }, 300);
}


// Function to handle exercise list scroll arrows
function setupExerciseListArrows() {
    const container = document.getElementById('exercise-list-container');
    const leftArrow = document.querySelector('.exercise-arrow-left');
    const rightArrow = document.querySelector('.exercise-arrow-right');

    if (!container || !leftArrow || !rightArrow) {
        return;
    }

    // Function to update arrow visibility
    function updateArrowVisibility() {
        // Get the current scroll position and dimensions
        const isAtStart = container.scrollLeft <= 0;
        const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
        const hasOverflow = container.scrollWidth > container.clientWidth;

        // Show/hide arrows based on scroll position and if there's overflow
        leftArrow.classList.toggle('hidden', isAtStart);
        rightArrow.classList.toggle('hidden', isAtEnd);

        // Force arrows to be visible if there's overflow content and we're not at the edge
        if (hasOverflow) {
            if (!isAtStart) leftArrow.classList.remove('hidden');
            if (!isAtEnd) rightArrow.classList.remove('hidden');
        }

        console.log("Container width:", container.clientWidth, "Content width:", container.scrollWidth, "Has overflow:", hasOverflow);
    }

    // Initial check - but wait for content to be fully rendered
    setTimeout(updateArrowVisibility, 100);

    // Left arrow click
    leftArrow.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        container.scrollBy({
            left: -250,
            behavior: 'smooth'
        });
    });

    // Right arrow click
    rightArrow.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        container.scrollBy({
            left: 250,
            behavior: 'smooth'
        });
    });

    // Update on scroll
    container.addEventListener('scroll', updateArrowVisibility);

    // Update on window resize
    window.addEventListener('resize', updateArrowVisibility);

    // Use MutationObserver to detect when content changes
    const observer = new MutationObserver(entries => {
        // Wait a short time for the browser to calculate new dimensions
        setTimeout(updateArrowVisibility, 50);
    });

    // Start observing the container for content changes
    observer.observe(container, {
        childList: true,    // Watch for changes to child elements
        subtree: true,      // Watch the entire subtree
        attributes: true    // Watch for attribute changes that might affect size
    });
}

// Function to update the exercise list in the popup
function updateExerciseList(workout) {
    const container = document.getElementById('exercise-list-container');

    if (!workout || !workout.exercises || !container) {
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add exercise items
    workout.exercises.forEach(exercise => {
        container.innerHTML += createExerciseItem(exercise);
    });

    // Setup video players after adding to DOM
    setupVideoPlayers();

    // Initialize the scroll arrows after a short delay to ensure content is rendered
    setTimeout(() => {
        forceArrowCheck();
        setupExerciseListArrows();
    }, 200);
}

// Function to force arrow visibility check after content is loaded
function forceArrowCheck() {
    const container = document.getElementById('exercise-list-container');
    const leftArrow = document.querySelector('.exercise-arrow-left');
    const rightArrow = document.querySelector('.exercise-arrow-right');

    if (!container || !leftArrow || !rightArrow) {
        return;
    }

    // Force recalculation of dimensions
    const hasOverflow = container.scrollWidth > container.clientWidth;
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

    // Make sure arrows are visible if content needs scrolling
    if (hasOverflow) {
        if (!isAtStart) leftArrow.classList.remove('hidden');
        if (!isAtEnd) rightArrow.classList.remove('hidden');

        // Additional backup - make right arrow visible if we have multiple items
        // and we're at the start position (common initial state)
        if (isAtStart && container.children.length > 1) {
            rightArrow.classList.remove('hidden');
        }
    }

    console.log("Force check - hasOverflow:", hasOverflow, "Items:", container.children.length);
}

// Touch scroll implementation for the exercise list
function setupExerciseListTouchScroll() {
    const container = document.getElementById('exercise-list-container');

    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        container.scrollLeft = scrollLeft - walk;
    });

    // Touch events for mobile
    container.addEventListener('touchstart', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('touchend', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });
}

function addVideoStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .exercise-item {
            width: 260px;
            margin-right: 15px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            cursor: pointer;
        }
        
        .exercise-video-container {
            position: relative;
            width: 100%;
            height: 150px;
            background-color: #000;
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
            background-color: rgba(0,0,0,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .play-button {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: rgba(255,255,255,0.8);
            border: none;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .play-button:hover {
            transform: scale(1.1);
            background-color: rgba(255,255,255,0.9);
        }
        
        .play-button i {
            font-size: 20px;
            color: #333;
        }
        
        .exercise-info {
            padding: 10px;
        }
        
        .exercise-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .exercise-details {
            font-size: 12px;
            color: #666;
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize video styles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addVideoStyles();
    initializeStartWorkoutButtons();
    initializeWorkoutSections();
    setupExerciseListTouchScroll();

    // Additional styles for better video controls
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        .play-button {
            cursor: pointer !important;
            z-index: 10;
        }
        .exercise-item {
            user-select: none;
        }
        .video-overlay {
            z-index: 5;
        }
    `;
    document.head.appendChild(additionalStyles);

    const defaultCard = document.querySelector('.activity-card-all');
    if (defaultCard) {
        defaultCard.click();
    }
});

// -------------------------------------------------------------------------------------------------------------------------------------- //
// Search functionality
class SearchImplementation {
    constructor() {
        this.searchInput = document.querySelector('.search-bar input');
        this.searchBarSmall = document.querySelector('.search-bar-small');
        this.searchBar = document.querySelector('.search-bar');
        this.searchIcon = document.querySelector('.search-bar .search-icon');
        this.searchBarCloseIcon = document.getElementById('search-close-btn');
        this.dropdownContainer = null;
        this.workoutSections = document.querySelectorAll('section.workout-body');
        this.isDropdownVisible = false;
        this.searchBackdrop = document.querySelector('.search-backdrop');
        this.isMobile = window.innerWidth <= 768;
        this.isSearchOpen = false;
        this.isNavigating = false;

        this.currentQuery = '';
        this.cachedResults = [];

        this.init();
    }

    init() {
        this.createDropdownContainer();
        this.bindEvents();
        this.handleResize();
    }

    createDropdownContainer() {
        if (!this.dropdownContainer) {
            this.dropdownContainer = document.createElement('div');
            this.dropdownContainer.className = 'search-dropdown';
            this.dropdownContainer.style.maxHeight = '300px';
            this.dropdownContainer.style.overflowY = 'auto';
            this.searchInput.parentElement.appendChild(this.dropdownContainer);
            this.dropdownContainer.style.display = 'none';
        }
    }

    handleResize() {
        const wasSearchOpen = this.isSearchOpen;
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;

        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                // Switching to mobile
                this.searchBar.classList.remove('show-search');
                this.searchBackdrop.style.display = 'none';
                this.searchBarCloseIcon.style.display = 'none';
                this.hideDropdown();

                if (!wasSearchOpen) {
                    this.searchBarSmall.style.display = 'block';
                }
            } else {
                // Switching to desktop
                if (wasSearchOpen) {
                    // If search was open in mobile, keep it visible in desktop
                    this.searchBar.classList.remove('show-search');
                    this.searchBarSmall.style.display = 'none';
                    if (this.currentQuery.trim() && this.cachedResults.length > 0) {
                        this.updateDropdown(this.cachedResults);
                    }
                } else {
                    // Normal desktop view
                    this.searchBarSmall.style.display = 'none';
                    this.searchBar.classList.remove('show-search');
                }
                this.searchBackdrop.style.display = 'none';
                this.searchBarCloseIcon.style.display = 'none';
            }
        } else if (this.isMobile) {
            if (wasSearchOpen) {
                this.searchBarSmall.style.display = 'none';
                this.searchBar.classList.add('show-search');
                this.searchBarCloseIcon.style.display = 'block';
                if (this.currentQuery.trim() && this.cachedResults.length > 0) {
                    this.updateDropdown(this.cachedResults);
                }
            } else {
                this.searchBarSmall.style.display = 'block';
                this.searchBar.classList.remove('show-search');
            }
        }

    }

    updateDropdownPosition() {
        if (this.isMobile) {
            const inputRect = this.searchInput.getBoundingClientRect();
            this.dropdownContainer.style.position = 'fixed';
            this.dropdownContainer.style.top = `${inputRect.bottom + 10}px`;
            this.dropdownContainer.style.left = '20px';
            this.dropdownContainer.style.right = '20px';
            this.dropdownContainer.style.maxHeight = 'calc(100vh - 150px)';
        } else {
            this.dropdownContainer.style.position = 'absolute';
            this.dropdownContainer.style.top = '100%';
            this.dropdownContainer.style.left = '0';
            this.dropdownContainer.style.right = '0';
            this.dropdownContainer.style.maxHeight = '300px';
        }
    }

    bindEvents() {
        let debounceTimeout;

        window.addEventListener('resize', () => {
            this.handleResize();
        });

        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.currentQuery = e.target.value;
                this.handleSearch(e.target.value);
            }, 300);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.currentQuery.trim() && this.cachedResults.length > 0) {
                this.updateDropdown(this.cachedResults);
            }
        });

        this.searchBarSmall.addEventListener('click', () => {
            this.openMobileSearch();
        });

        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a[href]');
            if (navLink && navLink.getAttribute('href') !== '#') {
                this.isNavigating = true;
                this.handleNavigation();
            }
        });

        this.searchBarCloseIcon.addEventListener('click', () => {
            this.closeMobileSearch();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileSearch();
            }
        });
    }

    handleNavigation() {
        // Hide search elements during navigation
        this.searchBarSmall.style.display = 'none';
        this.searchBar.classList.remove('show-search');
        this.searchBackdrop.style.display = 'none';
        this.searchBarCloseIcon.style.display = 'none';
        this.hideDropdown();

        // Reset after navigation
        setTimeout(() => {
            this.isNavigating = false;
            if (this.isMobile && !this.isSearchOpen) {
                this.searchBarSmall.style.display = 'block';
            }
        }, 100);
    }

    openMobileSearch() {
        this.isSearchOpen = true;
        this.searchBar.classList.add('show-search');
        this.searchBackdrop.style.display = 'block';
        this.searchBarSmall.style.display = 'none';
        this.searchBarCloseIcon.style.display = 'block';
        this.searchInput.focus();
    }

    closeMobileSearch() {
        this.isSearchOpen = false;
        this.searchBar.classList.remove('show-search');
        this.searchBackdrop.style.display = 'none';
        this.searchBarCloseIcon.style.display = 'none';
        this.hideDropdown();

        if (this.isMobile) {
            this.searchBarSmall.style.display = 'block';
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.hideDropdown();
            return;
        }

        const searchResults = [];
        const uniqueTitles = new Set(); // Track unique workout titles

        this.workoutSections.forEach((section) => {
            const sectionTitle = section.querySelector('.section-title')?.textContent;
            const workoutCards = section.querySelectorAll('.workout-card-content');

            workoutCards.forEach((card) => {
                const title = card.querySelector('.workout-title')?.textContent;

                // Skip if we've already added this title
                if (uniqueTitles.has(title)) {
                    return;
                }

                const duration = card.querySelector('.workout-stats span:first-child')?.textContent;
                const calories = card.querySelector('.workout-stats span:last-child')?.textContent;
                const image = card.querySelector('img')?.src;

                if (this.startsWithSearch(query, title)) {
                    searchResults.push({ title, duration, calories, image, section: sectionTitle });
                    uniqueTitles.add(title); // Mark this title as processed
                }

                if (this.isMobile) {
                    const inputRect = this.searchInput.getBoundingClientRect();
                    this.dropdownContainer.style.top = `${inputRect.bottom + 10}px`;
                    this.dropdownContainer.style.left = '20px';
                    this.dropdownContainer.style.right = '20px';
                    this.dropdownContainer.style.maxHeight = 'calc(100vh - 150px)';
                }
            });
        });

        this.cachedResults = searchResults; // Cache the results
        this.updateDropdown(searchResults);
    }

    startsWithSearch(query, title) {
        if (!title) return false;
        return title.toLowerCase().startsWith(query.toLowerCase());
    }

    updateDropdown(results) {
        if (results.length === 0) {
            this.dropdownContainer.innerHTML = `
                <div class="no-results">
                    <p>No workouts found</p>
                </div>
            `;
        } else {
            const visibleResults = results.slice(0, 3);
            const remainingResults = results.slice(3);

            this.dropdownContainer.innerHTML = `
                <div class="visible-results">
                    ${visibleResults.map((result) => this.createResultItem(result)).join('')}
                </div>
                ${remainingResults.length > 0
                    ? `
                    <div class="remaining-results">
                        ${remainingResults.map((result) => this.createResultItem(result)).join('')}
                    </div>
                `
                    : ''
                }
            `;
        }

        this.showDropdown();
    }

    createResultItem(result) {
        return `
            <div class="search-result-item">
                <div class="result-image">
                    <img src="${result.image || './assets/icons/vegan.svg'}" alt="${result.title}">
                </div>
                <div class="result-content">
                    <h3 class="workout-title">${result.title}</h3>
                    <div class="result-meta">
                        <span class="duration"> ${result.duration} </span>
                        <span class="calories"> ${result.calories} </span>
                    </div>
                </div>
            </div>
        `;
    }

    showDropdown() {
        this.dropdownContainer.style.display = 'block';
        this.isDropdownVisible = true;
        this.updateDropdownPosition();
    }

    hideDropdown() {
        this.dropdownContainer.style.display = 'none';
        this.isDropdownVisible = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchImplementation();
});

window.workouts = workouts;