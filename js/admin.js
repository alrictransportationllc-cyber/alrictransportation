// admin-dashboard.js - Clean Firebase Admin Dashboard
'use strict';

// Firebase Configuration
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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const realtimeDb = firebase.database();

// Global variables
let currentUser = null;
let refreshInterval = null;
let listeners = [];

// ===== AUTHENTICATION & INITIALIZATION =====

// Check if user is admin
async function isAdminUser(user) {
    try {
        // Check if user exists in admins collection
        const adminDoc = await db.collection('admins').doc(user.uid).get();
        if (adminDoc.exists && adminDoc.data().active === true) {
            return true;
        }
        
        // Fallback: check custom claims
        const token = await user.getIdTokenResult();
        return token.claims.admin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Authentication state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const isAdmin = await isAdminUser(user);
        if (isAdmin) {
            currentUser = user;
            initializeDashboard();
        } else {
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

// Initialize dashboard
function initializeDashboard() {
    console.log('Initializing admin dashboard...');
    updateUserInfo();
    setupNavigation();
    loadDashboardData();
    setupRealtimeListeners();
    startPeriodicRefresh();
}

function updateUserInfo() {
    if (!currentUser) return;
    
    const adminNameEl = document.getElementById('adminName');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (adminNameEl) {
        adminNameEl.textContent = currentUser.email.split('@')[0] || 'Admin';
    }
    
    if (userAvatarEl) {
        userAvatarEl.textContent = currentUser.email.charAt(0).toUpperCase();
    }
}

// ===== NAVIGATION =====

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });
}

function handleNavClick(e) {
    e.preventDefault();
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    
    // Show section
    const sectionId = this.dataset.section;
    showSection(sectionId);
    
    // Update title
    const title = this.textContent.trim().replace(/^\S+\s/, ''); // Remove emoji
    document.getElementById('pageTitle').textContent = title;
    
    // Load section data
    loadSectionData(sectionId);
}

function showSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'applications':
            loadApplicationsData();
            break;
        case 'tracking':
            loadTrackingData();
            break;
        case 'inquiries':
            loadInquiriesData();
            break;
        case 'reviews':
            loadReviewsData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// ===== DATA LOADING =====

