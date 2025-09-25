// Alric Transportation - Enhanced Real-Time Tracking System
// Firebase Configuration with Realtime Database

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
let currentTrackingRef = null; // For cleanup

// Debug Firebase loading
function debugFirebaseLoading() {
    console.log('=== Firebase Debug Info ===');
    console.log('window.firebase exists:', typeof firebase !== 'undefined');
    
    if (typeof firebase !== 'undefined') {
        console.log('firebase.apps exists:', !!firebase.apps);
        console.log('firebase.firestore exists:', !!firebase.firestore);
        console.log('firebase.database exists:', !!firebase.database);
        console.log('firebase.analytics exists:', !!firebase.analytics);
        console.log('firebase.initializeApp exists:', !!firebase.initializeApp);
    }
    
    const scripts = Array.from(document.scripts);
    const firebaseScripts = scripts.filter(script => 
        script.src.includes('firebase') || script.src.includes('gstatic.com')
    );
    
    console.log('Firebase scripts found:', firebaseScripts.length);
    firebaseScripts.forEach(script => {
        console.log('Script:', script.src, 'Loaded:', script.readyState || 'unknown');
    });
    console.log('=== End Firebase Debug ===');
}

// Initialize Firebase with Realtime Database
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.firestore && firebase.database) {
            if (firebase.apps.length === 0) {
                app = firebase.initializeApp(firebaseConfig);
            } else {
                app = firebase.apps[0];
            }
            
            db = firebase.firestore(); // For structured data
            realtimeDb = firebase.database(); // For real-time updates
            
            if (firebase.analytics && typeof firebase.analytics === 'function') {
                try {
                    analytics = firebase.analytics();
                } catch (analyticsError) {
                    console.log('Analytics not available:', analyticsError.message);
                }
            }
            
            console.log('Firebase initialized successfully with Realtime Database');
            return true;
        } else {
            console.warn('Firebase not fully loaded. Available:', {
                firebase: typeof firebase !== 'undefined',
                apps: typeof firebase !== 'undefined' && firebase.apps,
                firestore: typeof firebase !== 'undefined' && firebase.firestore,
                database: typeof firebase !== 'undefined' && firebase.database
            });
            return false;
        }
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
        return false;
    }
}

// Wait for Firebase to load with retry mechanism
function waitForFirebaseAndInit() {
    let attempts = 0;
    const maxAttempts = 20;
    
    function checkFirebase() {
        attempts++;
        console.log(`Checking for Firebase... attempt ${attempts}`);
        
        if (attempts === 1) {
            debugFirebaseLoading();
        }
        
        if (initializeFirebase()) {
            initializeApp();
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(checkFirebase, 300);
        } else {
            console.warn('Firebase failed to load after multiple attempts. Using fallback mode.');
            debugFirebaseLoading();
            initializeApp();
        }
    }
    
    checkFirebase();
}

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(waitForFirebaseAndInit, 100);
});

// Initialize Application with page detection
function initializeApp() {
    // Detect current page
    const currentPage = detectCurrentPage();
    console.log('Current page detected:', currentPage);
    
    // Always setup these universal features
    setupScrollAnimations();
    setupHeaderScrollEffect();
    setupMobileOptimizations();
    
    // Page-specific initialization
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
            // For other pages, setup basic functionality only
            setupBasicFormHandlers();
            break;
    }
}

// Detect current page based on URL and content
function detectCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    const filename = path.split('/').pop().replace('.html', '') || 'index';
    
    // Check for specific page indicators
    if (filename.includes('track') || document.getElementById('trackingInput')) {
        return 'track';
    } else if (filename.includes('contact') || document.getElementById('contactForm')) {
        return 'contact';
    } else if (filename.includes('services') || document.getElementById('applicationForm')) {
        return 'services';
    } else if (filename.includes('faq') || document.getElementById('faqSearch')) {
        return 'faq';
    } else if (document.getElementById('reviewForm')) {
        return 'review';
    }
    
    return filename || 'index';
}

