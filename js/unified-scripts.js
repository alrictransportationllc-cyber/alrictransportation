// Alric Transportation - Unified JavaScript (Cleaned & Debugged)
// Firebase Configuration - Using CDN imports

const firebaseConfig = {
  apiKey: "AIzaSyAa_GIteOi3r4GtdL8mFD7TkrOr1fE6GdE",
  authDomain: "alrictransportation.firebaseapp.com",
  projectId: "alrictransportation",
  storageBucket: "alrictransportation.firebasestorage.app",
  messagingSenderId: "257683950593",
  appId: "1:257683950593:web:8e84e6599a517f9c284400",
  measurementId: "G-P8EDVYFFJD"
};

// Global Variables
let currentRating = 0;
let app, db, analytics;

// Initialize Firebase when the script loads
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            app = firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            if (firebase.analytics) {
                analytics = firebase.analytics();
            }
            console.log('Firebase initialized successfully');
            return true;
        } else {
            console.warn('Firebase not loaded, using fallback functionality');
            return false;
        }
    } catch (error) {
        console.warn('Firebase initialization failed, using fallback:', error);
        return false;
    }
}

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupScrollAnimations();
    setupHeaderScrollEffect();
    setupFormHandlers();
    setupRatingSystem();
    setupSearchAndFilter();
    setupTrackingSystem();
    setupMobileOptimizations();
}

// Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all animation elements
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        observer.observe(el);
    });

    // Counter animation for statistics
    const counterObserver = new IntersectionObserver(animateCounters, observerOptions);
    document.querySelectorAll('.stat-number').forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Animate Counters
function animateCounters(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
            let count = 0;
            const increment = target / 100;
            
            const updateCount = () => {
                if (count < target) {
                    count += increment;
                    const suffix = counter.textContent.match(/[^\d]/g) ? counter.textContent.match(/[^\d]/g).join('') : '';
                    counter.textContent = Math.floor(count) + suffix;
                    requestAnimationFrame(updateCount);
                } else {
                    counter.textContent = counter.textContent;
                }
            };
            
            updateCount();
            observer.unobserve(counter);
        }
    });
}

// Header Scroll Effect
function setupHeaderScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'linear-gradient(135deg, var(--white) 0%, var(--light-gray) 100%)';
            header.style.backdropFilter = 'none';
        }
    });
}

// Form Handlers
function setupFormHandlers() {
    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Application Form
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationForm);
    }

    // Review Form
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewForm);
    }

    // Real-time validation
    setupRealTimeValidation();
}

// Handle Contact Form Submission
async function handleContactForm(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }

    const formData = new FormData(e.target);
    const contactData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        serviceNeeded: formData.get('serviceNeeded') || '',
        urgency: formData.get('urgency') || '',
        message: formData.get('message') || '',
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
        type: 'contact_inquiry'
    };

    try {
        if (db && db.collection) {
            await db.collection('contacts').add(contactData);
            console.log('Contact form submitted to Firebase');
        } else {
            // Fallback - log to console for development
            console.log('Contact form data (Firebase unavailable):', contactData);
        }
        
        showSuccessMessage('contactSuccess', 'Thank you! We\'ll get back to you within 2 hours.');
        e.target.reset();
        
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showErrorMessage('Failed to submit form. Please try again or call us directly.');
    }
}

// Handle Application Form Submission
async function handleApplicationForm(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }

    const formData = new FormData(e.target);
    const trackingId = `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const applicationData = {
        firstName: formData.get('appFirstName'),
        lastName: formData.get('appLastName'),
        phone: formData.get('appPhone'),
        email: formData.get('appEmail'),
        address: formData.get('address'),
        dateOfBirth: formData.get('dateOfBirth') || '',
        emergencyContact: formData.get('emergencyContact') || '',
        primaryService: formData.get('primaryService'),
        frequency: formData.get('frequency') || '',
        medicalNeeds: formData.get('medicalNeeds') || '',
        insurance: formData.get('insurance') || '',
        consent: formData.get('consent') === 'on',
        terms: formData.get('terms') === 'on',
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
        type: 'service_application',
        status: 'pending',
        trackingId: trackingId
    };

    try {
        if (db && db.collection) {
            await db.collection('applications').add(applicationData);
            console.log('Application submitted to Firebase');
        } else {
            console.log('Application data (Firebase unavailable):', applicationData);
        }
        
        showSuccessMessage('applicationSuccess', `Application submitted! We'll contact you within 24 hours. Your tracking ID is: ${trackingId}`);
        e.target.reset();
        
    } catch (error) {
        console.error('Error submitting application:', error);
        showErrorMessage('Failed to submit application. Please try again or call us directly.');
    }
}

