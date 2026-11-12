/* ==========================================================================
   CARROSSEL INFINITO CIRCULAR E BIDIRECIONAL (CORRIGIDO)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("carouselTrack");
    if (!track) return;
    
    const originalCards = Array.from(track.children);
    const segmentLength = originalCards.length;
    if (segmentLength === 0) return;
    
    originalCards.forEach(card => {
        track.appendChild(card.cloneNode(true));
    });
    // Clones para o início (Before) - inseridos em lote invertido para manter a ordem 1, 2, 3...
    originalCards.slice().reverse().forEach(card => {
        track.insertBefore(card.cloneNode(true), track.firstChild);
    });

    // O índice inicial deve ser exatamente após o primeiro bloco de clones (tamanho do array original)
    let currentIndex = segmentLength;
    let isTransitioning = false;

    function updateCarouselPosition(smooth = true) {
        const cards = track.children;
        if (!cards.length) return;
        
        // Pega a largura real do card + gap (certifique-se de que o gap no CSS bate com este valor)
        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = 20; 
        const offset = currentIndex * (cardWidth + gap);

        if (smooth) {
            track.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
        } else {
            track.style.transition = "none";
        }
        track.style.transform = `translateX(-${offset}px)`;
    }

    window.navigateCarousel = function(direction) {
        if (isTransitioning) return;
        isTransitioning = true;

        currentIndex += direction;
        updateCarouselPosition(true);
    };

    // 2. CORREÇÃO: Ajuste preciso dos limites do loop infinito
    track.addEventListener("transitionend", () => {
        isTransitioning = false;

        // Se passou do bloco do meio (original) para o bloco da direita (clones)
        if (currentIndex >= segmentLength * 2) {
            currentIndex = currentIndex - segmentLength;
            updateCarouselPosition(false);
        }
        // Se passou do bloco do meio para o bloco da esquerda (clones)
        else if (currentIndex < segmentLength) {
            currentIndex = currentIndex + segmentLength;
            updateCarouselPosition(false);
        }
    });

    // Inicialização da posição sem animação
    setTimeout(() => { updateCarouselPosition(false); }, 50);
    window.addEventListener("resize", () => { updateCarouselPosition(false); });
});


/* ==========================================================================
   SISTEMA DE POP-UP MODAL (SIDE PANELS CONTROL)
   ========================================================================== */
function openModal(cardElement) {
    const title = cardElement.getAttribute("data-title");
    const imgUrl = cardElement.getAttribute("data-img");
    const description = cardElement.getAttribute("data-desc");
    const year = cardElement.getAttribute("data-year");
    const subject = cardElement.getAttribute("data-subject");
    const projectLink = cardElement.getAttribute("data-link");

    // Preenche as tags do Modal
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalYear").innerText = year;
    document.getElementById("modalSubject").innerText = subject;
    document.getElementById("modalDescription").innerText = description;

    // Exibe o acesso externo somente quando o projeto possui um link.
    const modalLink = document.getElementById("modalLink");
    if (projectLink) {
        modalLink.href = projectLink;
        modalLink.hidden = false;
    } else {
        modalLink.removeAttribute("href");
        modalLink.hidden = true;
    }

    const imgArea = document.getElementById("modalImgArea");
    imgArea.innerHTML = ""; 

    // Criação da imagem de exibição
    const imgObj = document.createElement("img");
    imgObj.src = imgUrl;
    imgObj.alt = title;
    
    // Preserva a nitidez de pixel art se for o projeto 2D
    if (title.includes("Arte 2D")) {
        imgObj.className = "pixelated";
    }
    imgArea.appendChild(imgObj);

    // Ativa o painel de pop-up
    const modal = document.getElementById("projectModal");
    modal.classList.add("active");
}

// Função limpa para fechar o pop-up sem bugar a tela principal
function closeModal() {
    const modal = document.getElementById("projectModal");
    modal.classList.remove("active");
}

// Fecha o modal caso o usuário clique na área borrada externa ao painel
function handleOverlayClick(event) {
    const modal = document.getElementById("projectModal");
    if (event.target === modal) {
        closeModal();
    }
}