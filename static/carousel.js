// carousel.js - Enhanced with Demo Carousel, Video Support, and Visibility Tracking
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
      this.isSingleItem = config.singleItem || false;
      this.autoPlayVideos = config.autoPlayVideos || false;
      this.itemsToShow = this.isSingleItem ? 1 : this.getItemsToShow();
      this.currentIndex = 0;
      this.autoPlayInterval = null;
      this.resizeTimeout = null;
      this.isVideoPlaying = false;
      
      // Visibility tracking
      this.isVisible = true;
      this.isInViewport = true;
      this.observer = null;

      // Initialize if valid
      if (this.track && this.prevBtn && this.nextBtn && this.items.length > 0) {
        this.init();
        this.setupVisibilityTracking();
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
      
      // Video event listeners if this is a single item carousel
      if (this.isSingleItem) {
        this.setupVideoListeners();
      }
      
      // Auto-play setup
      this.startAutoPlay();
      
      // Pause on hover if container exists
      if (this.container) {
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.updateAutoPlayState());
      }
      
      // Responsive handling with debounce (only for multi-item carousels)
      if (!this.isSingleItem) {
        window.addEventListener('resize', () => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.itemsToShow = this.getItemsToShow();
            // Reset to valid index after resize
            this.currentIndex = Math.min(this.currentIndex, this.getMaxIndex());
            this.updateCarousel();
          }, 250);
        });
      }
    }

    setupVisibilityTracking() {
      // Track document visibility (tab switching)
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        this.updateAutoPlayState();
      });

      // Track viewport visibility (scrolling)
      if ('IntersectionObserver' in window && this.container) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isInViewport = entry.isIntersecting;
            this.updateAutoPlayState();
          });
        }, { threshold: 0.1 });
        
        this.observer.observe(this.container);
      }
    }

    updateAutoPlayState() {
      if (this.isVisible && this.isInViewport && !this.isVideoPlaying) {
        if (!this.container || !this.container.matches(':hover')) {
          this.startAutoPlay();
        }
      } else {
        this.stopAutoPlay();
      }
    }

    setupVideoListeners() {
      // Add event listeners to all videos in the carousel
      this.items.forEach((item, index) => {
        const video = item.querySelector('video');
        if (video) {
          // When video starts playing
          video.addEventListener('play', () => {
            if (index === this.currentIndex) {
              this.isVideoPlaying = true;
              this.stopAutoPlay();
            }
          });

          // When video ends
          video.addEventListener('ended', () => {
            if (index === this.currentIndex) {
              this.isVideoPlaying = false;
              this.updateAutoPlayState();
            }
          });

          // When video is paused
          video.addEventListener('pause', () => {
            if (index === this.currentIndex) {
              this.isVideoPlaying = false;
              this.updateAutoPlayState();
            }
          });
        }
      });
    }

    getItemsToShow() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    getMaxIndex() {
      // Maximum index where we can still show itemsToShow complete items
      return Math.max(0, this.items.length - this.itemsToShow);
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

      // Handle video state changes for single item carousels
      if (this.isSingleItem) {
        this.handleVideoStateChange();
      }
    }

    handleVideoStateChange() {
      // Pause all videos except the current one
      this.items.forEach((item, index) => {
        const video = item.querySelector('video');
        if (video && index !== this.currentIndex) {
          video.pause();
        }
      });

      // Check if current item has a video and update auto-play accordingly
      const currentItem = this.items[this.currentIndex];
      const currentVideo = currentItem?.querySelector('video');
      
      // Auto-play current video if it exists and autoPlayVideos is enabled
      if (this.autoPlayVideos && currentVideo) {
        currentVideo.play().catch(e => console.log('Autoplay failed:', e));
      }
      
      if (currentVideo && !currentVideo.paused) {
        this.isVideoPlaying = true;
        this.stopAutoPlay();
      } else {
        this.isVideoPlaying = false;
        this.updateAutoPlayState();
      }
    }

    slideNext() {
      if (this.items.length <= this.itemsToShow) return;
      
      const maxIndex = this.getMaxIndex();
      
      if (this.currentIndex >= maxIndex) {
        // At the last valid position, wrap to beginning
        this.currentIndex = 0;
      } else {
        // Normal increment
        this.currentIndex++;
      }
      
      this.updateCarousel();
    }

    slidePrev() {
      if (this.items.length <= this.itemsToShow) return;
      
      const maxIndex = this.getMaxIndex();
      
      if (this.currentIndex <= 0) {
        // At the beginning, wrap to last valid position
        this.currentIndex = maxIndex;
      } else {
        // Normal decrement
        this.currentIndex--;
      }
      
      this.updateCarousel();
    }

    startAutoPlay() {
      this.stopAutoPlay(); // Clear existing interval
      
      // Don't start auto-play if not visible, video playing, or not enough items
      if (!this.isVisible || !this.isInViewport || this.isVideoPlaying || this.items.length <= this.itemsToShow) {
        return;
      }
      
      this.autoPlayInterval = setInterval(
        () => this.slideNext(), 
        this.autoPlayDelay
      );
    }

    stopAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    }

    // Cleanup method for proper disposal
    destroy() {
      this.stopAutoPlay();
      if (this.observer) {
        this.observer.disconnect();
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

  // Initialize Demo Carousel (Single Item with Video Support)
  new Carousel({
    trackId: 'demoTrack',
    prevBtnId: 'demoPrevBtn',
    nextBtnId: 'demoNextBtn',
    itemSelector: '.demo-item',
    containerSelector: '.demo-carousel',
    autoPlayDelay: 4000,
    singleItem: true,
    autoPlayVideos: true
  });

  new Carousel({
      trackId: 'capabilityTrack',
      prevBtnId: 'capabilityPrevBtn',
      nextBtnId: 'capabilityNextBtn',
      itemSelector: '.testimonial-item',
      containerSelector: '.capability-carousel',
      autoPlayDelay: 5000
  });

  new Carousel({
      trackId: 'valueTrack',
      prevBtnId: 'valuePrevBtn',
      nextBtnId: 'valueNextBtn',
      itemSelector: '.testimonial-item',
      containerSelector: '.value-carousel',
      autoPlayDelay: 6000
  });
});