// Handle Review Form Submission
async function handleReviewForm(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }

    const formData = new FormData(e.target);
    const reviewData = {
        customerName: formData.get('customerName'),
        serviceUsed: formData.get('serviceUsed'),
        rating: parseInt(formData.get('rating')),
        reviewText: formData.get('reviewText'),
        customerEmail: formData.get('customerEmail') || '',
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
        approved: false
    };

    try {
        if (db && db.collection) {
            await db.collection('reviews').add(reviewData);
            console.log('Review submitted to Firebase');
        } else {
            console.log('Review data (Firebase unavailable):', reviewData);
        }
        
        showSuccessMessage('reviewSuccess', 'Thank you for your review! Your feedback helps us improve our services.');
        e.target.reset();
        resetRatingSystem();
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showErrorMessage('Failed to submit review. Please try again.');
    }
}

// Form Validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#28a745';
        }
    });
    
    return isValid;
}

// Real-time Validation
function setupRealTimeValidation() {
    document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
        
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#28a745';
            }
        });
    });
}

// Rating System
function setupRatingSystem() {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    
    if (!stars.length || !ratingValue) return;
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            currentRating = rating;
            ratingValue.value = rating;
            updateStars(rating);
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            updateStars(rating);
        });
    });
    
    const ratingContainer = document.getElementById('rating');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', function() {
            updateStars(currentRating);
        });
    }
}

// Update Stars Display
function updateStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Reset Rating System
function resetRatingSystem() {
    currentRating = 0;
    const ratingValue = document.getElementById('ratingValue');
    if (ratingValue) ratingValue.value = '';
    updateStars(0);
}

// FAQ Search and Filter
function setupSearchAndFilter() {
    // FAQ Search
    const faqSearch = document.getElementById('faqSearch');
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqItems.forEach(item => {
                const questionElement = item.querySelector('.faq-question span');
                const answerElement = item.querySelector('.faq-answer');
                
                if (!questionElement || !answerElement) return;
                
                const question = questionElement.textContent.toLowerCase();
                const answer = answerElement.textContent.toLowerCase();
                
                if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = 'block';
                    const section = item.closest('.faq-section');
                    if (section) section.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Reset category filter when searching
            if (searchTerm) {
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                const allBtn = document.querySelector('.category-btn[data-category="all"]');
                if (allBtn) allBtn.classList.add('active');
            }
        });
    }

    // Category Filtering
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            const sections = document.querySelectorAll('.faq-section');
            
            sections.forEach(section => {
                if (category === 'all' || section.dataset.category === category) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
            
            // Clear search when filtering by category
            const faqSearch = document.getElementById('faqSearch');
            if (faqSearch) faqSearch.value = '';
        });
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');
            
            // Close all other FAQs
            document.querySelectorAll('.faq-question').forEach(q => {
                if (q !== this) {
                    q.classList.remove('active');
                    q.nextElementSibling.classList.remove('active');
                    const qIcon = q.querySelector('.faq-icon');
                    if (qIcon) qIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle current FAQ
            this.classList.toggle('active');
            answer.classList.toggle('active');
            if (icon) {
                icon.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    });
}

// Tracking System
function setupTrackingSystem() {
    const trackingInput = document.getElementById('trackingInput');
    if (trackingInput) {
        trackingInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackService();
            }
        });
    }
}

// Track Service Function
async function trackService() {
    const trackingInput = document.getElementById('trackingInput');
    const trackingResults = document.getElementById('trackingResults');
    const errorMessage = document.getElementById('errorMessage');
    const displayTrackingId = document.getElementById('displayTrackingId');
    
    if (!trackingInput || !trackingResults || !errorMessage) {
        console.error('Required tracking elements not found');
        return;
    }
    
    const inputValue = trackingInput.value.trim();
    
    if (!inputValue) {
        showTrackingError('Please enter a tracking ID, booking reference, or phone number.');
        return;
    }

    try {
        let found = false;
        
        if (db && db.collection) {
            // Try to search Firebase
            const applicationsRef = db.collection('applications');
            
            // Search by tracking ID
            const trackingQuery = applicationsRef.where('trackingId', '==', inputValue.toUpperCase());
            const trackingSnapshot = await trackingQuery.get();
            
            if (!trackingSnapshot.empty) {
                const doc = trackingSnapshot.docs[0];
                const data = doc.data();
                found = true;
                
                displayTrackingResults(data, inputValue.toUpperCase());
            } else {
                // Search by phone number (try with and without formatting)
                const cleanPhone = inputValue.replace(/\D/g, '');
                const phoneQueries = [
                    applicationsRef.where('phone', '==', inputValue),
                    applicationsRef.where('phone', '==', cleanPhone)
                ];
                
                for (const phoneQuery of phoneQueries) {
                    const phoneSnapshot = await phoneQuery.get();
                    if (!phoneSnapshot.empty) {
                        const doc = phoneSnapshot.docs[0];
                        const data = doc.data();
                        found = true;
                        
                        displayTrackingResults(data, data.trackingId || 'Phone lookup');
                        break;
                    }
                }
            }
        }
        
        if (!found) {
            // Demo fallback for testing
            const testIds = ['AT-2025-001234', 'BK-MD-567890'];
            const testPhones = ['5551234567', '(555) 123-4567'];
            
            if (testIds.some(id => inputValue.toUpperCase().includes(id)) ||
                testPhones.some(phone => inputValue.includes(phone) || inputValue.replace(/\D/g, '').includes(phone.replace(/\D/g, '')))) {
                
                const demoData = {
                    status: 'pending',
                    firstName: 'Demo',
                    lastName: 'User',
                    primaryService: 'Medical Transport',
                    timestamp: new Date()
                };
                
                displayTrackingResults(demoData, inputValue.toUpperCase());
            } else {
                showTrackingError('Tracking ID not found. Please check your information and try again.');
            }
        }
        
    } catch (error) {
        console.error('Error tracking service:', error);
        showTrackingError('Unable to track service at this time. Please try again later.');
    }
}

