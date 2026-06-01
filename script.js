document.addEventListener('DOMContentLoaded', () => {
    initContentController();
    initDraggableCarousel();
    initMasks(); // Inicia as formatações automáticas de CEP e Telefone
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

    function getCardWidth() {
        const card = document.querySelector('.slide-card');
        const gap = 25; 
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

    window.addEventListener('resize', clampTranslate);
}

/**
 * Módulo 3: Máscaras Automáticas (Formatação em tempo real)
 */
function initMasks() {
    // Máscara do CEP
    const campoCep = document.getElementById('cep-input');
    if (campoCep) {
        campoCep.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
            if (valor.length > 5) {
                valor = valor.replace(/^(\d{5})(\d)/, '$1-$2'); // Insere o traço
            }
            e.target.value = valor;
        });
    }

    // Máscara do Celular / WhatsApp
    const campoTelefone = document.getElementById('telefone');
    if (campoTelefone) {
        campoTelefone.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, ''); 
            
            // Aplica a formatação: (XX) XXXXX-XXXX
            if (valor.length > 10) {
                valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (valor.length > 5) {
                valor = valor.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
            } else if (valor.length > 2) {
                valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else {
                valor = valor.replace(/^(\d*)/, '($1');
                if (valor === '(') valor = ''; // Limpa se apagar tudo
            }
            e.target.value = valor;
        });
    }
}


// =========================================================================
// MÓDULO 4: VALIDAÇÃO DE CEP E ENVIO DE E-MAIL (ESCOPO GLOBAL)
// =========================================================================

// Lista de prefixos de CEP válidos (Abrangendo Eldorado, Novo Eldorado, Glória e Av. João César)
const prefixosCepValidos = [
    '32010', // Av. João César de Oliveira e arredores
    '32310', '32311', '32312', '32313', '32314', '32315', // Região do Eldorado
    '32340', '32341' // Região do Glória e Novo Eldorado
];

function verificarCEP() {
    const cepInput = document.getElementById('cep-input').value;
    const cepLimpo = cepInput.replace(/\D/g, ''); 
    
    const cepMsg = document.getElementById('cep-msg');
    const formSection = document.getElementById('form-section');

    if (cepLimpo.length !== 8) {
        cepMsg.textContent = "Por favor, digite um CEP válido com 8 dígitos.";
        cepMsg.style.display = 'block';
        formSection.style.display = 'none';
        return;
    }

    // Verifica se o CEP digitado começa com algum dos prefixos da nossa lista
    const cepValido = prefixosCepValidos.some(prefixo => cepLimpo.startsWith(prefixo));

    if (cepValido) {
        cepMsg.style.display = 'none';
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        formSection.style.display = 'none';
        cepMsg.textContent = "Desculpe, não identificamos cobertura da UBS Eldorado para o CEP informado.";
        cepMsg.style.display = 'block';
    }
}

// --- ENVIO DO FORMULÁRIO (EmailJS) ---
function enviarFormulario(event) {
    event.preventDefault(); 
    
    const btnSubmit = document.querySelector('#atendimento-form button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btnSubmit.disabled = true;

    const parametrosTemplate = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
        mensagem: document.getElementById('mensagem').value,
        cep: document.getElementById('cep-input').value
    };

    const serviceID = "service_8i8nvqb"; 
    const templateID = "template_21d99c8"; 

    emailjs.send(serviceID, templateID, parametrosTemplate)
        .then(function(resposta) {
            alert("Sucesso! Sua solicitação foi enviada. Nossa equipe entrará em contato em breve.");
            document.getElementById('atendimento-form').reset(); 
            document.getElementById('form-section').style.display = 'none'; 
            document.getElementById('cep-input').value = ''; 
            
            document.getElementById('cep-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, function(erro) {
            alert("Ocorreu um erro ao enviar. Por favor, tente novamente mais tarde.");
            console.log("Erro EmailJS:", erro);
        })
        .finally(function() {
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.disabled = false;
        });
}