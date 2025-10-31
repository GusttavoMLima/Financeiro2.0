// =================================================================================
// Organização Pessoal - hotwheels.js
// Versão: 3.0 (Sistema Completo com localStorage e Melhorias)
// =================================================================================

let hwModal = null;
let currentlyEditingHw = null;

// Sistema de localStorage para persistência de dados
const HW_STORAGE_KEYS = {
    CARS: 'hotwheels_collection',
    SETTINGS: 'hotwheels_settings'
};

// Funções de localStorage para Hot Wheels
function saveCarsToStorage() {
    const cars = [];
    const hwList = document.getElementById('hw-list');
    const items = hwList.querySelectorAll('.hw-item');
    
    items.forEach(item => {
        cars.push({
            id: item.dataset.id || Date.now() + Math.random(),
            name: item.dataset.name,
            number: item.dataset.number,
            year: item.dataset.year,
            series: item.dataset.series,
            dateAdded: item.dataset.dateAdded || new Date().toISOString()
        });
    });
    
    try {
        localStorage.setItem(HW_STORAGE_KEYS.CARS, JSON.stringify(cars));
        return true;
    } catch (error) {
        console.error('Erro ao salvar carros:', error);
        showToast('Erro ao salvar dados. Verifique o espaço disponível.', 'danger');
        return false;
    }
}

function loadCarsFromStorage() {
    try {
        const savedCars = localStorage.getItem(HW_STORAGE_KEYS.CARS);
        return savedCars ? JSON.parse(savedCars) : [];
    } catch (error) {
        console.error('Erro ao carregar carros:', error);
        return [];
    }
}

// Carregar carros salvos ao inicializar
function loadSavedCars() {
    const savedCars = loadCarsFromStorage();
    const hwList = document.getElementById('hw-list');
    
    if (savedCars.length > 0) {
        savedCars.forEach(car => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item hw-item';
            listItem.dataset.name = car.name;
            listItem.dataset.number = car.number;
            listItem.dataset.year = car.year;
            listItem.dataset.series = car.series;
            listItem.dataset.id = car.id;
            listItem.dataset.dateAdded = car.dateAdded;
            hwList.appendChild(listItem);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hwForm = document.getElementById('add-hw-form');
    if (!hwForm) return;

    // Carregar dados salvos
    loadSavedCars();

    hwModal = new bootstrap.Modal(document.getElementById('hw-modal'));
    const hwNameInput = document.getElementById('hw-name');
    const hwNumberInput = document.getElementById('hw-number');
    const hwYearInput = document.getElementById('hw-year');
    const hwSeriesInput = document.getElementById('hw-series');
    const hwList = document.getElementById('hw-list');
    const modalTitle = document.getElementById('hw-modal-title');
    const submitButton = document.getElementById('hw-submit-btn');

    const seriesFilter = document.getElementById('hw-series-filter');
    const searchFilter = document.getElementById('search-hw-filter');

    function resetForm() {
        hwForm.reset();
        currentlyEditingHw = null;
        modalTitle.textContent = "Adicionar Novo Carrinho";
        submitButton.textContent = "Adicionar";
        submitButton.classList.remove('btn-success');
        submitButton.classList.add('btn-primary');
    }

    // Substitua a sua função hwForm.addEventListener inteira por esta

hwForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = hwNameInput.value;
    const number = hwNumberInput.value;
    const year = hwYearInput.value;
    const series = hwSeriesInput.value;
    
    if (!name || !number || !year) {
        showToast("Nome, Número e Ano são obrigatórios.", "warning");
        return;
    }

    // --- INÍCIO DA NOVA LÓGICA DE VERIFICAÇÃO ---
    // Só verifica duplicados se estiver a adicionar um novo carrinho
    if (currentlyEditingHw === null) {
        const items = hwList.querySelectorAll('.hw-item');
        let isDuplicate = false;
        items.forEach(item => {
            if (item.dataset.number.toLowerCase() === number.toLowerCase()) {
                isDuplicate = true;
            }
        });

        if (isDuplicate) {
            showToast("Atenção: Já existe um carrinho com este número na sua coleção.", "danger");
            return; // Para a execução e não adiciona o carrinho
        }
    }
    // --- FIM DA NOVA LÓGICA DE VERIFICAÇÃO ---

    const successMessage = currentlyEditingHw ? "Carrinho atualizado com sucesso!" : "Carrinho adicionado com sucesso!";

    if (currentlyEditingHw === null) {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item hw-item';
        listItem.dataset.name = name;
        listItem.dataset.number = number;
        listItem.dataset.year = year;
        listItem.dataset.series = series;
        listItem.dataset.id = Date.now() + Math.random();
        listItem.dataset.dateAdded = new Date().toISOString();
        hwList.appendChild(listItem);
    } else {
        currentlyEditingHw.dataset.name = name;
        currentlyEditingHw.dataset.number = number;
        currentlyEditingHw.dataset.year = year;
        currentlyEditingHw.dataset.series = series;
    }
    
    saveCarsToStorage(); // Salvar no localStorage
    resetForm();
    updateHwView();
    hwModal.hide();
    showToast(successMessage, "success");
});

    document.getElementById('hw-modal').addEventListener('hidden.bs.modal', resetForm);
    
    seriesFilter.addEventListener('change', updateHwView);
    // Debounce da busca por nome/numero
    function debounce(fn, delay = 250) {
        let t;
        return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
    }
    searchFilter.addEventListener('input', debounce(updateHwView, 250));

    // Botão de exportar dados
    const exportBtn = document.getElementById('export-hw-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportHotWheelsData);
    }

    setupHwActionListeners();
    updateHwView();
});

