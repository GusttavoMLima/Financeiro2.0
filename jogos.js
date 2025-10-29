// =================================================================================
// Organização Pessoal - jogos.js
// Versão: 6.0 (Sistema Completo com localStorage e Melhorias)
// =================================================================================

let gameModal = null;
let currentlyEditingGame = null;

// Sistema de localStorage para persistência de dados
const GAME_STORAGE_KEYS = {
    GAMES: 'game_library',
    SETTINGS: 'game_settings'
};

// Configuração da API RAWG
const RAWG_API = {
    BASE_URL: 'https://api.rawg.io/api',
    API_KEY: '1a957308e37b458ea316441ff60167bc',
    ENDPOINTS: {
        GAMES: '/games',
        GENRES: '/genres',
        PLATFORMS: '/platforms',
        SEARCH: '/games'
    }
};

// Cache para dados da API
const apiCache = new Map();

// Funções de localStorage para jogos
function saveGamesToStorage() {
    const games = [];
    const gameList = document.getElementById('game-list');
    const items = gameList.querySelectorAll('.game-item');
    
    items.forEach(item => {
        games.push({
            id: item.dataset.id || Date.now() + Math.random(),
            title: item.dataset.title,
            platform: item.dataset.platform,
            status: item.dataset.status,
            rating: item.dataset.rating,
            dateAdded: item.dataset.dateAdded || new Date().toISOString()
        });
    });
    
    try {
        localStorage.setItem(GAME_STORAGE_KEYS.GAMES, JSON.stringify(games));
        return true;
    } catch (error) {
        console.error('Erro ao salvar jogos:', error);
        showToast('Erro ao salvar dados. Verifique o espaço disponível.', 'danger');
        return false;
    }
}

function loadGamesFromStorage() {
    try {
        const savedGames = localStorage.getItem(GAME_STORAGE_KEYS.GAMES);
        return savedGames ? JSON.parse(savedGames) : [];
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        return [];
    }
}

// Carregar jogos salvos ao inicializar
function loadSavedGames() {
    const savedGames = loadGamesFromStorage();
    const gameList = document.getElementById('game-list');
    
    if (savedGames.length > 0) {
        savedGames.forEach(game => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item game-item';
            listItem.dataset.title = game.title;
            listItem.dataset.platform = game.platform;
            listItem.dataset.status = game.status;
            listItem.dataset.rating = game.rating;
            listItem.dataset.id = game.id;
            listItem.dataset.dateAdded = game.dateAdded;
            gameList.appendChild(listItem);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const gameForm = document.getElementById('add-game-form');
    if (!gameForm) return;

    // Carregar dados salvos
    loadSavedGames();

    gameModal = new bootstrap.Modal(document.getElementById('game-modal'));
    const gameTitleInput = document.getElementById('game-title');
    const gamePlatformInput = document.getElementById('game-platform');
    const gameStatusInput = document.getElementById('game-status');
    const gameRatingInput = document.getElementById('game-rating');
    const gameList = document.getElementById('game-list');
    const modalTitle = document.getElementById('game-modal-title');
    const submitButton = document.getElementById('game-submit-btn');

    const platformFilter = document.getElementById('platform-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchFilter = document.getElementById('search-game-filter');

    function resetForm() {
        gameForm.reset();
        currentlyEditingGame = null;
        modalTitle.textContent = "Adicionar Novo Jogo";
        submitButton.textContent = "Adicionar";
        submitButton.classList.remove('btn-success');
        submitButton.classList.add('btn-primary');
    }

    gameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const title = gameTitleInput.value;
        const platform = gamePlatformInput.value;
        const status = gameStatusInput.value;
        const rating = gameRatingInput.value;

        if (!title || !platform || !status) {
            showToast("Nome, Plataforma e Status são obrigatórios.", "warning");
            return;
        }
        
        const successMessage = currentlyEditingGame ? "Jogo atualizado com sucesso!" : "Jogo adicionado com sucesso!";

        if (currentlyEditingGame === null) {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item game-item';
            listItem.dataset.title = title;
            listItem.dataset.platform = platform;
            listItem.dataset.status = status;
            listItem.dataset.rating = rating;
            listItem.dataset.id = Date.now() + Math.random();
            listItem.dataset.dateAdded = new Date().toISOString();
            
            // Verificar se tem dados da API (se foi adicionado via API)
            const apiDataInput = document.getElementById('api-data-input');
            if (apiDataInput && apiDataInput.value) {
                listItem.dataset.apiData = apiDataInput.value;
            }
            
            gameList.appendChild(listItem);
        } else {
            currentlyEditingGame.dataset.title = title;
            currentlyEditingGame.dataset.platform = platform;
            currentlyEditingGame.dataset.status = status;
            currentlyEditingGame.dataset.rating = rating;
        }
        
        saveGamesToStorage(); // Salvar no localStorage
        resetForm();
        updateGameView();
        gameModal.hide();
        showToast(successMessage, "success");
    });

    document.getElementById('game-modal').addEventListener('hidden.bs.modal', resetForm);
    
    platformFilter.addEventListener('change', updateGameView);
    statusFilter.addEventListener('change', updateGameView);
    searchFilter.addEventListener('input', updateGameView);

    // Botão de exportar dados
    const exportBtn = document.getElementById('export-games-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportGamesData);
    }

    // Configurar busca na API
    setupAPISearch();

    setupGameActionListeners();
    updateGameView();
});