// Basic form handlers for pages that might have simple forms
function setupBasicFormHandlers() {
    // Only setup handlers if forms exist
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationForm);
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewForm);
    }

    // Only setup validation if there are required fields
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    if (requiredFields.length > 0) {
        setupRealTimeValidation();
    }
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

    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        observer.observe(el);
    });

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
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationForm);
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewForm);
    }

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
        timestamp: db ? firebase.firestore.Timestamp.now() : new Date().toISOString(),
        type: 'service_application',
        status: 'pending',
        assignedDriverId: null,
        createdAt: new Date().toISOString()
    };

    try {
        if (db && db.collection) {
            await db.collection('applications').add(applicationData);
            console.log('Application submitted to Firebase');
            
            // Create initial tracking record
            await createTrackingRecord(applicationData);
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

// Create initial tracking record when booking is made
async function createTrackingRecord(applicationData) {
    if (!realtimeDb) return;
    
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
    
    try {
        await realtimeDb.ref(`live_tracking/${trackingId}`).set(initialTrackingData);
        console.log(`Tracking record created for ${trackingId}`);
    } catch (error) {
        console.error('Error creating tracking record:', error);
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

// Rating System - Only for review pages
function setupRatingSystem() {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    const ratingContainer = document.getElementById('rating');
    
    // Only proceed if rating elements exist
    if (stars.length === 0 && !ratingValue && !ratingContainer) {
        console.log('Rating system not needed on this page');
        return;
    }
    
    console.log('Setting up rating system');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            currentRating = rating;
            if (ratingValue) ratingValue.value = rating;
            updateStars(rating);
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            updateStars(rating);
        });
    });
    
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

// FAQ Search and Filter - Only for FAQ pages
function setupSearchAndFilter() {
    const faqSearch = document.getElementById('faqSearch');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // Only proceed if FAQ elements exist
    if (!faqSearch && categoryButtons.length === 0 && faqQuestions.length === 0) {
        console.log('FAQ system not needed on this page');
        return;
    }
    
    console.log('Setting up FAQ search and filter system');
    
    // FAQ Search
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
            
            if (searchTerm) {
                categoryButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                const allBtn = document.querySelector('.category-btn[data-category="all"]');
                if (allBtn) allBtn.classList.add('active');
            }
        });
    }

    // Category Filtering
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
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
            
            if (faqSearch) faqSearch.value = '';
        });
    });

    // FAQ Accordion
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');
            
            faqQuestions.forEach(q => {
                if (q !== this) {
                    q.classList.remove('active');
                    const qAnswer = q.nextElementSibling;
                    if (qAnswer) qAnswer.classList.remove('active');
                    const qIcon = q.querySelector('.faq-icon');
                    if (qIcon) qIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            this.classList.toggle('active');
            if (answer) answer.classList.toggle('active');
            if (icon) {
                icon.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    });
}

// Tracking System - Only initialize on tracking pages
function setupTrackingSystem() {
    const trackingInput = document.getElementById('trackingInput');
    if (!trackingInput) {
        console.log('Tracking system not needed on this page');
        return;
    }
    
    console.log('Setting up tracking system');
    
    trackingInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            trackService();
        }
    });
    
    // Check for URL parameters
    checkForUrlTrackingId();
}

// Check for tracking ID in URL parameters
function checkForUrlTrackingId() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('track');
    
    if (trackId) {
        console.log('Auto-tracking from URL:', trackId);
        setTimeout(() => {
            const trackingInput = document.getElementById('trackingInput');
            if (trackingInput) {
                trackingInput.value = trackId;
                trackService();
            }
        }, 1000);
    }
}