function updateHwView() {
    // (Esta função não foi alterada, o seu conteúdo permanece o mesmo)
    const hwList = document.getElementById('hw-list');
    if (!hwList) return;
    const seriesFilterValue = document.getElementById('hw-series-filter').value;
    const searchFilterValue = document.getElementById('search-hw-filter').value.toLowerCase();
    const items = hwList.querySelectorAll('.hw-item');
    let totalCount = 0;
    const seriesSet = new Set();
    const yearCounts = {};
    items.forEach(item => {
        const { name, number, year, series } = item.dataset;
        const seriesMatch = seriesFilterValue === 'Todos' || series === seriesFilterValue;
        const searchMatch = name.toLowerCase().includes(searchFilterValue) || number.toLowerCase().includes(searchFilterValue);
        if (seriesMatch && searchMatch) {
            item.style.display = 'block';
            const dateAdded = new Date(item.dataset.dateAdded).toLocaleDateString('pt-BR');
            const seriesColor = getSeriesColor(series);
            
            // Renderização segura sem innerHTML
            item.textContent = '';
            const wrap = document.createElement('div');
            wrap.className = 'd-flex w-100 justify-content-between align-items-center';

            const left = document.createElement('div');
            left.className = 'd-flex align-items-center';
            const carIconWrap = document.createElement('div');
            carIconWrap.className = 'car-icon me-3';
            const carIcon = document.createElement('i');
            carIcon.className = 'bi bi-car-front-fill fs-3 text-primary';
            carIconWrap.appendChild(carIcon);
            const leftText = document.createElement('div');
            const title = document.createElement('h5');
            title.className = 'mb-1 fw-bold';
            const yearSpan = document.createElement('span');
            yearSpan.className = 'text-muted fw-normal fs-6';
            yearSpan.textContent = `(${year})`;
            title.appendChild(document.createTextNode(name + ' '));
            title.appendChild(yearSpan);
            const metaRow = document.createElement('div');
            metaRow.className = 'd-flex align-items-center gap-2 mb-1';
            const smallSeries = document.createElement('small');
            smallSeries.className = 'text-muted';
            const tag = document.createElement('i');
            tag.className = 'bi bi-tag me-1';
            smallSeries.appendChild(tag);
            smallSeries.appendChild(document.createTextNode(`Série: ${series || 'N/A'}`));
            const smallDate = document.createElement('small');
            smallDate.className = 'text-muted';
            const cal = document.createElement('i');
            cal.className = 'bi bi-calendar3 me-1';
            smallDate.appendChild(cal);
            smallDate.appendChild(document.createTextNode(dateAdded));
            metaRow.appendChild(smallSeries);
            metaRow.appendChild(smallDate);
            leftText.appendChild(title);
            leftText.appendChild(metaRow);
            left.appendChild(carIconWrap);
            left.appendChild(leftText);

            const right = document.createElement('div');
            right.className = 'd-flex align-items-center gap-2';
            const badge = document.createElement('span');
            badge.className = `badge ${seriesColor} rounded-pill px-3 py-2 fs-6`;
            badge.textContent = number;
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            btnGroup.setAttribute('role', 'group');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary edit-btn';
            editBtn.title = 'Editar';
            editBtn.setAttribute('aria-label', 'Editar carrinho');
            const editIcon = document.createElement('i');
            editIcon.className = 'bi bi-pencil';
            editBtn.appendChild(editIcon);
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-outline-danger delete-btn';
            delBtn.title = 'Excluir';
            delBtn.setAttribute('aria-label', 'Excluir carrinho');
            const delIcon = document.createElement('i');
            delIcon.className = 'bi bi-trash';
            delBtn.appendChild(delIcon);
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(delBtn);
            right.appendChild(badge);
            right.appendChild(btnGroup);

            wrap.appendChild(left);
            wrap.appendChild(right);
            item.appendChild(wrap);
            totalCount++;
            if(series) seriesSet.add(series);
            if(year) yearCounts[year] = (yearCounts[year] || 0) + 1;
        } else {
            item.style.display = 'none';
        }
    });
    document.getElementById('total-hw').textContent = totalCount;
    document.getElementById('total-series').textContent = seriesSet.size;
    let commonYear = '-';
    if (Object.keys(yearCounts).length > 0) {
        commonYear = Object.keys(yearCounts).reduce((a, b) => yearCounts[a] > yearCounts[b] ? a : b);
    }
    document.getElementById('common-year').textContent = commonYear;
    const seriesFilter = document.getElementById('hw-series-filter');
    const currentSeriesOptions = Array.from(seriesFilter.options).map(opt => opt.value);
    seriesSet.forEach(series => {
        if (!currentSeriesOptions.includes(series)) {
            const option = document.createElement('option');
            option.value = series;
            option.textContent = series;
            seriesFilter.appendChild(option);
        }
    });
}

