// Dark mode toggle functionality - defaults to dark mode
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Check for saved preference, default to dark mode if no preference exists
    const savedPreference = sessionStorage.getItem('darkMode');
    const isDarkMode = savedPreference === null ? true : savedPreference === 'true';
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        updateToggleText(darkModeToggle, true);
    } else {
        updateToggleText(darkModeToggle, false);
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', function() {
        const isCurrentlyDark = body.classList.contains('dark-mode');
        
        if (isCurrentlyDark) {
            body.classList.remove('dark-mode');
            sessionStorage.setItem('darkMode', 'false');
            updateToggleText(darkModeToggle, false);
        } else {
            body.classList.add('dark-mode');
            sessionStorage.setItem('darkMode', 'true');
            updateToggleText(darkModeToggle, true);
        }
    });
}

// Update toggle button text
function updateToggleText(button, isDark) {
    button.textContent = isDark ? '☀️ Light' : '🌙 Dark';
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', initDarkMode);