// Enhanced Track Service with better error handling
async function trackService() {
    const trackingInput = document.getElementById('trackingInput');
    const trackingResults = document.getElementById('trackingResults');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if we're on the right page
    if (!trackingInput) {
        console.error('trackService called but tracking input not found - wrong page?');
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

    try {
        // First, find the tracking record in Firestore
        const trackingData = await findTrackingRecord(inputValue);
        
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

// Show Tracking Error - only if elements exist
function showTrackingError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const trackingResults = document.getElementById('trackingResults');
    
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
}

// Find tracking record in Firestore
async function findTrackingRecord(inputValue) {
    if (!db) return null;

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

// Start Real-Time Tracking Updates
function startRealTimeTracking(trackingId) {
    if (!realtimeDb) {
        console.warn('Realtime Database not available - using demo mode');
        startDemoRealTimeUpdates(trackingId);
        return;
    }
    
    const trackingRef = realtimeDb.ref(`live_tracking/${trackingId}`);
    currentTrackingRef = trackingRef;
    
    trackingRef.on('value', (snapshot) => {
        const liveData = snapshot.val();
        if (liveData) {
            updateLiveTrackingDisplay(liveData);
        } else {
            console.log('No real-time data found, using demo updates');
            startDemoRealTimeUpdates(trackingId);
        }
    });
    
    window.addEventListener('beforeunload', stopRealTimeTracking);
}

// Demo real-time updates for testing
function startDemoRealTimeUpdates(trackingId) {
    console.log('Starting demo real-time updates for', trackingId);
    
    let updateCount = 0;
    const demoInterval = setInterval(() => {
        updateCount++;
        
        const demoLiveData = {
            trackingId: trackingId,
            status: updateCount < 3 ? 'enroute' : updateCount < 5 ? 'arrived' : 'intransit',
            driver: {
                id: 'demo_driver',
                name: 'Robert Martinez',
                phone: '555-234-5678',
                avatar: '👨‍🚗',
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
    }, 3000); // Update every 3 seconds for demo
    
    window.demoInterval = demoInterval;
}

// Update Live Tracking Display with enhanced UI updates
function updateLiveTrackingDisplay(liveData) {
    // Show live notifications
    showLiveNotification(`Status updated: ${getStatusText(liveData.status)}`);
    
    // Update last updated time
    updateLastUpdatedTime();
    
    // Update all sections
    updateDriverInfo(liveData.driver);
    updateLocation(liveData.location);
    updateStatus(liveData.status);
    updateTimelineStatus(liveData.status);
    updateTimelineTimestamps(liveData.timeline);
    
    // Update connection status
    updateConnectionStatus(true);
}

// Show live notification - only if elements exist
function showLiveNotification(message) {
    const notificationsDiv = document.getElementById('liveNotifications');
    const notificationText = document.getElementById('notificationText');
    
    if (!notificationsDiv || !notificationText) {
        console.log('Live notification elements not found on this page');
        return;
    }
    
    notificationText.textContent = message;
    notificationsDiv.style.display = 'block';
    
    setTimeout(() => {
        notificationsDiv.style.display = 'none';
    }, 5000);
}

// Update last updated time - only if element exists
function updateLastUpdatedTime() {
    const lastUpdatedElement = document.getElementById('lastUpdatedTime');
    if (!lastUpdatedElement) return;
    
    const now = new Date();
    lastUpdatedElement.textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Update connection status - only if elements exist
function updateConnectionStatus(connected) {
    const statusDiv = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');
    
    if (!statusDiv || !statusText) return;
    
    if (connected) {
        statusDiv.className = 'connection-status';
        statusText.textContent = '🔗 Connected to real-time updates';
    } else {
        statusDiv.className = 'connection-status disconnected';
        statusText.textContent = '⚠️ Connection lost - retrying...';
    }
}

// Update Driver Information
function updateDriverInfo(driverData) {
    if (!driverData) return;
    
    const driverDetails = document.querySelector('.driver-details');
    if (driverDetails) {
        driverDetails.innerHTML = `
            <h4>${driverData.name}</h4>
            <p>Professional Medical Transport Driver</p>
            <p>Vehicle: ${driverData.vehicle.year} ${driverData.vehicle.make} ${driverData.vehicle.model} 
               ${driverData.vehicle.type === 'wheelchair_accessible' ? '(Wheelchair Accessible)' : ''}</p>
            <p>License Plate: ${driverData.vehicle.licensePlate}</p>
        `;
    }
    
    const contactButtons = document.querySelector('.contact-driver');
    if (contactButtons && driverData.phone) {
        contactButtons.innerHTML = `
            <a href="tel:${driverData.phone}" class="contact-btn">📞 Call Driver</a>
            <a href="sms:${driverData.phone}" class="contact-btn">💬 Text Driver</a>
        `;
    }
}

// Update Location Display with enhanced details
function updateLocation(locationData) {
    if (!locationData) return;
    
    const currentLocationSpan = document.getElementById('currentLocation');
    const currentETASpan = document.getElementById('currentETA');
    const currentDistanceSpan = document.getElementById('currentDistance');
    
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
        // Calculate approximate distance (demo)
        const eta = locationData.eta ? new Date(locationData.eta) : null;
        const now = new Date();
        if (eta) {
            const minutes = Math.round((eta - now) / (1000 * 60));
            const miles = Math.max(0, Math.round(minutes * 0.5)); // Rough estimate
            currentDistanceSpan.textContent = `~${miles} miles`;
        }
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

// Update Timeline Timestamps
function updateTimelineTimestamps(timelineData) {
    if (!timelineData) return;
    
    const timelineItems = document.querySelectorAll('.timeline-item');
    const statusOrder = ['booked', 'driverAssigned', 'dispatched', 'enroute', 'arrived', 'intransit', 'completed'];
    
    timelineItems.forEach((item, index) => {
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

// Stop Real-Time Tracking
function stopRealTimeTracking() {
    if (currentTrackingRef) {
        currentTrackingRef.off();
        currentTrackingRef = null;
    }
    
    if (window.demoInterval) {
        clearInterval(window.demoInterval);
        window.demoInterval = null;
    }
}

// Admin/Driver Functions for updating tracking data
async function updateDriverLocation(trackingId, lat, lng, address) {
    if (!realtimeDb) return;
    
    const updates = {
        [`live_tracking/${trackingId}/location`]: {
            lat: lat,
            lng: lng,
            address: address,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        }
    };
    
    try {
        await realtimeDb.ref().update(updates);
        console.log(`Location updated for ${trackingId}`);
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

async function updateServiceStatus(trackingId, newStatus) {
    if (!realtimeDb || !db) return;
    
    const liveUpdates = {
        [`live_tracking/${trackingId}/status`]: newStatus,
        [`live_tracking/${trackingId}/timeline/${newStatus}`]: {
            time: new Date().toISOString(),
            completed: true
        },
        [`live_tracking/${trackingId}/lastUpdated`]: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await realtimeDb.ref().update(liveUpdates);
        
        // Update Firestore for historical record
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
    if (!realtimeDb) return;
    
    const updates = {
        [`live_tracking/${trackingId}/driver`]: driverData,
        [`live_tracking/${trackingId}/status`]: 'approved',
        [`live_tracking/${trackingId}/timeline/driverAssigned`]: {
            time: new Date().toISOString(),
            completed: true
        },
        [`live_tracking/${trackingId}/lastUpdated`]: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await realtimeDb.ref().update(updates);
        console.log(`Driver ${driverData.name} assigned to ${trackingId}`);
    } catch (error) {
        console.error('Error assigning driver:', error);
    }
}

// Auto-assign available driver
async function autoAssignDriver(trackingId, customerLocation) {
    if (!db) return;
    
    try {
        const driversRef = db.collection('drivers');
        const availableDrivers = await driversRef.where('status', '==', 'available').get();
        
        if (availableDrivers.empty) {
            console.log('No available drivers');
            return;
        }
        
        const driver = availableDrivers.docs[0].data();
        
        await assignDriver(trackingId, {
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            phone: driver.phone,
            vehicle: driver.vehicle,
            avatar: driver.avatar || "👨‍🚗"
        });
        
        await driversRef.doc(driver.id).update({ 
            status: 'busy', 
            currentJob: trackingId 
        });
        
        console.log(`Driver ${driver.firstName} ${driver.lastName} assigned to ${trackingId}`);
        
    } catch (error) {
        console.error('Error auto-assigning driver:', error);
    }
}

// Mobile Optimizations
function setupMobileOptimizations() {
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
    
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
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileToggle || !navLinks) {
        console.log('Mobile menu elements not found - creating fallback for small screens');
        
        if (window.innerWidth <= 768) {
            const nav = document.querySelector('nav');
            const existingNavLinks = nav?.querySelector('.nav-links');
            
            if (nav && existingNavLinks && !nav.querySelector('.mobile-menu-toggle')) {
                const toggle = document.createElement('button');
                toggle.className = 'mobile-menu-toggle';
                toggle.innerHTML = `
                    <span></span>
                    <span></span>
                    <span></span>
                `;
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
    
    mobileToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        navLinks.classList.toggle('mobile-open');
        this.classList.toggle('open');
    });
    
    document.addEventListener('click', function(e) {
        if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('mobile-open');
            mobileToggle.classList.remove('open');
        }
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('mobile-open');
            mobileToggle.classList.remove('open');
        });
    });
    
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

// Global functions for HTML onclick attributes and admin use
window.trackService = trackService;
window.updateDriverLocation = updateDriverLocation;
window.updateServiceStatus = updateServiceStatus;
window.assignDriver = assignDriver;
window.autoAssignDriver = autoAssignDriver;