async function loadDashboardData() {
    try {
        await Promise.all([
            loadOverviewStats(),
            loadRecentActivity(),
            loadApplicationsData(),
            loadInquiriesData()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Overview data
async function loadOverviewData() {
    await Promise.all([
        loadOverviewStats(),
        loadRecentActivity()
    ]);
}

async function loadOverviewStats() {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Today's applications
        const todayApps = await db.collection('applications')
            .where('timestamp', '>=', startOfDay)
            .get();
        updateStatCard('todayApplications', todayApps.size);
        
        // Completed services
        const completedServices = await db.collection('applications')
            .where('status', '==', 'completed')
            .get();
        updateStatCard('completedServices', completedServices.size);
        
        // Active services
        const activeServices = await db.collection('applications')
            .where('status', 'in', ['approved', 'dispatched', 'enroute', 'arrived', 'intransit'])
            .get();
        updateStatCard('activeServices', activeServices.size);
        
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

// Recent activity
async function loadRecentActivity() {
    try {
        const activities = await db.collection('applications')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        displayRecentActivity(activities);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        displayTableError('recentActivityTable', 4, 'Error loading activity');
    }
}

function displayRecentActivity(snapshot) {
    const tableBody = document.getElementById('recentActivityTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (snapshot.empty) {
        displayTableEmpty(tableBody, 4, 'No recent activity');
        return;
    }
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const row = createActivityRow(data);
        tableBody.appendChild(row);
    });
}

function createActivityRow(data) {
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

// Applications data
async function loadApplicationsData() {
    try {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        
        let query = db.collection('applications').orderBy('timestamp', 'desc').limit(50);
        
        if (statusFilter !== 'all') {
            query = db.collection('applications')
                .where('status', '==', statusFilter)
                .orderBy('timestamp', 'desc')
                .limit(50);
        }
        
        const applications = await query.get();
        displayApplications(applications);
    } catch (error) {
        console.error('Error loading applications:', error);
        displayTableError('applicationsTable', 6, 'Error loading applications');
    }
}

function displayApplications(snapshot) {
    const tableBody = document.getElementById('applicationsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (snapshot.empty) {
        displayTableEmpty(tableBody, 6, 'No applications found');
        return;
    }
    
    snapshot.forEach(doc => {
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
            ${data.status === 'pending' ? `<button class="action-btn btn-edit" onclick="approveApplication('${docId}')">Approve</button>` : ''}
        </td>
    `;
    
    return row;
}

// Tracking data
async function loadTrackingData() {
    try {
        const trackingSnapshot = await realtimeDb.ref('live_tracking').once('value');
        const trackingData = trackingSnapshot.val();
        
        displayTrackingData(trackingData);
    } catch (error) {
        console.error('Error loading tracking data:', error);
        displayTableError('trackingTable', 6, 'Error loading tracking data');
    }
}

function displayTrackingData(trackingData) {
    const tableBody = document.getElementById('trackingTable');
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
        <td>${data.customerName || 'N/A'}</td>
        <td>${data.serviceType || 'N/A'}</td>
        <td><span class="status-badge status-${data.status || 'pending'}">${getStatusText(data.status)}</span></td>
        <td>${lastUpdated}</td>
        <td>
            <button class="action-btn btn-view" onclick="viewTracking('${trackingId}')">Track</button>
            <button class="action-btn btn-edit" onclick="setTrackingId('${trackingId}')">Update</button>
        </td>
    `;
    
    return row;
}

// Inquiries data
async function loadInquiriesData() {
    try {
        const inquiries = await db.collection('contacts')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        displayInquiries(inquiries);
    } catch (error) {
        console.error('Error loading inquiries:', error);
        displayTableError('inquiriesTable', 6, 'Error loading inquiries');
    }
}

function displayInquiries(snapshot) {
    const tableBody = document.getElementById('inquiriesTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (snapshot.empty) {
        displayTableEmpty(tableBody, 6, 'No inquiries found');
        return;
    }
    
    snapshot.forEach(doc => {
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
        <td>
            <button class="action-btn btn-view" onclick="viewInquiry('${docId}')">View</button>
        </td>
    `;
    
    return row;
}

// Reviews data
async function loadReviewsData() {
    try {
        const reviewFilter = document.getElementById('reviewFilter')?.value || 'all';
        
        let query = db.collection('reviews').orderBy('timestamp', 'desc').limit(20);
        
        if (reviewFilter === 'pending') {
            query = db.collection('reviews')
                .where('approved', '==', false)
                .orderBy('timestamp', 'desc')
                .limit(20);
        } else if (reviewFilter === 'approved') {
            query = db.collection('reviews')
                .where('approved', '==', true)
                .orderBy('timestamp', 'desc')
                .limit(20);
        }
        
        const reviews = await query.get();
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        displayReviewsError();
    }
}

function displayReviews(snapshot) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    reviewsList.innerHTML = '';
    
    if (snapshot.empty) {
        reviewsList.innerHTML = '<div class="loading">No reviews found</div>';
        return;
    }
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const reviewItem = createReviewItem(doc.id, data);
        reviewsList.appendChild(reviewItem);
    });
}

function createReviewItem(docId, data) {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    reviewItem.style.cssText = `
        background: var(--light-gray);
        padding: 1.5rem;
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
    `;
    
    const timestamp = data.timestamp?.toDate() || new Date();
    const dateString = timestamp.toLocaleDateString();
    const stars = generateStars(data.rating || 0);
    const isApproved = data.approved === true;
    
    reviewItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
                <strong>${data.customerName || 'Anonymous'}</strong>
                <div style="color: #FFD700; font-size: 1.2rem;">${stars}</div>
            </div>
            <div style="color: var(--text-light); font-size: 0.9rem;">${dateString}</div>
        </div>
        <p style="margin-bottom: 1rem;">${data.reviewText || 'No review text'}</p>
        <p style="margin-bottom: 1rem;"><strong>Service:</strong> ${data.serviceUsed || 'N/A'}</p>
        <div style="margin-top: 10px;">
            ${!isApproved ? `<button class="action-btn btn-edit" onclick="approveReview('${docId}')">Approve</button>` : '<span style="color: var(--success-color); font-weight: bold;">✓ Approved</span>'}
            <button class="action-btn btn-delete" onclick="deleteReview('${docId}')">Delete</button>
        </div>
    `;
    
    return reviewItem;
}

function generateStars(rating) {
    const filledStars = Math.floor(rating);
    const emptyStars = 5 - filledStars;
    return '★'.repeat(filledStars) + '☆'.repeat(emptyStars);
}

// Reports data
async function loadReportsData() {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        // Month's services
        const monthServices = await db.collection('applications')
            .where('timestamp', '>=', startOfMonth)
            .get();
        
        updateStatCard('monthServices', monthServices.size);
        
        // Estimated revenue (demo calculation)
        const estimatedRevenue = monthServices.size * 75; // $75 average per service
        updateStatCard('monthRevenue', `$${estimatedRevenue.toLocaleString()}`);
        
        // Unique customers
        const customers = new Set();
        monthServices.forEach(doc => {
            const email = doc.data().email;
            if (email) customers.add(email);
        });
        updateStatCard('activeCustomers', customers.size);
        
        // Growth rate calculation
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        
        const lastMonthServices = await db.collection('applications')
            .where('timestamp', '>=', lastMonthStart)
            .where('timestamp', '<', startOfMonth)
            .get();
        
        const growthRate = lastMonthServices.size > 0 ? 
            Math.round(((monthServices.size - lastMonthServices.size) / lastMonthServices.size) * 100) : 0;
        
        updateStatCard('growthRate', `${growthRate}%`);
        
    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}

// ===== REALTIME LISTENERS =====

function setupRealtimeListeners() {
    // Applications listener
    const applicationsListener = db.collection('applications')
        .onSnapshot((snapshot) => {
            if (getCurrentSection() === 'overview' || getCurrentSection() === 'applications') {
                loadOverviewStats();
                if (getCurrentSection() === 'applications') {
                    loadApplicationsData();
                }
            }
        });
    
    // Contacts listener
    const contactsListener = db.collection('contacts')
        .onSnapshot((snapshot) => {
            if (getCurrentSection() === 'inquiries') {
                loadInquiriesData();
            }
        });
    
    // Tracking listener
    const trackingListener = realtimeDb.ref('live_tracking')
        .on('value', (snapshot) => {
            if (getCurrentSection() === 'tracking') {
                displayTrackingData(snapshot.val());
            }
        });
    
    listeners = [applicationsListener, contactsListener, trackingListener];
}

function getCurrentSection() {
    const activeSection = document.querySelector('.dashboard-section.active');
    return activeSection ? activeSection.id : null;
}

// ===== ACTION FUNCTIONS =====

// Update service status
async function updateServiceStatus() {
    const trackingId = document.getElementById('trackingIdInput')?.value.trim();
    const status = document.getElementById('statusSelect')?.value;
    
    if (!trackingId || !status) {
        showNotification('Please enter tracking ID and select status', 'error');
        return;
    }
    
    try {
        // Update realtime database
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
        
        // Clear input
        const input = document.getElementById('trackingIdInput');
        if (input) input.value = '';
        
        // Refresh tracking data
        loadTrackingData();
        
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

// View application
async function viewApplication(docId) {
    try {
        const doc = await db.collection('applications').doc(docId).get();
        const data = doc.data();
        
        if (data) {
            const details = formatApplicationDetails(data);
            alert(details);
        }
    } catch (error) {
        console.error('Error viewing application:', error);
        showNotification('Error loading application details', 'error');
    }
}

function formatApplicationDetails(data) {
    return `Application Details:

Name: ${data.firstName || ''} ${data.lastName || ''}
Email: ${data.email || ''}
Phone: ${data.phone || ''}
Address: ${data.address || ''}
Service: ${data.primaryService || ''}
Status: ${getStatusText(data.status)}
Tracking ID: ${data.trackingId || ''}
Date Submitted: ${data.timestamp?.toDate()?.toLocaleDateString() || 'N/A'}`;
}

// Approve application
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

// View inquiry
async function viewInquiry(docId) {
    try {
        const doc = await db.collection('contacts').doc(docId).get();
        const data = doc.data();
        
        if (data) {
            const details = formatInquiryDetails(data);
            const response = prompt(`${details}\n\nEnter your response (optional):`);
            
            if (response && response.trim()) {
                // Log the response
                await db.collection('contacts').doc(docId).update({
                    adminResponse: response,
                    respondedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    respondedBy: currentUser.email
                });
                
                showNotification('Response logged successfully', 'success');
            }
        }
    } catch (error) {
        console.error('Error viewing inquiry:', error);
        showNotification('Error loading inquiry details', 'error');
    }
}

function formatInquiryDetails(data) {
    return `Inquiry Details:

From: ${data.firstName || ''} ${data.lastName || ''}
Email: ${data.email || ''}
Phone: ${data.phone || ''}
Service: ${data.serviceNeeded || 'General Inquiry'}
Urgency: ${data.urgency || 'Normal'}
Date: ${data.timestamp?.toDate()?.toLocaleDateString() || 'N/A'}

Message:
${data.message || 'No message provided'}`;
}

// Approve review
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

// Delete review
async function deleteReview(docId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }
    
    try {
        await db.collection('reviews').doc(docId).delete();
        showNotification('Review deleted successfully', 'success');
        loadReviewsData();
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Error deleting review', 'error');
    }
}

// View tracking
function viewTracking(trackingId) {
    const trackingUrl = `../track.html?track=${trackingId}`;
    window.open(trackingUrl, '_blank');
}

// Set tracking ID for update
function setTrackingId(trackingId) {
    const input = document.getElementById('trackingIdInput');
    if (input) {
        input.value = trackingId;
        showNotification(`Tracking ID ${trackingId} loaded. Select status and update.`, 'info');
    }
}

// ===== FILTER FUNCTIONS =====

function filterApplications() {
    loadApplicationsData();
    showNotification('Applications filtered', 'info');
}

function filterReviews() {
    loadReviewsData();
    showNotification('Reviews filtered', 'info');
}

// ===== REPORT FUNCTIONS =====

function generateReport() {
    const reportType = document.getElementById('reportType')?.value;
    const reportDate = document.getElementById('reportDate')?.value;
    
    if (!reportDate) {
        showNotification('Please select a date for the report', 'error');
        return;
    }
    
    // Demo implementation
    showNotification(`Generating ${reportType} report for ${reportDate}...`, 'info');
    
    setTimeout(() => {
        showNotification('Report generated successfully (demo)', 'success');
    }, 2000);
}

// ===== REFRESH FUNCTIONS =====

function refreshData() {
    const spinner = document.getElementById('refreshSpinner');
    if (spinner) {
        spinner.style.display = 'inline-block';
    }
    
    loadDashboardData().then(() => {
        if (spinner) {
            spinner.style.display = 'none';
        }
        showNotification('Data refreshed successfully', 'success');
    }).catch(error => {
        if (spinner) {
            spinner.style.display = 'none';
        }
        console.error('Error refreshing data:', error);
        showNotification('Error refreshing data', 'error');
    });
}

function startPeriodicRefresh() {
    // Refresh stats every 30 seconds
    refreshInterval = setInterval(() => {
        if (getCurrentSection() === 'overview') {
            loadOverviewStats();
        }
    }, 30000);
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

function displayTableError(tableBodyId, colspan, message) {
    const tableBody = document.getElementById(tableBodyId);
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="loading" style="color: var(--error-color);">
                    ${message}
                </td>
            </tr>
        `;
    }
}

function displayTableEmpty(tableBody, colspan, message) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="loading">
                ${message}
            </td>
        </tr>
    `;
}

function displayReviewsError() {
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        reviewsList.innerHTML = '<div class="loading" style="color: var(--error-color);">Error loading reviews</div>';
    }
}

// ===== NOTIFICATION SYSTEM =====

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 4 seconds
    setTimeout(() => hideNotification(notification), 4000);
    
    // Click to dismiss
    notification.addEventListener('click', () => hideNotification(notification));
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

// ===== LOGOUT FUNCTION =====

function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    // Cleanup
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
    // Clear refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    // Cleanup Firestore listeners
    listeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    listeners = [];
    
    // Cleanup Realtime Database listeners
    realtimeDb.ref('live_tracking').off();
}

// ===== PAGE INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    // Set today's date for report picker
    const reportDate = document.getElementById('reportDate');
    if (reportDate) {
        const today = new Date().toISOString().split('T')[0];
        reportDate.value = today;
    }
    
    console.log('Admin dashboard DOM ready');
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

// ===== EXPOSE FUNCTIONS FOR HTML =====

// Make functions available globally for onclick attributes
window.updateServiceStatus = updateServiceStatus;
window.viewApplication = viewApplication;
window.approveApplication = approveApplication;
window.viewInquiry = viewInquiry;
window.approveReview = approveReview;
window.deleteReview = deleteReview;
window.viewTracking = viewTracking;
window.setTrackingId = setTrackingId;
window.filterApplications = filterApplications;
window.filterReviews = filterReviews;
window.generateReport = generateReport;
window.refreshData = refreshData;
window.logout = logout;

console.log('Admin dashboard JavaScript loaded successfully');
