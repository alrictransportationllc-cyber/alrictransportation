// Alric Transportation - Enhanced Real-Time Tracking System
// Fixed version - prevents blank pages and improves reliability
// Mobile nav conflict removed - relies on separate mobile-nav.js

const firebaseConfig = {
  apiKey: "AIzaSyAa_GIteOi3r4GtdL8mFD7TkrOr1fE6GdE",
  authDomain: "alrictransportation.firebaseapp.com",
  projectId: "alrictransportation",
  storageBucket: "alrictransportation.firebasestorage.app",
  messagingSenderId: "257683950593",
  appId: "1:257683950593:web:8e84e6599a517f9c284400",
  measurementId: "G-P8EDVYFFJD",
  databaseURL: "https://alrictransportation-default-rtdb.firebaseio.com/"
};

// Global Variables
let currentRating = 0;
let app, db, realtimeDb, analytics;
let currentTrackingRef = null;
let firebaseReady = false;
let initializationComplete = false;

// Safe DOM element getter with error handling
function safeGetElement(id) {
    try {
        return document.getElementById(id);
    } catch (error) {
        console.warn(`Element ${id} not found:`, error);
        return null;
    }
}

// Safe querySelector with error handling
function safeQuerySelector(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn(`Selector ${selector} failed:`, error);
        return null;
    }
}

// Safe querySelectorAll with error handling
function safeQuerySelectorAll(selector) {
    try {
        return document.querySelectorAll(selector);
    } catch (error) {
        console.warn(`Selector ${selector} failed:`, error);
        return [];
    }
}

// Initialize Firebase with timeout and fallback
function initializeFirebase() {
    return new Promise((resolve) => {
        try {
            // Check if Firebase is available
            if (typeof firebase === 'undefined') {
                console.warn('Firebase not available - running in offline mode');
                resolve(false);
                return;
            }

            // Check required Firebase components
            if (!firebase.apps || !firebase.firestore) {
                console.warn('Firebase components not fully loaded - running in offline mode');
                resolve(false);
                return;
            }

            // Initialize Firebase app
            if (firebase.apps.length === 0) {
                app = firebase.initializeApp(firebaseConfig);
            } else {
                app = firebase.apps[0];
            }
            
            // Initialize Firestore
            db = firebase.firestore();
            
            // Initialize Realtime Database if available
            if (firebase.database) {
                realtimeDb = firebase.database();
            }
            
            // Initialize Analytics if available
            if (firebase.analytics && typeof firebase.analytics === 'function') {
                try {
                    analytics = firebase.analytics();
                } catch (analyticsError) {
                    console.log('Analytics not available:', analyticsError.message);
                }
            }
            
            console.log('Firebase initialized successfully');
            firebaseReady = true;
            resolve(true);
            
        } catch (error) {
            console.warn('Firebase initialization failed, running in offline mode:', error);
            resolve(false);
        }
    });
}

// Wait for Firebase with maximum timeout
async function waitForFirebase() {
    const maxWaitTime = 5000; // 5 seconds max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.firestore) {
            const success = await initializeFirebase();
            if (success) return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('Firebase failed to load within timeout - continuing without Firebase');
    return false;
}

// Main initialization function
async function initializeApp() {
    // Prevent multiple initializations
    if (initializationComplete) {
        return;
    }
    
    try {
        console.log('Starting app initialization...');
        
        // Initialize Firebase (non-blocking)
        waitForFirebase().catch(error => {
            console.warn('Firebase initialization error:', error);
        });
        
        // Detect current page
        const currentPage = detectCurrentPage();
        console.log('Current page detected:', currentPage);
        
        // Always setup these universal features first
        setupScrollAnimations();
        setupHeaderScrollEffect();
        // NOTE: Mobile optimizations removed to prevent conflict with mobile-nav.js
        
        // Page-specific initialization with error handling
        try {
            switch(currentPage) {
                case 'track':
                    setupTrackingSystem();
                    break;
                case 'contact':
                case 'services':
                case 'application':
                    setupFormHandlers();
                    setupRatingSystem();
                    break;
                case 'faq':
                    setupSearchAndFilter();
                    break;
                default:
                    setupBasicFormHandlers();
                    break;
            }
        } catch (pageError) {
            console.error('Page-specific initialization error:', pageError);
            // Continue with basic functionality even if page-specific features fail
        }
        
        initializationComplete = true;
        console.log('App initialization completed');
        
    } catch (error) {
        console.error('Critical initialization error:', error);
        // Ensure basic page functionality works even if initialization fails
        setupBasicFallbacks();
    }
}

