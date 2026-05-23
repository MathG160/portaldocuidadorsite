document.addEventListener('DOMContentLoaded', () => {
    initContentController();
    initDraggableCarousel();
});

/**
 * Módulo 1: Controlador de Exibição dos Painéis 
 */
function initContentController() {
    // Escuta apenas os botões presentes dentro dos cards
    const navLinks = document.querySelectorAll('.nav-tab-link');
    const panels = document.querySelectorAll('.content-panel');
    const mainContentArea = document.getElementById('main-content-area'); 

    function showPanel(targetIndex) {
        
        // 1. REVELA A ÁREA INFERIOR (Se for o primeiro clique do usuário)
        let isOpeningNow = false;
        if (mainContentArea.classList.contains('hidden-area')) {
            mainContentArea.classList.remove('hidden-area');
            mainContentArea.classList.add('visible-area');
            isOpeningNow = true; 
        }
        
        // 2. Esconde todos os painéis ativamente exibidos
        panels.forEach(panel => {
            panel.classList.remove('show');
            setTimeout(() => {
                panel.classList.remove('active');
            }, 300); 
        });

        // 3. Ativa o painel exato referente ao card clicado
        setTimeout(() => {
            const targetPanel = document.getElementById(`panel-${targetIndex}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                setTimeout(() => targetPanel.classList.add('show'), 50); 
            }
        }, 300);

        // 4. Scroll Suave até a seção revelada
        const scrollDelay = isOpeningNow ? 150 : 0; 
        
        setTimeout(() => {
            const element = document.getElementById('main-content-area');
            if (element) {
                const yOffset = -30; // Espaço do topo da tela para a barra cor
                const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        }, scrollDelay);
    }

    // Registra cliques dos botões nos cards
    navLinks.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault(); 
            const target = trigger.getAttribute('data-target');
            if (target !== null) showPanel(target);
        });
    });
}

/**
 * Módulo 2: Controlador do Carrossel (Swipe)
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
    const cardWidth = 385; // Largura do card + gap (360 + 25)

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
        if (movedBy < -50) currentTranslate = prevTranslate - cardWidth;
        else if (movedBy > 50) currentTranslate = prevTranslate + cardWidth;
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
        const maxScroll = -(track.scrollWidth - track.parentElement.clientWidth + 25);
        if (currentTranslate > 0) currentTranslate = 0;
        if (currentTranslate < maxScroll) currentTranslate = maxScroll;
        
        prevTranslate = currentTranslate;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    if(nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => { currentTranslate -= cardWidth; clampTranslate(); });
        prevBtn.addEventListener('click', () => { currentTranslate += cardWidth; clampTranslate(); });
    }
}