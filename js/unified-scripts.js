// Alric Transportation - Unified JavaScript
// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAa_GIteOi3r4GtdL8mFD7TkrOr1fE6GdE",
  authDomain: "alrictransportation.firebaseapp.com",
  projectId: "alrictransportation",
  storageBucket: "alrictransportation.firebasestorage.app",
  messagingSenderId: "257683950593",
  appId: "1:257683950593:web:8e84e6599a517f9c284400",
  measurementId: "G-P8EDVYFFJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Global Variables
let currentRating = 0;

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
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
        serviceNeeded: formData.get('serviceNeeded'),
        urgency: formData.get('urgency'),
        message: formData.get('message'),
        timestamp: new Date(),
        type: 'contact_inquiry'
    };

    try {
        await addDoc(collection(db, 'contacts'), contactData);
        showSuccessMessage('contactSuccess', 'Thank you! We\'ll get back to you within 2 hours.');
        e.target.reset();
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showErrorMessage('Failed to submit form. Please try again.');
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
        dateOfBirth: formData.get('dateOfBirth'),
        emergencyContact: formData.get('emergencyContact'),
        primaryService: formData.get('primaryService'),
        frequency: formData.get('frequency'),
        medicalNeeds: formData.get('medicalNeeds'),
        insurance: formData.get('insurance'),
        consent: formData.get('consent') === 'on',
        terms: formData.get('terms') === 'on',
        timestamp: new Date(),
        type: 'service_application',
        status: 'pending'
    };

    try {
        const docRef = await addDoc(collection(db, 'applications'), applicationData);
        showSuccessMessage('applicationSuccess', 'Application submitted! We\'ll contact you within 24 hours.');
        e.target.reset();
        
        // Generate tracking ID
        const trackingId = `AT-${new Date().getFullYear()}-${docRef.id.slice(-6).toUpperCase()}`;
        await updateDoc(doc(db, 'applications', docRef.id), { trackingId });
        
    } catch (error) {
        console.error('Error submitting application:', error);
        showErrorMessage('Failed to submit application. Please try again.');
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
        customerEmail: formData.get('customerEmail'),
        timestamp: new Date(),
        approved: false
    };

    try {
        await addDoc(collection(db, 'reviews'), reviewData);
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
    
    document.getElementById('rating').addEventListener('mouseleave', function() {
        updateStars(currentRating);
    });
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
                    item.closest('.faq-section').style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
            if (searchTerm) {
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector('.category-btn[data-category="all"]')?.classList.add('active');
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
        // Search in applications collection
        const q = query(
            collection(db, 'applications'),
            where('trackingId', '==', inputValue.toUpperCase())
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            
            if (displayTrackingId) {
                displayTrackingId.textContent = data.trackingId;
            }
            
            errorMessage.classList.remove('show');
            trackingResults.classList.add('show');
            trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Update tracking status based on application data
            updateTrackingDisplay(data);
            
        } else {
            // Search by phone number
            const phoneQuery = query(
                collection(db, 'applications'),
                where('phone', '==', inputValue)
            );
            
            const phoneSnapshot = await getDocs(phoneQuery);
            
            if (!phoneSnapshot.empty) {
                const doc = phoneSnapshot.docs[0];
                const data = doc.data();
                
                if (displayTrackingId) {
                    displayTrackingId.textContent = data.trackingId || 'Phone lookup';
                }
                
                errorMessage.classList.remove('show');
                trackingResults.classList.add('show');
                trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                updateTrackingDisplay(data);
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
        // Update status based on application data
        const status = data.status || 'pending';
        const statusText = getStatusText(status);
        
        statusIndicator.className = `status-indicator status-${status}`;
        statusIndicator.textContent = statusText;
    }
    
    // Update timeline if needed
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
    
    // Reset all timeline items
    timelineItems.forEach(item => {
        item.classList.remove('active', 'completed');
    });
    
    // Update based on status
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
    // Touch event handling for mobile devices
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
    
    // Mobile menu handling if needed
    setupMobileMenu();
}

// Mobile Menu Setup
function setupMobileMenu() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    // Add mobile menu toggle if needed
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
    // Create or show error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Global function for tracking (called from HTML)
window.trackService = trackService;

// Export functions if using modules
export {
    trackService,
    handleContactForm,
    handleApplicationForm,
    handleReviewForm
};
