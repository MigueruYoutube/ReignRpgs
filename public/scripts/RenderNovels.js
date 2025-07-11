  document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Bloqueia arrastar imagens
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    // Referências do DOM para o player de música
    const musicSelect = document.getElementById('musicSelect');
    const mobileMusicSelect = document.getElementById('mobileMusicSelect');
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const nowPlaying = document.getElementById('nowPlaying');
    const mobileNowPlaying = document.getElementById('mobileNowPlaying');
    const playerContainer = document.getElementById('playerContainer');
    const mobilePlayPauseBtn = document.getElementById('mobilePlayPauseBtn');
    const mobilePrevBtn = document.getElementById('mobilePrevBtn');
    const mobileNextBtn = document.getElementById('mobileNextBtn');
    const mobileControls = document.getElementById('mobileControls');
    const playerDragArea = document.querySelector('.player-drag-area');
    const mobileDragArea = document.querySelector('.mobile-controls-balloon .drag-area');
    const toggleSelectBtn = document.getElementById('toggleSelectBtn');
    const mobileToggleSelectBtn = document.getElementById('mobileToggleSelectBtn');
    const playerSelectContainer = document.getElementById('playerSelectContainer');
    const mobileSelectContainer = document.getElementById('mobileSelectContainer');
    const hidePlayerBtn = document.getElementById('hidePlayerBtn');
    const miniPlayer = document.getElementById('miniPlayer');

    // Variáveis de estado do player de música
    let allMusics = [];
    let recommendedMusics = [];
    let currentMusicIndex = -1;
    let isDragging = false;
    let offsetX, offsetY;
    let isSelectVisible = false;
    let isPlayerHidden = false;

    // Referências do DOM para o leitor de novel
    const chaptersContainer = document.getElementById('chapters-container');
    const readerModal = document.getElementById('reader-modal');
    const readerTitle = document.getElementById('reader-title');
    const readerBody = document.getElementById('reader-content');
    const btnClose = document.getElementById('btn-close');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const totalChapters = document.getElementById('total-chapters');
    const novelTitle = document.getElementById('novel-title');
    const novelAuthor = document.getElementById('novel-author');
    const authorLink = document.getElementById('author-link');
    const novelSynopsis = document.getElementById('novel-synopsis');
    const novelCover = document.getElementById('novel-cover');
    const novelBadges = document.getElementById('novel-badges');
    const releaseDate = document.getElementById('release-date');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const visitorsCount = document.getElementById('visitors-count');
    
    // Variáveis de estado do leitor de novel
    let currentChapter = null;
    let allChapters = [];
    let displayedChapters = [];
    let currentChapterIndex = 0;
    let novelData = null;
    let maxChapterLoaded = 0;
    let isSearching = false;
    let currentSearchTerm = '';

    // Funções do player de música
    function getCurrentPageId() {
        const pathParts = window.location.pathname.split('/');
        for (let i = pathParts.length - 1; i >= 0; i--) {
            const part = pathParts[i];
            if (/^\d+$/.test(part)) {
                return parseInt(part);
            }
        }
        return null;
    }

    async function fetchMusicData() {
    try {
        const baseUrl = window.location.href;
        const jsonUrl = new URL('../../Musics/AllMusics.json', baseUrl).href;

        console.log("Buscando músicas em:", jsonUrl); // Adicione para depurar

        const response = await fetch(jsonUrl);
        if (!response.ok) {
            throw new Error('Falha ao buscar dados das músicas');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar dados das músicas:', error);
        return [];
    }
}

    async function fetchRecommendedMusics() {
        try {
            const currentPageId = getCurrentPageId();
            if (!currentPageId) return [];
            
            const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');
            const jsonUrl = new URL('../AllNovels.json', baseUrl).href;
            
            const response = await fetch(jsonUrl);
            if (!response.ok) {
                throw new Error('Falha ao buscar músicas recomendadas');
            }
            
            const data = await response.json();
            const novelData = data.find(item => item.id === currentPageId);
            
            return novelData ? novelData.recommended : [];
        } catch (error) {
            console.error('Erro ao buscar músicas recomendadas:', error);
            return [];
        }
    }

    async function loadMusics() {
        const [musics, recommended] = await Promise.all([
            fetchMusicData(),
            fetchRecommendedMusics()
        ]);
        
        allMusics = musics;
        recommendedMusics = recommended;
        
        musicSelect.innerHTML = '<option value="">Selecione uma música...</option>';
        mobileMusicSelect.innerHTML = '<option value="">Selecione uma música...</option>';
        
        recommendedMusics.forEach(recommendedId => {
            const musicInfo = allMusics.find(m => m.id === recommendedId);
            if (musicInfo) {
                const option = document.createElement('option');
                option.value = musicInfo.id;
                option.textContent = `⭐ ${musicInfo.name}`;
                option.dataset.recommended = true;
                musicSelect.appendChild(option.cloneNode(true));
                mobileMusicSelect.appendChild(option);
            }
        });
        
        allMusics.forEach(musicInfo => {
            const isRecommended = recommendedMusics.includes(musicInfo.id);
            if (!isRecommended) {
                const option = document.createElement('option');
                option.value = musicInfo.id;
                option.textContent = musicInfo.name;
                musicSelect.appendChild(option.cloneNode(true));
                mobileMusicSelect.appendChild(option);
            }
        });
    }

    function playSelectedMusic(event = null) {
        let selectedMusicId;

        if (event && event.target) {
            selectedMusicId = event.target.value;
        } else {
            selectedMusicId = musicSelect.value || mobileMusicSelect.value;
        }

        if (!selectedMusicId) {
            audioPlayer.pause();
            nowPlaying.textContent = 'Nenhuma música selecionada';
            mobileNowPlaying.textContent = 'Nenhuma música selecionada';
            updatePlayButtons('play');
            currentMusicIndex = -1;
            return;
        }

        musicSelect.value = selectedMusicId;
        mobileMusicSelect.value = selectedMusicId;

        currentMusicIndex = Array.from(musicSelect.options).findIndex(
            opt => opt.value === selectedMusicId
        );

        const musicInfo = allMusics.find(m => m.id == selectedMusicId);
        if (!musicInfo) return;

        const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');
        const musicPath = new URL(`../../Musics/${selectedMusicId}.mp3`, baseUrl).href;

        audioPlayer.src = musicPath;
        audioPlayer.play()
            .then(() => {
                updatePlayButtons('pause');
                nowPlaying.textContent = musicInfo.name;
                mobileNowPlaying.textContent = musicInfo.name;
            })
            .catch(error => {
                console.error('Erro ao reproduzir música:', error);
                nowPlaying.textContent = 'Erro ao reproduzir';
                mobileNowPlaying.textContent = 'Erro ao reproduzir';
            });
    }

    function updatePlayButtons(state) {
        const playIcon = playPauseBtn.querySelector('i');
        const mobilePlayIcon = mobilePlayPauseBtn.querySelector('i');
        
        if (state === 'play') {
            playPauseBtn.title = 'Play';
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
            mobilePlayPauseBtn.title = 'Play';
            mobilePlayIcon.classList.remove('fa-pause');
            mobilePlayIcon.classList.add('fa-play');
        } else {
            playPauseBtn.title = 'Pause';
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
            mobilePlayPauseBtn.title = 'Pause';
            mobilePlayIcon.classList.remove('fa-play');
            mobilePlayIcon.classList.add('fa-pause');
        }
    }

    function playNextMusic() {
        if (musicSelect.options.length <= 1) return;
        
        let nextIndex = currentMusicIndex + 1;
        if (nextIndex >= musicSelect.options.length) {
            nextIndex = 1;
        }
        
        musicSelect.selectedIndex = nextIndex;
        mobileMusicSelect.selectedIndex = nextIndex;
        playSelectedMusic();
    }

    function playPreviousMusic() {
        if (musicSelect.options.length <= 1) return;
        
        let prevIndex = currentMusicIndex - 1;
        if (prevIndex <= 0) {
            prevIndex = musicSelect.options.length - 1;
        }
        
        musicSelect.selectedIndex = prevIndex;
        mobileMusicSelect.selectedIndex = prevIndex;
        playSelectedMusic();
    }

    function togglePlayPause() {
        if (audioPlayer.paused) {
            if (audioPlayer.src) {
                audioPlayer.play();
                updatePlayButtons('pause');
            } else if (musicSelect.options.length > 1) {
                musicSelect.selectedIndex = 1;
                mobileMusicSelect.selectedIndex = 1;
                playSelectedMusic();
            }
        } else {
            audioPlayer.pause();
            updatePlayButtons('play');
        }
    }

    function toggleSelectMenu() {
        isSelectVisible = !isSelectVisible;
        
        if (isSelectVisible) {
            playerSelectContainer.classList.add('show');
            mobileSelectContainer.classList.add('show');
            toggleSelectBtn.classList.add('rotated');
            mobileToggleSelectBtn.classList.add('rotated');
        } else {
            playerSelectContainer.classList.remove('show');
            mobileSelectContainer.classList.remove('show');
            toggleSelectBtn.classList.remove('rotated');
            mobileToggleSelectBtn.classList.remove('rotated');
        }
    }

    function startDrag(e) {
        isDragging = true;
        const rect = playerContainer.getBoundingClientRect();
        
        if (e.type === 'mousedown') {
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        } else {
            e.preventDefault();
            const touch = e.touches[0];
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', stopDrag);
        }
        
        playerContainer.style.transition = 'none';
    }
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        let clientX, clientY;
        
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        }
        
        const newLeft = clientX - offsetX;
        const newTop = clientY - offsetY;
        const maxLeft = window.innerWidth - playerContainer.offsetWidth;
        const maxTop = window.innerHeight - playerContainer.offsetHeight;
        
        playerContainer.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        playerContainer.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        playerContainer.style.right = 'auto';
        playerContainer.style.bottom = 'auto';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
        
        playerContainer.style.transition = 'all 0.3s ease';
    }
    
    function startMobileDrag(e) {
        e.stopPropagation();
        const rect = mobileControls.getBoundingClientRect();
        
        if (e.type === 'mousedown') {
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            document.addEventListener('mousemove', mobileDrag);
            document.addEventListener('mouseup', stopMobileDrag);
        } else {
            const touch = e.touches[0];
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            document.addEventListener('touchmove', mobileDrag, { passive: false });
            document.addEventListener('touchend', stopMobileDrag);
        }
        
        mobileControls.style.transition = 'none';
    }
    function mobileDrag(e) {
        e.preventDefault();
        let clientX, clientY;
        
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        }
        
        const newLeft = clientX - offsetX;
        const newTop = clientY - offsetY;
        const maxLeft = window.innerWidth - mobileControls.offsetWidth;
        const maxTop = window.innerHeight - mobileControls.offsetHeight;
        
        mobileControls.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        mobileControls.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        mobileControls.style.right = 'auto';
        mobileControls.style.bottom = 'auto';
    }
    function stopMobileDrag() {
        document.removeEventListener('mousemove', mobileDrag);
        document.removeEventListener('mouseup', stopMobileDrag);
        document.removeEventListener('touchmove', mobileDrag);
        document.removeEventListener('touchend', stopMobileDrag);
        
        mobileControls.style.transition = 'all 0.3s ease';
    }

    // Funções do botão de ocultar player
    function togglePlayerVisibility() {
    const isCurrentlyHidden = playerContainer.classList.contains('hidden');

    if (isCurrentlyHidden) {
        // Mostrar players
        playerContainer.classList.remove('hidden');
        mobileControls.classList.remove('hidden');
        
        // Ocultar mini player
        miniPlayer.classList.add('hidden');
        
        // Rotacionar ícone de volta
        hidePlayerBtn.classList.remove('rotated');

        // No mobile, voltar o player para a posição original
        if (window.innerWidth <= 768) {
            mobileControls.style.transform = 'scale(0.7)';
        }
    } else {
        // Ocultar players
        playerContainer.classList.add('hidden');
        mobileControls.classList.add('hidden');
        
        // Mostrar mini player
        miniPlayer.classList.remove('hidden');
        
        // Rotacionar ícone
        hidePlayerBtn.classList.add('rotated');

        // No mobile, mover o player para fora da tela
        if (window.innerWidth <= 768) {
            mobileControls.style.transform = 'translateX(100%) scale(0.7)';
        }
    }
}

    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            // Mobile
            playerContainer.style.display = 'none';
            mobileControls.style.display = 'flex';
            playerContainer.classList.add('hidden');
            mobileControls.classList.add('hidden');
        } else {
            // Desktop
            playerContainer.style.display = 'flex';
            mobileControls.style.display = 'none';
            playerContainer.classList.add('hidden');
            mobileControls.classList.add('hidden');
        }
    }

    // Funções do leitor de novel
    function getCurrentNovelId() {
    const pathParts = window.location.pathname.split('/');
    
    // Procura por algo como /Novels/{}/
    const novelsIndex = pathParts.indexOf('Novels');
    if (novelsIndex !== -1 && pathParts.length > novelsIndex + 1) {
        const possibleId = pathParts[novelsIndex + 1];
        if (/^\d+$/.test(possibleId)) {
            return parseInt(possibleId);
        }
    }

    // Fallback: procura qualquer número
    for (let i = pathParts.length - 1; i >= 0; i--) {
        const part = pathParts[i];
        if (/^\d+$/.test(part)) {
            return parseInt(part);
        }
    }

    return null;
}

    async function loadNovelData() {
        const novelId = getCurrentNovelId();
        if (!novelId) {
            console.error('Não foi possível determinar o ID da novel');
            return null;
        }

        try {
            const response = await fetch('../AllNovels.json');
            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados das novels');
            }
            
            const allNovels = await response.json();
            const novel = allNovels.find(n => n.id === novelId);
            
            if (!novel) {
                throw new Error(`Novel com ID ${novelId} não encontrada`);
            }
            
            return novel;
        } catch (error) {
            console.error('Erro ao carregar dados da novel:', error);
            return null;
        }
    }

    function parseDateBr(dateString) {
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const spTimeZone = 'America/Sao_Paulo';

        let dia, mes, ano, hora, minuto;

        if (dateString.includes(',') && dateString.includes('-')) {
            const [dataPart, horaPart] = dateString.split(' - ');
            const [d, m, a] = dataPart.replace(',', '').split(' ');
            dia = parseInt(d);
            mes = meses.indexOf(m.toLowerCase());
            ano = parseInt(a);
            [hora, minuto] = horaPart.split(':').map(Number);
        } else if (dateString.includes('/') && dateString.includes(',')) {
            const [dataPart, horaPart] = dateString.split(',');
            const [d, m, a] = dataPart.split('/').map(Number);
            dia = d;
            mes = m - 1;
            ano = a;
            [hora, minuto] = horaPart.trim().split(':').map(Number);
        } else {
            return null;
        }

        return new Date(Date.UTC(ano, mes, dia, hora, minuto)) || null;
    }

    function isDateNew(dateString, diasLimite) {
        const date = parseDateBr(dateString);
        if (!date) return false;

        const now = new Date();
        const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

        const diffTime = Math.abs(spNow - date);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        return diffDays <= diasLimite;
    }

    function isNovelNew(dateString) {
        return isDateNew(dateString, 30);
    }

    function isChapterNew(dateString) {
        return isDateNew(dateString, 3);
    }

    function formatDate(dateString) {
        const date = parseDateBr(dateString);
        if (!date) return 'Data inválida';

        const dia = String(date.getUTCDate()).padStart(2, '0');
        const ano = date.getUTCFullYear();
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const mes = meses[date.getUTCMonth()];

        return `<i class="far fa-calendar"></i> ${dia} ${mes}, ${ano}`;
    }

    function updateNovelUI(data) {
        if (!data) {
            novelTitle.textContent = 'Informações não disponíveis';
            novelAuthor.textContent = 'Autor desconhecido';
            novelSynopsis.textContent = 'Sinopse não disponível';
            novelCover.src = 'https://via.placeholder.com/250x350?text=Capa+Não+Disponível';
            authorLink.href = '#';
            return;
        }

        document.title = data.name + ' | Reign Of RPG\'s';
        novelTitle.textContent = data.name || '<span class="missing-info">Nome não disponível</span>';
   
        if (data.author && data.authorUrl) {
            novelAuthor.textContent = data.author;
            authorLink.href = data.authorUrl;
        } else if (data.author) {
            novelAuthor.textContent = data.author;
            authorLink.href = '#';
        } else {
            novelAuthor.innerHTML = '<span class="missing-info">Autor não disponível</span>';
            authorLink.href = '#';
        }
        
        novelSynopsis.textContent = data.sinopse || 'Sinopse não disponível.';
        
        if (data.cover) {
            novelCover.src = data.cover;
            novelCover.alt = `Capa de ${data.name}`;
        } else {
            novelCover.src = 'https://via.placeholder.com/250x350?text=Capa+Não+Disponível';
            novelCover.alt = 'Capa não disponível';
        }
        
        novelBadges.innerHTML = '';
        if (data.IsPopular) {
            const badge = document.createElement('span');
            badge.className = 'novel-badge badge-popular';
            badge.textContent = 'Popular';
            novelBadges.appendChild(badge);
        }
        if (data.IsCompleted) {
            const badge = document.createElement('span');
            badge.className = 'novel-badge badge-completed';
            badge.textContent = 'Completa';
            novelBadges.appendChild(badge);
        }
        if (data.date && isNovelNew(data.date)) {
            const badge = document.createElement('span');
            badge.className = 'novel-badge badge-new';
            badge.textContent = 'Novo';
            novelBadges.appendChild(badge);
        }
        
        if (data.date) {
            releaseDate.innerHTML = formatDate(data.date);
        } else {
            releaseDate.textContent = '-';
        }
        
        if (!window.disqusLoaded) {
            var d = document, s = d.createElement('script');
            
            var nomeCorrigido = data.name;
            var regexCapitulo = /(.*?) - Cap[ií]tulo\s*\d+$/i;

            if (regexCapitulo.test(nomeCorrigido)) {
                var match = nomeCorrigido.match(regexCapitulo);
                if (match && match[1]) {
                    nomeCorrigido = match[1] + ' - ReignOfRpgs';
                }
            } else {
                nomeCorrigido = nomeCorrigido + ' - ReignOfRpgs';
            }

            window.disqus_config = function () {
                this.page.url = window.location.href;
                this.page.identifier = nomeCorrigido;
                this.page.title = nomeCorrigido;
            };

            s.src = 'https://reignofrpgs.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            s.setAttribute('data-theme', 'dark');
            (d.head || d.body).appendChild(s);

            window.disqusLoaded = true;
        }
    }

    async function carregarCapitulo(id) {
        try {
            const response = await fetch(`./Capitulos/cap${id}.json`);
            
            if (!response.ok) {
                throw new Error(`Capítulo ${id} não encontrado`);
            }
            
            const capData = await response.json();
            capData.Id = id;
            return capData;
        } catch (error) {
            console.error(error.message);
            return null;
        }
    }

    async function carregarTodosCapitulos() {
        const capitulos = [];
        let id = 1;
        let capitulo;
        
        do {
            capitulo = await carregarCapitulo(id);
            if (capitulo) {
                capitulos.push(capitulo);
                maxChapterLoaded = id;
                id++;
            }
        } while (capitulo !== null);
        
        return capitulos;
    }

    function filterChapters(searchTerm) {
        if (!searchTerm.trim()) {
            return allChapters;
        }
        
        const term = searchTerm.toLowerCase();
        return allChapters.filter(cap => {
            const chapterNumber = `capítulo ${cap.Id}`;
            return (
                chapterNumber.includes(term) ||
                (cap.Titulo && cap.Titulo.toLowerCase().includes(term))
            );
        });
    }

    function createVerMaisElement() {
        const container = document.createElement('div');
        container.className = 'ver-mais-container';
        
        container.innerHTML = `
            <div class="ver-mais-bar"></div>
            <button class="ver-mais-text">Ver Mais</button>
        `;
        
        const verMaisBtn = container.querySelector('.ver-mais-text');
        verMaisBtn.addEventListener('click', () => {
            const hiddenChapters = document.querySelectorAll('.hidden-chapter');
            hiddenChapters.forEach(chapter => {
                chapter.classList.remove('hidden-chapter');
                chapter.style.display = 'block';
            });
            
            container.remove();
        });
        
        return container;
    }

    function renderizarCapitulos(capitulos, isSearch = false) {
        if (!capitulos || capitulos.length === 0) {
            chaptersContainer.innerHTML = `
                <div class="no-chapters">
                    <i class="fas fa-book-open"></i>
                    <h3>Nenhum Capítulo Encontrado</h3>
                    <p>Nenhum capítulo corresponde à sua pesquisa. Tente novamente com termos diferentes.</p>
                </div>
            `;
            totalChapters.textContent = "0";
            return;
        }
        
        chaptersContainer.innerHTML = '';
        document.querySelector('.ver-mais-container')?.remove();
        
        if (isSearch) {
            displayedChapters = capitulos;
        } else {
            displayedChapters = capitulos;
            
            if (capitulos.length > 4) {
                for (let i = 4; i < capitulos.length; i++) {
                    capitulos[i].hidden = true;
                }
            }
        }
        
        displayedChapters.forEach((cap, index) => {
            const chapterNumber = cap.Id;
            const badges = [];
            
            if (cap.Date && isChapterNew(cap.Date)) {
                badges.push(`<span class="badge badge-new">Novo</span>`);
            }
            if (cap.IsHot) badges.push(`<span class="badge badge-hot">Destaque</span>`);
            if (cap.IsFinal) badges.push(`<span class="badge badge-final">Final</span>`);
            
            const preview = cap.Content.replace(/<br>/g, ' ').replace(/<\/?[^>]+(>|$)/g, "");
            const words = preview.split(' ');
            const shortPreview = words.length > 50 ? words.slice(0, 50).join(' ') + '...' : preview;
            
            const chapterEl = document.createElement('div');
            chapterEl.className = `chapter-card ${index >= 4 && !isSearch ? 'hidden-chapter' : ''}`;
            chapterEl.innerHTML = `
                <div class="chapter-header">
                    <div class="chapter-number">Capítulo ${chapterNumber}</div>
                    <h3 class="chapter-title">${cap.Titulo}</h3>
                    <div class="chapter-date">
                        ${formatDate(cap.Date)}
                    </div>
                    <div class="chapter-badges">
                        ${badges.join('')}
                    </div>
                </div>
                <div class="chapter-content">
                    <p class="chapter-preview">${shortPreview}</p>
                    <button class="btn-read" data-id="${chapterNumber}">
                        <i class="fas fa-book-reader"></i>
                        Ler Capítulo
                    </button>
                </div>
            `;
            
            chaptersContainer.appendChild(chapterEl);
        });
        
        if (capitulos.length > 4 && !isSearch) {
            const verMaisContainer = createVerMaisElement();
            chaptersContainer.parentNode.insertBefore(verMaisContainer, chaptersContainer.nextSibling);
        }
        
        totalChapters.textContent = allChapters.length;
        
        document.querySelectorAll('.btn-read').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                abrirCapitulo(id);
            });
        });
    }

    async function abrirCapitulo(id) {
        const arrayIndex = id - 1;
        
        if (arrayIndex >= 0 && arrayIndex < allChapters.length) {
            currentChapter = allChapters[arrayIndex];
            currentChapterIndex = arrayIndex;
            mostrarCapituloNoModal();
            return;
        }
        
        try {
            const cap = await carregarCapitulo(id);
            if (!cap) {
                alert('Capítulo não encontrado');
                return;
            }
            
            if (id > maxChapterLoaded) {
                allChapters.push(cap);
                maxChapterLoaded = id;
                renderizarCapitulos(allChapters, isSearching);
            }
            
            currentChapter = cap;
            currentChapterIndex = id - 1;
            mostrarCapituloNoModal();
        } catch (error) {
            console.error('Erro ao carregar capítulo:', error);
            alert('Erro ao carregar o capítulo');
        }
    }

    function mostrarCapituloNoModal() {
        if (!currentChapter) return;
        
        const displayNumber = currentChapterIndex + 1;
        readerTitle.textContent = `Capítulo ${displayNumber}: ${currentChapter.Titulo}`;
        readerBody.innerHTML = `<p>${currentChapter.Content}</p>`;
        
        btnPrev.disabled = currentChapterIndex === 0;
        btnNext.disabled = false;
        
        readerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        readerBody.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function fecharLeitor() {
        readerModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Event listeners combinados
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar player de música
        musicSelect.addEventListener('change', e => playSelectedMusic(e));
        mobileMusicSelect.addEventListener('change', e => playSelectedMusic(e));
        
        playPauseBtn.addEventListener('click', togglePlayPause);
        nextBtn.addEventListener('click', playNextMusic);
        prevBtn.addEventListener('click', playPreviousMusic);
        
        mobilePlayPauseBtn.addEventListener('click', togglePlayPause);
        mobileNextBtn.addEventListener('click', playNextMusic);
        mobilePrevBtn.addEventListener('click', playPreviousMusic);
        
        toggleSelectBtn.addEventListener('click', toggleSelectMenu);
        mobileToggleSelectBtn.addEventListener('click', toggleSelectMenu);
        
        audioPlayer.addEventListener('ended', playNextMusic);

        playerContainer.style.left = '1.25rem';
playerContainer.style.top = '1.25rem';
mobileControls.style.right = '1.25rem';
mobileControls.style.bottom = '1.25rem';

        playerDragArea.addEventListener('mousedown', startDrag);
        playerDragArea.addEventListener('touchstart', startDrag, { passive: false });
        mobileDragArea.addEventListener('mousedown', startMobileDrag);
        mobileDragArea.addEventListener('touchstart', startMobileDrag, { passive: false });

        // Controles do botão de ocultar player
        hidePlayerBtn.addEventListener('click', togglePlayerVisibility);
        miniPlayer.addEventListener('click', togglePlayerVisibility);
        
        // Verificar tamanho da tela inicialmente
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        loadMusics();

        // Inicializar leitor de novel
        btnPrev.addEventListener('click', () => {
            if (currentChapterIndex > 0) {
                currentChapterIndex--;
                currentChapter = allChapters[currentChapterIndex];
                mostrarCapituloNoModal();
                
                readerBody.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });

        btnNext.addEventListener('click', async () => {
            const nextChapterId = currentChapterIndex + 2;
            
            if (nextChapterId - 1 < allChapters.length) {
                currentChapterIndex++;
                currentChapter = allChapters[currentChapterIndex];
                mostrarCapituloNoModal();
                
                readerBody.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }
            
            try {
                const cap = await carregarCapitulo(nextChapterId);
                if (!cap) {
                    btnNext.disabled = true;
                    return;
                }
                
                allChapters.push(cap);
                maxChapterLoaded = nextChapterId;
                currentChapterIndex++;
                currentChapter = cap;
                
                renderizarCapitulos(allChapters, isSearching);
                mostrarCapituloNoModal();
                
                readerBody.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } catch (error) {
                console.error('Erro ao carregar próximo capítulo:', error);
                btnNext.disabled = true;
            }
        });

        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                isSearching = true;
                currentSearchTerm = searchTerm;
                const filteredChapters = filterChapters(searchTerm);
                renderizarCapitulos(filteredChapters, true);
            } else {
                isSearching = false;
                currentSearchTerm = '';
                renderizarCapitulos(allChapters, false);
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });

        btnClose.addEventListener('click', fecharLeitor);
        
        readerModal.addEventListener('click', (e) => {
            if (e.target === readerModal) {
                fecharLeitor();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && readerModal.classList.contains('active')) {
                fecharLeitor();
            }
        });

        // Inicialização combinada
        async function init() {
            try {
                novelData = await loadNovelData();
                updateNovelUI(novelData);
                
                allChapters = await carregarTodosCapitulos();
                renderizarCapitulos(allChapters, false);
              
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                chaptersContainer.innerHTML = `
                    <div class="no-chapters">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao Carregar Dados</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
        
        init();
    });