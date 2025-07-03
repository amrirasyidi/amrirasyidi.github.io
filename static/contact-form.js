// Contact form handling with popup
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const popup = document.getElementById('success-popup');

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Create FormData object
            const formData = new FormData(form);
            
            // Submit to Web3Forms
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                // Success - show popup and reset form
                showSuccessPopup();
                form.reset();
            } else {
                // Error handling
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Sorry, there was an error sending your message. Please try again or email me directly at amri.geodesy@gmail.com');
        } finally {
            // Reset button state
            setLoadingState(false);
        }
    });

    // Loading state management
    function setLoadingState(loading) {
        if (loading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    // Show success popup
    function showSuccessPopup() {
        popup.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close popup function (global scope for onclick)
    window.closePopup = function() {
        popup.classList.remove('show');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    };

    // Close popup on overlay click
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            closePopup();
        }
    });

    // Close popup on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup.classList.contains('show')) {
            closePopup();
        }
    });
});