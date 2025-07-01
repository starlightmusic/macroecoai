// Authentication state management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionToken = localStorage.getItem('session_token');
        
        // Initialize authentication state
        this.init();
    }
    
    async init() {
        // Check if we have a stored session token
        if (this.sessionToken) {
            await this.validateSession();
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI based on authentication state
        this.updateUI();
    }
    
    async validateSession() {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setUser(data.user);
            } else {
                this.clearSession();
            }
        } catch (error) {
            console.error('Session validation error:', error);
            this.clearSession();
        }
    }
    
    setupEventListeners() {
        // Desktop auth buttons
        document.getElementById('login-btn')?.addEventListener('click', () => this.showLoginModal());
        document.getElementById('register-btn')?.addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        
        // Mobile auth buttons
        document.getElementById('mobile-login-btn')?.addEventListener('click', () => this.showLoginModal());
        document.getElementById('mobile-register-btn')?.addEventListener('click', () => this.showRegisterModal());
        document.getElementById('mobile-logout-btn')?.addEventListener('click', () => this.logout());
        
        // Modal controls
        document.getElementById('close-login-modal')?.addEventListener('click', () => this.hideLoginModal());
        document.getElementById('close-register-modal')?.addEventListener('click', () => this.hideRegisterModal());
        document.getElementById('switch-to-register')?.addEventListener('click', () => this.switchToRegister());
        document.getElementById('switch-to-login')?.addEventListener('click', () => this.switchToLogin());
        
        // Form submissions
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Close modals when clicking outside
        document.getElementById('login-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'login-modal') this.hideLoginModal();
        });
        document.getElementById('register-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'register-modal') this.hideRegisterModal();
        });
    }
    
    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('register-modal').classList.add('hidden');
        this.clearErrors();
    }
    
    showRegisterModal() {
        document.getElementById('register-modal').classList.remove('hidden');
        document.getElementById('login-modal').classList.add('hidden');
        this.clearErrors();
    }
    
    hideLoginModal() {
        document.getElementById('login-modal').classList.add('hidden');
        this.clearErrors();
    }
    
    hideRegisterModal() {
        document.getElementById('register-modal').classList.add('hidden');
        this.clearErrors();
    }
    
    switchToRegister() {
        this.hideLoginModal();
        this.showRegisterModal();
    }
    
    switchToLogin() {
        this.hideRegisterModal();
        this.showLoginModal();
    }
    
    clearErrors() {
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('register-error').classList.add('hidden');
    }
    
    showError(type, message) {
        const errorElement = document.getElementById(`${type}-error`);
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('login-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(e.target);
            const email = formData.get('email');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.setUser(data.user);
                this.sessionToken = data.session_token;
                localStorage.setItem('session_token', this.sessionToken);
                this.hideLoginModal();
                this.updateUI();
                
                // Notify preview tracker of login
                if (window.previewTracker) {
                    window.previewTracker.onUserLogin();
                }
                
                // Show success message
                this.showWelcomeMessage(data.user.name);
            } else {
                this.showError('login', data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login', 'Login failed. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('register-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing Up...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(e.target);
            const name = formData.get('name');
            const email = formData.get('email');
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.setUser(data.user);
                this.sessionToken = data.session_token;
                localStorage.setItem('session_token', this.sessionToken);
                this.hideRegisterModal();
                this.updateUI();
                
                // Notify preview tracker of login
                if (window.previewTracker) {
                    window.previewTracker.onUserLogin();
                }
                
                // Show success message
                this.showWelcomeMessage(data.user.name, true);
            } else {
                this.showError('register', data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showError('register', 'Registration failed. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async logout() {
        try {
            if (this.sessionToken) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.sessionToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
            this.updateUI();
            
            // Notify preview tracker of logout
            if (window.previewTracker) {
                window.previewTracker.onUserLogout();
            }
        }
    }
    
    setUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
    }
    
    clearSession() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionToken = null;
        localStorage.removeItem('session_token');
    }
    
    updateUI() {
        const authUnauthenticated = document.getElementById('auth-unauthenticated');
        const authAuthenticated = document.getElementById('auth-authenticated');
        const mobileAuthUnauthenticated = document.getElementById('mobile-auth-unauthenticated');
        const mobileAuthAuthenticated = document.getElementById('mobile-auth-authenticated');
        
        if (this.isAuthenticated && this.currentUser) {
            // Show authenticated state
            authUnauthenticated.classList.add('hidden');
            authAuthenticated.classList.remove('hidden');
            mobileAuthUnauthenticated.classList.add('hidden');
            mobileAuthAuthenticated.classList.remove('hidden');
            
            // Update user name displays
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('mobile-user-name').textContent = this.currentUser.name;
        } else {
            // Show unauthenticated state
            authUnauthenticated.classList.remove('hidden');
            authAuthenticated.classList.add('hidden');
            mobileAuthUnauthenticated.classList.remove('hidden');
            mobileAuthAuthenticated.classList.add('hidden');
        }
        
        // Update preview counter
        if (window.previewTracker) {
            window.previewTracker.updatePreviewCounter();
        }
    }
    
    showWelcomeMessage(name, isNewUser = false) {
        const message = isNewUser 
            ? `Welcome to MacroAI, ${name}! Your account has been created successfully.`
            : `Welcome back, ${name}!`;
            
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Public API methods
    getUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return this.isAuthenticated;
    }
    
    getSessionToken() {
        return this.sessionToken;
    }
}

// Initialize authentication manager when DOM is loaded
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Export for use in other modules
window.authManager = authManager;