function toggleMobileMenu(){const m=document.getElementById('mobile-menu');m.classList.toggle('hidden');}
function initSmoothScrolling(){document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});});});}
function showLoading(e){e.disabled=true;e.classList.add('opacity-50','cursor-not-allowed');}
function hideLoading(e){e.disabled=false;e.classList.remove('opacity-50','cursor-not-allowed');}
function initThemeToggle(){const b=document.getElementById('theme-toggle');if(!b)return;const s=()=>{b.innerHTML=document.documentElement.classList.contains('dark')?'<i data-lucide="sun"></i>':'<i data-lucide="moon"></i>';lucide.createIcons();};b.addEventListener('click',()=>{document.documentElement.classList.toggle('dark');localStorage.setItem('theme',document.documentElement.classList.contains('dark')?'dark':'light');s();});if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}s();}
document.addEventListener('DOMContentLoaded',()=>{initSmoothScrolling();initThemeToggle();});