// Display Tracking Results
function displayTrackingResults(data, displayId) {
    const trackingResults = document.getElementById('trackingResults');
    const errorMessage = document.getElementById('errorMessage');
    const displayTrackingId = document.getElementById('displayTrackingId');
    
    if (displayTrackingId) {
        displayTrackingId.textContent = displayId;
    }
    
    errorMessage.classList.remove('show');
    trackingResults.classList.add('show');
    trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    updateTrackingDisplay(data);
}

// Update Tracking Display
function updateTrackingDisplay(data) {
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (statusIndicator) {
        const status = data.status || 'pending';
        const statusText = getStatusText(status);
        
        statusIndicator.className = `status-indicator status-${status}`;
        statusIndicator.textContent = statusText;
    }
    
    updateTimelineStatus(data.status || 'pending');
}

// Get Status Text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Application Under Review',
        'approved': 'Service Approved',
        'dispatched': 'Vehicle Dispatched',
        'enroute': 'En Route to Pickup',
        'arrived': 'Arrived at Pickup',
        'intransit': 'En Route to Destination',
        'completed': 'Service Completed',
        'cancelled': 'Service Cancelled'
    };
    
    return statusMap[status] || 'Status Unknown';
}

// Update Timeline Status
function updateTimelineStatus(status) {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
        item.classList.remove('active', 'completed');
    });
    
    const statusMap = {
        'pending': 0,
        'approved': 1,
        'dispatched': 2,
        'enroute': 3,
        'arrived': 4,
        'intransit': 5,
        'completed': 6
    };
    
    const currentStep = statusMap[status] || 0;
    
    timelineItems.forEach((item, index) => {
        if (index < currentStep) {
            item.classList.add('completed');
        } else if (index === currentStep) {
            item.classList.add('active');
        }
    });
}

// Show Tracking Error
function showTrackingError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const trackingResults = document.getElementById('trackingResults');
    
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => errorMessage.classList.remove('show'), 5000);
    }
    
    if (trackingResults) {
        trackingResults.classList.remove('show');
    }
}

// Mobile Optimizations
function setupMobileOptimizations() {
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
    
    // Prevent zoom on input focus for iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.style.fontSize = '16px';
            });
            input.addEventListener('blur', function() {
                this.style.fontSize = '';
            });
        });
    }
    
    setupMobileMenu();
}

// Mobile Menu Setup (Single, cleaned version)
function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileToggle || !navLinks) {
        console.log('Mobile menu elements not found - creating fallback for small screens');
        
        // Create mobile menu toggle if it doesn't exist and we're on mobile
        if (window.innerWidth <= 768) {
            const nav = document.querySelector('nav');
            const existingNavLinks = nav?.querySelector('.nav-links');
            
            if (nav && existingNavLinks && !nav.querySelector('.mobile-menu-toggle')) {
                const toggle = document.createElement('button');
                toggle.className = 'mobile-menu-toggle';
                toggle.innerHTML = '☰';
                toggle.setAttribute('aria-label', 'Toggle mobile menu');
                
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    existingNavLinks.classList.toggle('mobile-open');
                    this.classList.toggle('open');
                });
                
                nav.appendChild(toggle);
            }
        }
        return;
    }
    
    // Toggle mobile menu
    mobileToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        navLinks.classList.toggle('mobile-open');
        this.classList.toggle('open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('mobile-open');
            mobileToggle.classList.remove('open');
        }
    });
    
    // Close menu when clicking on a nav link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('mobile-open');
            mobileToggle.classList.remove('open');
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('mobile-open');
            mobileToggle.classList.remove('open');
        }
    });
}

// Utility Functions
function showSuccessMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 5000);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Global functions for HTML onclick attributes
window.trackService = trackService;
