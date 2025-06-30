function toggleMobileMenu(){const m=document.getElementById('mobile-menu');m.classList.toggle('hidden');}
function initSmoothScrolling(){document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});});});}
function showLoading(e){e.disabled=true;e.classList.add('opacity-50','cursor-not-allowed');}
function hideLoading(e){e.disabled=false;e.classList.remove('opacity-50','cursor-not-allowed');}

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
        
        // Process documents
        if (data.documents && Object.keys(data.documents).length > 0) {
            Object.values(data.documents).forEach(doc => {
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
            
            // Show table
            spinner.style.display = 'none';
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
        const apiUrl = `/api/worldbank/text?url=${encodeURIComponent(txtUrl)}`;
        console.log('📡 Making fetch request to:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        console.log('📊 Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('✅ Successfully fetched text, length:', text.length);
        console.log('📝 First 200 chars:', text.substring(0, 200));
        
        // Show first 1000 characters of the document
        const preview = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
        modalContent.innerHTML = `<p class="whitespace-pre-wrap">${preview}</p>`;
        
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
});
