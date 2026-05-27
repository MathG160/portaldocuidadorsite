document.addEventListener('DOMContentLoaded', () => {
    initContentController();
    initDraggableCarousel();
});

/**
 * Módulo 1: Controlador de Exibição dos Painéis 
 */
function initContentController() {
    const navLinks = document.querySelectorAll('.nav-tab-link');
    const panels = document.querySelectorAll('.content-panel');
    const mainContentArea = document.getElementById('main-content-area'); 

    function showPanel(targetIndex) {
        
        let isOpeningNow = false;
        if (mainContentArea.classList.contains('hidden-area')) {
            mainContentArea.classList.remove('hidden-area');
            mainContentArea.classList.add('visible-area');
            isOpeningNow = true; 
        }
        
        panels.forEach(panel => {
            panel.classList.remove('show');
            setTimeout(() => {
                panel.classList.remove('active');
            }, 300); 
        });

        setTimeout(() => {
            const targetPanel = document.getElementById(`panel-${targetIndex}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                setTimeout(() => targetPanel.classList.add('show'), 50); 
            }
        }, 300);

        const scrollDelay = isOpeningNow ? 150 : 0; 
        
        setTimeout(() => {
            const element = document.getElementById('main-content-area');
            if (element) {
                const yOffset = -30;
                const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        }, scrollDelay);
    }

    navLinks.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault(); 
            const target = trigger.getAttribute('data-target');
            if (target !== null) showPanel(target);
        });
    });
}

/**
 * Módulo 2: Controlador do Carrossel (Swipe e Mobile Fix)
 */
function initDraggableCarousel() {
    const track = document.getElementById('sliderTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!track) return; 

    let isDragging = false;
    let startX;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;

    // Função que calcula o pulo dinâmico para garantir que funcione no PC e no Celular
    function getCardWidth() {
        const card = document.querySelector('.slide-card');
        const gap = 25; // Gap fixo do flexbox
        return card ? card.offsetWidth + gap : 385;
    }

    track.addEventListener('mousedown', startDrag);
    track.addEventListener('mousemove', drag);
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);
    
    track.addEventListener('touchstart', startDrag, { passive: true });
    track.addEventListener('touchmove', drag, { passive: true });
    track.addEventListener('touchend', endDrag);

    function startDrag(e) {
        isDragging = true;
        startX = getPositionX(e);
        track.style.transition = 'none'; 
        animationID = requestAnimationFrame(animation);
    }

    function drag(e) {
        if (!isDragging) return;
        const currentX = getPositionX(e);
        currentTranslate = prevTranslate + (currentX - startX);
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(animationID);
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'; 

        const movedBy = currentTranslate - prevTranslate;
        const jumpWidth = getCardWidth();

        if (movedBy < -50) currentTranslate = prevTranslate - jumpWidth;
        else if (movedBy > 50) currentTranslate = prevTranslate + jumpWidth;
        else currentTranslate = prevTranslate;
        
        clampTranslate();
    }

    function getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    function animation() {
        track.style.transform = `translateX(${currentTranslate}px)`;
        if (isDragging) requestAnimationFrame(animation);
    }

    function clampTranslate() {
        // Usa as bordas da tela para não arrastar para o infinito
        const maxScroll = -(track.scrollWidth - track.parentElement.clientWidth + 25);
        if (currentTranslate > 0) currentTranslate = 0;
        if (currentTranslate < maxScroll) currentTranslate = maxScroll;
        
        prevTranslate = currentTranslate;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    if(nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => { currentTranslate -= getCardWidth(); clampTranslate(); });
        prevBtn.addEventListener('click', () => { currentTranslate += getCardWidth(); clampTranslate(); });
    }

    // Recalcula se o usuário girar a tela do celular
    window.addEventListener('resize', clampTranslate);
}