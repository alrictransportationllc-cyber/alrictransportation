// admin-scripts.js - Comprehensive Admin Dashboard Functions
// Firebase Configuration - matches your existing setup
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

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const realtimeDb = firebase.database();

// Global Variables
let currentUser = null;
let refreshInterval = null;
let liveTrackingListeners = [];

// ===== AUTHENTICATION & INITIALIZATION =====

// Check Authentication State
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const token = await user.getIdTokenResult();
            if (token.claims.admin === true) {
                currentUser = user;
                initializeAdminDashboard();
                updateAdminInfo(user);
            } else {
                redirectToLogin();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            redirectToLogin();
        }
    } else {
        redirectToLogin();
    }
});

function redirectToLogin() {
    if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function updateAdminInfo(user) {
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = user.email.split('@')[0] || 'Admin';
    }
    
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.textContent = user.email.charAt(0).toUpperCase();
    }
}

// Initialize Admin Dashboard
function initializeAdminDashboard() {
    console.log('Initializing admin dashboard...');
    setupNavigation();
    loadInitialData();
    setupRealTimeListeners();
    startPeriodicRefresh();
}

// ===== NAVIGATION =====

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
}

function handleNavigation(e) {
    e.preventDefault();
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    
    // Show corresponding section
    const sectionId = this.dataset.section;
    showDashboardSection(sectionId);
    
    // Update page title
    const pageTitle = this.textContent.trim().replace(/^\S+\s/, ''); // Remove emoji
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = pageTitle;
    }
    
    // Load section-specific data
    loadSectionData(sectionId);
}

function showDashboardSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function loadSectionData(sectionId) {
    console.log(`Loading data for section: ${sectionId}`);
    
    switch(sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'bookings':
            loadBookingsData();
            break;
        case 'tracking':
            loadTrackingData();
            break;
        case 'applications':
            loadApplicationsData();
            break;
        case 'reviews':
            loadReviewsData();
            break;
        case 'inquiries':
            loadInquiriesData();
            break;
        case 'drivers':
            loadDriversData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// ===== DATA LOADING FUNCTIONS =====

async function loadInitialData() {
    try {
        await Promise.all([
            loadOverviewStats(),
            loadRecentActivity(),
            loadApplicationsData(),
            loadInquiriesData()
        ]);
        console.log('Initial data loaded successfully');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Overview Statistics
async function loadOverviewStats() {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Today's bookings
        const todayBookings = await db.collection('applications')
            .where('timestamp', '>=', startOfDay)
            .get();
        updateStatCard('todayBookings', todayBookings.size);
        
        // Completed trips
        const completedTrips = await db.collection('applications')
            .where('status', '==', 'completed')
            .get();
        updateStatCard('completedTrips', completedTrips.size);
        
        // Active trips
        const activeTrips = await db.collection('applications')
            .where('status', 'in', ['dispatched', 'enroute', 'arrived', 'intransit'])
            .get();
        updateStatCard('activeTrips', activeTrips.size);
        
        // Average rating
        const reviews = await db.collection('reviews').get();
        const avgRating = calculateAverageRating(reviews);
        updateStatCard('avgRating', avgRating);
        
    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function calculateAverageRating(reviewsSnapshot) {
    if (reviewsSnapshot.empty) return '0.0';
    
    let totalRating = 0;
    let count = 0;
    
    reviewsSnapshot.forEach(doc => {
        const review = doc.data();
        if (review.rating && typeof review.rating === 'number') {
            totalRating += review.rating;
            count++;
        }
    });
    
    return count > 0 ? (totalRating / count).toFixed(1) : '0.0';
}

// Recent Activity
async function loadRecentActivity() {
    try {
        const activities = await db.collection('applications')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        displayRecentActivity(activities);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        displayTableError('recentActivityTable', 4);
    }
}

function displayRecentActivity(activitiesSnapshot) {
    const tableBody = document.getElementById('recentActivityTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (activitiesSnapshot.empty) {
        displayTableEmpty(tableBody, 4, 'No recent activity');
        return;
    }
    
    activitiesSnapshot.forEach(doc => {
        const data = doc.data();
        const row = createRecentActivityRow(data);
        tableBody.appendChild(row);
    });
}

function createRecentActivityRow(data) {
    const row = document.createElement('tr');
    const timestamp = data.timestamp?.toDate() || new Date();
    const timeString = timestamp.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    row.innerHTML = `
        <td>${timeString}</td>
        <td>${data.primaryService || 'Service Request'}</td>
        <td>${data.firstName || ''} ${data.lastName || ''}</td>
        <td><span class="status-badge status-${data.status || 'pending'}">${getStatusText(data.status)}</span></td>
    `;
    
    return row;
}

// Applications Data
async function loadApplicationsData() {
    try {
        const applications = await db.collection('applications')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        displayApplications(applications);
    } catch (error) {
        console.error('Error loading applications:', error);
        displayTableError('applicationsTable', 6);
    }
}

function displayApplications(applicationsSnapshot) {
    const tableBody = document.getElementById('applicationsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (applicationsSnapshot.empty) {
        displayTableEmpty(tableBody, 6, 'No applications found');
        return;
    }
    
    applicationsSnapshot.forEach(doc => {
        const data = doc.data();
        const row = createApplicationRow(doc.id, data);
        tableBody.appendChild(row);
    });
}

function createApplicationRow(docId, data) {
    const row = document.createElement('tr');
    const timestamp = data.timestamp?.toDate() || new Date();
    const dateString = timestamp.toLocaleDateString();
    
    row.innerHTML = `
        <td>${data.trackingId || 'N/A'}</td>
        <td>${data.firstName || ''} ${data.lastName || ''}</td>
        <td>${data.primaryService || 'N/A'}</td>
        <td>${dateString}</td>
        <td><span class="status-badge status-${data.status || 'pending'}">${getStatusText(data.status)}</span></td>
        <td>
            <button class="action-btn btn-view" onclick="viewApplication('${docId}')">View</button>
            <button class="action-btn btn-edit" onclick="approveApplication('${docId}')">Approve</button>
        </td>
    `;
    
    return row;
}

// Inquiries Data
async function loadInquiriesData() {
    try {
        const inquiries = await db.collection('contacts')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        displayInquiries(inquiries);
    } catch (error) {
        console.error('Error loading inquiries:', error);
        displayTableError('inquiriesTable', 7);
    }
}

function displayInquiries(inquiriesSnapshot) {
    const tableBody = document.getElementById('inquiriesTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (inquiriesSnapshot.empty) {
        displayTableEmpty(tableBody, 7, 'No inquiries found');
        return;
    }
    
    inquiriesSnapshot.forEach(doc => {
        const data = doc.data();
        const row = createInquiryRow(doc.id, data);
        tableBody.appendChild(row);
    });
}

function createInquiryRow(docId, data) {
    const row = document.createElement('tr');
    const timestamp = data.timestamp?.toDate() || new Date();
    const dateString = timestamp.toLocaleDateString();
    
    row.innerHTML = `
        <td>${data.firstName || ''} ${data.lastName || ''}</td>
        <td>${data.email || ''}</td>
        <td>${data.serviceNeeded || 'General Inquiry'}</td>
        <td>${data.urgency || 'Normal'}</td>
        <td>${dateString}</td>
        <td><span class="status-badge status-pending">New</span></td>
        <td>
            <button class="action-btn btn-view" onclick="viewInquiry('${docId}')">Reply</button>
        </td>
    `;
    
    return row;
}

// Reviews Data
async function loadReviewsData() {
    try {
        const reviews = await db.collection('reviews')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        displayReviewsError();
    }
}

function displayReviews(reviewsSnapshot) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    reviewsList.innerHTML = '';
    
    if (reviewsSnapshot.empty) {
        reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-light);">No reviews found</div>';
        return;
    }
    
    reviewsSnapshot.forEach(doc => {
        const data = doc.data();
        const reviewItem = createReviewItem(doc.id, data);
        reviewsList.appendChild(reviewItem);
    });
}

function createReviewItem(docId, data) {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    
    const timestamp = data.timestamp?.toDate() || new Date();
    const dateString = timestamp.toLocaleDateString();
    const stars = generateStarsDisplay(data.rating || 0);
    
    reviewItem.innerHTML = `
        <div class="review-header">
            <div>
                <strong>${data.customerName || 'Anonymous'}</strong>
                <div class="review-rating">${stars}</div>
            </div>
            <div class="review-date">${dateString}</div>
        </div>
        <p>${data.reviewText || 'No review text'}</p>
        <p><strong>Service:</strong> ${data.serviceUsed || 'N/A'}</p>
        <div style="margin-top: 10px;">
            <button class="action-btn btn-edit" onclick="approveReview('${docId}')">Approve</button>
            <button class="action-btn btn-delete" onclick="rejectReview('${docId}')">Reject</button>
        </div>
    `;
    
    return reviewItem;
}

function generateStarsDisplay(rating) {
    const filledStars = Math.floor(rating);
    const emptyStars = 5 - filledStars;
    return '★'.repeat(filledStars) + '☆'.repeat(emptyStars);
}

// Tracking Data
async function loadTrackingData() {
    try {
        const trackingSnapshot = await realtimeDb.ref('live_tracking').once('value');
        const trackingData = trackingSnapshot.val();
        
        displayTrackingData(trackingData);
    } catch (error) {
        console.error('Error loading tracking data:', error);
        displayTableError('liveTrackingTable', 6);
    }
}

function displayTrackingData(trackingData) {
    const tableBody = document.getElementById('liveTrackingTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!trackingData || Object.keys(trackingData).length === 0) {
        displayTableEmpty(tableBody, 6, 'No live tracking data');
        return;
    }
    
    Object.entries(trackingData).forEach(([trackingId, data]) => {
        const row = createTrackingRow(trackingId, data);
        tableBody.appendChild(row);
    });
}

function createTrackingRow(trackingId, data) {
    const row = document.createElement('tr');
    const lastUpdated = data.lastUpdated ? 
        new Date(data.lastUpdated).toLocaleString() : 'Never';
    
    row.innerHTML = `
        <td>${trackingId}</td>
        <td>${data.customer?.name || 'N/A'}</td>
        <td>${data.service?.type || 'N/A'}</td>
        <td><span class="status-badge status-${data.status || 'pending'}">${getStatusText(data.status)}</span></td>
        <td>${lastUpdated}</td>
        <td>
            <button class="action-btn btn-view" onclick="viewLiveTracking('${trackingId}')">Track</button>
            <button class="action-btn btn-edit" onclick="setTrackingForUpdate('${trackingId}')">Update</button>
        </td>
    `;
    
    return row;
}

// ===== REAL-TIME LISTENERS =====

function setupRealTimeListeners() {
    console.log('Setting up real-time listeners...');
    
    // Listen for application changes
    const applicationsListener = db.collection('applications')
        .onSnapshot((snapshot) => {
            if (isCurrentSection('applications') || isCurrentSection('overview')) {
                loadApplicationsData();
                loadOverviewStats();
            }
        }, (error) => {
            console.error('Applications listener error:', error);
        });
    
    // Listen for contact changes
    const contactsListener = db.collection('contacts')
        .onSnapshot((snapshot) => {
            if (isCurrentSection('inquiries')) {
                loadInquiriesData();
            }
        }, (error) => {
            console.error('Contacts listener error:', error);
        });
    
    // Listen for tracking changes
    const trackingListener = realtimeDb.ref('live_tracking')
        .on('value', (snapshot) => {
            if (isCurrentSection('tracking')) {
                displayTrackingData(snapshot.val());
            }
        }, (error) => {
            console.error('Tracking listener error:', error);
        });
    
    // Store listeners for cleanup
    liveTrackingListeners.push(applicationsListener, contactsListener, trackingListener);
}

function isCurrentSection(sectionName) {
    const activeSection = document.querySelector('.dashboard-section.active');
    return activeSection && activeSection.id === sectionName;
}

// ===== ACTION FUNCTIONS =====

// Service Status Update
async function updateServiceStatus() {
    const trackingId = getElementValue('trackingIdInput');
    const status = getElementValue('statusSelect');
    
    if (!trackingId || !status) {
        showNotification('Please enter tracking ID and select status', 'error');
        return;
    }
    
    try {
        // Update Realtime Database
        await realtimeDb.ref(`live_tracking/${trackingId}`).update({
            status: status,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Update Firestore
        const applicationsQuery = await db.collection('applications')
            .where('trackingId', '==', trackingId)
            .get();
        
        if (!applicationsQuery.empty) {
            const docRef = applicationsQuery.docs[0].ref;
            await docRef.update({
                status: status,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showNotification(`Status updated to ${getStatusText(status)} for ${trackingId}`, 'success');
        clearElement('trackingIdInput');
        
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

// View Functions
async function viewApplication(docId) {
    try {
        const doc = await db.collection('applications').doc(docId).get();
        const data = doc.data();
        
        if (data) {
            const details = `
Application Details:

Name: ${data.firstName || ''} ${data.lastName || ''}
Email: ${data.email || ''}
Phone: ${data.phone || ''}
Address: ${data.address || ''}
Service: ${data.primaryService || ''}
Status: ${getStatusText(data.status)}
Tracking ID: ${data.trackingId || ''}
Date of Birth: ${data.dateOfBirth || 'Not provided'}
Emergency Contact: ${data.emergencyContact || 'Not provided'}
Medical Needs: ${data.medicalNeeds || 'None specified'}
Insurance: ${data.insurance || 'Not provided'}
            `.trim();
            
            alert(details);
        }
    } catch (error) {
        console.error('Error viewing application:', error);
        showNotification('Error loading application details', 'error');
    }
}

async function viewInquiry(docId) {
    try {
        const doc = await db.collection('contacts').doc(docId).get();
        const data = doc.data();
        
        if (data) {
            const inquiryDetails = `
Inquiry from: ${data.firstName || ''} ${data.lastName || ''}
Email: ${data.email || ''}
Phone: ${data.phone || ''}
Service Needed: ${data.serviceNeeded || 'General Inquiry'}
Urgency: ${data.urgency || 'Normal'}
Message: ${data.message || 'No message'}
            `.trim();
            
            const response = prompt(`${inquiryDetails}\n\nEnter your reply (this will be logged):`);
            
            if (response && response.trim()) {
                // Log the response (in real implementation, send email)
                console.log(`Reply to ${data.email}: ${response}`);
                
                // Update the contact record
                await db.collection('contacts').doc(docId).update({
                    replied: true,
                    replyText: response,
                    repliedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    repliedBy: currentUser.email
                });
                
                showNotification('Reply logged successfully', 'success');
            }
        }
    } catch (error) {
        console.error('Error viewing inquiry:', error);
        showNotification('Error loading inquiry details', 'error');
    }
}

// Approval Functions
async function approveApplication(docId) {
    if (!confirm('Are you sure you want to approve this application?')) {
        return;
    }
    
    try {
        await db.collection('applications').doc(docId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentUser.email
        });
        
        showNotification('Application approved successfully', 'success');
        loadApplicationsData();
        loadOverviewStats();
    } catch (error) {
        console.error('Error approving application:', error);
        showNotification('Error approving application', 'error');
    }
}

async function approveReview(docId) {
    try {
        await db.collection('reviews').doc(docId).update({
            approved: true,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentUser.email
        });
        
        showNotification('Review approved successfully', 'success');
        loadReviewsData();
    } catch (error) {
        console.error('Error approving review:', error);
        showNotification('Error approving review', 'error');
    }
}

async function rejectReview(docId) {
    if (!confirm('Are you sure you want to reject and delete this review?')) {
        return;
    }
    
    try {
        await db.collection('reviews').doc(docId).delete();
        showNotification('Review rejected and deleted', 'success');
        loadReviewsData();
    } catch (error) {
        console.error('Error rejecting review:', error);
        showNotification('Error rejecting review', 'error');
    }
}

// Tracking Functions
function viewLiveTracking(trackingId) {
    const trackingUrl = `../track.html?track=${trackingId}`;
    window.open(trackingUrl, '_blank');
}

function setTrackingForUpdate(trackingId) {
    const input = document.getElementById('trackingIdInput');
    if (input) {
        input.value = trackingId;
        showNotification(`Tracking ID ${trackingId} loaded. Select status and click Update.`, 'info');
        
        // Scroll to the update form
        const trackingSection = document.getElementById('tracking');
        if (trackingSection) {
            trackingSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// ===== UTILITY FUNCTIONS =====

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'approved': 'Approved',
        'dispatched': 'Dispatched',
        'enroute': 'En Route',
        'arrived': 'Arrived',
        'intransit': 'In Transit',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status || 'Unknown';
}

function getElementValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value.trim() : '';
}

function clearElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = '';
    }
}

function displayTableError(tableBodyId, colspan) {
    const tableBody = document.getElementById(tableBodyId);
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 2rem; color: var(--error-color);">
                    Error loading data
                </td>
            </tr>
        `;
    }
}

function displayTableEmpty(tableBody, colspan, message) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="${colspan}" style="text-align: center; padding: 2rem; color: var(--text-light);">
                ${message}
            </td>
        </tr>
    `;
}

function displayReviewsError() {
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading reviews</div>';
    }
}

// ===== NOTIFICATION SYSTEM =====

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 10px;
        padding: 0;
        line-height: 1;
    `;
    closeBtn.onclick = () => hideNotification(notification);
    
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => hideNotification(notification), 5000);
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

// ===== REFRESH FUNCTIONS =====

function refreshData() {
    const spinner = document.getElementById('refreshSpinner');
    if (spinner) {
        spinner.style.display = 'inline-block';
    }
    
    loadInitialData().then(() => {
        if (spinner) {
            spinner.style.display = 'none';
        }
        showNotification('Dashboard data refreshed', 'success');
    }).catch(error => {
        if (spinner) {
            spinner.style.display = 'none';
        }
        console.error('Error refreshing data:', error);
        showNotification('Error refreshing data', 'error');
    });
}

function startPeriodicRefresh() {
    // Refresh overview stats every 30 seconds
    refreshInterval = setInterval(() => {
        loadOverviewStats();
    }, 30000);
}

// ===== FILTER FUNCTIONS =====

function filterApplications() {
    const statusFilter = getElementValue('appStatusFilter');
    showNotification(`Filtering applications by: ${statusFilter}`, 'info');
    
    // In a real implementation, you would filter the data
    // For now, just reload with the filter applied
    loadApplicationsData();
}

function filterReviews() {
    const statusFilter = getElementValue('reviewStatusFilter');
    showNotification(`Filtering reviews by: ${statusFilter}`, 'info');
    
    // In a real implementation, you would filter the data
    loadReviewsData();
}

// ===== REPORT FUNCTIONS =====

async function loadReportsData() {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        // Get month's applications
        const monthApps = await db.collection('applications')
            .where('timestamp', '>=', startOfMonth)
            .get();
        
        updateStatCard('monthTrips', monthApps.size);
        
        // Calculate estimated revenue (demo calculation)
        const estimatedRevenue = monthApps.size * 50; // $50 average per trip
        updateStatCard('monthRevenue', `${estimatedRevenue.toLocaleString()}`);
        
        // Get unique customers this month
        const customers = new Set();
        monthApps.forEach(doc => {
            const data = doc.data();
            if (data.email) {
                customers.add(data.email);
            }
        });
        updateStatCard('activeCustomers', customers.size);
        
        // Calculate growth rate (demo calculation)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        
        const lastMonthApps = await db.collection('applications')
            .where('timestamp', '>=', lastMonth)
            .where('timestamp', '<', startOfMonth)
            .get();
        
        const growthRate = lastMonthApps.size > 0 ? 
            Math.round(((monthApps.size - lastMonthApps.size) / lastMonthApps.size) * 100) : 0;
        updateStatCard('growthRate', `${growthRate}%`);
        
    } catch (error) {
        console.error('Error loading report data:', error);
    }
}

function generateReport() {
    const reportType = getElementValue('reportType');
    const reportDate = getElementValue('reportDate');
    
    if (!reportDate) {
        showNotification('Please select a date for the report', 'error');
        return;
    }
    
    // In a real implementation, you would generate and download a report
    const reportInfo = `Report Type: ${reportType}\nDate: ${reportDate}`;
    console.log('Generating report:', reportInfo);
    showNotification(`Generating ${reportType} report for ${reportDate}...`, 'success');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('Report generated successfully! (Demo mode)', 'success');
    }, 2000);
}

// ===== MODAL FUNCTIONS (Placeholders) =====

function showNewBookingForm() {
    showNotification('New booking form feature coming soon', 'info');
    // In real implementation, show a modal with booking form
}

function showAddDriverForm() {
    showNotification('Add driver form feature coming soon', 'info');
    // In real implementation, show a modal with driver form
}

// ===== DRIVERS FUNCTIONS (Placeholder) =====

async function loadDriversData() {
    // Placeholder for driver management
    const tableBody = document.getElementById('driversTable');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    Driver management system coming soon
                </td>
            </tr>
        `;
    }
}

// ===== BOOKINGS FUNCTIONS (Placeholder) =====

async function loadBookingsData() {
    // For now, use applications data for bookings
    loadApplicationsData();
}

// ===== AUTH FUNCTIONS =====

function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    // Clean up listeners
    cleanupListeners();
    
    auth.signOut().then(() => {
        sessionStorage.removeItem('adminUser');
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }).catch((error) => {
        console.error('Logout error:', error);
        showNotification('Error during logout', 'error');
    });
}

// ===== CLEANUP FUNCTIONS =====

function cleanupListeners() {
    // Clear interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    // Cleanup Firestore listeners
    liveTrackingListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    liveTrackingListeners = [];
    
    // Cleanup Realtime Database listeners
    realtimeDb.ref('live_tracking').off();
}

// ===== PAGE LOAD INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    // Set today's date for report picker
    const reportDate = document.getElementById('reportDate');
    if (reportDate) {
        const today = new Date().toISOString().split('T')[0];
        reportDate.value = today;
    }
    
    console.log('Admin dashboard DOM loaded');
});

// ===== CLEANUP ON PAGE UNLOAD =====

window.addEventListener('beforeunload', () => {
    cleanupListeners();
});

// ===== GLOBAL ERROR HANDLER =====

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred', 'error');
});

// ===== EXPOSE FUNCTIONS GLOBALLY =====

// Make functions available globally for HTML onclick attributes
window.updateServiceStatus = updateServiceStatus;
window.viewApplication = viewApplication;
window.viewInquiry = viewInquiry;
window.approveApplication = approveApplication;
window.approveReview = approveReview;
window.rejectReview = rejectReview;
window.viewLiveTracking = viewLiveTracking;
window.setTrackingForUpdate = setTrackingForUpdate;
window.refreshData = refreshData;
window.filterApplications = filterApplications;
window.filterReviews = filterReviews;
window.generateReport = generateReport;
window.showNewBookingForm = showNewBookingForm;
window.showAddDriverForm = showAddDriverForm;
window.logout = logout;

console.log('Admin scripts loaded successfully');
