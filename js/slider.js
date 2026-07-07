/* Swiper Initialization Module */

/**
 * Initializes Swiper carousels.
 */
export function initSliders() {
  // Hero Slider
  const heroSwiperElement = document.querySelector('.hero-swiper');
  if (heroSwiperElement && typeof Swiper !== 'undefined') {
    new Swiper('.hero-swiper', {
      loop: true,
      effect: 'slide',
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.hero-swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.hero-swiper-button-next',
        prevEl: '.hero-swiper-button-prev',
      },
      speed: 800,
    });
  }

  // Testimonial / Customer Review Slider
  const testimonialElement = document.querySelector('.testimonial-swiper');
  if (testimonialElement && typeof Swiper !== 'undefined') {
    new Swiper('.testimonial-swiper', {
      loop: true,
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.testimonial-swiper-pagination',
        clickable: true,
      },
      slidesPerView: 1,
      spaceBetween: 24,
      breakpoints: {
        // Mobile Landscape
        576: {
          slidesPerView: 1.5,
          spaceBetween: 16,
        },
        // Tablet Portrait
        768: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        // Desktop
        992: {
          slidesPerView: 3,
          spaceBetween: 24,
        }
      },
      speed: 600,
    });
  }
}
