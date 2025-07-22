

window.onload = () => setTimeout(() => openModal('./redirects/nosapoie.html'), 5000);

   document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});


  function openModal(url) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');

    modalOverlay.style.display = 'flex';
    modalContent.innerHTML = '<div class="loading-spinner"></div>';

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Erro ao carregar');
        return response.text();
      })
      .then(html => {
        // Primeiro, insira o HTML no DOM
        modalContent.innerHTML = html;
        
        // Depois, execute os scripts que estão no conteúdo carregado
        executeScripts(modalContent);
        
        // Dispare um evento personalizado para notificar que o conteúdo foi carregado
        const event = new CustomEvent('contentLoaded', { detail: { url } });
        modalContent.dispatchEvent(event);
      })
      .catch(error => {
        modalContent.innerHTML = `
          <p class="error-message">
            Erro ao carregar conteúdo.<br>Verifique sua conexão ou se o diretório está acessível.
          </p>
        `;
        console.error('Erro ao carregar modal:', error);
      });
}

// Função para executar scripts dentro do conteúdo carregado
function executeScripts(container) {
    // Encontra todos os scripts no container
    const scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
        // Cria um novo script
        const newScript = document.createElement('script');
        
        // Copia todos os atributos do script original
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        // Se o script tem conteúdo interno (não é um src), copia o texto
        if (!oldScript.src && oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
        }
        
        // Substitui o script antigo pelo novo (que será executado)
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}



  function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');

    modalOverlay.style.display = 'none';
    modalContent.innerHTML = ''; // Limpa o conteúdo carregado
  }

  // Fechar modal ao clicar fora da caixa
  window.addEventListener('click', function (event) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContainer = document.querySelector('.modal-container');

    if (event.target === modalOverlay) {
      closeModal();
    }
  });





        // Elementos DOM
        const slidesContainer = document.getElementById('slidesContainer');
        const carouselControls = document.getElementById('carouselControls');
        const novelsContainer = document.getElementById('novelsContainer');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const searchInput = document.getElementById('searchInput');
        const filterSelect = document.getElementById('filterSelect');
        const categoriesNav = document.getElementById('categoriesNav');
        const navLinks = document.querySelectorAll('.nav-link');
        const welcomeNotification = document.getElementById('welcomeNotification');
        const carousel = document.getElementById('carousel');
        const carouselSection = document.getElementById('carouselSection');
        const novelsSection = document.getElementById('novelsSection');
        
        // Variáveis do carrossel
        let currentSlide = 0;
        let autoSlideInterval;
        let allNovels = [];
        let allCategories = new Set();
        let startX, moveX;
        let isDragging = false;

        // Função para converter data no formato bonito com ícone
        function converterData(dataStr) {
            const meses = [
                'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                'jul', 'ago', 'set', 'out', 'nov', 'dez'
            ];

            // Divide a data e ignora a hora
            const [dataParte] = dataStr.split(',');
            const [dia, mes, ano] = dataParte.split('/');

            return `<i class="fas fa-calendar-alt"></i> ${dia} ${meses[parseInt(mes) - 1]}, ${ano}`;
        }

        // Função para contar capítulos de um novel
        async function contarCapitulos(novelId) {
            let count = 0;
            let id = 1;
            
            while (true) {
                try {
                    const response = await fetch(`./Novels/${novelId}/Capitulos/cap${id}.json`);
                    if (!response.ok) {
                        break;
                    }
                    count++;
                    id++;
                } catch (error) {
                    break;
                }
            }
            
            return count;
        }
        
        // Função para mostrar notificação de boas-vindas
        function showWelcomeNotification() {
            // Mostrar a notificação
            setTimeout(() => {
                welcomeNotification.classList.add('show');
            }, 1000);
            
            // Esconder e remover após 3 segundos
            setTimeout(() => {
                if (welcomeNotification) {
                    welcomeNotification.remove();
                }
            }, 4000);
            
            // Verificar se é mobile para vibrar
            if ('vibrate' in navigator && window.innerWidth <= 768) {
                navigator.vibrate([200, 100, 200]);
            } else {
                // Tocar som de notificação no desktop
                const notificationSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                notificationSound.volume = 0.3;
                notificationSound.play().catch(e => console.log('Não foi possível tocar o som:', e));
            }
        }

        // Função para buscar os novels
        async function fetchNovels() {
            try {
                const response = await fetch('./Novels/AllNovels.json');
                
                if (!response.ok) {
                    throw new Error('Arquivo não encontrado');
                }
                
                const data = await response.json();
                
                if (!data || data.length === 0) {
                    throw new Error('Nenhum novel disponível');
                }
                
                // Contar capítulos para cada novel
                for (let novel of data) {
                    const chaptersCount = await contarCapitulos(novel.id);
                    novel.chapters = chaptersCount;
                }
                
                return data;
            } catch (error) {
                console.error('Erro ao carregar novels:', error);
                throw error;
            }
        }

        // Função para extrair categorias
        function extractCategories(novels) {
            const categories = new Set(['all']); // 'all' é a categoria padrão
            
            novels.forEach(novel => {
                if (novel.category && Array.isArray(novel.category)) {
                    novel.category.forEach(cat => {
                        if (cat && typeof cat === 'string') {
                            categories.add(cat.toLowerCase());
                        }
                    });
                }
            });
            
            return Array.from(categories);
        }

        // Função para renderizar as categorias
        function renderCategories(categories) {
            const navLinksContainer = categoriesNav.querySelector('.nav-links');
            
            // Limpar links existentes (exceto o primeiro que é "Todos")
            while (navLinksContainer.children.length > 1) {
                navLinksContainer.removeChild(navLinksContainer.lastChild);
            }
            
            // Adicionar categorias
            categories.filter(cat => cat !== 'all').forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="nav-link" data-category="${category}" onclick="event.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});">${capitalizeFirstLetter(category)}</a>`;
                navLinksContainer.appendChild(li);
            });
            
            // Adicionar event listeners
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Atualizar link ativo
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Filtrar novels
                    const category = this.dataset.category;
                    filterNovels(searchInput.value, filterSelect.value, category);
                });
            });
        }

        // Função para capitalizar a primeira letra
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        // Função para converter data no formato "dd/mm/yyyy, HH:mm" para timestamp
        function parseBrazilianDate(dateStr) {
            const [datePart, timePart] = dateStr.split(', ');
            const [day, month, year] = datePart.split('/').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            
            // Criar data no fuso horário de São Paulo (GMT-3)
            // Nota: O JavaScript usa o fuso horário do cliente, então precisamos ajustar
            const date = new Date(year, month - 1, day, hours, minutes);
            
            // Ajustar para o fuso horário de São Paulo (GMT-3)
            // Como o JavaScript já usa o fuso horário local, precisamos compensar
            // Vamos assumir que o date no JSON está em GMT-3 (horário de SP)
            const timezoneOffset = date.getTimezoneOffset(); // em minutos
            const spOffset = 180; // GMT-3 = 180 minutos
            const adjustedDate = new Date(date.getTime() + (timezoneOffset + spOffset) * 60000);
            
            return adjustedDate.getTime();
        }

        // Função para verificar se um novel é novo (lançado nos últimos 30 dias)
        function isNovelNew(novel) {
            if (!novel.date) return false;
            
            try {
                const releaseDate = parseBrazilianDate(novel.date);
                const now = new Date().getTime();
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                
                return (now - releaseDate) <= thirtyDaysInMs;
            } catch (e) {
                console.error('Erro ao verificar data do novel:', e);
                return false;
            }
        }

        // Função para renderizar o carrossel
        function renderCarousel(novels) {
            // Filtrar apenas novels populares (IsPopular = true)
            const popularNovels = novels.filter(novel => novel.IsPopular).slice(0, 5);
            
            // Limpar containers
            slidesContainer.innerHTML = '';
            carouselControls.innerHTML = '';
            
            if (popularNovels.length === 0) {
                slidesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>Nenhum destaque disponível</h3>
                        <p>Volte mais tarde para novos lançamentos</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar slides
            popularNovels.forEach((novel, index) => {
                // Criar elemento de slide
                const slide = document.createElement('div');
                slide.className = 'slide';
                
                // Gerar badges - agora verificando a data
                const badges = [];
                if (isNovelNew(novel)) badges.push({text: 'Novo', cls: 'badge-new'});
                if (novel.IsPopular) badges.push({text: 'Popular', cls: 'badge-popular'});
                if (novel.IsCompleted) badges.push({text: 'Completo', cls: 'badge-completed'});
                
                const badgesHtml = badges.map(badge => 
                    `<span class="slide-badge ${badge.cls}">${badge.text}</span>`
                ).join('');
                
                // Conteúdo do slide
                slide.innerHTML = `
                    <img src="${novel.cover}" alt="${novel.name}" class="slide-image">
                    <div class="slide-overlay"></div>
                    <div class="slide-content">
                        <div class="slide-badges">
                            ${badgesHtml}
                        </div>
                        <h2 class="slide-title">${novel.name}</h2>
                       <div class="slide-meta">
    <span>${converterData(novel.date) || 'Data não disponível'}</span>
    <span>${novel.chapters || 0} capítulos</span>
</div>
                `;
                
                // Adicionar evento de clique para redirecionar
                slide.addEventListener('click', () => {
                    window.location.href = `./Novels/${novel.id}/`;
                });
                
                slidesContainer.appendChild(slide);
                
                // Criar controle
                const control = document.createElement('button');
                control.className = 'control-btn';
                control.dataset.index = index;
                if (index === 0) control.classList.add('active');
                
                control.addEventListener('click', () => {
                    goToSlide(index);
                });
                
                carouselControls.appendChild(control);
            });
            
            // Configurar eventos de toque para o carrossel
            setupCarouselTouchEvents();
        }

        // Função para configurar eventos de toque
        function setupCarouselTouchEvents() {
            slidesContainer.addEventListener('touchstart', handleTouchStart, false);
            slidesContainer.addEventListener('touchmove', handleTouchMove, false);
            slidesContainer.addEventListener('touchend', handleTouchEnd, false);
        }

        function handleTouchStart(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
            clearInterval(autoSlideInterval);
        }

        function handleTouchMove(e) {
            if (!isDragging) return;
            moveX = e.touches[0].clientX;
        }

        function handleTouchEnd() {
            if (!isDragging) return;
            isDragging = false;
            
            if (moveX < startX - 50) {
                nextSlide(); // Deslizou para a esquerda
            } else if (moveX > startX + 50) {
                prevSlide(); // Deslizou para a direita
            }
            
            startAutoSlide();
        }

        // Função para renderizar os cards de novel
        function renderNovelCards(novels, filter = '', statusFilter = 'all', categoryFilter = 'all') {
            // Limpar container
            novelsContainer.innerHTML = '';
            
            // Aplicar filtros
            let filteredNovels = [...novels];
            
            // Filtro de texto - BUSCAR APENAS PELO NAME
            if (filter) {
                const searchTerm = filter.toLowerCase();
                filteredNovels = filteredNovels.filter(novel => 
                    novel.name.toLowerCase().includes(searchTerm)
                );
            }
            
            // Filtro de status - agora verificando a data para "new"
            if (statusFilter === 'new') {
                filteredNovels = filteredNovels.filter(novel => isNovelNew(novel));
            } else if (statusFilter === 'popular') {
                filteredNovels = filteredNovels.filter(novel => novel.IsPopular);
            } else if (statusFilter === 'completed') {
                filteredNovels = filteredNovels.filter(novel => novel.IsCompleted);
            }
            
            // Filtro de categoria
            if (categoryFilter !== 'all') {
                filteredNovels = filteredNovels.filter(novel => 
                    novel.category && novel.category.includes(categoryFilter)
                );
            }
            
            // Mostrar/ocultar carrossel baseado no filtro de texto apenas em mobile portrait
            const isMobilePortrait = window.innerWidth < 768 && window.matchMedia("(orientation: portrait)").matches;
            
            if (filter && isMobilePortrait && filter.trim() !== '') {
                carouselSection.style.display = 'none';
                clearInterval(autoSlideInterval); // Parar o carrossel automático
            } else {
                carouselSection.style.display = 'block';
                if (!autoSlideInterval) startAutoSlide(); // Reiniciar o carrossel automático se não estiver ativo
            }
            
            // Verificar se há resultados
            if (filteredNovels.length === 0) {
                novelsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>Nenhum novel encontrado</h3>
                        <p>Tente ajustar sua pesquisa ou filtros</p>
                    </div>
                `;
                return;
            }
            
            // Verificar se estamos em desktop/tablet landscape e não há pesquisa ativa
            const isDesktopLandscape = window.innerWidth >= 768 || window.matchMedia("(orientation: landscape)").matches;
            
            if (isDesktopLandscape && !filter) {
                // Layout com scroll horizontal
                novelsContainer.classList.add('has-search');
                
                // Renderizar cards com scroll horizontal
                filteredNovels.forEach(novel => {
                    const card = document.createElement('div');
                    card.className = 'novel-card';
                    
                    // Gerar badges - agora verificando a data
                    let badgesHtml = '';
                    if (isNovelNew(novel)) {
                        badgesHtml += '<span class="card-badge badge-new">Novo</span>';
                    }
                    if (novel.IsPopular) {
                        badgesHtml += '<span class="card-badge badge-popular">Popular</span>';
                    }
                    if (novel.IsCompleted) {
                        badgesHtml += '<span class="card-badge badge-completed">Completo</span>';
                    }
                    
                    // Gerar categorias
                    let categoriesHtml = '';
                    if (novel.category && novel.category.length > 0) {
                        categoriesHtml = novel.category.slice(0, 3).map(cat => 
                            `<span class="card-category">${capitalizeFirstLetter(cat)}</span>`
                        ).join('');
                    }
                    
                    card.innerHTML = `
                        <div class="card-img-container">
                            <img src="${novel.cover}" alt="${novel.name}" class="card-img">
                            <div class="card-badges">
                                ${badgesHtml}
                            </div>
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">${novel.name}</h3>
                            <div class="card-meta">
                                <span>${converterData(novel.date) || 'N/D'}</span>
                                <span>${novel.chapters || 0} caps</span>
                            </div>
                            <div class="card-categories">
                                ${categoriesHtml}
                            </div>
                            <p class="card-info">${novel.sinopse}</p>
                        </div>
                    `;
                    
                    // Adicionar evento de clique para redirecionar
                    card.addEventListener('click', () => {
                        window.location.href = `./Novels/${novel.id}/`;
                    });
                    
                    novelsContainer.appendChild(card);
                });
            } else {
                // Layout padrão com grid
                novelsContainer.classList.remove('has-search');
                
                // Renderizar cards em grid
                filteredNovels.forEach(novel => {
                    const card = document.createElement('div');
                    card.className = 'novel-card';
                    
                    // Gerar badges - agora verificando a data
                    let badgesHtml = '';
                    if (isNovelNew(novel)) {
                        badgesHtml += '<span class="card-badge badge-new">Novo</span>';
                    }
                    if (novel.IsPopular) {
                        badgesHtml += '<span class="card-badge badge-popular">Popular</span>';
                    }
                    if (novel.IsCompleted) {
                        badgesHtml += '<span class="card-badge badge-completed">Completo</span>';
                    }
                    
                    // Gerar categorias
                    let categoriesHtml = '';
                    if (novel.category && novel.category.length > 0) {
                        categoriesHtml = novel.category.slice(0, 3).map(cat => 
                            `<span class="card-category">${capitalizeFirstLetter(cat)}</span>`
                        ).join('');
                    }
                    
                    card.innerHTML = `
                        <div class="card-img-container">
                            <img src="${novel.cover}" alt="${novel.name}" class="card-img">
                            <div class="card-badges">
                                ${badgesHtml}
                            </div>
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">${novel.name}</h3>
                            <div class="card-meta">
                                <span>${converterData(novel.date) || 'N/D'}</span>
                                <span>${novel.chapters || 0} caps</span>
                            </div>
                            <div class="card-categories">
                                ${categoriesHtml}
                            </div>
                            <p class="card-info">${novel.sinopse}</p>
                        </div>
                    `;
                    
                    // Adicionar evento de clique para redirecionar
                    card.addEventListener('click', () => {
                        window.location.href = `./Novels/${novel.id}/`;
                    });
                    
                    novelsContainer.appendChild(card);
                });
            }
        }

        // Função para filtrar novels
        function filterNovels(searchTerm = '', statusFilter = 'all', categoryFilter = 'all') {
            renderNovelCards(allNovels, searchTerm, statusFilter, categoryFilter);
        }

        // Funções do carrossel
        function goToSlide(index) {
            const slides = document.querySelectorAll('.slide');
            const controls = document.querySelectorAll('.control-btn');
            
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            
            slidesContainer.scrollTo({
                left: index * slidesContainer.offsetWidth,
                behavior: 'smooth'
            });
            
            currentSlide = index;
            
            // Atualizar controles ativos
            controls.forEach((control, i) => {
                if (i === index) {
                    control.classList.add('active');
                } else {
                    control.classList.remove('active');
                }
            });
            
            // Reiniciar o slide automático
            restartAutoSlide();
        }
        
        function nextSlide() {
            goToSlide(currentSlide + 1);
        }
        
        function prevSlide() {
            goToSlide(currentSlide - 1);
        }
        
        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, 15000);
        }
        
        function restartAutoSlide() {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }

        // Event Listeners
        searchInput.addEventListener('input', (e) => {
            const activeCategory = document.querySelector('.nav-link.active').dataset.category;
            filterNovels(e.target.value, filterSelect.value, activeCategory);
        });

        filterSelect.addEventListener('change', (e) => {
            const activeCategory = document.querySelector('.nav-link.active').dataset.category;
            filterNovels(searchInput.value, e.target.value, activeCategory);
        });

        // Carregar dados quando a página carregar
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                // Mostrar notificação de boas-vindas
                showWelcomeNotification();
                
                // Buscar dados
                allNovels = await fetchNovels();
                
                // Extrair categorias
                allCategories = extractCategories(allNovels);
                
                // Renderizar categorias
                renderCategories(allCategories);
                
                // Esconder indicador de carregamento
                loadingIndicator.style.display = 'none';
                
                // Renderizar conteúdo
                renderCarousel(allNovels);
                filterNovels();
                
                // Iniciar carrossel automático
                startAutoSlide();
            } catch (error) {
                console.error('Erro ao carregar novels:', error);
                
                // Esconder indicador de carregamento
                loadingIndicator.style.display = 'none';
                
                // Mostrar mensagem de erro
                novelsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar novels</h3>
                        <p>${error.message || 'Tente recarregar a página mais tarde'}</p>
                        <p>Arquivo procurado: ./Novels/AllNovels.json</p>
                    </div>
                `;
                
                // Limpar carrossel
                slidesContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Não foi possível carregar os destaques</h3>
                    </div>
                `;
            }
            
            
            
        });

        // Handle all # links to scroll to top
        document.querySelectorAll('a[href="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        });

        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            const activeCategory = document.querySelector('.nav-link.active').dataset.category;
            filterNovels(searchInput.value, filterSelect.value, activeCategory);
        });