function toggleMobileMenu(){const m=document.getElementById('mobile-menu');m.classList.toggle('hidden');}
function initSmoothScrolling(){document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});});});}
function showLoading(e){e.disabled=true;e.classList.add('opacity-50','cursor-not-allowed');}
function hideLoading(e){e.disabled=false;e.classList.remove('opacity-50','cursor-not-allowed');}

async function fetchWorldBankData() {
    const button = document.getElementById('worldbank-btn');
    const section = document.getElementById('worldbank-section');
    const spinner = document.getElementById('loading-spinner');
    const errorMsg = document.getElementById('error-message');
    const tableContainer = document.getElementById('data-table-container');
    const tableBody = document.getElementById('worldbank-data');
    
    // Show section and loading state
    section.style.display = 'block';
    spinner.style.display = 'block';
    errorMsg.style.display = 'none';
    tableContainer.style.display = 'none';
    showLoading(button);
    
    // Scroll to section
    section.scrollIntoView({ behavior: 'smooth' });
    
    try {
        const response = await fetch('https://search.worldbank.org/api/v3/wds?format=json&owner=EMFMD&fl=count,txturl&strdate=2024-01-01&rows=100');
        
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
    } finally {
        hideLoading(button);
    }
}

document.addEventListener('DOMContentLoaded',()=>{initSmoothScrolling();});