function updateGameView() {
    // (Esta função não foi alterada, o seu conteúdo permanece o mesmo)
    const gameList = document.getElementById('game-list');
    if (!gameList) return;
    const platformFilterValue = document.getElementById('platform-filter').value;
    const statusFilterValue = document.getElementById('status-filter').value;
    const searchFilterValue = document.getElementById('search-game-filter').value.toLowerCase();
    const games = gameList.querySelectorAll('.game-item');
    let totalCount = 0;
    let playingCount = 0;
    let finishedCount = 0;
    let backlogCount = 0;
    games.forEach(game => {
        const { title, platform, status, rating } = game.dataset;
        const platformMatch = platformFilterValue === 'Todos' || platform === platformFilterValue;
        const statusMatch = statusFilterValue === 'Todos' || status === statusFilterValue;
        const searchMatch = title.toLowerCase().includes(searchFilterValue);
        if (platformMatch && statusMatch && searchMatch) {
            game.style.display = 'block';
            totalCount++;
            if (status === 'Jogando') playingCount++;
            if (status === 'Finalizado') finishedCount++;
            if (status === 'Backlog') backlogCount++;
            // Interface visual melhorada com dados da API
            const platformIcon = getPlatformIcon(platform);
            const statusColor = getStatusColor(status);
            const ratingDisplay = rating && rating !== 'Sem nota' ? `<span class="game-rating">${rating}</span>` : '';
            const dateAdded = new Date(game.dataset.dateAdded).toLocaleDateString('pt-BR');
            
            // Verificar se tem dados da API
            const hasAPIData = game.dataset.apiData;
            const apiData = hasAPIData ? JSON.parse(game.dataset.apiData) : null;
            
            game.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="platform-icon me-3">
                            <i class="bi ${platformIcon} fs-3"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="mb-1 fw-bold">${title}</h5>
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <small class="text-muted">
                                    <i class="bi bi-controller me-1"></i>${platform}
                                </small>
                                <small class="text-muted">
                                    <i class="bi bi-calendar3 me-1"></i>${dateAdded}
                                </small>
                                ${apiData ? `
                                    <small class="text-success">
                                        <i class="bi bi-star me-1"></i>${apiData.rating || 'N/A'}/5
                                    </small>
                                ` : ''}
                            </div>
                            ${apiData ? `
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <small class="text-muted">
                                        <i class="bi bi-tags me-1"></i>${apiData.genres?.slice(0, 2).join(', ') || 'N/A'}
                                    </small>
                                    ${apiData.metacritic ? `
                                        <small class="text-info">
                                            <i class="bi bi-award me-1"></i>${apiData.metacritic}
                                        </small>
                                    ` : ''}
                                </div>
                            ` : ''}
                        ${ratingDisplay}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${statusColor} rounded-pill px-3 py-2">${status}</span>
                        <div class="btn-group" role="group">
                            ${apiData ? `
                                <button class="btn btn-sm btn-outline-info view-api-details-btn" title="Ver Detalhes da API" data-api-data='${JSON.stringify(apiData)}'>
                                    <i class="bi bi-info-circle"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-primary edit-btn" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            game.style.display = 'none';
        }
    });
    document.getElementById('total-games').textContent = totalCount;
    document.getElementById('playing-games').textContent = playingCount;
    document.getElementById('finished-games').textContent = finishedCount;
    document.getElementById('backlog-games').textContent = backlogCount;
}

function setupGameActionListeners() {
    const list = document.getElementById('game-list');
    if (!list) return;

    list.addEventListener('click', (event) => {
        const target = event.target;
        const item = target.closest('.game-item');
        if (!item) return;

        if (target.classList.contains('delete-btn')) {
            item.remove();
            saveGamesToStorage(); // Salvar no localStorage após deletar
            updateGameView();
            showToast("Jogo apagado.", "info");
        }

        if (target.classList.contains('edit-btn')) {
            currentlyEditingGame = item;
            const { title, platform, status, rating } = item.dataset;
            
            document.getElementById('game-title').value = title;
            document.getElementById('game-platform').value = platform;
            document.getElementById('game-status').value = status;
            document.getElementById('game-rating').value = rating || 'Sem nota';
            
            document.getElementById('game-modal-title').textContent = "Editar Jogo";
            const submitButton = document.getElementById('game-submit-btn');
            submitButton.textContent = "Salvar Alterações";
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-success');
            
            gameModal.show();
        }

        if (target.classList.contains('view-api-details-btn')) {
            const apiData = JSON.parse(target.dataset.apiData);
            showAPIGameDetails(apiData);
        }
    });
}

// Funções auxiliares para interface
function getPlatformIcon(platform) {
    const icons = {
        'PC': 'bi-pc-display',
        'PlayStation 5': 'bi-playstation',
        'Xbox Series X': 'bi-xbox',
        'Nintendo Switch': 'bi-nintendo-switch',
        'Outra': 'bi-controller'
    };
    return icons[platform] || 'bi-controller';
}

function getStatusColor(status) {
    const colors = {
        'Backlog': 'bg-secondary',
        'Jogando': 'bg-primary',
        'Finalizado': 'bg-success',
        'Pausado': 'bg-warning',
        'Desistido': 'bg-danger'
    };
    return colors[status] || 'bg-secondary';
}

// Função para exportar dados dos jogos
function exportGamesData() {
    const games = loadGamesFromStorage();
    
    if (games.length === 0) {
        showToast("Nenhum jogo para exportar.", "warning");
        return;
    }
    
    // Criar CSV
    let csvContent = "Título,Plataforma,Status,Avaliação,Data Adicionado\n";
    games.forEach(game => {
        const dateAdded = new Date(game.dateAdded).toLocaleDateString('pt-BR');
        csvContent += `"${game.title}","${game.platform}","${game.status}","${game.rating}","${dateAdded}"\n`;
    });
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `biblioteca_jogos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Biblioteca de jogos exportada com sucesso!", "success");
}

// =================================================================================
// FUNÇÕES DA API RAWG
// =================================================================================

// Função para fazer requisições à API RAWG
async function fetchFromRAWG(endpoint, params = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Verificar cache primeiro
    if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
    }
    
    try {
        const url = new URL(`${RAWG_API.BASE_URL}${endpoint}`);
        url.searchParams.append('key', RAWG_API.API_KEY);
        
        // Adicionar parâmetros
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Salvar no cache
        apiCache.set(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados da API RAWG:', error);
        showToast('Erro ao conectar com a API de jogos. Verifique sua conexão.', 'warning');
        return null;
    }
}

// Buscar jogos por nome
async function searchGames(query, limit = 20) {
    if (!query || query.length < 3) {
        return { results: [] };
    }
    
    return await fetchFromRAWG(RAWG_API.ENDPOINTS.SEARCH, {
        search: query,
        page_size: limit,
        ordering: '-rating'
    });
}

// Buscar detalhes de um jogo específico
async function getGameDetails(gameId) {
    return await fetchFromRAWG(`${RAWG_API.ENDPOINTS.GAMES}/${gameId}`);
}

// Buscar jogos populares
async function getPopularGames(limit = 10) {
    return await fetchFromRAWG(RAWG_API.ENDPOINTS.GAMES, {
        page_size: limit,
        ordering: '-rating',
        dates: '2020-01-01,2024-12-31'
    });
}

// Buscar gêneros disponíveis
async function getGenres() {
    return await fetchFromRAWG(RAWG_API.ENDPOINTS.GENRES);
}

// Buscar plataformas disponíveis
async function getPlatforms() {
    return await fetchFromRAWG(RAWG_API.ENDPOINTS.PLATFORMS);
}

// Função para formatar dados do jogo da API
function formatGameFromAPI(apiGame) {
    return {
        id: apiGame.id,
        name: apiGame.name,
        slug: apiGame.slug,
        released: apiGame.released,
        background_image: apiGame.background_image,
        rating: apiGame.rating,
        rating_top: apiGame.rating_top,
        ratings_count: apiGame.ratings_count,
        metacritic: apiGame.metacritic,
        playtime: apiGame.playtime,
        platforms: apiGame.platforms?.map(p => p.platform.name) || [],
        genres: apiGame.genres?.map(g => g.name) || [],
        stores: apiGame.stores?.map(s => s.store.name) || [],
        tags: apiGame.tags?.map(t => t.name) || [],
        description: apiGame.description_raw || apiGame.description,
        website: apiGame.website,
        reddit_url: apiGame.reddit_url,
        metacritic_url: apiGame.metacritic_url
    };
}

// =================================================================================
// FUNCIONALIDADES DE BUSCA NA API
// =================================================================================

// Configurar busca na API
function setupAPISearch() {
    const searchApiBtn = document.getElementById('search-api-btn');
    const apiSearchModal = new bootstrap.Modal(document.getElementById('api-search-modal'));
    const apiSearchInput = document.getElementById('api-search-input');
    const apiSearchBtn = document.getElementById('api-search-btn');
    const apiSearchResults = document.getElementById('api-search-results');

    // Abrir modal de busca
    if (searchApiBtn) {
        searchApiBtn.addEventListener('click', () => {
            apiSearchModal.show();
        });
    }

    // Buscar jogos na API
    if (apiSearchBtn) {
        apiSearchBtn.addEventListener('click', async () => {
            const query = apiSearchInput.value.trim();
            if (query.length < 3) {
                showToast('Digite pelo menos 3 caracteres para buscar.', 'warning');
                return;
            }

            await searchGamesInAPI(query);
        });
    }

    // Buscar ao pressionar Enter
    if (apiSearchInput) {
        apiSearchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = apiSearchInput.value.trim();
                if (query.length >= 3) {
                    await searchGamesInAPI(query);
                }
            }
        });
    }
}

// Buscar jogos na API
async function searchGamesInAPI(query) {
    const apiSearchResults = document.getElementById('api-search-results');
    
    // Mostrar loading
    apiSearchResults.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Buscando...</span>
            </div>
            <p class="mt-2">Buscando jogos...</p>
        </div>
    `;

    try {
        const searchResults = await searchGames(query, 20);
        
        if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
            apiSearchResults.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted"></i>
                    <p class="mt-2">Nenhum jogo encontrado para "${query}"</p>
                </div>
            `;
            return;
        }

        // Exibir resultados
        displayAPISearchResults(searchResults.results);
        
    } catch (error) {
        console.error('Erro ao buscar jogos:', error);
        apiSearchResults.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erro ao buscar jogos. Tente novamente.
            </div>
        `;
    }
}

// Exibir resultados da busca na API
function displayAPISearchResults(games) {
    const apiSearchResults = document.getElementById('api-search-results');
    
    const gamesHTML = games.map(game => {
        const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'N/A';
        const genres = game.genres?.map(g => g.name).join(', ') || 'N/A';
        const rating = game.rating ? Math.round(game.rating * 10) / 10 : 'N/A';
        const releaseDate = game.released ? new Date(game.released).toLocaleDateString('pt-BR') : 'N/A';
        
        return `
            <div class="card mb-3 game-search-result" data-game-id="${game.id}">
                <div class="row g-0">
                    <div class="col-md-3">
                        <img src="${game.background_image || '/assets/no-image.jpg'}" 
                             class="img-fluid rounded-start h-100 object-cover" 
                             alt="${game.name}"
                             style="height: 120px; object-fit: cover;">
                    </div>
                    <div class="col-md-9">
                        <div class="card-body">
                            <h6 class="card-title fw-bold">${game.name}</h6>
                            <div class="row">
                                <div class="col-sm-6">
                                    <small class="text-muted">
                                        <i class="bi bi-calendar3 me-1"></i>${releaseDate}<br>
                                        <i class="bi bi-star me-1"></i>${rating}/5<br>
                                        <i class="bi bi-controller me-1"></i>${platforms}
                                    </small>
                                </div>
                                <div class="col-sm-6">
                                    <small class="text-muted">
                                        <i class="bi bi-tags me-1"></i>${genres}
                                    </small>
                                </div>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-sm btn-primary add-from-api-btn" 
                                        data-game-id="${game.id}" 
                                        data-game-name="${game.name}">
                                    <i class="bi bi-plus-circle me-1"></i>Adicionar à Biblioteca
                                </button>
                                <button class="btn btn-sm btn-outline-info view-details-btn" 
                                        data-game-id="${game.id}">
                                    <i class="bi bi-info-circle me-1"></i>Detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    apiSearchResults.innerHTML = gamesHTML;

    // Adicionar event listeners para os botões
    setupAPISearchEventListeners();
}

