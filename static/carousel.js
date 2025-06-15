// carousel.js - Refactored with Carousel class
document.addEventListener('DOMContentLoaded', () => {
  class Carousel {
    constructor(config) {
      // Initialize elements
      this.track = document.getElementById(config.trackId);
      this.prevBtn = document.getElementById(config.prevBtnId);
      this.nextBtn = document.getElementById(config.nextBtnId);
      this.container = config.containerSelector 
        ? document.querySelector(config.containerSelector) 
        : null;
      
      // Get items and validate
      this.items = Array.from(this.track?.querySelectorAll(config.itemSelector) || []);
      
      // Configuration
      this.autoPlayDelay = config.autoPlayDelay;
      this.itemsToShow = this.getItemsToShow();
      this.currentIndex = 0;
      this.autoPlayInterval = null;
      this.resizeTimeout = null;

      // Initialize if valid
      if (this.track && this.prevBtn && this.nextBtn && this.items.length > 0) {
        this.init();
      } else {
        console.warn(`Carousel initialization skipped for ${config.trackId}`);
      }
    }

    init() {
      // Set initial state
      this.updateCarousel();
      
      // Event listeners
      this.prevBtn.addEventListener('click', () => this.slidePrev());
      this.nextBtn.addEventListener('click', () => this.slideNext());
      
      // Auto-play setup
      this.startAutoPlay();
      
      // Pause on hover if container exists
      if (this.container) {
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
      }
      
      // Responsive handling with debounce
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.itemsToShow = this.getItemsToShow();
          this.updateCarousel();
        }, 250);
      });
    }

    getItemsToShow() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    updateCarousel() {
      // Disable movement if not enough items
      if (this.items.length <= this.itemsToShow) {
        this.track.style.transform = 'translateX(0)';
        this.stopAutoPlay();
        return;
      }
      
      // Calculate and apply new position
      const itemWidth = 100 / this.itemsToShow;
      const translateX = -(this.currentIndex * itemWidth);
      this.track.style.transform = `translateX(${translateX}%)`;
    }

    slideNext() {
      if (this.items.length <= this.itemsToShow) return;
      this.currentIndex = (this.currentIndex + 1) % this.items.length;
      this.updateCarousel();
    }

    slidePrev() {
      if (this.items.length <= this.itemsToShow) return;
      this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
      this.updateCarousel();
    }

    startAutoPlay() {
      this.stopAutoPlay(); // Clear existing interval
      if (this.items.length > this.itemsToShow) {
        this.autoPlayInterval = setInterval(
          () => this.slideNext(), 
          this.autoPlayDelay
        );
      }
    }

    stopAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    }
  }

  // Initialize Testimonials Carousel
  new Carousel({
    trackId: 'testimonialTrack',
    prevBtnId: 'prevBtn',
    nextBtnId: 'nextBtn',
    itemSelector: '.testimonial-item',
    containerSelector: '.testimonials-carousel',
    autoPlayDelay: 5000
  });

  // Initialize Services Carousel
  new Carousel({
    trackId: 'servicesTrack',
    prevBtnId: 'servicesPrevBtn',
    nextBtnId: 'servicesNextBtn',
    itemSelector: '.service-item',
    containerSelector: '.services-carousel',
    autoPlayDelay: 6000
  });
});