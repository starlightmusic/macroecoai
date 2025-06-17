function validateForm(f){clearErrors();let valid=true;f.querySelectorAll('[required]').forEach(i=>{if(!i.value){showError(i,'This field is required');valid=false;}});return valid;}
function handleFormSubmit(e){const f=e.target;if(!validateForm(f)){e.preventDefault();return;}showLoading(f.querySelector('button[type="submit"]'));}
function showError(field,msg){const s=document.createElement('p');s.className='text-red-600 text-sm mt-1';s.innerText=msg;field.classList.add('border-red-600');field.parentNode.appendChild(s);}
function clearErrors(){document.querySelectorAll('.text-red-600.text-sm.mt-1').forEach(e=>e.remove());document.querySelectorAll('.border-red-600').forEach(e=>e.classList.remove('border-red-600'));}
function showSuccess(msg){alert(msg);}
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('form').forEach(f=>{f.addEventListener('submit',handleFormSubmit);});});