// Setup basic fallbacks if main initialization fails
function setupBasicFallbacks() {
    try {
        // Ensure forms work at minimum
        const forms = safeQuerySelectorAll('form');
        forms.forEach(form => {
            if (!form.hasAttribute('data-fallback-setup')) {
                form.addEventListener('submit', function(e) {
                    console.log('Form submitted (fallback mode):', e.target.id || 'unnamed form');
                });
                form.setAttribute('data-fallback-setup', 'true');
            }
        });
        
    } catch (error) {
        console.error('Even fallback setup failed:', error);
    }
}

// Detect current page based on URL and content
function detectCurrentPage() {
    try {
        const path = window.location.pathname.toLowerCase();
        const filename = path.split('/').pop().replace('.html', '') || 'index';
        
        // Check for specific page indicators with safe element checking
        if (filename.includes('track') || safeGetElement('trackingInput')) {
            return 'track';
        } else if (filename.includes('contact') || safeGetElement('contactForm')) {
            return 'contact';
        } else if (filename.includes('services') || safeGetElement('applicationForm')) {
            return 'services';
        } else if (filename.includes('faq') || safeGetElement('faqSearch')) {
            return 'faq';
        } else if (safeGetElement('reviewForm')) {
            return 'review';
        }
        
        return filename || 'index';
    } catch (error) {
        console.warn('Page detection failed:', error);
        return 'unknown';
    }
}

// Scroll Animations with error handling
function setupScrollAnimations() {
    try {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                try {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                } catch (error) {
                    console.warn('Scroll animation error:', error);
                }
            });
        }, observerOptions);

        const animatedElements = safeQuerySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        animatedElements.forEach(el => {
            try {
                observer.observe(el);
            } catch (error) {
                console.warn('Failed to observe element:', error);
            }
        });

        // Counter animation
        const counterObserver = new IntersectionObserver(animateCounters, observerOptions);
        const counters = safeQuerySelectorAll('.stat-number');
        counters.forEach(counter => {
            try {
                counterObserver.observe(counter);
            } catch (error) {
                console.warn('Failed to observe counter:', error);
            }
        });
    } catch (error) {
        console.warn('Scroll animations setup failed:', error);
    }
}

// Animate Counters with error handling
function animateCounters(entries, observer) {
    entries.forEach(entry => {
        try {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
                
                if (isNaN(target)) return;
                
                let count = 0;
                const increment = target / 100;
                
                const updateCount = () => {
                    try {
                        if (count < target) {
                            count += increment;
                            const suffix = counter.textContent.match(/[^\d]/g) ? counter.textContent.match(/[^\d]/g).join('') : '';
                            counter.textContent = Math.floor(count) + suffix;
                            requestAnimationFrame(updateCount);
                        } else {
                            counter.textContent = counter.textContent;
                        }
                    } catch (error) {
                        console.warn('Counter animation error:', error);
                    }
                };
                
                updateCount();
                observer.unobserve(counter);
            }
        } catch (error) {
            console.warn('Counter animation entry error:', error);
        }
    });
}

// Header Scroll Effect with error handling
function setupHeaderScrollEffect() {
    try {
        const header = safeQuerySelector('header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            try {
                if (window.scrollY > 100) {
                    header.style.background = 'rgba(255, 255, 255, 0.95)';
                    header.style.backdropFilter = 'blur(10px)';
                } else {
                    header.style.background = 'linear-gradient(135deg, var(--white) 0%, var(--light-gray) 100%)';
                    header.style.backdropFilter = 'none';
                }
            } catch (error) {
                console.warn('Header scroll effect error:', error);
            }
        });
    } catch (error) {
        console.warn('Header scroll effect setup failed:', error);
    }
}

// Basic form handlers
function setupBasicFormHandlers() {
    try {
        const contactForm = safeGetElement('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactForm);
        }

        const applicationForm = safeGetElement('applicationForm');
        if (applicationForm) {
            applicationForm.addEventListener('submit', handleApplicationForm);
        }

        const reviewForm = safeGetElement('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', handleReviewForm);
        }

        setupRealTimeValidation();
    } catch (error) {
        console.warn('Basic form handlers setup failed:', error);
    }
}

// Enhanced form handlers
function setupFormHandlers() {
    setupBasicFormHandlers();
}

