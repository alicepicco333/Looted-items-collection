
    const modal       = document.getElementById("imageModal");
    const expandedImg = document.getElementById("expandedImg");
    const modalContent = document.querySelector(".modal-content");
    
  
    let scale = 1;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    

    function openModal(src) {
     
        expandedImg.src = src;
        
       
        scale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
    
     
        modal.style.display = "block";
    }
    

    function closeModal() {
        modal.style.display = "none";
    }
    
 
    function applyTransform() {
        expandedImg.style.transform = `
            translate(-50%, -50%)
            translate(${translateX}px, ${translateY}px)
            scale(${scale})
        `;}
    
 
    expandedImg.addEventListener('wheel', (e) => {
        e.preventDefault(); 
    
     
        scale -= e.deltaY * 0.001;
        
       
        if (scale < 0.2) scale = 0.2;
        if (scale > 10) scale = 10;
    
        applyTransform();
    });
    
   
    expandedImg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
   
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });
    
  
    expandedImg.addEventListener('mousemove', (e) => {
        if (!isDragging) return; 
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    });
    

    expandedImg.addEventListener('mouseup', () => {
        isDragging = false;
    });
    expandedImg.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
 
    window.openModal = openModal;
    window.closeModal = closeModal;


let isTouchDragging = false;
let touchStartX = 0;
let touchStartY = 0;


expandedImg.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isTouchDragging = true;


    const touch = e.touches[0];
    touchStartX = touch.clientX - translateX;
    touchStartY = touch.clientY - translateY;

    modalContent.style.cursor = 'grabbing';
});


expandedImg.addEventListener('touchmove', (e) => {
    if (!isTouchDragging) return;

    e.preventDefault();

   
    const touch = e.touches[0];
    translateX = touch.clientX - touchStartX;
    translateY = touch.clientY - touchStartY;

    applyTransform();
});


expandedImg.addEventListener('touchend', () => {
    isTouchDragging = false;
    modalContent.style.cursor = 'grab';
});



document.addEventListener('click', (event) => {
    if (event.target.matches('img:not(#expandedImg)')) {
      openModal(event.target.src);
    }
  });


// Escape closes the enlarged image
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
});
