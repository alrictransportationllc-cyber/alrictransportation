// Mobile Navigation Script - Standalone and lightweight
// Works independently of other scripts

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }
    
    // Initialize mobile navigation
    function initMobileNav() {
        try {
            setupMobileToggle();
            setupNavCloseOnClick();
            setupResizeHandler();
            addMobileStyles();
        } catch (error) {
            console.warn('Mobile nav initialization error:', error);
        }
    }
    
    // Setup mobile toggle button
    function setupMobileToggle() {
        let mobileToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('nav');
        const navLinks = document.querySelector('.nav-links') || document.querySelector('nav ul');
        
        if (!nav || !navLinks) {
            console.warn('Navigation elements not found');
            return;
        }
        
        // Create toggle button if it doesn't exist
        if (!mobileToggle) {
            mobileToggle = createToggleButton();
            nav.appendChild(mobileToggle);
        }
        
        // Add toggle functionality
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = navLinks.classList.contains('mobile-open');
            
            if (isOpen) {
                closeNav();
            } else {
                openNav();
            }
        });
        
        // Functions to open/close nav
        function openNav() {
            navLinks.classList.add('mobile-open');
            mobileToggle.classList.add('open');
            document.body.classList.add('nav-open');
            
            // Add overlay
            if (!document.querySelector('.nav-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'nav-overlay';
                overlay.addEventListener('click', closeNav);
                document.body.appendChild(overlay);
            }
        }
        
        function closeNav() {
            navLinks.classList.remove('mobile-open');
            mobileToggle.classList.remove('open');
            document.body.classList.remove('nav-open');
            
            // Remove overlay
            const overlay = document.querySelector('.nav-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
        
        // Store functions globally for external access
        window.openMobileNav = openNav;
        window.closeMobileNav = closeNav;
    }
    
    // Create toggle button
    function createToggleButton() {
        const button = document.createElement('button');
        button.className = 'mobile-menu-toggle';
        button.setAttribute('aria-label', 'Toggle navigation menu');
        button.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        return button;
    }
    
    // Setup navigation link clicks to close menu
    function setupNavCloseOnClick() {
        const navLinks = document.querySelectorAll('.nav-links a, nav ul a');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Close mobile nav when link is clicked
                if (window.innerWidth <= 768) {
                    if (window.closeMobileNav) {
                        window.closeMobileNav();
                    }
                }
            });
        });
    }
    
    // Setup window resize handler
    function setupResizeHandler() {
        let resizeTimer;
        
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                // Close mobile nav on resize to desktop
                if (window.innerWidth > 768) {
                    if (window.closeMobileNav) {
                        window.closeMobileNav();
                    }
                }
            }, 250);
        });
    }
    
    // Add essential mobile styles
    function addMobileStyles() {
        // Check if styles already exist
        if (document.querySelector('#mobile-nav-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'mobile-nav-styles';
        style.textContent = `
            /* Mobile Navigation Styles */
            .mobile-menu-toggle {
                display: none;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 40px;
                height: 40px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background-color 0.3s ease;
            }
            
            .mobile-menu-toggle:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            .hamburger-line {
                width: 25px;
                height: 3px;
                background-color: #333;
                margin: 2px 0;
                transition: all 0.3s ease;
                border-radius: 2px;
            }
            
            .mobile-menu-toggle.open .hamburger-line:nth-child(1) {
                transform: rotate(45deg) translate(6px, 6px);
            }
            
            .mobile-menu-toggle.open .hamburger-line:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-toggle.open .hamburger-line:nth-child(3) {
                transform: rotate(-45deg) translate(6px, -6px);
            }
            
            .nav-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 998;
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
            }
            
            @keyframes fadeIn {
                to { opacity: 1; }
            }
            
            /* Mobile styles */
            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: flex;
                    order: 999;
                }
                
                nav {
                    position: relative;
                }
                
                .nav-links,
                nav ul {
                    position: fixed;
                    top: 0;
                    right: -100%;
                    width: 280px;
                    max-width: 80vw;
                    height: 100vh;
                    background: white;
                    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
                    z-index: 999;
                    padding: 80px 20px 20px;
                    overflow-y: auto;
                    transition: right 0.3s ease;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .nav-links.mobile-open,
                nav ul.mobile-open {
                    right: 0;
                }
                
                .nav-links li,
                nav ul li {
                    width: 100%;
                    margin: 0;
                    border-bottom: 1px solid #eee;
                }
                
                .nav-links li:last-child,
                nav ul li:last-child {
                    border-bottom: none;
                }
                
                .nav-links a,
                nav ul a {
                    display: block;
                    padding: 15px 0;
                    color: #333;
                    text-decoration: none;
                    font-size: 16px;
                    transition: color 0.3s ease;
                    width: 100%;
                }
                
                .nav-links a:hover,
                nav ul a:hover {
                    color: #007bff;
                }
                
                /* Prevent body scroll when nav is open */
                body.nav-open {
                    overflow: hidden;
                }
                
                /* Close button in mobile menu */
                .nav-links.mobile-open::before,
                nav ul.mobile-open::before {
                    content: "✕";
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    font-size: 24px;
                    color: #666;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #f5f5f5;
                }
            }
            
            /* Ensure nav is horizontal on desktop */
            @media (min-width: 769px) {
                .nav-links,
                nav ul {
                    position: static !important;
                    width: auto !important;
                    height: auto !important;
                    background: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    flex-direction: row !important;
                    overflow: visible !important;
                }
                
                .nav-links.mobile-open,
                nav ul.mobile-open {
                    right: auto !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Handle clicks on close button in mobile menu
    document.addEventListener('click', function(e) {
        if (e.target.textContent === '✕' && e.target.parentElement.classList.contains('mobile-open')) {
            if (window.closeMobileNav) {
                window.closeMobileNav();
            }
        }
    });
    
    // Initialize when DOM is ready
    ready(initMobileNav);
    
    // Backup initialization for slow-loading pages
    setTimeout(function() {
        if (!document.querySelector('.mobile-menu-toggle')) {
            initMobileNav();
        }
    }, 1000);
    
})();
