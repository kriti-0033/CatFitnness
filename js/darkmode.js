(() => {
    // Configuration
    const CONFIG = {
        STORAGE_KEY: 'darkMode',
        TOGGLE_SELECTOR: 'input[type="checkbox"][name="dark-mode-toggle"]',
        TRANSITION_DURATION: 300, // milliseconds
        DEBUG: false
    };

    // State management with proper initialization
    const state = {
        isDark: false,
        isTransitioning: false,
        isInitialized: false
    };

    // Logging utility
    const log = (message, type = 'log') => {
        if (CONFIG.DEBUG) {
            console[type](`[DarkMode] ${message}`);
        }
    };

    // Debounce function to prevent rapid switching
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Safe DOM manipulation with error handling
    function safeToggleDarkMode(isDark) {
        if (state.isTransitioning) {
            log('Transition in progress, skipping toggle', 'warn');
            return;
        }

        try {
            state.isTransitioning = true;
            state.isDark = isDark;

            // Update DOM
            document.documentElement.classList.toggle('dark-mode', isDark);

            // Update storage - store as boolean string
            localStorage.setItem(CONFIG.STORAGE_KEY, isDark.toString());

            // Update all toggles
            const toggles = document.querySelectorAll(CONFIG.TOGGLE_SELECTOR);
            toggles.forEach(toggle => {
                toggle.checked = isDark;
            });

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('darkModeChange', {
                detail: { isDark, timestamp: Date.now() }
            }));

            log(`Dark mode ${isDark ? 'enabled' : 'disabled'}`);
        } catch (error) {
            log(`Error toggling dark mode: ${error.message}`, 'error');
            // Attempt to recover
            state.isDark = document.documentElement.classList.contains('dark-mode');
        } finally {
            // Ensure transition lock is released after animation
            setTimeout(() => {
                state.isTransitioning = false;
            }, CONFIG.TRANSITION_DURATION);
        }
    }

    // Debounced version of toggle function
    const debouncedToggle = debounce(safeToggleDarkMode, CONFIG.TRANSITION_DURATION);

    // Initialize a single toggle with error handling
    function initializeToggle(toggle) {
        try {
            // Set initial state
            toggle.checked = state.isDark;

            // Remove any existing listeners to prevent duplicates
            const newToggleHandler = () => {
                debouncedToggle(!state.isDark);
            };

            toggle.removeEventListener('change', newToggleHandler);
            toggle.addEventListener('change', newToggleHandler);

            log(`Toggle initialized: ${toggle.id || 'unnamed'}`);
        } catch (error) {
            log(`Error initializing toggle: ${error.message}`, 'error');
        }
    }

    // Main initialization function
    function initialize() {
        if (state.isInitialized) {
            log('Already initialized, skipping', 'warn');
            return;
        }

        try {
            // Get initial state from storage with light mode as default
            const storedMode = localStorage.getItem(CONFIG.STORAGE_KEY);
            state.isDark = storedMode ? storedMode === 'true' : false;

            // Apply initial state without transition
            document.documentElement.classList.toggle('dark-mode', state.isDark);

            // Initialize existing toggles
            document.querySelectorAll(CONFIG.TOGGLE_SELECTOR).forEach(initializeToggle);

            // Watch for new toggles
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const toggles = node.matches(CONFIG.TOGGLE_SELECTOR) ?
                                [node] :
                                node.querySelectorAll(CONFIG.TOGGLE_SELECTOR);
                            toggles.forEach(initializeToggle);
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Handle cross-tab synchronization
            window.addEventListener('storage', (e) => {
                if (e.key === CONFIG.STORAGE_KEY) {
                    debouncedToggle(e.newValue === 'true');
                }
            });

            state.isInitialized = true;
            log('Initialization complete');
        } catch (error) {
            log(`Initialization error: ${error.message}`, 'error');
            // Recover to light mode
            document.documentElement.classList.remove('dark-mode');
            state.isDark = false;
            state.isTransitioning = false;
            localStorage.setItem(CONFIG.STORAGE_KEY, 'false');
        }
    }

    // Public API
    window.darkMode = {
        toggle: () => debouncedToggle(!state.isDark),
        enable: () => debouncedToggle(true),
        disable: () => debouncedToggle(false),
        isEnabled: () => state.isDark,
        reset: () => {
            localStorage.setItem(CONFIG.STORAGE_KEY, 'false');
            initialize();
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();