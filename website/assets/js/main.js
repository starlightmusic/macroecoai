function toggleMobileMenu(){const m=document.getElementById('mobile-menu');m.classList.toggle('hidden');}
function initSmoothScrolling(){document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});});});}
function showLoading(e){e.disabled=true;e.classList.add('opacity-50','cursor-not-allowed');}
function hideLoading(e){e.disabled=false;e.classList.remove('opacity-50','cursor-not-allowed');}
document.addEventListener('DOMContentLoaded',()=>{initSmoothScrolling();});
