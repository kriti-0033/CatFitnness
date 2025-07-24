let currentPopup = null;
let removeTimeout = null;

document.addEventListener('DOMContentLoaded', function () {
    // Hamburger menu functionality
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');
    const navbar = document.getElementById('navbar');
    const navLogoRes = document.getElementById('nav-logo-responsive');
    const searchBarSmall = document.getElementById('search-bar-small');

    function toggleMenuVisibility(show) {
        if (hamburgerMenu && navLinks) {
            hamburgerMenu.classList.toggle('active', show);
            navLinks.classList.toggle('show', show);
            document.body.classList.toggle('menu-open', show);

            if (show) {
                document.body.style.overflow = 'hidden';
                profilePic.style.display = 'none';
                navbar.style.padding = '1.8rem 2rem';
                navLogoRes.style.display = 'none';
                searchBarSmall.style.display = 'none';
            } else {
                document.body.style.overflow = 'auto';
                profilePic.style.display = 'block';
                navbar.style.padding = '1rem 2rem';

                // Handle searchBarSmall and navLogoRes based on window width
                if (window.innerWidth > 832) {
                    navLogoRes.style.display = 'none';
                    // searchBarSmall.style.display = 'none';
                } else {
                    navLogoRes.style.display = 'block';
                    // searchBarSmall.style.display = 'block';
                }
            }
        }
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 832) {
            navLogoRes.style.display = 'none';
            // searchBarSmall.style.display = 'none';
        } else if (!document.body.classList.contains('menu-open')) {
            navLogoRes.style.display = 'block';
            // searchBarSmall.style.display = 'block';
        }
    });



    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', function (event) {
            event.stopPropagation();
            toggleMenuVisibility(!navLinks?.classList.contains('show'));
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (navLinks && navLinks.classList.contains('show') && !navLinks.contains(event.target) && event.target !== hamburgerMenu) {
            toggleMenuVisibility(false);
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (hamburgerMenu && navLinks) {
            const isClickInsideMenu = navLinks.contains(event.target);
            const isClickOnHamburger = hamburgerMenu.contains(event.target);

            if (!isClickInsideMenu && !isClickOnHamburger && navLinks.classList.contains('show')) {
                console.log('Closing menu');
                toggleMenuVisibility(false);
            }
        }
    });

    //mini profile
    const profilePic = document.getElementById('profile-pic');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logout = document.querySelector('.logout-profile');
    const popupContainer = document.getElementById('popup-container');
    const popupTitle = document.getElementById('popup-title');
    const popupBody = document.getElementById('popup-body');

    console.log('profilePic:', profilePic);
    console.log('profileDropdown:', profileDropdown);

    function showPopup(title, content) {
        popupTitle.textContent = title;
        popupBody.innerHTML = content;
        popupContainer.style.display = 'flex';
    }

    function closePopup() {
        popupContainer.style.display = 'none';
    }

    function showAnimatedPopup(message) {
        if (currentPopup) {
            document.body.removeChild(currentPopup);
            clearTimeout(removeTimeout);
        }

        const animatedPopup = document.createElement('div');
        animatedPopup.className = 'animated-popup';
        animatedPopup.textContent = message;

        document.body.appendChild(animatedPopup);
        currentPopup = animatedPopup;

        requestAnimationFrame(() => {
            animatedPopup.style.top = '20px';
            animatedPopup.style.opacity = '1';
        });

        removeTimeout = setTimeout(() => {
            animatedPopup.style.top = '-100px';
            animatedPopup.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(animatedPopup)) {
                    document.body.removeChild(animatedPopup);
                }
                if (currentPopup === animatedPopup) {
                    currentPopup = null;
                }
            }, 300); // Wait for the animation to finish before removing
        }, 3000);
    }

    // Function to show logout confirmation modal
    function showLogoutModal() {
        const modal = document.createElement('div');
        modal.className = 'logout-modal';
        modal.innerHTML = `
        <div class="logout-modal-content">
            <h2>Logout?</h2>
            <p>Are you sure you want to log out?</p>
            <button id="confirm-logout">Yes, Logout</button>
            <button id="cancel-logout">Cancel</button>
        </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('confirm-logout').addEventListener('click', function () {
            // Redirect to logout.php
            window.location.href = 'logout.php';
        });

        document.getElementById('cancel-logout').addEventListener('click', function () {
            document.body.removeChild(modal);
        });
    }

    if (profilePic && profileDropdown) {
        console.log('Both profilePic and profileDropdown found');
        profilePic.addEventListener('click', function (e) {
            console.log('Profile pic clicked');
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            console.log('Dropdown classes after toggle:', profileDropdown.className);
        });

        document.addEventListener('click', function (e) {
            if (!profileDropdown.contains(e.target) && !profilePic.contains(e.target)) {
                profileDropdown.classList.remove('show');
                console.log('Dropdown closed');
            }
        });
    } else {
        console.error('profilePic or profileDropdown not found in the DOM');
        if (!profilePic) console.error('profilePic is missing');
        if (!profileDropdown) console.error('profileDropdown is missing');
    }

    // Dark mode functionality
    const darkModeToggle = document.querySelector('input[name="dark-mode-toggle"]');
    if (darkModeToggle) {
        // Set initial state based on localStorage
        const isDarkMode = localStorage.getItem('darkMode') === 'true';

        darkModeToggle.checked = isDarkMode;
        document.documentElement.classList.toggle('dark-mode', isDarkMode);

        darkModeToggle.addEventListener('change', function () {
            const isDarkModeEnabled = this.checked;
            document.documentElement.classList.toggle('dark-mode', isDarkModeEnabled);
            localStorage.setItem('darkMode', isDarkModeEnabled);

            // Show notification
            const message = isDarkModeEnabled ? "Dark mode is now enabled" : "Dark mode is now disabled";
            showAnimatedPopup(message);
            changeLogoPic();

            // Sync dark mode across open tabs
            localStorage.setItem('darkModeTimestamp', Date.now().toString());
        });
    }

    function changeLogoPic() {
        const navLogo = document.getElementById('nav-logo');
        const navLogoResponsive = document.getElementById('nav-logo-responsive');

        if (!navLogo || !navLogoResponsive) return;

        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const darkModeLogoPath = './assets/icons/logo-dark-mode-1.svg';
        const lightModeLogoPath = './assets/icons/logo.svg';

        navLogo.src = isDarkMode ? darkModeLogoPath : lightModeLogoPath;
        navLogo.alt = isDarkMode ? 'Dark Mode Logo' : 'Light Mode Logo';

        navLogoResponsive.src = isDarkMode ? darkModeLogoPath : lightModeLogoPath;
        navLogoResponsive.alt = isDarkMode ? 'Dark Mode Logo' : 'Light Mode Logo';
    }

    // Logout functionality
    if (logout) {
        logout.addEventListener('click', function (e) {
            e.preventDefault();
            // Show logout confirmation modal
            showLogoutModal();
        });
    }

    // Listen for dark mode changes in other tabs
    window.addEventListener('storage', function (e) {
        if (e.key === 'darkModeTimestamp') {
            const isDarkMode = localStorage.getItem('darkMode') === 'true';
            document.documentElement.classList.toggle('dark-mode', isDarkMode);
            if (darkModeToggle) {
                darkModeToggle.checked = isDarkMode;
            }
        }
    });

    //Animation on navbar for hover
    // Replace the existing indicator code with:
    const navLinksa = document.querySelectorAll('.nav-links a');
    const indicator = document.createElement('div');
    indicator.classList.add('nav-links-indicator');
    document.querySelector('.nav-links').appendChild(indicator);

    function updateIndicatorPosition(link) {
        // Ensure the nav-links container is fully rendered
        requestAnimationFrame(() => {
            const rect = link.getBoundingClientRect();
            const navLinksContainer = link.closest('.nav-links');
            const navLinksRect = navLinksContainer.getBoundingClientRect();
            const isMobile = window.innerWidth <= 832;
            const minWidth = 80;

            navLinksa.forEach(l => {
                if (!l.classList.contains('active')) {
                    l.style.padding = '5px 15px';
                }
            });

            if (!isMobile && link.classList.contains('active')) {
                link.style.padding = '5px 15px';
            }

            if (isMobile) {
                indicator.style.width = '150px';
                indicator.style.height = `${rect.height}px`;
                indicator.style.borderRadius = '68px';
                navLinks.style.color = 'white';
                const scrollTop = navLinksContainer.scrollTop;
                const top = rect.top - navLinksRect.top + scrollTop;
                const mobileOffset = link.offsetTop;
                indicator.style.transform = `translateY(${mobileOffset}px)`;
            } else {
                const linkWidth = Math.max(rect.width, minWidth);
                const left = rect.left - navLinksRect.left + (rect.width - linkWidth) / 2;
                indicator.style.width = `${linkWidth}px`;
                indicator.style.height = '25px';
                indicator.style.borderRadius = '68px';
                navLinks.style.color = 'white';
                indicator.style.transform = `translateX(${left}px)`;
            }
        });
    }

    const activeLink = document.querySelector('.nav-links a.active');
    if (activeLink) updateIndicatorPosition(activeLink);

    setTimeout(() => {
        const activeLink = document.querySelector('.nav-links a.active');
        if (activeLink) updateIndicatorPosition(activeLink);
    }, 100);

    navLinksa.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (!document.documentElement.classList.contains('dark-mode')) {
                const activeLink = document.querySelector('.nav-links a.active');
                if (activeLink && !activeLink.isSameNode(link)) {
                    activeLink.style.color = 'black';
                }
            }
            updateIndicatorPosition(link);
        });

        link.addEventListener('mouseleave', () => {
            const active = document.querySelector('.nav-links a.active');
            if (active) updateIndicatorPosition(active);
            if (!document.documentElement.classList.contains('dark-mode')) {
                const activeLink = document.querySelector('.nav-links a.active');
                if (activeLink && !activeLink.isSameNode(link)) {
                    activeLink.style.color = 'white';
                }
            }
        });
    });


    // Update on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const active = document.querySelector('.nav-links a.active');
            if (active) updateIndicatorPosition(active);
        }, 100);
    });
});