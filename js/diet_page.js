let selectedDiet = null;

function updateDietCarousel(selectedType) {
    // Get filtered diets based on selected type
    let filteredDiets;
    if (selectedType === 'All') {
        filteredDiets = diets.slice(0, 3); // Show first 3 diets for "All"
    } else {
        // Convert to lowercase for comparison
        const typeLower = selectedType.toLowerCase();

        filteredDiets = diets.filter(diet => {
            if (!diet.type) return false;

            if (Array.isArray(diet.type)) {
                return diet.type.some(t =>
                    typeof t === 'string' && t.toLowerCase() === typeLower
                );
            } else {
                return typeof diet.type === 'string' &&
                    diet.type.toLowerCase() === typeLower;
            }
        }).slice(0, 3); // Take top 3 matching diets
    }

    if (filteredDiets.length === 0) {
        filteredDiets = [{
            title: `No ${selectedType} Diet Plans Found`,
            description: "Try a different diet category",
            duration: "0 min",
            calories: "0 kcal",
            image: "./assets/icons/diet.svg"
        }];
    }

    // Recreate the carousel with filtered diets
    const carousel = document.querySelector('.diet-carousel');
    if (carousel) {
        // Remove existing carousel
        carousel.innerHTML = '';

        // Create new track
        const track = document.createElement('div');
        track.className = 'diet-slides';
        carousel.appendChild(track);

        // Create slides HTML
        const slidesHTML = filteredDiets.map((diet, index) => `
            <div class="diet-slide" data-index="${index}">
                <div class="diet-card">
                    <div class="card-content">
                        <h3>${diet.title}</h3>
                        <p>${diet.description}</p>
                        <div class="diet-meta">
                            <span class="duration">
                                <i class="fas fa-clock"></i> ${diet.duration || "0 min"}
                            </span>
                            <span class="calories">
                                <i class="fas fa-fire"></i> ${diet.calories || "0 kcal"}
                            </span>
                        </div>
                        <button class="start-diet">Start Diet</button>
                    </div>
                    <div class="seperate-diet-transparent"></div>
                    <div class="card-image">
                        <img src="${diet.image || './assets/icons/diet.svg'}" alt="diet">
                    </div>
                </div>
            </div>
        `).join('');

        track.innerHTML = slidesHTML;

        const nav = document.createElement('div');
        nav.className = 'carousel-nav';

        const startDietButtons = document.querySelectorAll('.start-diet');
        startDietButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const selectedDiet = filteredDiets[index];

                if (selectedDiet) {
                    const dietId = selectedDiet.id || selectedDiet.diet_id;

                    if (dietId != null && dietId !== 'undefined') {
                        const destinationPage = `subdiet_page.php?diet_id=${dietId}`;

                        localStorage.setItem('selectedDiet', JSON.stringify(selectedDiet));

                        window.location.href = destinationPage;
                    } else {
                        console.error('Invalid diet ID:', dietId);
                        alert('Unable to load diet details. Please try again.');
                    }
                }
            });
        });

        filteredDiets.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                // Update active dot
                nav.querySelectorAll('.nav-dot').forEach((d, i) => {
                    d.classList.toggle('active', i === index);
                });

                // Update slide positions
                track.querySelectorAll('.diet-slide').forEach((slide, i) => {
                    const offset = (i - index) * 100;
                    slide.style.transform = `translateX(${offset}%)`;
                    slide.style.opacity = i === index ? '1' : '0.5';
                    slide.style.visibility = Math.abs(i - index) <= 1 ? 'visible' : 'hidden';
                    slide.style.zIndex = i === index ? '1' : '0';
                });
            });
            nav.appendChild(dot);
        });

        carousel.appendChild(nav);

        track.querySelectorAll('.diet-slide').forEach((slide, index) => {
            slide.style.transform = `translateX(${index * 100}%)`;
            slide.style.opacity = index === 0 ? '1' : '0.5';
            slide.style.visibility = index <= 1 ? 'visible' : 'hidden';
            slide.style.zIndex = index === 0 ? '1' : '0';
        });
    }
}

function handleStartDiet(diet) {
    if (!diet) {
        console.error('No diet object provided');
        return;
    }

    const dietId = diet.id || diet.diet_id;

    if (dietId == null || dietId === 'undefined') {
        console.error('Invalid diet ID:', dietId);

        alert('Unable to load diet details. Please try again.');
        return;
    }

    const destinationPage = `subdiet_page.php?diet_id=${dietId}`;
    console.log('Destination Page:', destinationPage);

    localStorage.setItem('selectedDiet', JSON.stringify(diet));

    // Navigate to the diet-specific page
    window.location.href = destinationPage;
}