// Handle Contact Form Submission
async function handleContactForm(e) {
    e.preventDefault();
    
    try {
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
            timestamp: firebaseReady && db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
            type: 'contact_inquiry'
        };

        if (firebaseReady && db && db.collection) {
            await db.collection('contacts').add(contactData);
            console.log('Contact form submitted to Firebase');
        } else {
            console.log('Contact form data (offline mode):', contactData);
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
    
    try {
        if (!validateForm(e.target)) {
            return;
        }

        const formData = new FormData(e.target);
        const trackingId = `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        const applicationData = {
            trackingId: trackingId,
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
            timestamp: firebaseReady && db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
            type: 'service_application',
            status: 'pending',
            assignedDriverId: null,
            createdAt: new Date().toISOString()
        };

        if (firebaseReady && db && db.collection) {
            await db.collection('applications').add(applicationData);
            console.log('Application submitted to Firebase');
            
            // Create initial tracking record
            await createTrackingRecord(applicationData);
        } else {
            console.log('Application data (offline mode):', applicationData);
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
    
    try {
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
            timestamp: firebaseReady && db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
            approved: false
        };

        if (firebaseReady && db && db.collection) {
            await db.collection('reviews').add(reviewData);
            console.log('Review submitted to Firebase');
        } else {
            console.log('Review data (offline mode):', reviewData);
        }
        
        showSuccessMessage('reviewSuccess', 'Thank you for your review! Your feedback helps us improve our services.');
        e.target.reset();
        resetRatingSystem();
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showErrorMessage('Failed to submit review. Please try again.');
    }
}

// Create initial tracking record
async function createTrackingRecord(applicationData) {
    if (!firebaseReady || !realtimeDb) return;
    
    try {
        const trackingId = applicationData.trackingId;
        
        const initialTrackingData = {
            trackingId: trackingId,
            status: 'pending',
            customer: {
                name: `${applicationData.firstName} ${applicationData.lastName}`,
                phone: applicationData.phone,
                email: applicationData.email
            },
            service: {
                type: applicationData.primaryService,
                medicalNeeds: applicationData.medicalNeeds || '',
                pickupAddress: applicationData.address
            },
            timeline: {
                booked: {
                    time: new Date().toISOString(),
                    completed: true
                },
                driverAssigned: { completed: false },
                dispatched: { completed: false },
                enroute: { completed: false },
                arrived: { completed: false },
                intransit: { completed: false },
                completed: { completed: false }
            },
            messages: {},
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        };
        
        await realtimeDb.ref(`live_tracking/${trackingId}`).set(initialTrackingData);
        console.log(`Tracking record created for ${trackingId}`);
    } catch (error) {
        console.error('Error creating tracking record:', error);
    }
}

// Form Validation
function validateForm(form) {
    try {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            try {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#28a745';
                }
            } catch (error) {
                console.warn('Field validation error:', error);
            }
        });
        
        return isValid;
    } catch (error) {
        console.warn('Form validation failed:', error);
        return true; // Allow submission if validation fails
    }
}

// Real-time Validation
function setupRealTimeValidation() {
    try {
        const fields = safeQuerySelectorAll('input[required], select[required], textarea[required]');
        fields.forEach(field => {
            try {
                field.addEventListener('blur', function() {
                    try {
                        if (!this.value.trim()) {
                            this.style.borderColor = '#dc3545';
                        } else {
                            this.style.borderColor = '#28a745';
                        }
                    } catch (error) {
                        console.warn('Blur validation error:', error);
                    }
                });
                
                field.addEventListener('input', function() {
                    try {
                        if (this.value.trim()) {
                            this.style.borderColor = '#28a745';
                        }
                    } catch (error) {
                        console.warn('Input validation error:', error);
                    }
                });
            } catch (error) {
                console.warn('Failed to setup validation for field:', error);
            }
        });
    } catch (error) {
        console.warn('Real-time validation setup failed:', error);
    }
}

// Rating System
function setupRatingSystem() {
    try {
        const stars = safeQuerySelectorAll('.star');
        const ratingValue = safeGetElement('ratingValue');
        const ratingContainer = safeGetElement('rating');
        
        if (stars.length === 0 && !ratingValue && !ratingContainer) {
            return;
        }
        
        console.log('Setting up rating system');
        
        stars.forEach(star => {
            try {
                star.addEventListener('click', function() {
                    try {
                        const rating = parseInt(this.dataset.rating);
                        currentRating = rating;
                        if (ratingValue) ratingValue.value = rating;
                        updateStars(rating);
                    } catch (error) {
                        console.warn('Star click error:', error);
                    }
                });
                
                star.addEventListener('mouseover', function() {
                    try {
                        const rating = parseInt(this.dataset.rating);
                        updateStars(rating);
                    } catch (error) {
                        console.warn('Star mouseover error:', error);
                    }
                });
            } catch (error) {
                console.warn('Failed to setup star event:', error);
            }
        });
        
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseleave', function() {
                try {
                    updateStars(currentRating);
                } catch (error) {
                    console.warn('Rating container mouseleave error:', error);
                }
            });
        }
    } catch (error) {
        console.warn('Rating system setup failed:', error);
    }
}

// Update Stars Display
function updateStars(rating) {
    try {
        const stars = safeQuerySelectorAll('.star');
        stars.forEach((star, index) => {
            try {
                if (index < rating) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            } catch (error) {
                console.warn('Star update error:', error);
            }
        });
    } catch (error) {
        console.warn('Update stars failed:', error);
    }
}

// Reset Rating System
function resetRatingSystem() {
    try {
        currentRating = 0;
        const ratingValue = safeGetElement('ratingValue');
        if (ratingValue) ratingValue.value = '';
        updateStars(0);
    } catch (error) {
        console.warn('Reset rating system failed:', error);
    }
}

// FAQ Search and Filter
function setupSearchAndFilter() {
    try {
        const faqSearch = safeGetElement('faqSearch');
        const categoryButtons = safeQuerySelectorAll('.category-btn');
        const faqQuestions = safeQuerySelectorAll('.faq-question');
        
        if (!faqSearch && categoryButtons.length === 0 && faqQuestions.length === 0) {
            return;
        }
        
        console.log('Setting up FAQ search and filter system');
        
        // FAQ Search
        if (faqSearch) {
            faqSearch.addEventListener('input', function() {
                try {
                    const searchTerm = this.value.toLowerCase();
                    const faqItems = safeQuerySelectorAll('.faq-item');
                    
                    faqItems.forEach(item => {
                        try {
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
                        } catch (error) {
                            console.warn('FAQ item filter error:', error);
                        }
                    });
                    
                    if (searchTerm) {
                        categoryButtons.forEach(btn => {
                            try {
                                btn.classList.remove('active');
                            } catch (error) {
                                console.warn('Button class removal error:', error);
                            }
                        });
                        const allBtn = document.querySelector('.category-btn[data-category="all"]');
                        if (allBtn) allBtn.classList.add('active');
                    }
                } catch (error) {
                    console.warn('FAQ search error:', error);
                }
            });
        }

        // Category Filtering
        categoryButtons.forEach(btn => {
            try {
                btn.addEventListener('click', function() {
                    try {
                        categoryButtons.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        
                        const category = this.dataset.category;
                        const sections = safeQuerySelectorAll('.faq-section');
                        
                        sections.forEach(section => {
                            try {
                                if (category === 'all' || section.dataset.category === category) {
                                    section.style.display = 'block';
                                } else {
                                    section.style.display = 'none';
                                }
                            } catch (error) {
                                console.warn('Section display error:', error);
                            }
                        });
                        
                        if (faqSearch) faqSearch.value = '';
                    } catch (error) {
                        console.warn('Category button click error:', error);
                    }
                });
            } catch (error) {
                console.warn('Failed to setup category button:', error);
            }
        });

        // FAQ Accordion
        faqQuestions.forEach(question => {
            try {
                question.addEventListener('click', function() {
                    try {
                        const answer = this.nextElementSibling;
                        const icon = this.querySelector('.faq-icon');
                        
                        faqQuestions.forEach(q => {
                            try {
                                if (q !== this) {
                                    q.classList.remove('active');
                                    const qAnswer = q.nextElementSibling;
                                    if (qAnswer) qAnswer.classList.remove('active');
                                    const qIcon = q.querySelector('.faq-icon');
                                    if (qIcon) qIcon.style.transform = 'rotate(0deg)';
                                }
                            } catch (error) {
                                console.warn('FAQ question deactivation error:', error);
                            }
                        });
                        
                        this.classList.toggle('active');
                        if (answer) answer.classList.toggle('active');
                        if (icon) {
                            icon.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                        }
                    } catch (error) {
                        console.warn('FAQ question click error:', error);
                    }
                });
            } catch (error) {
                console.warn('Failed to setup FAQ question:', error);
            }
        });
    } catch (error) {
        console.warn('FAQ search and filter setup failed:', error);
    }
}

// Tracking System
function setupTrackingSystem() {
    try {
        const trackingInput = safeGetElement('trackingInput');
        if (!trackingInput) {
            return;
        }
        
        console.log('Setting up tracking system');
        
        trackingInput.addEventListener('keypress', function(e) {
            try {
                if (e.key === 'Enter') {
                    trackService();
                }
            } catch (error) {
                console.warn('Tracking input keypress error:', error);
            }
        });
        
        // Check for URL parameters
        setTimeout(checkForUrlTrackingId, 100);
    } catch (error) {
        console.warn('Tracking system setup failed:', error);
    }
}

// Check for tracking ID in URL parameters
function checkForUrlTrackingId() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const trackId = urlParams.get('track');
        
        if (trackId) {
            console.log('Auto-tracking from URL:', trackId);
            setTimeout(() => {
                const trackingInput = safeGetElement('trackingInput');
                if (trackingInput) {
                    trackingInput.value = trackId;
                    trackService();
                }
            }, 1000);
        }
    } catch (error) {
        console.warn('URL tracking check failed:', error);
    }
}

// Track Service with comprehensive error handling
async function trackService() {
    try {
        const trackingInput = safeGetElement('trackingInput');
        const trackingResults = safeGetElement('trackingResults');
        const errorMessage = safeGetElement('errorMessage');
        
        if (!trackingInput) {
            console.error('trackService called but tracking input not found');
            return;
        }
        
        if (!trackingResults || !errorMessage) {
            console.error('Required tracking elements not found');
            return;
        }
        
        const inputValue = trackingInput.value.trim();
        
        if (!inputValue) {
            showTrackingError('Please enter a tracking ID, booking reference, or phone number.');
            return;
        }

        // Stop any existing tracking
        stopRealTimeTracking();

        // First, find the tracking record if Firebase is available
        let trackingData = null;
        if (firebaseReady) {
            trackingData = await findTrackingRecord(inputValue);
        }
        
        if (trackingData) {
            displayTrackingResults(trackingData, trackingData.trackingId);
            startRealTimeTracking(trackingData.trackingId);
        } else {
            // Demo fallback for testing
            const testIds = ['AT-2025-001234', 'BK-MD-567890'];
            const testPhones = ['5551234567', '(555) 123-4567'];
            
            if (testIds.some(id => inputValue.toUpperCase().includes(id)) ||
                testPhones.some(phone => inputValue.includes(phone) || inputValue.replace(/\D/g, '').includes(phone.replace(/\D/g, '')))) {
                
                const demoData = {
                    trackingId: inputValue.toUpperCase(),
                    status: 'pending',
                    firstName: 'Demo',
                    lastName: 'Customer',
                    primaryService: 'Medical Transportation'
                };
                
                displayTrackingResults(demoData, inputValue.toUpperCase());
                startDemoRealTimeUpdates(inputValue.toUpperCase());
            } else {
                showTrackingError('Tracking ID not found. Please check your information and try again.');
            }
        }
        
    } catch (error) {
        console.error('Error tracking service:', error);
        showTrackingError('Unable to track service at this time. Please try again later.');
    }
}

// Find tracking record in Firestore
async function findTrackingRecord(inputValue) {
    if (!firebaseReady || !db) return null;

    try {
        const applicationsRef = db.collection('applications');
        
        let query = applicationsRef.where('trackingId', '==', inputValue.toUpperCase());
        let snapshot = await query.get();
        
        if (!snapshot.empty) {
            return snapshot.docs[0].data();
        }
        
        const cleanPhone = inputValue.replace(/\D/g, '');
        const phoneQueries = [
            applicationsRef.where('phone', '==', inputValue),
            applicationsRef.where('phone', '==', cleanPhone)
        ];
        
        for (const phoneQuery of phoneQueries) {
            const phoneSnapshot = await phoneQuery.get();
            if (!phoneSnapshot.empty) {
                return phoneSnapshot.docs[0].data();
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error finding tracking record:', error);
        return null;
    }
}

// Show Tracking Error
function showTrackingError(message) {
    try {
        const errorMessage = safeGetElement('errorMessage');
        const trackingResults = safeGetElement('trackingResults');
        
        if (!errorMessage) {
            console.error('Error message element not found');
            return;
        }
        
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => errorMessage.classList.remove('show'), 5000);
        
        if (trackingResults) {
            trackingResults.classList.remove('show');
        }
    } catch (error) {
        console.warn('Show tracking error failed:', error);
    }
}

// Display Tracking Results
function displayTrackingResults(data, displayId) {
    try {
        const trackingResults = safeGetElement('trackingResults');
        const errorMessage = safeGetElement('errorMessage');
        const displayTrackingId = safeGetElement('displayTrackingId');
        
        if (displayTrackingId) {
            displayTrackingId.textContent = displayId;
        }
        
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
        
        if (trackingResults) {
            trackingResults.classList.add('show');
            trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        updateTrackingDisplay(data);
    } catch (error) {
        console.warn('Display tracking results failed:', error);
    }
}

// Update Tracking Display
function updateTrackingDisplay(data) {
    try {
        const statusIndicator = safeGetElement('statusIndicator');
        
        if (statusIndicator) {
            const status = data.status || 'pending';
            const statusText = getStatusText(status);
            
            statusIndicator.className = `status-indicator status-${status}`;
            statusIndicator.textContent = statusText;
        }
        
        updateTimelineStatus(data.status || 'pending');
    } catch (error) {
        console.warn('Update tracking display failed:', error);
    }
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
    try {
        const timelineItems = safeQuerySelectorAll('.timeline-item');
        
        timelineItems.forEach(item => {
            try {
                item.classList.remove('active', 'completed');
            } catch (error) {
                console.warn('Timeline item class removal error:', error);
            }
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
            try {
                if (index < currentStep) {
                    item.classList.add('completed');
                } else if (index === currentStep) {
                    item.classList.add('active');
                }
            } catch (error) {
                console.warn('Timeline item class addition error:', error);
            }
        });
    } catch (error) {
        console.warn('Update timeline status failed:', error);
    }
}

// Start Real-Time Tracking Updates
function startRealTimeTracking(trackingId) {
    try {
        if (!firebaseReady || !realtimeDb) {
            console.warn('Realtime Database not available - using demo mode');
            startDemoRealTimeUpdates(trackingId);
            return;
        }
        
        const trackingRef = realtimeDb.ref(`live_tracking/${trackingId}`);
        currentTrackingRef = trackingRef;
        
        trackingRef.on('value', (snapshot) => {
            try {
                const liveData = snapshot.val();
                if (liveData) {
                    updateLiveTrackingDisplay(liveData);
                } else {
                    console.log('No real-time data found, using demo updates');
                    startDemoRealTimeUpdates(trackingId);
                }
            } catch (error) {
                console.warn('Real-time tracking update error:', error);
            }
        });
        
        window.addEventListener('beforeunload', stopRealTimeTracking);
    } catch (error) {
        console.warn('Start real-time tracking failed:', error);
        startDemoRealTimeUpdates(trackingId);
    }
}

// Demo real-time updates for testing
function startDemoRealTimeUpdates(trackingId) {
    try {
        console.log('Starting demo real-time updates for', trackingId);
        
        let updateCount = 0;
        const demoInterval = setInterval(() => {
            try {
                updateCount++;
                
                const demoLiveData = {
                    trackingId: trackingId,
                    status: updateCount < 3 ? 'enroute' : updateCount < 5 ? 'arrived' : 'intransit',
                    driver: {
                        id: 'demo_driver',
                        name: 'Robert Martinez',
                        phone: '555-234-5678',
                        vehicle: {
                            make: 'Ford',
                            model: 'Transit',
                            year: 2023,
                            licensePlate: 'AMT-4567',
                            type: 'wheelchair_accessible'
                        }
                    },
                    location: {
                        lat: 40.7128 + (updateCount * 0.001),
                        lng: -74.0060 + (updateCount * 0.001),
                        address: `${updateCount + 4}th & Main Street`,
                        eta: new Date(Date.now() + (10 - updateCount) * 60000).toISOString()
                    },
                    timeline: {
                        booked: { time: new Date(Date.now() - 3600000).toISOString(), completed: true },
                        driverAssigned: { time: new Date(Date.now() - 1800000).toISOString(), completed: true },
                        dispatched: { time: new Date(Date.now() - 600000).toISOString(), completed: true },
                        enroute: { time: new Date(Date.now() - 300000).toISOString(), completed: updateCount >= 1 },
                        arrived: { completed: updateCount >= 4 },
                        intransit: { completed: updateCount >= 5 },
                        completed: { completed: updateCount >= 7 }
                    }
                };
                
                updateLiveTrackingDisplay(demoLiveData);
                
                if (updateCount >= 8) {
                    clearInterval(demoInterval);
                    console.log('Demo updates completed');
                }
            } catch (error) {
                console.warn('Demo update error:', error);
                clearInterval(demoInterval);
            }
        }, 3000);
        
        window.demoInterval = demoInterval;
    } catch (error) {
        console.warn('Start demo updates failed:', error);
    }
}

// Update Live Tracking Display
function updateLiveTrackingDisplay(liveData) {
    try {
        showLiveNotification(`Status updated: ${getStatusText(liveData.status)}`);
        updateLastUpdatedTime();
        updateDriverInfo(liveData.driver);
        updateLocation(liveData.location);
        updateStatus(liveData.status);
        updateTimelineStatus(liveData.status);
        updateTimelineTimestamps(liveData.timeline);
        updateConnectionStatus(true);
    } catch (error) {
        console.warn('Update live tracking display failed:', error);
    }
}

// Show live notification
function showLiveNotification(message) {
    try {
        const notificationsDiv = safeGetElement('liveNotifications');
        const notificationText = safeGetElement('notificationText');
        
        if (!notificationsDiv || !notificationText) {
            return;
        }
        
        notificationText.textContent = message;
        notificationsDiv.style.display = 'block';
        
        setTimeout(() => {
            notificationsDiv.style.display = 'none';
        }, 5000);
    } catch (error) {
        console.warn('Show live notification failed:', error);
    }
}

// Update last updated time
function updateLastUpdatedTime() {
    try {
        const lastUpdatedElement = safeGetElement('lastUpdatedTime');
        if (!lastUpdatedElement) return;
        
        const now = new Date();
        lastUpdatedElement.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.warn('Update last updated time failed:', error);
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    try {
        const statusDiv = safeGetElement('connectionStatus');
        const statusText = safeGetElement('connectionText');
        
        if (!statusDiv || !statusText) return;
        
        if (connected) {
            statusDiv.className = 'connection-status';
            statusText.textContent = 'Connected to real-time updates';
        } else {
            statusDiv.className = 'connection-status disconnected';
            statusText.textContent = 'Connection lost - retrying...';
        }
    } catch (error) {
        console.warn('Update connection status failed:', error);
    }
}

// Update Driver Information
function updateDriverInfo(driverData) {
    try {
        if (!driverData) return;
        
        const driverDetails = safeQuerySelector('.driver-details');
        if (driverDetails) {
            // Clear any existing styles that might cause layout issues
            driverDetails.style.display = 'block';
            driverDetails.style.width = '100%';
            driverDetails.style.wordWrap = 'break-word';
            driverDetails.style.overflowWrap = 'break-word';
            
            driverDetails.innerHTML = `
                <div style="display: block; width: 100%; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #333; display: block; width: 100%;">${driverData.name}</h4>
                </div>
                <div style="display: block; width: 100%; margin-bottom: 8px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666; display: block; width: 100%;">Professional Medical Transport Driver</p>
                </div>
                <div style="display: block; width: 100%; margin-bottom: 8px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666; display: block; width: 100%; word-wrap: break-word;">
                        Vehicle: ${driverData.vehicle.year} ${driverData.vehicle.make} ${driverData.vehicle.model}
                        ${driverData.vehicle.type === 'wheelchair_accessible' ? ' (Wheelchair Accessible)' : ''}
                    </p>
                </div>
                <div style="display: block; width: 100%;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666; display: block; width: 100%;">License Plate: ${driverData.vehicle.licensePlate}</p>
                </div>
            `;
        }
        
        const contactButtons = safeQuerySelector('.contact-driver');
        if (contactButtons && driverData.phone) {
            // Ensure contact buttons display properly on mobile
            contactButtons.style.display = 'flex';
            contactButtons.style.flexDirection = 'column';
            contactButtons.style.gap = '10px';
            contactButtons.style.width = '100%';
            contactButtons.style.marginTop = '15px';
            
            contactButtons.innerHTML = `
                <a href="tel:${driverData.phone}" class="contact-btn" style="
                    display: block; 
                    width: 100%; 
                    padding: 12px; 
                    text-align: center; 
                    background: #007bff; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-size: 14px;
                    margin-bottom: 8px;
                    box-sizing: border-box;
                ">Call Driver</a>
                <a href="sms:${driverData.phone}" class="contact-btn" style="
                    display: block; 
                    width: 100%; 
                    padding: 12px; 
                    text-align: center; 
                    background: #28a745; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-size: 14px;
                    box-sizing: border-box;
                ">Text Driver</a>
            `;
        }
    } catch (error) {
        console.warn('Update driver info failed:', error);
    }
}

// Update Location Display
function updateLocation(locationData) {
    try {
        if (!locationData) return;
        
        const currentLocationSpan = safeGetElement('currentLocation');
        const currentETASpan = safeGetElement('currentETA');
        const currentDistanceSpan = safeGetElement('currentDistance');
        
        if (currentLocationSpan) {
            currentLocationSpan.textContent = locationData.address || 'Location updating...';
        }
        
        if (currentETASpan && locationData.eta) {
            const eta = new Date(locationData.eta);
            const now = new Date();
            const minutesRemaining = Math.round((eta - now) / (1000 * 60));
            
            if (minutesRemaining > 0) {
                currentETASpan.textContent = `${minutesRemaining} minutes`;
            } else if (minutesRemaining > -5) {
                currentETASpan.textContent = 'Arriving now';
            } else {
                currentETASpan.textContent = 'Arrived';
            }
        }
        
        if (currentDistanceSpan && locationData.distance) {
            currentDistanceSpan.textContent = locationData.distance;
        } else if (currentDistanceSpan) {
            const eta = locationData.eta ? new Date(locationData.eta) : null;
            const now = new Date();
            if (eta) {
                const minutes = Math.round((eta - now) / (1000 * 60));
                const miles = Math.max(0, Math.round(minutes * 0.5));
                currentDistanceSpan.textContent = `~${miles} miles`;
            }
        }
    } catch (error) {
        console.warn('Update location failed:', error);
    }
}

// Update Status
function updateStatus(status) {
    try {
        updateTimelineStatus(status);
    } catch (error) {
        console.warn('Update status failed:', error);
    }
}

// Update Timeline Timestamps
function updateTimelineTimestamps(timelineData) {
    try {
        if (!timelineData) return;
        
        const timelineItems = safeQuerySelectorAll('.timeline-item');
        const statusOrder = ['booked', 'driverAssigned', 'dispatched', 'enroute', 'arrived', 'intransit', 'completed'];
        
        timelineItems.forEach((item, index) => {
            try {
                const statusKey = statusOrder[index];
                const timeElement = item.querySelector('.timeline-time');
                
                if (timeElement && timelineData[statusKey]) {
                    if (timelineData[statusKey].completed && timelineData[statusKey].time) {
                        const time = new Date(timelineData[statusKey].time);
                        timeElement.textContent = `Today, ${time.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        })}`;
                    } else if (timelineData[statusKey].eta) {
                        const eta = new Date(timelineData[statusKey].eta);
                        timeElement.textContent = `Estimated: Today, ${eta.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        })}`;
                    }
                }
            } catch (error) {
                console.warn('Timeline item update error:', error);
            }
        });
    } catch (error) {
        console.warn('Update timeline timestamps failed:', error);
    }
}

// Stop Real-Time Tracking
function stopRealTimeTracking() {
    try {
        if (currentTrackingRef) {
            currentTrackingRef.off();
            currentTrackingRef = null;
        }
        
        if (window.demoInterval) {
            clearInterval(window.demoInterval);
            window.demoInterval = null;
        }
    } catch (error) {
        console.warn('Stop real-time tracking failed:', error);
    }
}

// Utility Functions
function showSuccessMessage(elementId, message) {
    try {
        const element = safeGetElement(elementId);
        if (element) {
            element.textContent = message;
            element.classList.add('show');
            setTimeout(() => element.classList.remove('show'), 5000);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (error) {
        console.warn('Show success message failed:', error);
    }
}

function showErrorMessage(message) {
    try {
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
    } catch (error) {
        console.warn('Show error message failed:', error);
    }
}

// Admin/Driver Functions (with error handling)
async function updateDriverLocation(trackingId, lat, lng, address) {
    if (!firebaseReady || !realtimeDb) return;
    
    try {
        const updates = {
            [`live_tracking/${trackingId}/location`]: {
                lat: lat,
                lng: lng,
                address: address,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            }
        };
        
        await realtimeDb.ref().update(updates);
        console.log(`Location updated for ${trackingId}`);
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

async function updateServiceStatus(trackingId, newStatus) {
    if (!firebaseReady || !realtimeDb || !db) return;
    
    try {
        const liveUpdates = {
            [`live_tracking/${trackingId}/status`]: newStatus,
            [`live_tracking/${trackingId}/timeline/${newStatus}`]: {
                time: new Date().toISOString(),
                completed: true
            },
            [`live_tracking/${trackingId}/lastUpdated`]: firebase.database.ServerValue.TIMESTAMP
        };
        
        await realtimeDb.ref().update(liveUpdates);
        
        const applicationsRef = db.collection('applications');
        const query = applicationsRef.where('trackingId', '==', trackingId);
        const snapshot = await query.get();
        
        if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await docRef.update({
                status: newStatus,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log(`Status updated to ${newStatus} for ${trackingId}`);
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

async function assignDriver(trackingId, driverData) {
    if (!firebaseReady || !realtimeDb) return;
    
    try {
        const updates = {
            [`live_tracking/${trackingId}/driver`]: driverData,
            [`live_tracking/${trackingId}/status`]: 'approved',
            [`live_tracking/${trackingId}/timeline/driverAssigned`]: {
                time: new Date().toISOString(),
                completed: true
            },
            [`live_tracking/${trackingId}/lastUpdated`]: firebase.database.ServerValue.TIMESTAMP
        };
        
        await realtimeDb.ref().update(updates);
        console.log(`Driver ${driverData.name} assigned to ${trackingId}`);
    } catch (error) {
        console.error('Error assigning driver:', error);
    }
}

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Small delay to ensure all scripts are loaded
        setTimeout(initializeApp, 100);
    } catch (error) {
        console.error('DOMContentLoaded error:', error);
        // Try to at least setup basic functionality
        setTimeout(setupBasicFallbacks, 200);
    }
});

// Global functions for HTML onclick attributes and admin use
window.trackService = trackService;
window.updateDriverLocation = updateDriverLocation;
window.updateServiceStatus = updateServiceStatus;
window.assignDriver = assignDriver;
