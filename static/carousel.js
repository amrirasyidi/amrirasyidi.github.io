// carousel.js
// Testimonials and Services Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Testimonials Carousel
    const testimonialTrack = document.getElementById('testimonialTrack');
    const testimonialPrevBtn = document.getElementById('prevBtn');
    const testimonialNextBtn = document.getElementById('nextBtn');
    const testimonials = document.querySelectorAll('.testimonial-item');
    
    if (testimonialTrack && testimonialPrevBtn && testimonialNextBtn) {
        let testimonialCurrentIndex = 0;
        let testimonialItemsToShow = getTestimonialItemsToShow();
        
        function getTestimonialItemsToShow() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }
        
        function updateTestimonialCarousel() {
            const itemWidth = 100 / testimonialItemsToShow;
            const translateX = -(testimonialCurrentIndex * itemWidth);
            testimonialTrack.style.transform = `translateX(${translateX}%)`;
        }
        
        function nextTestimonialSlide() {
            testimonialCurrentIndex = (testimonialCurrentIndex + 1) % testimonials.length;
            updateTestimonialCarousel();
        }
        
        function prevTestimonialSlide() {
            testimonialCurrentIndex = (testimonialCurrentIndex - 1 + testimonials.length) % testimonials.length;
            updateTestimonialCarousel();
        }
        
        // Event listeners
        testimonialNextBtn.addEventListener('click', nextTestimonialSlide);
        testimonialPrevBtn.addEventListener('click', prevTestimonialSlide);
        
        // Handle window resize
        window.addEventListener('resize', function() {
            testimonialItemsToShow = getTestimonialItemsToShow();
            updateTestimonialCarousel();
        });
        
        // Auto-play carousel (advances every 5 seconds)
        let testimonialAutoPlayInterval = setInterval(nextTestimonialSlide, 5000);
        
        // Pause auto-play on hover
        const testimonialCarouselContainer = document.querySelector('.testimonials-carousel');
        if (testimonialCarouselContainer) {
            testimonialCarouselContainer.addEventListener('mouseenter', function() {
                clearInterval(testimonialAutoPlayInterval);
            });
            
            testimonialCarouselContainer.addEventListener('mouseleave', function() {
                testimonialAutoPlayInterval = setInterval(nextTestimonialSlide, 5000);
            });
        }
        
        // Initialize carousel
        updateTestimonialCarousel();
    }

    // Services Carousel
    const servicesTrack = document.getElementById('servicesTrack');
    const servicesPrevBtn = document.getElementById('servicesPrevBtn');
    const servicesNextBtn = document.getElementById('servicesNextBtn');
    const services = document.querySelectorAll('.service-item');
    
    if (servicesTrack && servicesPrevBtn && servicesNextBtn) {
        let servicesCurrentIndex = 0;
        let servicesItemsToShow = getServicesItemsToShow();
        
        function getServicesItemsToShow() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }
        
        function updateServicesCarousel() {
            const itemWidth = 100 / servicesItemsToShow;
            const translateX = -(servicesCurrentIndex * itemWidth);
            servicesTrack.style.transform = `translateX(${translateX}%)`;
        }
        
        function nextServicesSlide() {
            servicesCurrentIndex = (servicesCurrentIndex + 1) % services.length;
            updateServicesCarousel();
        }
        
        function prevServicesSlide() {
            servicesCurrentIndex = (servicesCurrentIndex - 1 + services.length) % services.length;
            updateServicesCarousel();
        }
        
        // Event listeners
        servicesNextBtn.addEventListener('click', nextServicesSlide);
        servicesPrevBtn.addEventListener('click', prevServicesSlide);
        
        // Handle window resize
        window.addEventListener('resize', function() {
            servicesItemsToShow = getServicesItemsToShow();
            updateServicesCarousel();
        });
        
        // Auto-play carousel (advances every 6 seconds - slightly different from testimonials)
        let servicesAutoPlayInterval = setInterval(nextServicesSlide, 6000);
        
        // Pause auto-play on hover
        const servicesCarouselContainer = document.querySelector('.services-carousel');
        if (servicesCarouselContainer) {
            servicesCarouselContainer.addEventListener('mouseenter', function() {
                clearInterval(servicesAutoPlayInterval);
            });
            
            servicesCarouselContainer.addEventListener('mouseleave', function() {
                servicesAutoPlayInterval = setInterval(nextServicesSlide, 6000);
            });
        }
        
        // Initialize carousel
        updateServicesCarousel();
    }
});