// Configurar event listeners para busca na API
function setupAPISearchEventListeners() {
    // Botão para adicionar jogo da API
    document.querySelectorAll('.add-from-api-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            const gameName = e.target.dataset.gameName;
            
            try {
                // Buscar detalhes completos do jogo
                const gameDetails = await getGameDetails(gameId);
                if (gameDetails) {
                    addGameFromAPI(gameDetails);
                } else {
                    showToast('Erro ao buscar detalhes do jogo.', 'danger');
                }
            } catch (error) {
                console.error('Erro ao adicionar jogo:', error);
                showToast('Erro ao adicionar jogo à biblioteca.', 'danger');
            }
        });
    });

    // Botão para ver detalhes
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            await showGameDetails(gameId);
        });
    });
}

// Adicionar jogo da API à biblioteca
function addGameFromAPI(apiGame) {
    const formattedGame = formatGameFromAPI(apiGame);
    
    // Preencher formulário com dados da API
    document.getElementById('game-title').value = formattedGame.name;
    
    // Tentar mapear plataforma
    const platformMap = {
        'PC': 'PC',
        'PlayStation 5': 'PlayStation 5',
        'Xbox Series X': 'Xbox Series X',
        'Nintendo Switch': 'Nintendo Switch'
    };
    
    const detectedPlatform = formattedGame.platforms.find(p => platformMap[p]) || 'Outra';
    document.getElementById('game-platform').value = detectedPlatform;
    
    // Adicionar campo oculto com dados da API
    let apiDataInput = document.getElementById('api-data-input');
    if (!apiDataInput) {
        apiDataInput = document.createElement('input');
        apiDataInput.type = 'hidden';
        apiDataInput.id = 'api-data-input';
        document.getElementById('add-game-form').appendChild(apiDataInput);
    }
    apiDataInput.value = JSON.stringify(formattedGame);
    
    // Fechar modal de busca e abrir modal de adição
    bootstrap.Modal.getInstance(document.getElementById('api-search-modal')).hide();
    gameModal.show();
    
    showToast(`Jogo "${formattedGame.name}" carregado! Complete os dados e salve.`, 'success');
}