class DietCarousel {
    constructor(filterType = 'All') {
        this.carousel = document.querySelector('.diet-carousel');
        this.track = document.querySelector('.diet-slides');

        // Filter diets based on the selected type
        let filteredDiets;
        if (filterType === 'All') {
            filteredDiets = diets.slice(0, 3);
        } else {
            const typeLower = filterType.toLowerCase();
            filteredDiets = diets.filter(diet => {
                if (!diet.type) return false;

                if (Array.isArray(diet.type)) {
                    return diet.type.some(t =>
                        typeof t === 'string' && t.toLowerCase() === typeLower
                    );
                } else {
                    return typeof diet.type === 'string' &&
                        diet.type.toLowerCase() === typeLower;
                }
            }).slice(0, 3);
        }

        this.slides = filteredDiets.map(diet => ({
            title: diet.title,
            description: "Diet plan based on your preferences",
            duration: diet.duration,
            calories: diet.calories,
            image: diet.image
        }));

        if (this.slides.length === 0) {
            this.slides = [{
                title: `No ${filterType} Diet Plans Found`,
                description: "Try a different diet category",
                duration: "0 min",
                calories: "0 kcal",
                image: "./assets/icons/diet.svg"
            }];
        }

        // The rest of your code remains the same
        this.currentIndex = 0;
        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.autoSlideInterval = null;
        this.autoSlideDelay = 10000;
        this.init();
        this.bindStartDietEvents();
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
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }

        this.autoSlideInterval = setInterval(() => {
            if (this.currentIndex < this.slides.length - 1) {
                this.nextSlide();
            } else {
                this.goToSlide(0);
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
        setTimeout(() => {
            this.startAutoSlide();
        }, 500);
    }

    createSlides() {
        const slidesHTML = this.slides.map((slide, index) => `
            <div class="diet-slide" data-index="${index}">
                <div class="diet-card">
                    <div class="card-content">
                        <h3>${slide.title}</h3>
                        <p>${slide.description}</p>
                        <div class="diet-meta">
                            <span class="duration">
                                <i class="fas fa-clock"></i> ${slide.duration}
                            </span>
                            <span class="calories">
                                <i class="fas fa-fire"></i> ${slide.calories}
                            </span>
                        </div>
                        <button class="start-diet">Start Diet</button>
                    </div>
                    <div class="seperate-diet-transparent"></div>
                    <div class="card-image">
                        <img src="${slide.image}" alt="diet">
                    </div>
                </div>
            </div>
        `).join('');

        this.track.innerHTML = slidesHTML;
        this.slides = document.querySelectorAll('.diet-slide');
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
        });

        this.carousel.addEventListener('touchmove', (e) => {
            if (this.isTransitioning) return;

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;

            const deltaX = this.touchStartX - touchEndX;
            const deltaY = this.touchStartY - touchEndY;

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

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }
        });

        // Mouse wheel event
        this.carousel.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();

                if (this.isTransitioning) return;

