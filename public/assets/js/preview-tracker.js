// Preview tracking system for authenticated and unauthenticated users
class PreviewTracker {
    constructor() {
        this.maxFreepreviews = 3;
        this.storageKey = 'free_preview_count';
        this.init();
    }
    
    init() {
        this.updatePreviewCounter();
    }
    
    // Get current preview count for unauthenticated users
    getFreePreviewCount() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? parseInt(stored, 10) : 0;
    }
    
    // Set preview count for unauthenticated users
    setFreePreviewCount(count) {
        localStorage.setItem(this.storageKey, count.toString());
        this.updatePreviewCounter();
    }
    
    // Get remaining free previews for unauthenticated users
    getRemainingFreePreviews() {
        return Math.max(0, this.maxFreepreviews - this.getFreePreviewCount());
    }
    
    // Check if user can preview (for unauthenticated users)
    canPreview() {
        if (window.authManager && window.authManager.isLoggedIn()) {
            return true; // Authenticated users can always preview
        }
        return this.getFreePreviewCount() < this.maxFreepreviews;
    }
    
    // Increment preview count and return whether preview is allowed
    usePreview() {
        if (window.authManager && window.authManager.isLoggedIn()) {
            // For authenticated users, increment via API
            this.incrementAuthenticatedPreview();
            return true;
        } else {
            // For unauthenticated users, use localStorage
            const currentCount = this.getFreePreviewCount();
            if (currentCount >= this.maxFreepreviews) {
                this.showRegistrationPrompt();
                return false;
            }
            this.setFreePreviewCount(currentCount + 1);
            return true;
        }
    }
    
    // Increment preview count for authenticated users via API
    async incrementAuthenticatedPreview() {
        try {
            const response = await fetch('/api/auth/increment-preview', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.authManager.getSessionToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Update user object with new preview count
                if (window.authManager.currentUser) {
                    window.authManager.currentUser.preview_count = data.preview_count;
                }
                this.updatePreviewCounter();
            }
        } catch (error) {
            console.error('Error incrementing preview count:', error);
        }
    }
    
    // Update the preview counter in the UI
    updatePreviewCounter() {
        const counterElement = document.getElementById('preview-counter');
        const mobileCounterElement = document.getElementById('mobile-preview-counter');
        
        let content = '';
        
        if (window.authManager && window.authManager.isLoggedIn()) {
            // Show total previews for authenticated users
            const count = window.authManager.currentUser?.preview_count || 0;
            content = `
                <span class="text-sm text-slate-600">
                    Previews: <span class="font-semibold text-blue-600">${count}</span>
                </span>
            `;
        } else {
            // Show remaining previews for unauthenticated users
            const remaining = this.getRemainingFreePreviews();
            const used = this.getFreePreviewCount();
            
            if (remaining > 0) {
                content = `
                    <span class="text-sm text-slate-600">
                        Free previews: <span class="font-semibold text-green-600">${remaining}</span> left
                    </span>
                `;
            } else {
                content = `
                    <span class="text-sm text-red-600">
                        <span class="font-semibold">Sign up</span> for unlimited previews
                    </span>
                `;
            }
        }
        
        // Update both desktop and mobile counters
        if (counterElement) {
            counterElement.innerHTML = content;
            counterElement.classList.remove('hidden');
        }
        
        if (mobileCounterElement) {
            mobileCounterElement.innerHTML = content;
        }
    }
    
    // Show registration prompt modal
    showRegistrationPrompt() {
        const modal = document.getElementById('preview-limit-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            // Create modal if it doesn't exist
            this.createRegistrationPromptModal();
        }
    }
    
    // Create the registration prompt modal
    createRegistrationPromptModal() {
        const modalHTML = `
            <div id="preview-limit-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                                <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c.77.833 1.732 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Preview Limit Reached</h3>
                        <p class="text-sm text-gray-500 mb-6">
                            You've used all ${this.maxFreePreviews} free previews. Create a free account to get unlimited document previews and AI summaries.
                        </p>
                        <div class="flex space-x-3">
                            <button id="prompt-register-btn" class="btn-primary flex-1">
                                Sign Up Free
                            </button>
                            <button id="prompt-login-btn" class="btn-secondary flex-1">
                                Sign In
                            </button>
                        </div>
                        <button id="close-preview-limit-modal" class="mt-4 text-sm text-gray-500 hover:text-gray-700">
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners
        document.getElementById('prompt-register-btn')?.addEventListener('click', () => {
            this.hideRegistrationPrompt();
            if (window.authManager) {
                window.authManager.showRegisterModal();
            }
        });
        
        document.getElementById('prompt-login-btn')?.addEventListener('click', () => {
            this.hideRegistrationPrompt();
            if (window.authManager) {
                window.authManager.showLoginModal();
            }
        });
        
        document.getElementById('close-preview-limit-modal')?.addEventListener('click', () => {
            this.hideRegistrationPrompt();
        });
        
        // Close modal when clicking outside
        document.getElementById('preview-limit-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'preview-limit-modal') {
                this.hideRegistrationPrompt();
            }
        });
    }
    
    // Hide registration prompt modal
    hideRegistrationPrompt() {
        const modal = document.getElementById('preview-limit-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    // Reset free preview count (useful for testing)
    resetFreePreviewCount() {
        localStorage.removeItem(this.storageKey);
        this.updatePreviewCounter();
    }
    
    // Clear preview count when user logs in (transfer to authenticated tracking)
    onUserLogin() {
        // Clear the localStorage count since we're now tracking server-side
        localStorage.removeItem(this.storageKey);
        this.updatePreviewCounter();
    }
    
    // Restore local tracking when user logs out
    onUserLogout() {
        this.updatePreviewCounter();
    }
}

// Initialize preview tracker when DOM is loaded
let previewTracker;

document.addEventListener('DOMContentLoaded', () => {
    previewTracker = new PreviewTracker();
});

// Export for use in other modules
window.previewTracker = previewTracker;