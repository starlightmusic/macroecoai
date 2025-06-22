class EconomicDataManager {
    constructor(workerUrl) {
        this.workerUrl = workerUrl;
        this.cache = new Map();
        this.loadingStates = new Set();
    }

    async fetchLatestData() {
        if (this.loadingStates.has('latest')) {
            return this.cache.get('latest');
        }

        this.loadingStates.add('latest');

        try {
            const response = await fetch(`${this.workerUrl}/api/latest`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            this.cache.set('latest', result.data);
            return result.data;

        } catch (error) {
            console.error('Failed to fetch latest data:', error);
            throw error;
        } finally {
            this.loadingStates.delete('latest');
        }
    }

    async fetchEconomicData() {
        if (this.loadingStates.has('economic')) {
            return this.cache.get('economic');
        }

        this.loadingStates.add('economic');

        try {
            const response = await fetch(`${this.workerUrl}/api/economic-data`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch economic data');
            }

            this.cache.set('economic', result.data);
            return result.data;

        } catch (error) {
            console.error('Failed to fetch economic data:', error);
            throw error;
        } finally {
            this.loadingStates.delete('economic');
        }
    }

    async fetchNews() {
        if (this.loadingStates.has('news')) {
            return this.cache.get('news');
        }

        this.loadingStates.add('news');

        try {
            const response = await fetch(`${this.workerUrl}/api/news`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch news');
            }

            this.cache.set('news', result.data);
            return result.data;

        } catch (error) {
            console.error('Failed to fetch news:', error);
            throw error;
        } finally {
            this.loadingStates.delete('news');
        }
    }

    clearCache() {
        this.cache.clear();
    }

    formatIndicatorName(code) {
        const names = {
            'NY.GDP.MKTP.CD': 'GDP (Current US$)',
            'NY.GDP.PCAP.CD': 'GDP per Capita',
            'NY.GDP.MKTP.KD.ZG': 'GDP Growth Rate',
            'SL.UEM.TOTL.ZS': 'Unemployment Rate',
            'FP.CPI.TOTL.ZG': 'Inflation Rate',
            'PA.NUS.FCRF': 'Exchange Rate (ETB/USD)'
        };
        return names[code] || code;
    }

    formatValue(value, indicatorCode) {
        if (value === null || value === undefined) return 'N/A';

        const number = parseFloat(value);
        if (isNaN(number)) return 'N/A';

        switch (indicatorCode) {
            case 'NY.GDP.MKTP.CD':
                return `$${(number / 1e9).toFixed(1)}B`;
            case 'NY.GDP.PCAP.CD':
                return `$${number.toLocaleString()}`;
            case 'NY.GDP.MKTP.KD.ZG':
            case 'SL.UEM.TOTL.ZS':
            case 'FP.CPI.TOTL.ZG':
                return `${number.toFixed(1)}%`;
            case 'PA.NUS.FCRF':
                return `${number.toFixed(2)} ETB`;
            default:
                return number.toLocaleString();
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }
}

class EconomicDataRenderer {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center p-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-3">Loading...</span>
                </div>
            `;
        }
    }

    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex">
                        <div class="text-red-600">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Error</h3>
                            <p class="text-sm text-red-700 mt-1">${message}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderLatestData(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { economic, news } = data;

        container.innerHTML = `
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-blue-800">Latest Economic Indicators</h3>
                    <div class="space-y-3">
                        ${economic.map(item => `
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-medium text-gray-600">
                                        ${this.dataManager.formatIndicatorName(item.indicator_code)}
                                    </span>
                                    <span class="text-sm text-gray-500">${item.year}</span>
                                </div>
                                <div class="text-xl font-bold text-blue-600 mt-1">
                                    ${this.dataManager.formatValue(item.value, item.indicator_code)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-green-800">Recent Economic News</h3>
                    <div class="space-y-3">
                        ${news.slice(0, 5).map(article => `
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 class="font-medium text-gray-900 mb-2 line-clamp-2">
                                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" 
                                       class="hover:text-blue-600 transition-colors">
                                        ${article.title}
                                    </a>
                                </h4>
                                <p class="text-sm text-gray-600 mb-2 line-clamp-2">
                                    ${article.description || ''}
                                </p>
                                <div class="flex justify-between items-center text-xs text-gray-500">
                                    <span>${article.source}</span>
                                    <span>${this.dataManager.formatDate(article.published_at)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderEconomicChart(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Group data by indicator
        const groupedData = data.reduce((acc, item) => {
            if (!acc[item.indicator_code]) {
                acc[item.indicator_code] = [];
            }
            acc[item.indicator_code].push(item);
            return acc;
        }, {});

        // Create charts for each indicator
        container.innerHTML = `
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${Object.entries(groupedData).map(([code, items]) => {
                    const sortedItems = items.sort((a, b) => a.year.localeCompare(b.year));
                    return `
                        <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h4 class="font-semibold mb-3 text-gray-800">
                                ${this.dataManager.formatIndicatorName(code)}
                            </h4>
                            <div class="space-y-2">
                                ${sortedItems.slice(-5).map(item => `
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-gray-600">${item.year}</span>
                                        <span class="font-medium">
                                            ${this.dataManager.formatValue(item.value, code)}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Automatically detect if running locally or in production
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const workerUrl = isLocal ? 'http://localhost:8787' : 'https://macroecoai2.workers.dev';
    
    const dataManager = new EconomicDataManager(workerUrl);
    const renderer = new EconomicDataRenderer(dataManager);

    // Function to load and display latest data
    window.loadLatestEconomicData = async function(containerId = 'economic-data-container') {
        renderer.showLoading(containerId);
        
        try {
            const data = await dataManager.fetchLatestData();
            renderer.renderLatestData(data, containerId);
        } catch (error) {
            renderer.showError(containerId, 'Failed to load economic data. Please try again later.');
        }
    };

    // Function to load and display full economic data
    window.loadFullEconomicData = async function(containerId = 'economic-chart-container') {
        renderer.showLoading(containerId);
        
        try {
            const data = await dataManager.fetchEconomicData();
            renderer.renderEconomicChart(data, containerId);
        } catch (error) {
            renderer.showError(containerId, 'Failed to load economic data. Please try again later.');
        }
    };

    // Function to refresh data
    window.refreshEconomicData = function() {
        dataManager.clearCache();
        // Reload any visible data containers
        if (document.getElementById('economic-data-container')) {
            loadLatestEconomicData();
        }
        if (document.getElementById('economic-chart-container')) {
            loadFullEconomicData();
        }
    };
});