                if (Math.abs(e.deltaX) > 50) {
                    if (e.deltaX > 0) {
                        this.nextSlide();
                    } else {
                        this.previousSlide();
                    }
                }
            }
        }, { passive: false });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isTransitioning) return;

            if (e.key === 'ArrowRight') {
                this.nextSlide();
            } else if (e.key === 'ArrowLeft') {
                this.previousSlide();
            }
        });
    }

    bindStartDietEvents() {
        this.carousel.addEventListener('click', (event) => {
            const startDietButton = event.target.closest('.start-diet');
            if (startDietButton) {
                const dietSlide = startDietButton.closest('.diet-slide');
                if (dietSlide) {
                    const index = parseInt(dietSlide.dataset.index, 10);
                    const selectedDiet = diets && diets[index] ? diets[index] : null;

                    if (selectedDiet) {
                        handleStartDiet(selectedDiet);
                    } else {
                        console.error('No diet found at index:', index);
                        alert('Unable to load diet details. Please try again.');
                    }
                }
            }
        });
    }

    startSelectedDiet(diet) {
        // Mapping of diet titles to their respective pages
        const dietPages = {
            'Greek Salad': '/diets/greek-salad.html',
            'No All Diet Plans Found': '/diets/default.html',
            'default': '/diets/default.html'
        };

        // Determine the destination page
        const destinationPage = dietPages[diet.title] || dietPages['default'];

        // Optional: Store selected diet in localStorage
        localStorage.setItem('selectedDiet', JSON.stringify(diet));

        // Navigate to the diet-specific page
        window.location.href = destinationPage;
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

// Helper function to check dark mode
function checkDarkMode() {
    const darkModeToggle = document.querySelector('input[name="dark-mode-toggle"]');
    if (darkModeToggle) {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = isDarkMode;
        document.documentElement.classList.toggle('dark-mode', isDarkMode);
        return isDarkMode;
    }
    return false;
}

// -------------------------------------------------------------------------------------------------------------------------------------- //
// Activity Types
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
// Top Picks For You - Diet Plan
let displayedDiets = [];

function getRecommendedDiets(userProfile, allDiets) {
    // Destructure user profile data
    const {
        height,
        weight,
        goal, // 'lose', 'gain', or 'maintain'
        dietaryPreferences = [], // Array of preferred diet types (vegetarian, vegan, meat)
        completedDiets = [], // Array of diet IDs the user has completed
        healthConditions = [], // Any health conditions to consider
        timeConstraint = 30 // Default time constraint in minutes
    } = userProfile;

    // Calculate BMI (for personalized recommendations)
    const bmi = weight / ((height / 100) ** 2);

    // Define scoring criteria based on user goal
    const scoreDiet = (diet) => {
        let score = 0;

        // Parse calories and preparation time
        const calories = parseInt(diet.calories);
        const prepTime = parseInt(diet.duration);

        // Base score adjustments by goal
        if (goal === 'lose') {
            // For weight loss, prioritize lower calorie meals
            if (calories < 400) score += 3;
            else if (calories < 600) score += 2;
            else if (calories < 800) score += 1;

            // Vegetarian and vegan options often have lower calories
            if (diet.type.includes('Vegetarian') || diet.type.includes('Vegan')) score += 1;
        }
        else if (goal === 'gain') {
            // For weight gain, prioritize higher calorie, protein-rich meals
            if (calories > 800) score += 3;
            else if (calories > 600) score += 2;
            else if (calories > 400) score += 1;

            // Meat options often have more protein
            if (diet.type.includes('Meat')) score += 2;
        }
        else { // 'maintain' or general health
            // Balanced approach
            score += 1; // Base score for all diets

            // Prefer balanced meals
            if (calories >= 500 && calories <= 700) score += 2;
        }

        // Match diet difficulty to user's time constraint
        const levelScore = {
            'Easy': prepTime <= 20 ? 3 : 1,
            'Medium': prepTime <= 30 ? 2 : 0,
            'Hard': prepTime <= 40 ? 1 : -1
        };
        score += levelScore[diet.level] || 0;

        // Respect user's time constraint
        if (prepTime <= timeConstraint) score += 2;
        else score -= Math.floor((prepTime - timeConstraint) / 10); // Penalty for each 10 min over

        // Respect user dietary preferences
        dietaryPreferences.forEach(pref => {
            if (diet.type.includes(pref)) score += 3;
        });

        // Consider health conditions
        if (healthConditions.includes('diabetes') &&
            calories < 500) {
            score += 2;
        }

        if (healthConditions.includes('high_cholesterol') &&
            (diet.type.includes('Vegetarian') || diet.type.includes('Vegan'))) {
            score += 2;
        }

        // Variety - downrank diets the user has recently completed
        if (completedDiets.includes(diet.diet_id)) score -= 2;

        return score;
    };

    // Score and sort all diets
    const scoredDiets = allDiets.map(diet => ({
        ...diet,
        score: scoreDiet(diet)
    }));

    // Sort by score (highest first)
    scoredDiets.sort((a, b) => b.score - a.score);

    // Return top diets
    return scoredDiets.slice(0, 6);
}

function findTopPicksDietSection() {
    // Find all sections with the diet-body class
    const sections = document.querySelectorAll('section.diet-body');

    // Loop through them to find the one with the title we want
    for (const section of sections) {
        const titleElement = section.querySelector('.section-title');
        if (titleElement && titleElement.textContent.includes('Top Picks For You')) {
            return section;
        }
    }
    return null;
}

// Function to load user profile data
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

// Function to create a diet card
function createDietCard(diet, position) {
    return `
        <div class="diet-card" data-diet-id="${diet.diet_id}" data-position="${position}">
            <div class="diet-image">
                <img src="${diet.image || './assets/icons/error.svg'}" alt="${diet.title}">
            </div>
            <div class="diet-info">
                <h3 class="diet-title">${diet.title}</h3>
                <span class="diet-level">${diet.level}</span>
                <div class="diet-stats">
                    <span><i class="fas fa-clock"></i> ${diet.duration}</span>
                    <span><i class="fas fa-fire"></i> ${diet.calories}</span>
                </div>
                <div class="diet-type-tags">
                    ${diet.type.map(type => `<span class="diet-type-tag">${type}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// Function to setup scroll arrows
// function setupDietScrollArrows(container) {
//     const parentSection = container.closest('section');
//     if (!parentSection) return;

//     // Check if arrows already exist
//     let leftArrow = parentSection.querySelector('.scroll-arrow.left');
//     let rightArrow = parentSection.querySelector('.scroll-arrow.right');

//     // Create arrow container if needed
//     let arrowContainer = parentSection.querySelector('.arrow-container');
//     if (!arrowContainer) {
//         arrowContainer = document.createElement('div');
//         arrowContainer.className = 'arrow-container';
//         // Position the container relative to the grid
//         arrowContainer.style.position = 'relative';
//         arrowContainer.style.width = '100%';
//         arrowContainer.style.height = '0';
//         // Insert before the grid
//         container.parentNode.insertBefore(arrowContainer, container);
//     }

//     if (!leftArrow) {
//         leftArrow = document.createElement('button');
//         leftArrow.className = 'scroll-arrow left';
//         leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
//         // Position left arrow
//         leftArrow.style.position = 'absolute';
//         leftArrow.style.top = '50%';
//         leftArrow.style.left = '0';
//         leftArrow.style.transform = 'translateY(-50%)';
//         leftArrow.style.zIndex = '10';
//         arrowContainer.appendChild(leftArrow);
//     }

//     if (!rightArrow) {
//         rightArrow = document.createElement('button');
//         rightArrow.className = 'scroll-arrow right';
//         rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
//         // Position right arrow
//         rightArrow.style.position = 'absolute';
//         rightArrow.style.top = '50%';
//         rightArrow.style.right = '0';
//         rightArrow.style.transform = 'translateY(-50%)';
//         rightArrow.style.zIndex = '10';
//         arrowContainer.appendChild(rightArrow);
//     }

//     // Add event listeners
//     leftArrow.onclick = () => {
//         container.scrollBy({ left: -300, behavior: 'smooth' });
//     };

//     rightArrow.onclick = () => {
//         container.scrollBy({ left: 300, behavior: 'smooth' });
//     };

//     // Show/hide arrows based on scroll position
//     function updateArrowVisibility() {
//         if (container.scrollLeft <= 10) {
//             leftArrow.style.display = 'none';
//         } else {
//             leftArrow.style.display = 'block';
//         }

//         if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
//             rightArrow.style.display = 'none';
//         } else {
//             rightArrow.style.display = 'block';
//         }
//     }

//     // Initial check
//     updateArrowVisibility();

//     // Listen for scroll events
//     container.addEventListener('scroll', updateArrowVisibility);
// }

// Function to setup diet card click events
function setupDietCardClick() {
    document.querySelectorAll('.diet-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling

            // Get the diet ID and position
            const dietId = card.getAttribute('data-diet-id');
            const position = parseInt(card.getAttribute('data-position'));

            // Get the actual diet object from our stored recommendations
            const diet = displayedDiets[position];

            if (!diet) {
                console.error('Diet not found in displayedDiets array at position', position);
                return;
            }

            // Navigate to the diet details page
            window.location.href = `diet_details.php?id=${dietId}`;
        });
    });
}

