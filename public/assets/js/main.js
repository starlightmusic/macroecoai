function toggleMobileMenu(){const m=document.getElementById('mobile-menu');m.classList.toggle('hidden');}
function initSmoothScrolling(){document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});});});}
function showLoading(e){e.disabled=true;e.classList.add('opacity-50','cursor-not-allowed');}
function hideLoading(e){e.disabled=false;e.classList.remove('opacity-50','cursor-not-allowed');}

// Global variables for filtering
let allDocuments = [];
let macroPovertyFilterEnabled = true;

async function fetchWorldBankData() {
    const spinner = document.getElementById('loading-spinner');
    const errorMsg = document.getElementById('error-message');
    const tableContainer = document.getElementById('data-table-container');
    const tableBody = document.getElementById('worldbank-data');
    
    // Show loading state
    spinner.style.display = 'block';
    errorMsg.style.display = 'none';
    tableContainer.style.display = 'none';
    
    try {
        const response = await fetch('/api/worldbank');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Clear existing data
        tableBody.innerHTML = '';
        
        // Store all documents and process them
        if (data.documents && Object.keys(data.documents).length > 0) {
            allDocuments = Object.values(data.documents);
            renderFilteredDocuments();
            
            // Show filter controls and table
            const filterControls = document.getElementById('filter-controls');
            spinner.style.display = 'none';
            filterControls.style.display = 'block';
            tableContainer.style.display = 'block';
        } else {
            throw new Error('No documents found in response');
        }
        
    } catch (error) {
        console.error('Error fetching World Bank data:', error);
        spinner.style.display = 'none';
        errorMsg.style.display = 'block';
    }
}

function isMacroPovertyOutlook(title) {
    // Pattern: "Macro Poverty Outlook for [Country] : [Month Year]"
    const pattern = /^Macro Poverty Outlook for .+ : \w+ \d{4}$/;
    return pattern.test(title);
}

function renderFilteredDocuments() {
    const tableBody = document.getElementById('worldbank-data');
    const documentCount = document.getElementById('document-count');
    
    // Clear existing data
    tableBody.innerHTML = '';
    
    // Filter documents based on current filter state
    let filteredDocuments = allDocuments;
    if (macroPovertyFilterEnabled) {
        filteredDocuments = allDocuments.filter(doc => 
            isMacroPovertyOutlook(doc.display_title || '')
        );
    }
    
    // Render filtered documents
    filteredDocuments.forEach(doc => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const country = doc.count || 'N/A';
        const title = doc.display_title || 'Untitled Document';
        const pdfUrl = doc.pdfurl || '';
        const txtUrl = doc.txturl || '';
        
        row.innerHTML = `
            <td class="px-4 py-3 font-medium">${country}</td>
            <td class="px-4 py-3">${title}</td>
            <td class="px-4 py-3 text-center">
                ${pdfUrl ? `<a href="${pdfUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">PDF</a>` : 'N/A'}
            </td>
            <td class="px-4 py-3 text-center">
                ${txtUrl ? `<a href="${txtUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">Text</a>` : 'N/A'}
            </td>
            <td class="px-4 py-3 text-center">
                ${txtUrl ? `<button onclick="showDocumentPreview('${txtUrl}', '${title.replace(/'/g, "&#39;")}')" class="btn-secondary text-sm">Preview</button>` : 'N/A'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update document count
    if (macroPovertyFilterEnabled) {
        documentCount.textContent = `Showing ${filteredDocuments.length} of ${allDocuments.length} documents`;
    } else {
        documentCount.textContent = `Showing all ${allDocuments.length} documents`;
    }
}

async function showDocumentPreview(txtUrl, title) {
    const modal = document.getElementById('document-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalLoading = document.getElementById('modal-loading');
    const modalContent = document.getElementById('modal-content');
    const modalError = document.getElementById('modal-error');
    
    // DEBUG: Log the txtUrl being used
    console.log('🔍 DEBUG: Document preview requested');
    console.log('📄 Title:', title);
    console.log('🔗 txtUrl:', txtUrl);
    console.log('🌐 API endpoint:', `/api/worldbank/text?url=${encodeURIComponent(txtUrl)}`);
    
    // Show modal
    modal.style.display = 'flex';
    modalTitle.textContent = title;
    modalLoading.style.display = 'block';
    modalContent.style.display = 'none';
    modalError.style.display = 'none';
    
    try {
        const apiUrl = `/api/worldbank/summary?url=${encodeURIComponent(txtUrl)}`;
        console.log('🤖 Making AI summary request to:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        console.log('📊 Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Successfully generated AI summary');
        console.log('📝 Summary length:', result.summaryLength);
        console.log('📄 Original length:', result.originalLength);
        
        // Display the AI-generated summary
        modalContent.innerHTML = `
            <div class="ai-summary">
                <div class="ai-badge mb-4">
                    <span class="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        🤖 AI Summary (${result.summaryLength} words from ${result.originalLength} chars)
                    </span>
                </div>
                <div class="summary-text">
                    ${result.summary.split('\n').map(paragraph => 
                        paragraph.trim() ? `<p class="mb-4">${paragraph.trim()}</p>` : ''
                    ).join('')}
                </div>
            </div>
        `;
        
        modalLoading.style.display = 'none';
        modalContent.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error fetching document text:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        modalLoading.style.display = 'none';
        modalError.style.display = 'block';
    }
}

function closeDocumentModal() {
    const modal = document.getElementById('document-modal');
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScrolling();
    
    // Note: Authentication is handled by auth.js which loads before this script
    
    // Auto-load World Bank data on homepage
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        fetchWorldBankData();
    }
    
    // Setup modal close functionality
    const closeBtn = document.getElementById('close-modal');
    const modal = document.getElementById('document-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDocumentModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDocumentModal();
            }
        });
    }
    
    // Setup filter toggle functionality
    const filterToggle = document.getElementById('macro-poverty-filter');
    if (filterToggle) {
        filterToggle.addEventListener('change', (e) => {
            macroPovertyFilterEnabled = e.target.checked;
            if (allDocuments.length > 0) {
                renderFilteredDocuments();
            }
        });
    }
});