// Mostrar detalhes do jogo
async function showGameDetails(gameId) {
    try {
        const gameDetails = await getGameDetails(gameId);
        if (!gameDetails) {
            showToast('Erro ao carregar detalhes do jogo.', 'danger');
            return;
        }

        const formattedGame = formatGameFromAPI(gameDetails);
        
        // Criar modal de detalhes
        const detailsModal = `
            <div class="modal fade" id="game-details-modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content glass">
                        <div class="modal-header">
                            <h5 class="modal-title">${formattedGame.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="${formattedGame.background_image || '/assets/no-image.jpg'}" 
                                         class="img-fluid rounded" alt="${formattedGame.name}">
                                </div>
                                <div class="col-md-8">
                                    <h6>Informações</h6>
                                    <p><strong>Lançamento:</strong> ${formattedGame.released || 'N/A'}</p>
                                    <p><strong>Avaliação:</strong> ${formattedGame.rating || 'N/A'}/5</p>
                                    <p><strong>Metacritic:</strong> ${formattedGame.metacritic || 'N/A'}</p>
                                    <p><strong>Plataformas:</strong> ${formattedGame.platforms.join(', ')}</p>
                                    <p><strong>Gêneros:</strong> ${formattedGame.genres.join(', ')}</p>
                                    <p><strong>Tempo de Jogo:</strong> ${formattedGame.playtime || 'N/A'} horas</p>
                                </div>
                            </div>
                            ${formattedGame.description ? `
                                <div class="mt-3">
                                    <h6>Descrição</h6>
                                    <p class="text-muted">${formattedGame.description.substring(0, 500)}${formattedGame.description.length > 500 ? '...' : ''}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-primary" onclick="addGameFromAPI(${JSON.stringify(formattedGame).replace(/"/g, '&quot;')})">
                                <i class="bi bi-plus-circle me-1"></i>Adicionar à Biblioteca
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const existingModal = document.getElementById('game-details-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', detailsModal);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('game-details-modal'));
        modal.show();

    } catch (error) {
        console.error('Erro ao mostrar detalhes:', error);
        showToast('Erro ao carregar detalhes do jogo.', 'danger');
    }
}

// Mostrar detalhes do jogo da API
function showAPIGameDetails(apiData) {
    // Criar modal de detalhes
    const detailsModal = `
        <div class="modal fade" id="api-game-details-modal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content glass">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-info-circle me-2"></i>${apiData.name}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${apiData.background_image || '/assets/no-image.jpg'}" 
                                     class="img-fluid rounded" alt="${apiData.name}"
                                     style="max-height: 200px; object-fit: cover;">
                            </div>
                            <div class="col-md-8">
                                <h6>Informações da API</h6>
                                <div class="row">
                                    <div class="col-sm-6">
                                        <p><strong>Lançamento:</strong> ${apiData.released || 'N/A'}</p>
                                        <p><strong>Avaliação:</strong> ${apiData.rating || 'N/A'}/5</p>
                                        <p><strong>Metacritic:</strong> ${apiData.metacritic || 'N/A'}</p>
                                        <p><strong>Tempo de Jogo:</strong> ${apiData.playtime || 'N/A'} horas</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <p><strong>Plataformas:</strong> ${apiData.platforms?.join(', ') || 'N/A'}</p>
                                        <p><strong>Gêneros:</strong> ${apiData.genres?.join(', ') || 'N/A'}</p>
                                        <p><strong>Tags:</strong> ${apiData.tags?.slice(0, 5).join(', ') || 'N/A'}</p>
                                        <p><strong>Stores:</strong> ${apiData.stores?.join(', ') || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${apiData.description ? `
                            <div class="mt-3">
                                <h6>Descrição</h6>
                                <p class="text-muted">${apiData.description.substring(0, 800)}${apiData.description.length > 800 ? '...' : ''}</p>
                            </div>
                        ` : ''}
                        ${apiData.website || apiData.reddit_url || apiData.metacritic_url ? `
                            <div class="mt-3">
                                <h6>Links</h6>
                                <div class="d-flex gap-2 flex-wrap">
                                    ${apiData.website ? `<a href="${apiData.website}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-globe me-1"></i>Website</a>` : ''}
                                    ${apiData.reddit_url ? `<a href="${apiData.reddit_url}" target="_blank" class="btn btn-sm btn-outline-danger"><i class="bi bi-reddit me-1"></i>Reddit</a>` : ''}
                                    ${apiData.metacritic_url ? `<a href="${apiData.metacritic_url}" target="_blank" class="btn btn-sm btn-outline-warning"><i class="bi bi-award me-1"></i>Metacritic</a>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior se existir
    const existingModal = document.getElementById('api-game-details-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adicionar novo modal
    document.body.insertAdjacentHTML('beforeend', detailsModal);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('api-game-details-modal'));
    modal.show();
}