// Function to initialize Top Picks section
async function initializeTopPicksDiet() {
    try {
        // Load user profile
        const userProfile = await loadUserProfile();

        // Find the Top Picks section
        const topPicksSection = findTopPicksDietSection();
        const dietGrid = topPicksSection?.querySelector('.diet-grid');

        if (!dietGrid) return;

        // Clear existing diets
        dietGrid.innerHTML = '';

        let recommendedDiets = [];

        if (userProfile) {
            // User is logged in, use personalized recommendations
            recommendedDiets = getRecommendedDiets(userProfile, diets);
        } else {
            // User not logged in, show generic recommendations
            recommendedDiets = [...diets] // Create a copy to avoid mutating the original array
                .sort(() => 0.5 - Math.random())
                .slice(0, 6);
        }

        if (recommendedDiets.length > 0) {
            dietGrid.classList.add('scroll-layout');

            // Store these recommendations for reference
            displayedDiets = recommendedDiets;

            // Create diet cards
            dietGrid.innerHTML = recommendedDiets.map((diet, position) => {
                return createDietCard(diet, position);
            }).join('');

            // Setup scroll arrows
            setupScrollArrows(dietGrid);

            // Setup click handlers
            setupDietCardClick();

            // Show the section
            topPicksSection.style.display = '';
        } else {
            // Show message when no diets are available
            dietGrid.innerHTML = '<div class="no-diets-message">No diet plans available at the moment.</div>';
            topPicksSection.style.display = '';
        }
    } catch (error) {
        console.error('Error initializing Top Picks for Diet:', error);
    }
}

