// Alric Transportation - Unified JavaScript
// Firebase Configuration - Using CDN imports instead of modules

// Firebase will be loaded via CDN in HTML, so we reference the global objects
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
        } else {
            console.warn('Firebase not loaded, using fallback functionality');
        }
    } catch (error) {
        console.warn('Firebase initialization failed, using fallback:', error);
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
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date(),
        type: 'contact_inquiry'
    };

    try {
        if (db && db.collection) {
            await db.collection('contacts').add(contactData);
            console.log('Contact form submitted to Firebase');
        } else {
            // Fallback - log to console or send to alternative endpoint
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
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date(),
        type: 'service_application',
        status: 'pending'
    };

    try {
        let trackingId = `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        applicationData.trackingId = trackingId;
        
        if (db && db.collection) {
            await db.collection('applications').add(applicationData);
            console.log('Application submitted to Firebase');
        } else {
            console.log('Application data (Firebase unavailable):', applicationData);
        }
        
        showSuccessMessage('applicationSuccess', 'Application submitted! We\'ll contact you within 24 hours. Your tracking ID is: ' + trackingId);
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
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date(),
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
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                
                if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = 'block';
                    const section = item.closest('.faq-section');
                    if (section) section.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
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
    
    if (!trackingInput || !trackingResults || !errorMessage) return;
    
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
                
                if (displayTrackingId) {
                    displayTrackingId.textContent = data.trackingId;
                }
                
                errorMessage.classList.remove('show');
                trackingResults.classList.add('show');
                trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                updateTrackingDisplay(data);
            } else {
                // Search by phone number
                const phoneQuery = applicationsRef.where('phone', '==', inputValue);
                const phoneSnapshot = await phoneQuery.get();
                
                if (!phoneSnapshot.empty) {
                    const doc = phoneSnapshot.docs[0];
                    const data = doc.data();
                    found = true;
                    
                    if (displayTrackingId) {
                        displayTrackingId.textContent = data.trackingId || 'Phone lookup';
                    }
                    
                    errorMessage.classList.remove('show');
                    trackingResults.classList.add('show');
                    trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    updateTrackingDisplay(data);
                }
            }
        }
        
        if (!found) {
            // Fallback demo for testing
            const testIds = ['AT-2025-001234', 'BK-MD-567890', '(555) 123-4567', '5551234567'];
            if (testIds.some(id => inputValue.toLowerCase().includes(id.toLowerCase()))) {
                if (displayTrackingId) {
                    displayTrackingId.textContent = inputValue.toUpperCase();
                }
                
                errorMessage.classList.remove('show');
                trackingResults.classList.add('show');
                trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                updateTrackingDisplay({ status: 'pending' });
            } else {
                showTrackingError('Tracking ID not found. Please check your information and try again.');
            }
        }
        
    } catch (error) {
        console.error('Error tracking service:', error);
        showTrackingError('Unable to track service at this time. Please try again later.');
    }
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

// Mobile Menu Setup
function setupMobileMenu() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    if (window.innerWidth <= 768) {
        const navLinks = nav.querySelector('.nav-links');
        if (navLinks && !nav.querySelector('.mobile-menu-toggle')) {
            const toggle = document.createElement('button');
            toggle.className = 'mobile-menu-toggle';
            toggle.innerHTML = '☰';
            toggle.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-open');
            });
            nav.appendChild(toggle);
        }
    }
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

// Global function for tracking (called from HTML onclick)
window.trackService = trackService;
