//for fade in animation in all pages
const rightAnimation = document.querySelectorAll('.right-fade-in');
const leftAnimation = document.querySelectorAll('.left-fade-in');

function checkScroll() {
    const windowHeight = window.innerHeight;
    rightAnimation.forEach(element => {
        const rightHeight = element.getBoundingClientRect();
      
        if (rightHeight.top < windowHeight && rightHeight.bottom > 0) {
            element.classList.add('visible'); 
        }
    })
    leftAnimation.forEach(element => {
        const leftHeight = element.getBoundingClientRect();

        if (leftHeight.top < windowHeight && leftHeight.bottom > 0) {
            element.classList.add('visible');
        }
    })
}

window.addEventListener('scroll', checkScroll);
checkScroll();


//for page 3 color rect animation
const rectangle = document.getElementById('color-rect1');
const rectangle2 = document.getElementById('color-rect2');
const page3 = document.getElementById('page3');

window.addEventListener('scroll', function() {
    const page3Rect = page3.getBoundingClientRect(); // position of page 3
    const viewportHeight = window.innerHeight; 

    // Calculate the amount of page 3 that is visible
    const visibleHeight = Math.min(viewportHeight - 250, page3Rect.bottom) - Math.max(-200, page3Rect.top);    
    const page3Height = page3Rect.height;

    // Calculate the exposure percentage
    const exposurePercentage = Math.max(0, Math.min(1, visibleHeight / page3Height));

    // Map the exposure percentage to the rectangle's Y position
    const newYPosition1 = -50 + (exposurePercentage * 100); 
    const newYPosition2 = -20 + (exposurePercentage * 40);

    rectangle.style.transform = `translateY(${newYPosition1}px)`;
    rectangle2.style.transform = `translateY(${newYPosition2}px)`;
});


//for page 3 transition animation
let scrollProgress = 0;
const fixedContent = document.getElementById("fix");
const scrollableSection = document.getElementById("page3");

const scrollText = document.getElementById("header");
scrollText.classList.add("header-style");

const scrollText2 = document.getElementById("content");
scrollText2.classList.add("content-style");

const img = document.getElementById("image");
img.classList.add("image-style");

isAnimating = false;

window.addEventListener("wheel", (event) => {
    const rect = scrollableSection.getBoundingClientRect();
    const sectionHeight = scrollableSection.clientHeight;
    const viewportHeight = window.innerHeight;

    // Check if 80% of the section is within the viewport
    const isFullyVisible =
        rect.top >= -sectionHeight * 0.15 &&
        rect.bottom <= viewportHeight + sectionHeight * 0.15;

    if (!isFullyVisible|| isAnimating) {
        return; 
    }
    
    const direction = event.deltaY > 0 ? 1 : -1;
    const newProgress = scrollProgress + direction;

    if (newProgress >= 0 && newProgress <= 3 && Math.abs(newProgress - scrollProgress) === 1) {
        scrollProgress = newProgress;
        handleTextUpdate(scrollProgress);

        document.body.style.overflow = "hidden";
        
    }
    if (scrollProgress >3 && scrollProgress < 0) {
            document.body.style.overflow = "auto";
    }
});

function handleTextUpdate(progress) {
    switch (progress) {
        case 0:
            scrollText.innerHTML = "Unleash Fun with <br> MEWFIT's Cat Tower!";
            scrollText2.innerHTML = "MEWFIT engages users through a unique cat tower game,<br> transforming workouts into fun challenges that keep you motivated.";
            img.src = "./assets/screenshot_interface/homepage.jpeg";
            break;
        case 1:
            scrollText.innerHTML = "Tailor-Made Diet Plans: <br> Meat, Vegan, or Vegetarian!";
            scrollText2.innerHTML = "MEWFIT offers tailored diet plans with meat, vegan, and vegetarian options <br> to suit your lifestyle and dietary preferences.";
            img.src = "./assets/screenshot_interface/subdiet.png";
            break;
        case 2:
            scrollText.innerHTML = "Effortless Calorie Tracking <br>and Beyond!";
            scrollText2.innerHTML = "Keep tabs on your daily calories burnt and consumed, <br> plus a host of other fitness metrics with <br> MEWFIT's comprehensive tracking features.";
            img.src = "./assets/screenshot_interface/workoutpage.jpeg";
            break;
        case 3:
            fixedContent.classList.add("hidden");
            break;
    }

    isAnimating = true; // Set the flag to true
    fixedContent.style.opacity = 0;
    setTimeout(() => {
        fixedContent.style.opacity = 1; 
        isAnimating = false; 
        document.body.style.overflow = "auto"; 
    }, 900);
}