function setupHwActionListeners() {
    const list = document.getElementById('hw-list');
    if (!list) return;

    list.addEventListener('click', (event) => {
        const target = event.target;
        const item = target.closest('.hw-item');
        if (!item) return;

        if (target.closest('.delete-btn')) {
            item.remove();
            saveCarsToStorage(); // Salvar no localStorage após deletar
            updateHwView();
            showToast("Carrinho apagado.", "info");
        }

        if (target.closest('.edit-btn')) {
            currentlyEditingHw = item;
            const { name, number, year, series } = item.dataset;
            document.getElementById('hw-name').value = name;
            document.getElementById('hw-number').value = number;
            document.getElementById('hw-year').value = year;
            document.getElementById('hw-series').value = series;
            document.getElementById('hw-modal-title').textContent = "Editar Carrinho";
            const submitButton = document.getElementById('hw-submit-btn');
            submitButton.textContent = "Salvar Alterações";
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-success');
            hwModal.show();
        }
    });
}

// Funções auxiliares para interface
function getSeriesColor(series) {
    const colors = {
        'HW Dream Garage': 'bg-primary',
        'HW Boulevard': 'bg-success',
        'HW Premium': 'bg-warning',
        'HW Mainline': 'bg-info',
        'HW Collectors': 'bg-danger'
    };
    return colors[series] || 'bg-dark';
}

// Função para exportar dados da coleção
function exportHotWheelsData() {
    const cars = loadCarsFromStorage();
    
    if (cars.length === 0) {
        showToast("Nenhum carrinho para exportar.", "warning");
        return;
    }
    
    // Criar CSV
    let csvContent = "Nome,Número,Ano,Série,Data Adicionado\n";
    cars.forEach(car => {
        const dateAdded = new Date(car.dateAdded).toLocaleDateString('pt-BR');
        csvContent += `"${car.name}","${car.number}","${car.year}","${car.series}","${dateAdded}"\n`;
    });
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `colecao_hotwheels_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Coleção de Hot Wheels exportada com sucesso!", "success");
}