// Function to update category display
function filterDietsByCategory(category) {
    // Find all diet cards across all sections
    const dietCards = document.querySelectorAll('.diet-card');

    if (category === 'All') {
        // Show all diet cards
        // initializeTopPicksDiet();
        dietCards.forEach(card => {
            card.style.display = '';
        });
    } else {
        // Filter by category
        dietCards.forEach(card => {
            const position = parseInt(card.getAttribute('data-position'));
            const diet = displayedDiets[position];

            if (diet && diet.type.includes(category)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Setup category selection
function setupCategorySelection() {
    const allBtn = document.querySelector('.activity-card-all');
    const vegetarianBtn = document.querySelector('.activity-card-vegetarian');
    const veganBtn = document.querySelector('.activity-card-vegan');
    const meatBtn = document.querySelector('.activity-card-meat');

    if (allBtn) {
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.activity-card').forEach(card => card.classList.remove('active'));
            allBtn.classList.add('active');
            filterDietsByCategory('All');
        });
    }

    if (vegetarianBtn) {
        vegetarianBtn.addEventListener('click', () => {
            document.querySelectorAll('.activity-card').forEach(card => card.classList.remove('active'));
            vegetarianBtn.classList.add('active');
            filterDietsByCategory('Vegetarian');
        });
    }

    if (veganBtn) {
        veganBtn.addEventListener('click', () => {
            document.querySelectorAll('.activity-card').forEach(card => card.classList.remove('active'));
            veganBtn.classList.add('active');
            filterDietsByCategory('Vegan');
        });
    }

    if (meatBtn) {
        meatBtn.addEventListener('click', () => {
            document.querySelectorAll('.activity-card').forEach(card => card.classList.remove('active'));
            meatBtn.classList.add('active');
            filterDietsByCategory('Meat');
        });
    }
}


// -------------------------------------------------------------------------------------------------------------------------------------- //
function setupRecentDietCards() {
    document.querySelectorAll('.diet-card-recently').forEach(card => {
        card.addEventListener('click', () => {
            const dietId = card.getAttribute('data-diet-id');

            // Find the diet by ID in the available diets
            const diet = diets.find(d => d.diet_id === dietId);

            if (!diet) {
                console.error('Diet not found with ID:', dietId);
                return;
            }

            // Store the selected diet
            selectedDiet = diet;

            // Update popup content
            const popup = document.getElementById('popup-container');

            document.getElementById('popup-title').textContent = diet.title.toUpperCase();

            // Optional: Add description handling
            if (document.getElementById('popup-desc')) {
                document.getElementById('popup-desc').textContent = diet.description || 'No description available';
            }

            // Extract preparation time and calories
            const durationNum = diet.duration.match(/\d+/)[0];
            document.getElementById('popup-duration').textContent = durationNum;

            const caloriesNum = diet.calories.match(/\d+/)[0];
            document.getElementById('popup-calories').textContent = caloriesNum;

            // Update difficulty level
            updatePopupLevel(diet.level);

            // Handle diet image
            const dietImage = document.getElementById('popup-diet-image');
            if (diet.image) {
                dietImage.src = diet.image;
                dietImage.alt = `${diet.title} Image`;
                dietImage.style.objectFit = 'cover';
            } else {
                dietImage.src = './assets/icons/error.svg';
                dietImage.alt = 'Diet Image Not Found';
                dietImage.style.objectFit = 'contain';
                dietImage.style.width = '60%';
                dietImage.style.height = 'auto';
            }

            // Update ingredients list
            updateIngredientsList(diet);

            // Show popup
            popup.classList.add('active');
        });
    });
}

function initializeRecentDiet() {
    let recentDiets = [];


    if (window.recentUserDiets && window.recentUserDiets.length > 0) {
        recentDiets = window.recentUserDiets.map(diet => ({
            diet_id: diet.id,
            title: diet.title,
            duration: diet.duration,
            calories: '0 kcal', // You might want to calculate this
            image: diet.image,
            level: 'Unknown' // Add a default level if not provided
        }));
    } else {
        // Fallback to localStorage
        try {
            const storedRecentDiets = JSON.parse(localStorage.getItem('recentDiets'));
            if (Array.isArray(storedRecentDiets) && storedRecentDiets.length > 0) {
                recentDiets = storedRecentDiets;
            }
        } catch (error) {
            console.error('Error parsing recent diets from localStorage:', error);
        }
    }

    console.log('Recent Diets:', recentDiets);

    const recentDietContainer = document.querySelector('.recent-diets-container');

    // Clear existing recent diet cards
    if (recentDietContainer) {
        recentDietContainer.innerHTML = '';
    }

    // If no recent diets, display a message or hide the section
    if (recentDiets.length === 0) {
        if (recentDietContainer) {
            recentDietContainer.innerHTML = '<p>No recent diets</p>';
        }
        return;
    }

    // Iterate through recent diets and create cards
    recentDiets.forEach(diet => {
        if (!diet || !diet.diet_id || !diet.title) {
            console.warn('Invalid diet object:', diet);
            return; // Skip invalid entries
        }

        const dietCard = document.createElement('div');
        dietCard.classList.add('diet-card', 'diet-card-recently');
        dietCard.setAttribute('data-diet-id', diet.diet_id);

        dietCard.innerHTML = `
            <div class="diet-card-image">
                <img src="${diet.image || './assets/icons/error.svg'}"
                     alt="${diet.title} Image"
                     onerror="this.src='./assets/icons/error.svg'; this.style.objectFit='contain';">
            </div>
            <div class="diet-card-details">
                <h3>${diet.title}</h3>
                <div class="diet-card-info">
                    <span class="diet-duration">
                        ${diet.duration || 'N/A'}
                    </span>
                    <span class="diet-calories">
                        ${diet.calories || '0 kcal'}
                    </span>
                </div>
            </div>
        `;

        if (recentDietContainer) {
            recentDietContainer.appendChild(dietCard);
        }
    });

    // Re-run the setup for recent diet cards to ensure click events work
    setupRecentDietCards();
}

// Function to add a diet to recent diets
function addToRecentDiets(diet) {
    // Get existing recent diets from localStorage
    const recentDiets = JSON.parse(localStorage.getItem('recentDiets')) || [];

    // Check if diet already exists to avoid duplicates
    const exists = recentDiets.some(d => d.diet_id === diet.diet_id);

    if (!exists) {
        // Add to the beginning of the array
        recentDiets.unshift(diet);

        // Limit to last 5 recent diets
        const maxRecentDiets = 5;
        const updatedRecentDiets = recentDiets.slice(0, maxRecentDiets);

        // Save back to localStorage
        localStorage.setItem('recentDiets', JSON.stringify(updatedRecentDiets));
    }

    // Reinitialize recent diets display
    initializeRecentDiet();
}

// Start Button Event Listener
// document.querySelector('.popup-start-button').addEventListener('click', () => {
//     if (selectedDiet) {
//         localStorage.setItem('currentDiet', JSON.stringify([selectedDiet]));
//         window.location.href = 'subdiet_page.php';
//     } else {
//         console.error('No diet selected');
//     }
// });


// Initialize everything on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTopPicksDiet();
    setupCategorySelection();
    setupRecentDietCards();
    setupScrollArrows(document.getElementById('recently-diet-grid'));

    // Set default category selection
    const defaultCard = document.querySelector('.activity-card-all');
    if (defaultCard) {
        defaultCard.classList.add('active');
    }

    // Add popup start button event listener
    const popupStartButton = document.querySelector('.popup-start-button');
    if (popupStartButton) {
        popupStartButton.addEventListener('click', () => {
            if (selectedDiet) {
                // Add the selected diet to recent diets before navigating
                addToRecentDiets(selectedDiet);

                localStorage.setItem('currentDiet', JSON.stringify([selectedDiet]));
                window.location.href = 'subdiet_page.php';
            } else {
                console.error('No diet selected');
            }
        });
    }

    // Initialize recent diets on page load
    initializeRecentDiet();
});
// -------------------------------------------------------------------------------------------------------------------------------------- //
// Helper function to create a unified diet card
function createDietCard(diet) {
    return `
        <div class="diet-card-content" data-diet-id="${diet.diet_id}" data-diet-type="${diet.type}">
            <div>
                <img src="${diet.image}" alt="${diet.title}" class="diet-image">
            </div>
            <div class="diet-info">
                <h3 class="diet-title">${diet.title}</h3>
                <span class="diet-level">${diet.level || ''}</span>
                <div class="diet-stats">
                    <span><i class="fas fa-clock"></i> ${diet.duration || '-'}</span>
                    <span><i class="fas fa-fire"></i> ${diet.calories || '0 kcal'}</span>
                </div>
            </div>
        </div>
    `;
}

// Function to filter diets by type`
function filterDiets(type) {
    if (type === 'All') return diets;

    // Convert to lowercase for comparison
    const typeLower = type.toLowerCase();

    return diets.filter(diet => {
        // Check if diet.type exists
        if (!diet.type) {
            console.log("Diet missing type:", diet);
            return false;
        }
        
        if (Array.isArray(diet.type)) {
            console.log(`Checking ${diet.title} with types:`, diet.type);
            return diet.type.some(t =>
                typeof t === 'string' && t.toLowerCase() === typeLower
            );
        } else {
            console.log(`Checking ${diet.title} with type:`, diet.type);
            return typeof diet.type === 'string' &&
                diet.type.toLowerCase() === typeLower;
        }
    });
}

// Setup click handlers for diet cards
function setupDietCardClick() {
    document.querySelectorAll('.diet-card-content').forEach(card => {
        card.addEventListener('click', () => {
            const dietId = card.getAttribute('data-diet-id');
            if (dietId) {
                window.location.href = `subdiet_page.php?diet_id=${dietId}`;
            }
        });
        card.style.cursor = 'pointer';
    });
}

// Setup scroll arrows for horizontal scrolling
function setupScrollArrows(grid) {
    // Remove any existing wrapper and arrows
    const existingWrapper = grid.parentElement.querySelector('.grid-wrapper');
    if (existingWrapper) {
        const originalGrid = existingWrapper.querySelector('.diet-grid, .workout-grid');
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
        e.stopPropagation();
        grid.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    rightArrow.addEventListener('click', (e) => {
        e.stopPropagation();
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

// Initialize diet sections
function initializeDietSections() {
    console.log("Initializing diet sections with data:", diets);

    document.querySelectorAll('section.diet-body').forEach(section => {
        const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
        const dietGrid = section.querySelector('.diet-grid, .diet-history-grid');

        console.log(`Processing section: ${sectionTitle}`);


        if (dietGrid && diets && diets.length > 0) {
            dietGrid.classList.add('scroll-layout');

            const sectionType = sectionTitle.replace(/^(🔥|⚡|⏰|❤️|💪|🏋️|🧘‍♀️|🧘)?\s*/, '').trim();
            console.log(`Section type: ${sectionType}`);

            let filteredDiets;
            if (sectionType === 'Top Picks For You' || sectionType === 'Recently Meals') {
                filteredDiets = diets.slice(0, 5);
            } else {
                filteredDiets = filterDiets(sectionType);
            }

            console.log(`Filtered diets for ${sectionType}:`, filteredDiets);

            if (filteredDiets.length > 0) {
                dietGrid.innerHTML = filteredDiets.map(diet => createDietCard(diet)).join('');
            } else {
                dietGrid.innerHTML = `<div class="no-data">No ${sectionType} diets found</div>`;
            }

            setupScrollArrows(dietGrid);
        } else {
            console.log(`No diet data or grid for section: ${sectionTitle}`);
        }
    });

    setupDietCardClick();
}

// Search implementation
class SearchImplementation {
    constructor() {
        this.searchInput = document.querySelector('.search-bar input');
        this.searchBarSmall = document.querySelector('.search-bar-small');
        this.dropdownContainer = null;
        this.dietSections = document.querySelectorAll('section.diet-body');
        this.isDropdownVisible = false;

        this.init();
    }

    init() {
        this.createDropdownContainer();
        this.bindEvents();
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

    bindEvents() {
        let debounceTimeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        this.searchBarSmall.addEventListener('click', () => {
            const searchBar = document.querySelector('.search-bar');
            searchBar.classList.toggle('show-search');
            searchBar.querySelector('input').focus();
        });

        document.addEventListener('click', (e) => {
            if (!this.searchInput.parentElement.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.hideDropdown();
            return;
        }

        const searchResults = [];
        this.dietSections.forEach(section => {
            const sectionTitle = section.querySelector('.section-title')?.textContent;
            const dietCards = section.querySelectorAll('.diet-card-content');

            dietCards.forEach(card => {
                const title = card.querySelector('.diet-title')?.textContent;
                const duration = card.querySelector('.diet-stats span:first-child')?.textContent;
                const calories = card.querySelector('.diet-stats span:last-child')?.textContent;
                const image = card.querySelector('img')?.src;

                if (this.startsWithSearch(query, title)) {
                    searchResults.push({ title, duration, calories, image, section: sectionTitle });
                }
            });
        });

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
                    <p>No diets found</p>
                </div>
            `;
        } else {
            const visibleResults = results.slice(0, 3);
            const remainingResults = results.slice(3);

            this.dropdownContainer.innerHTML = `
                <div class="visible-results">
                    ${visibleResults.map(result => this.createResultItem(result)).join('')}
                </div>
                ${remainingResults.length > 0 ? `
                    <div class="remaining-results">
                        ${remainingResults.map(result => this.createResultItem(result)).join('')}
                    </div>
                ` : ''}
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
                    <h3 class="diet-title">${result.title}</h3>
                    <div class="result-meta">
                        <span class="duration">
                            ${result.duration}
                        </span>
                        <span class="calories">
                            ${result.calories}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    showDropdown() {
        this.dropdownContainer.style.display = 'block';
        this.isDropdownVisible = true;
    }

    hideDropdown() {
        this.dropdownContainer.style.display = 'none';
        this.isDropdownVisible = false;
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // console.log("Diet data from PHP:", diets);
    // console.log("Response object:", response);

    // Initialize activity cards
    const defaultSelection = document.getElementById('default-selection');

    document.querySelectorAll('.activity-card').forEach(card => {
        updateCardStyles(card, card === defaultSelection);

        // Click handling
        card.addEventListener('click', () => {
            const selectedType = card.querySelector('p').textContent.trim();

            // Reset all cards
            document.querySelectorAll('.activity-card').forEach(c => {
                updateCardStyles(c);
            });

            // Highlight selected card
            const isDark = checkDarkMode();
            if (isDark) {
                card.style.background = '#ffa07a';
                card.style.border = '1px solid #ffa07a';
                card.style.color = 'white';
            } else {
                card.style.background = '#FFAD84';
                card.style.color = 'white';
            }

            updateDietCarousel(selectedType);

            // First, make all sections visible by default when "All" is selected
            if (selectedType === 'All') {
                initializeTopPicksDiet();
                initializeRecentDiet();
                document.querySelectorAll('section.diet-body').forEach(section => {
                    section.style.display = '';
                    const dietGrid = section.querySelector('.diet-grid, .diet-history-grid');
                    if (dietGrid) {
                        dietGrid.classList.add('scroll-layout');
                        dietGrid.classList.remove('grid-layout');
                    }
                });
            } else {
                // Filter sections based on selection for non-"All" types
                document.querySelectorAll('section.diet-body').forEach(section => {
                    const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
                    const dietGrid = section.querySelector('.diet-grid, .diet-history-grid');

                    // Special handling for Top Picks and Recently Meals - hide for non-All selections
                    if (['Top Picks For You', 'Recently Meals'].includes(sectionTitle)) {
                        section.style.display = 'none';
                        return;
                    }

                    // For Categories, always show
                    if (sectionTitle === 'Categories') {
                        section.style.display = '';
                    }
                    // For specific type sections, only show if they match the selected type
                    else if (sectionTitle.includes(selectedType)) {
                        section.style.display = '';
                        if (dietGrid) {
                            dietGrid.classList.add('grid-layout');
                            dietGrid.classList.remove('scroll-layout');
                        }
                    } else {
                        section.style.display = 'none';
                    }
                });
            }

            // Update diet content
            document.querySelectorAll('.diet-grid, .diet-history-grid').forEach(grid => {
                const section = grid.closest('section');
                const sectionTitle = section.querySelector('.section-title')?.textContent.trim();
                const sectionType = sectionTitle.replace(/^(🔥|⚡|⏰|❤️|💪|🏋️|🧘‍♀️|🧘)?\s*/, '');

                // Only update content if the section is visible
                if (section.style.display !== 'none') {
                    let filterType = selectedType;

                    // Map selected type to database value
                    switch (selectedType) {
                        case 'Vegetarian': filterType = 'vegetarian'; break;
                        case 'Vegan': filterType = 'vegan'; break;
                        case 'Meat': filterType = 'meat'; break;
                        default: filterType = 'All';
                    }

                    const filteredDiets = filterDiets(selectedType === 'All' ? sectionType : filterType);
                    grid.innerHTML = filteredDiets.map(diet => createDietCard(diet)).join('');
                }
            });

            setupDietCardClick();
        });
    });

    // Initialize carousel
    new DietCarousel();

    // Initialize search
    new SearchImplementation();

    // Initialize diet sections
    initializeDietSections();

    // Handle dark mode changes
    window.addEventListener('darkModeChange', () => {
        document.querySelectorAll('.activity-card').forEach(card => {
            const isDefault = card === defaultSelection;
            updateCardStyles(card, isDefault);
        });
    });

    // Set default filter to 'All'
    const defaultCard = document.querySelector('.activity-card-all');
    if (defaultCard) {
        defaultCard.click();
    }
});