// =================================================================================
// Organização Pessoal - financas.js
// Versão: 4.0 (Sistema Completo com localStorage e Melhorias)
// =================================================================================

let myCategoryChart = null;
let currentlyEditingItem = null;
let transactionModal = null;
let budgetsModal = null;
// Removido: variável não utilizada - dados são carregados via loadSavedData()

// Objeto para guardar os orçamentos com persistência
let budgets = {}; // Estrutura nova: { 'YYYY-MM': { Categoria: valor } } com compatibilidade legado

// Sistema de localStorage para persistência de dados
const STORAGE_KEYS = {
    TRANSACTIONS: 'finance_transactions',
    BUDGETS: 'finance_budgets',
    SETTINGS: 'finance_settings',
    RULES: 'finance_rules',
    SAVINGS_GOAL: 'finance_savings_goal',
    CUSTOM_CATEGORIES: 'finance_custom_categories',
    TEMPLATES: 'finance_templates',
    ACCOUNTS: 'finance_accounts',
    BACKUPS: 'finance_backups',
    NOTIFICATIONS: 'finance_notifications'
};

// Categorias padrão com ícones
const DEFAULT_CATEGORIES = [
    { name: 'Alimentação', icon: 'bi-cup-hot', color: '#FF6384' },
    { name: 'Moradia', icon: 'bi-house-door', color: '#36A2EB' },
    { name: 'Transporte', icon: 'bi-car-front', color: '#FFCE56' },
    { name: 'Lazer', icon: 'bi-emoji-smile', color: '#4BC0C0' },
    { name: 'Saúde', icon: 'bi-heart-pulse', color: '#9966FF' },
    { name: 'Trabalho', icon: 'bi-briefcase', color: '#FF9F40' },
    { name: 'Outros', icon: 'bi-three-dots', color: '#C9CBCF' }
];

// Funções de localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        showToast('Erro ao salvar dados. Verifique o espaço disponível.', 'danger');
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return defaultValue;
    }
}

// Carregar dados salvos ao inicializar
function getCurrentPeriodKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function loadSavedData() {
    const savedTransactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const savedBudgets = loadFromStorage(STORAGE_KEYS.BUDGETS, {});

    // Carregar transações salvas
    if (savedTransactions.length > 0) {
        const financeList = document.getElementById('finance-list');
        savedTransactions.forEach(transaction => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item transaction-item';
            listItem.dataset.description = transaction.description;
            listItem.dataset.amount = transaction.amount;
            listItem.dataset.type = transaction.type;
            listItem.dataset.date = transaction.date;
            listItem.dataset.category = transaction.category;
            listItem.dataset.id = transaction.id;
            // Suporte para fonte (compatibilidade com dados antigos)
            if (transaction.source) {
                listItem.dataset.source = transaction.source;
            } else {
                listItem.dataset.source = 'Cartão'; // Padrão para dados antigos
            }
            financeList.appendChild(listItem);

            if (transaction.isInstallment) {
                listItem.dataset.isInstallment = 'true';
                if (transaction.installmentNumber) listItem.dataset.installmentNumber = transaction.installmentNumber.toString();
                if (transaction.totalInstallments) listItem.dataset.totalInstallments = transaction.totalInstallments.toString();
            }
        });
    }

    // Carregar orçamentos salvos
    // Migração de orçamento: se veio no formato legado (mapa direto de categorias), mover para o mês atual
    const periodKey = getCurrentPeriodKey();
    if (savedBudgets && !savedBudgets[periodKey] && Object.values(savedBudgets).every(v => typeof v === 'number')) {
        budgets = { [periodKey]: savedBudgets };
    } else {
        budgets = savedBudgets || {};
    }
}

// Salvar transações
function saveTransactions() {
    const transactions = [];
    const financeList = document.getElementById('finance-list');
    const items = financeList.querySelectorAll('.transaction-item');

    items.forEach(item => {
        const transaction = {
            id: item.dataset.id || Date.now() + Math.random(),
            description: item.dataset.description,
            amount: parseFloat(item.dataset.amount),
            type: item.dataset.type,
            date: item.dataset.date,
            category: item.dataset.category,
            source: item.dataset.source || 'Cartão' // Padrão: Cartão
        };
        if (item.dataset.isInstallment === 'true') {
            transaction.isInstallment = true;
            transaction.installmentNumber = parseInt(item.dataset.installmentNumber);
            transaction.totalInstallments = parseInt(item.dataset.totalInstallments);
        }
        transactions.push(transaction);
    });

    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
}

// Salvar orçamentos
function saveBudgets() {
    saveToStorage(STORAGE_KEYS.BUDGETS, budgets);
}

document.addEventListener('DOMContentLoaded', () => {
    const financeForm = document.getElementById('add-finance-form');
    if (!financeForm) return;

    // Carregar dados salvos
    loadSavedData();

    // Inicializa os Modals do Bootstrap
    transactionModal = new bootstrap.Modal(document.getElementById('transaction-modal'));
    budgetsModal = new bootstrap.Modal(document.getElementById('budgets-modal'));

    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // N para nova transação (quando não está em input)
        if (e.key === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            e.preventDefault();
            transactionModal.show();
            setTimeout(() => document.getElementById('finance-description')?.focus(), 300);
        }
        // ESC para fechar modal
        if (e.key === 'Escape' && transactionModal._isShown) {
            transactionModal.hide();
        }
        // Enter para salvar (quando no modal)
        if (e.key === 'Enter' && e.ctrlKey && transactionModal._isShown) {
            e.preventDefault();
            financeForm.dispatchEvent(new Event('submit'));
        }
    });

    // Seleção de todos os elementos do DOM
    const descriptionInput = document.getElementById('finance-description');
    const amountInput = document.getElementById('finance-amount');
    const typeInput = document.getElementById('finance-type');
    const dateInput = document.getElementById('finance-date');
    const categoryInput = document.getElementById('finance-category');
    const sourceInput = document.getElementById('finance-source');
    const financeList = document.getElementById('finance-list');
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const searchFilter = document.getElementById('search-filter');
    const sortFilter = document.getElementById('sort-filter');
    const categoryFilter = document.getElementById('category-filter');
    const submitButton = document.getElementById('submit-btn');
    const modalTitle = document.getElementById('modal-title');
    const saveBudgetsBtn = document.getElementById('save-budgets-btn');
    const budgetsForm = document.getElementById('budgets-form');
    const selectAllCheckbox = document.getElementById('select-all');
    const bulkDeleteBtn = document.getElementById('bulk-delete');
    const bulkCategorySelect = document.getElementById('bulk-category');
    const bulkApplyBtn = document.getElementById('bulk-apply');

    // Define a data atual como padrão no formulário de transação
    dateInput.value = new Date().toISOString().split('T')[0];

    // Botões rápidos de tipo (Receita/Despesa)
    const quickTypeRadios = document.querySelectorAll('input[name="quick-type"]');
    quickTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            typeInput.value = selectedType;
            // Sincronizar botões rápidos com o select
            if (selectedType === 'Receita') {
                document.getElementById('quick-receita').checked = true;
                document.getElementById('quick-despesa').checked = false;
            } else {
                document.getElementById('quick-receita').checked = false;
                document.getElementById('quick-despesa').checked = true;
            }
            updateQuickAmountsVisibility();
            updateFrequentCategories();
        });
    });
    
    // Sincronizar select com botões rápidos quando o select mudar
    if (typeInput) {
        typeInput.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            if (selectedType === 'Receita') {
                const quickReceita = document.getElementById('quick-receita');
                if (quickReceita) quickReceita.checked = true;
            } else {
                const quickDespesa = document.getElementById('quick-despesa');
                if (quickDespesa) quickDespesa.checked = true;
            }
            updateQuickAmountsVisibility();
            updateFrequentCategories();
        });
    }

    // Valores rápidos
    const quickAmountButtons = document.querySelectorAll('.quick-amount');
    quickAmountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            amountInput.value = btn.dataset.amount;
            amountInput.focus();
        });
    });

    function updateQuickAmountsVisibility() {
        const quickAmountsDiv = document.getElementById('quick-amounts');
        if (quickAmountsDiv) {
            quickAmountsDiv.style.display = typeInput.value === 'Despesa' ? 'flex' : 'none';
        }
    }

    // Categorias frequentes
    function updateFrequentCategories() {
        const container = document.getElementById('frequent-categories-buttons');
        if (!container) return;
        
        const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
        const type = typeInput.value;
        
        // Contar categorias por tipo
        const categoryCount = {};
        transactions
            .filter(t => t.type === type)
            .forEach(t => {
                categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
            });
        
        // Ordenar e pegar top 4
        const topCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cat]) => cat);
        
        container.innerHTML = '';
        if (topCategories.length > 0) {
            topCategories.forEach(cat => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm btn-outline-secondary frequent-category-btn';
                btn.textContent = cat;
                btn.addEventListener('click', () => {
                    categoryInput.value = cat;
                });
                container.appendChild(btn);
            });
        } else {
            container.innerHTML = '<small class="text-muted">Nenhuma categoria frequente</small>';
        }
    }

    // Controle de transações recorrentes
    const recurringCheckbox = document.getElementById('recurring-checkbox');
    const recurringOptions = document.getElementById('recurring-options');
    const installmentTotal = document.getElementById('installment-total');
    const installmentTotalInput = document.getElementById('installment-total');

    if (recurringCheckbox && recurringOptions) {
        recurringCheckbox.addEventListener('change', () => {
            recurringOptions.style.display = recurringCheckbox.checked ? 'block' : 'none';
            if (recurringCheckbox.checked) {
                typeInput.value = 'Despesa';
                typeInput.disabled = true;
            } else {
                typeInput.disabled = false;
            }
        });
    }

    // Botão de exportar dados
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    const exportReportBtn = document.getElementById('export-report-btn');
    if (exportReportBtn) exportReportBtn.addEventListener('click', exportMonthlyReport);
    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-file-input');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                if (file.name.toLowerCase().endsWith('.json')) {
                    const data = JSON.parse(text);
                    importTransactionsFromJSON(data);
                } else {
                    importTransactionsFromCSV(text);
                }
            } catch (err) {
                console.error(err);
                showToast('Falha ao importar arquivo.', 'danger');
            } finally {
                importInput.value = '';
            }
        });
    }

    function populateFilters() {
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const currentYear = new Date().getFullYear(); const currentMonth = new Date().getMonth();
        months.forEach((month, index) => {
            const option = document.createElement('option'); option.value = index; option.textContent = month; monthFilter.appendChild(option);
        });
        for (let i = 0; i < 5; i++) {
            const option = document.createElement('option'); option.value = currentYear - i; option.textContent = currentYear - i; yearFilter.appendChild(option);
        }
        monthFilter.value = currentMonth; yearFilter.value = currentYear;
    }

    // Substitua a função resetForm inteira
    function resetForm() {
        financeForm.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        currentlyEditingItem = null;
        modalTitle.textContent = "Adicionar Nova Transação";
        submitButton.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar (Enter)';
        submitButton.classList.remove('btn-success');
        submitButton.classList.add('btn-primary');
        if (recurringCheckbox) recurringCheckbox.checked = false;
        if (recurringOptions) recurringOptions.style.display = 'none';
        typeInput.disabled = false; // Garante que o tipo é reativado
        
        // Resetar botões rápidos e sincronizar
        const quickReceita = document.getElementById('quick-receita');
        const quickDespesa = document.getElementById('quick-despesa');
        if (quickReceita) {
            quickReceita.checked = true;
            quickDespesa.checked = false;
        }
        typeInput.value = 'Receita';
        // Resetar fonte para padrão (após o reset do form)
        setTimeout(() => {
            if (sourceInput) {
                sourceInput.value = 'Cartão';
            }
        }, 0);
        updateQuickAmountsVisibility();
        updateFrequentCategories();
    }

    function populateBudgetsForm() {
        // Usar categorias personalizadas se disponíveis
        const categories = (typeof customCategories !== 'undefined' && customCategories.length > 0) 
            ? customCategories.map(c => c.name)
            : ["Alimentação", "Moradia", "Transporte", "Lazer", "Saúde", "Trabalho", "Outros"];
        
        budgetsForm.innerHTML = '';
        const currentPeriod = getCurrentPeriodKey(new Date(parseInt(yearFilter.value), parseInt(monthFilter.value)));
        const periodBudgets = budgets[currentPeriod] || {};
        categories.forEach(category => {
            const value = periodBudgets[category] || '';
            const catInfo = (typeof getCategoryInfo === 'function') ? getCategoryInfo(category) : null;
            const icon = catInfo ? `<i class="bi ${catInfo.icon} me-1" style="color: ${catInfo.color}"></i>` : '';
            const formRow = `<div class="input-group mb-2"><span class="input-group-text" style="width: 120px;">${icon}${category}</span><input type="number" class="form-control" data-category="${category}" value="${value}" placeholder="0" min="0"></div>`;
            budgetsForm.insertAdjacentHTML('beforeend', formRow);
        });
        
        // Carregar meta de economia salva
        const savingsGoalInput = document.getElementById('savings-goal-input');
        if (savingsGoalInput) {
            const savedGoal = loadFromStorage(STORAGE_KEYS.SAVINGS_GOAL, 0);
            savingsGoalInput.value = savedGoal || '';
        }
    }

    document.querySelector('[data-bs-target="#budgets-modal"]').addEventListener('click', populateBudgetsForm);

    saveBudgetsBtn.addEventListener('click', () => {
        const inputs = budgetsForm.querySelectorAll('input');
        const currentPeriod = getCurrentPeriodKey(new Date(parseInt(yearFilter.value), parseInt(monthFilter.value)));
        budgets[currentPeriod] = {}; // sobrescreve somente o período atual
        inputs.forEach(input => {
            const category = input.dataset.category;
            if (!category) return; // Pular o campo de meta de economia
            const amount = parseFloat(input.value);
            if (amount > 0) {
                budgets[currentPeriod][category] = amount;
            }
        });
        saveBudgets(); // Salvar no localStorage
        
        // Salvar meta de economia
        const savingsGoalInput = document.getElementById('savings-goal-input');
        if (savingsGoalInput) {
            const savingsGoal = parseFloat(savingsGoalInput.value);
            if (!isNaN(savingsGoal) && savingsGoal >= 0) {
                saveToStorage(STORAGE_KEYS.SAVINGS_GOAL, savingsGoal);
            }
        }
        
        showToast("Orçamentos salvos com sucesso!", "success");
        budgetsModal.hide();
        filterTransactions();
    });

    // Substitua a função financeForm.addEventListener('submit', ...) inteira
    financeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const description = descriptionInput.value.trim();
        const totalAmount = parseFloat(amountInput.value);
        // Capturar tipo do select (garantir que está sincronizado)
        let type = typeInput.value;
        // Se os botões rápidos estiverem disponíveis, verificar qual está selecionado
        const quickReceita = document.getElementById('quick-receita');
        const quickDespesa = document.getElementById('quick-despesa');
        if (quickReceita && quickReceita.checked) {
            type = 'Receita';
            typeInput.value = 'Receita';
        } else if (quickDespesa && quickDespesa.checked) {
            type = 'Despesa';
            typeInput.value = 'Despesa';
        }
        const date = dateInput.value;
        const category = categoryInput.value;
        const source = sourceInput && sourceInput.value ? sourceInput.value : 'Cartão'; // Padrão: Cartão
        // Validar se a fonte é válida
        if (!source || source === '' || (source !== 'Cartão' && source !== 'Dinheiro')) {
            showToast("Por favor, selecione uma fonte válida (Salário/Cartão ou Vale/Dinheiro).", "warning");
            if (sourceInput) sourceInput.focus();
            return;
        }
        const isInstallment = recurringCheckbox.checked;
        const totalInstallments = isInstallment ? parseInt(installmentTotalInput.value) : 1; // Usa o novo ID

        // Validações melhoradas
        if (!description || description.length < 2) {
            showToast("A descrição deve ter pelo menos 2 caracteres.", "warning");
            return;
        }
        if (!date) {
            showToast("Por favor, selecione uma data.", "warning");
            return;
        }
        if (isNaN(totalAmount) || totalAmount <= 0) {
            showToast("O valor deve ser um número positivo.", "warning");
            return;
        }
        if (!category) {
            showToast("Por favor, selecione uma categoria.", "warning");
            return;
        }
        if (isInstallment && (isNaN(totalInstallments) || totalInstallments < 2 || totalInstallments > 120)) {
            showToast("O número de parcelas deve estar entre 2 e 120.", "warning");
            return;
        }
        
        // Validar data não futura demais (máx 1 ano)
        const transactionDate = new Date(date + 'T00:00:00');
        const today = new Date();
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() + 1);
        if (transactionDate > maxDate) {
            showToast("A data não pode ser mais de 1 ano no futuro.", "warning");
            return;
        }

        if (currentlyEditingItem && currentlyEditingItem.dataset.isInstallment === 'true') {
            showToast("Não é possível editar uma parcela individualmente.", "warning");
            return;
        }

        const successMessage = currentlyEditingItem ? "Transação atualizada!" : "Transação adicionada!";

        if (currentlyEditingItem === null) {
            // LÓGICA DE ADICIONAR
            const installmentAmount = isInstallment ? parseFloat((totalAmount / totalInstallments).toFixed(2)) : totalAmount;
            const startDate = new Date(date + 'T00:00:00');
            let transactionsAddedCount = 0;

            // Se não for parcela, criar apenas uma transação
            if (!isInstallment) {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item transaction-item';
                listItem.dataset.id = Date.now() + Math.random();
                listItem.dataset.description = description;
                listItem.dataset.amount = totalAmount;
                listItem.dataset.type = type; // Usar o tipo capturado do formulário
                listItem.dataset.date = date;
                listItem.dataset.category = category;
                listItem.dataset.source = source; // Fonte: Cartão ou Dinheiro
                financeList.appendChild(listItem);
                transactionsAddedCount = 1;
            } else {
                // Se for parcela, criar múltiplas transações
                for (let i = 0; i < totalInstallments; i++) {
                    const installmentDate = new Date(startDate);
                    installmentDate.setMonth(startDate.getMonth() + i);

                    const year = installmentDate.getFullYear();
                    const month = (installmentDate.getMonth() + 1).toString().padStart(2, '0');
                    const day = installmentDate.getDate().toString().padStart(2, '0');
                    const installmentDateString = `${year}-${month}-${day}`;

                    const installmentDescription = `${description} (${i + 1}/${totalInstallments})`;

                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item transaction-item';
                    listItem.dataset.id = Date.now() + Math.random() + i;
                    listItem.dataset.description = installmentDescription;
                    listItem.dataset.amount = installmentAmount;
                    // Parcelas são sempre despesas
                    listItem.dataset.type = 'Despesa';
                    listItem.dataset.date = installmentDateString;
                    listItem.dataset.category = category;
                    listItem.dataset.source = source; // Fonte da parcela
                    listItem.dataset.isInstallment = 'true';
                    listItem.dataset.installmentNumber = i + 1;
                    listItem.dataset.totalInstallments = totalInstallments;
                    financeList.appendChild(listItem);
                    transactionsAddedCount++;
                }
            }
            if (isInstallment) {
                showToast(`${transactionsAddedCount} parcelas adicionadas!`, "success");
            } else {
                showToast(successMessage, "success");
            }
        } else {
            // LÓGICA DE EDITAR (sem alterações)
            currentlyEditingItem.dataset.description = description;
            currentlyEditingItem.dataset.amount = totalAmount;
            currentlyEditingItem.dataset.type = type;
            currentlyEditingItem.dataset.date = date;
            currentlyEditingItem.dataset.category = category;
            currentlyEditingItem.dataset.source = source;
            delete currentlyEditingItem.dataset.isInstallment;
            delete currentlyEditingItem.dataset.installmentNumber;
            delete currentlyEditingItem.dataset.totalInstallments;
            showToast(successMessage, "success");
        }

        saveTransactions();
        resetForm();
        filterTransactions();
        updateTodayTransactions();
        updateTodayDashboard();
        transactionModal.hide();
    });

    document.getElementById('transaction-modal').addEventListener('hidden.bs.modal', resetForm);
    const transactionModalEl = document.getElementById('transaction-modal');
    if (transactionModalEl) {
        transactionModalEl.addEventListener('shown.bs.modal', () => {
            updateFrequentCategories();
            updateQuickAmountsVisibility();
            setTimeout(() => document.getElementById('finance-description')?.focus(), 100);
        });
    }
    
    populateFilters();
    filterTransactions();
    updateTodayTransactions();
    updateTodayDashboard();
    monthFilter.addEventListener('change', filterTransactions);
    yearFilter.addEventListener('change', filterTransactions);
    if (sortFilter) sortFilter.addEventListener('change', filterTransactions);
    if (categoryFilter) categoryFilter.addEventListener('change', filterTransactions);
    // Debounce para reduzir re-render a cada tecla digitada
    function debounce(fn, delay = 250) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    searchFilter.addEventListener('input', debounce(filterTransactions, 250));
    setupFinanceActionListeners();

    // Seleção em massa
    function updateBulkState() {
        const anyChecked = !!document.querySelector('.transaction-item input[type="checkbox"]:checked');
        bulkDeleteBtn.disabled = !anyChecked;
        bulkApplyBtn.disabled = !anyChecked || !bulkCategorySelect.value;
    }
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            document.querySelectorAll('.transaction-item input[type="checkbox"]').forEach(cb => cb.checked = selectAllCheckbox.checked);
            updateBulkState();
        });
    }
    if (bulkCategorySelect) bulkCategorySelect.addEventListener('change', updateBulkState);
    if (bulkDeleteBtn) bulkDeleteBtn.addEventListener('click', () => {
        const checked = Array.from(document.querySelectorAll('.transaction-item input[type="checkbox"]:checked')).map(cb => cb.closest('.transaction-item'));
        if (checked.length === 0) return;
        checked.forEach(item => item.remove());
        saveTransactions();
        filterTransactions();
        updateTodayTransactions();
        updateTodayDashboard();
        showToast(`${checked.length} transação(ões) excluída(s).`, 'info');
    });
    if (bulkApplyBtn) bulkApplyBtn.addEventListener('click', () => {
        const newCat = bulkCategorySelect.value;
        if (!newCat) return;
        const checked = Array.from(document.querySelectorAll('.transaction-item input[type="checkbox"]:checked')).map(cb => cb.closest('.transaction-item'));
        checked.forEach(item => item.dataset.category = newCat);
        saveTransactions();
        filterTransactions();
        showToast(`Categoria aplicada em ${checked.length} item(ns).`, 'success');
    });
});

function filterTransactions() {
    const financeList = document.getElementById('finance-list');
    if (!financeList) return;

    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const searchFilter = document.getElementById('search-filter');
    const categoryFilter = document.getElementById('category-filter');
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);
    const searchTerm = searchFilter.value.toLowerCase();
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    // Remover cabeçalhos anteriores
    Array.from(financeList.querySelectorAll('.transaction-header')).forEach(h => h.remove());
    const transactions = Array.from(financeList.querySelectorAll('.list-group-item.transaction-item'));
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpensesEl = document.getElementById('monthly-expenses');
    const monthlyBalanceEl = document.getElementById('monthly-balance');
    const categoryList = document.getElementById('category-list');
    const expenseTrendEl = document.getElementById('expense-trend');

    let monthlyIncome = 0, monthlyExpenses = 0, previousMonthExpenses = 0;
    const categoryTotals = {};
    // Calcular mês anterior corretamente
    const previousMonthDate = new Date(selectedYear, selectedMonth, 0);
    const previousMonth = previousMonthDate.getMonth();
    const previousYear = previousMonthDate.getFullYear();

    const sortMode = document.getElementById('sort-filter')?.value || 'date_desc';
    const sorted = transactions.sort((a, b) => {
        const ad = new Date(a.dataset.date + 'T00:00:00').getTime();
        const bd = new Date(b.dataset.date + 'T00:00:00').getTime();
        const aa = parseFloat(a.dataset.amount);
        const ba = parseFloat(b.dataset.amount);
        switch (sortMode) {
            case 'date_asc':
                return ad - bd;
            case 'amount_desc':
                return ba - aa;
            case 'amount_asc':
                return aa - ba;
            case 'date_desc':
            default:
                return bd - ad;
        }
    });

    let lastHeaderDate = '';
    sorted.forEach(transaction => {
        const transactionDate = new Date(transaction.dataset.date + 'T00:00:00');
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();
        const descriptionLower = transaction.dataset.description.toLowerCase();
        const categoryLower = (transaction.dataset.category || '').toLowerCase();
        const typeLower = (transaction.dataset.type || '').toLowerCase();
        const isMonthMatch = transactionMonth === selectedMonth && transactionYear === selectedYear;
        const isSearchMatch = searchTerm === '' || descriptionLower.includes(searchTerm) || categoryLower.includes(searchTerm) || typeLower.includes(searchTerm);
        const isCategoryMatch = selectedCategory === '' || category === selectedCategory;
        
        // Aplicar filtros avançados se existirem
        let passesAdvancedFilters = true;
        if (typeof advancedSearchFilters !== 'undefined' && Object.keys(advancedSearchFilters).length > 0) {
            const amount = parseFloat(transaction.dataset.amount);
            const transDate = new Date(transaction.dataset.date + 'T00:00:00');
            
            if (advancedSearchFilters.minAmount !== null && amount < advancedSearchFilters.minAmount) {
                passesAdvancedFilters = false;
            }
            if (advancedSearchFilters.maxAmount !== null && amount > advancedSearchFilters.maxAmount) {
                passesAdvancedFilters = false;
            }
            if (advancedSearchFilters.startDate && transDate < new Date(advancedSearchFilters.startDate)) {
                passesAdvancedFilters = false;
            }
            if (advancedSearchFilters.endDate && transDate > new Date(advancedSearchFilters.endDate + 'T23:59:59')) {
                passesAdvancedFilters = false;
            }
            if (advancedSearchFilters.categories && advancedSearchFilters.categories.length > 0) {
                if (!advancedSearchFilters.categories.includes(category)) {
                    passesAdvancedFilters = false;
                }
            }
            if (advancedSearchFilters.type && transaction.dataset.type !== advancedSearchFilters.type) {
                passesAdvancedFilters = false;
            }
        }
        
        if (isMonthMatch && isSearchMatch && isCategoryMatch && passesAdvancedFilters) {
            transaction.style.display = 'block';
            const { amount, type, date, category, source } = transaction.dataset;
            const descriptionRaw = transaction.dataset.description;
            const numAmount = parseFloat(amount);
            const transactionSource = source || 'Cartão';

            // Renderização segura sem innerHTML
            const formattedDate = new Date(date).toLocaleDateString('pt-BR');
            const formattedAmount = numAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const typeIcon = type === 'Receita' ? 'bi-arrow-up-circle-fill text-success' : 'bi-arrow-down-circle-fill text-danger';

            // Limpar e construir DOM de forma segura
            transaction.textContent = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex w-100 justify-content-between align-items-center';

            const left = document.createElement('div');
            left.className = 'd-flex align-items-center';
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.className = 'form-check-input me-2';
            check.addEventListener('change', () => {
                const anyChecked = !!document.querySelector('.transaction-item input[type="checkbox"]:checked');
                const bulkDeleteBtn = document.getElementById('bulk-delete');
                const bulkApplyBtn = document.getElementById('bulk-apply');
                const bulkCategorySelect = document.getElementById('bulk-category');
                if (bulkDeleteBtn) bulkDeleteBtn.disabled = !anyChecked;
                if (bulkApplyBtn) bulkApplyBtn.disabled = !anyChecked || !bulkCategorySelect?.value;
            });
            const icon = document.createElement('i');
            icon.className = `bi ${typeIcon} me-3 fs-4`;
            const leftTextWrap = document.createElement('div');
            const title = document.createElement('h6');
            title.className = 'mb-1 fw-bold';
            title.textContent = descriptionRaw;
            const meta = document.createElement('small');
            meta.className = 'text-muted';
            const calIcon = document.createElement('i');
            calIcon.className = 'bi bi-calendar3 me-1';
            const tagIcon = document.createElement('i');
            tagIcon.className = 'bi bi-tag me-1';
            meta.appendChild(calIcon);
            meta.appendChild(document.createTextNode(formattedDate + ' • '));
            meta.appendChild(tagIcon);
            meta.appendChild(document.createTextNode(category));
            // Adicionar badge da fonte
            const sourceBadge = document.createElement('span');
            sourceBadge.className = 'badge ms-2 ' + (transactionSource === 'Cartão' ? 'bg-primary' : 'bg-info');
            sourceBadge.textContent = transactionSource === 'Cartão' ? '💳 Cartão' : '💵 Dinheiro';
            meta.appendChild(sourceBadge);
            leftTextWrap.appendChild(title);
            leftTextWrap.appendChild(meta);
            left.appendChild(check);
            left.appendChild(icon);
            left.appendChild(leftTextWrap);

            const right = document.createElement('div');
            right.className = 'd-flex align-items-center gap-2';
            const valueSpan = document.createElement('span');
            valueSpan.className = `fw-bold fs-5 ${type === 'Receita' ? 'text-success' : 'text-danger'}`;
            valueSpan.textContent = formattedAmount;
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            btnGroup.setAttribute('role', 'group');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary edit-btn';
            editBtn.title = 'Editar';
            editBtn.setAttribute('aria-label', 'Editar transação');
            const editIcon = document.createElement('i');
            editIcon.className = 'bi bi-pencil';
            editBtn.appendChild(editIcon);
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-outline-danger delete-btn';
            delBtn.title = 'Excluir';
            delBtn.setAttribute('aria-label', 'Excluir transação');
            const delIcon = document.createElement('i');
            delIcon.className = 'bi bi-trash';
            delBtn.appendChild(delIcon);
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(delBtn);
            right.appendChild(valueSpan);
            right.appendChild(btnGroup);

            wrapper.appendChild(left);
            wrapper.appendChild(right);
            transaction.appendChild(wrapper);
            // Inserir cabeçalho por data se mudou
            if (date !== lastHeaderDate) {
                lastHeaderDate = date;
                const header = document.createElement('li');
                header.className = 'list-group-item transaction-header bg-light-subtle text-muted fw-semibold';
                header.textContent = new Date(date).toLocaleDateString('pt-BR');
                financeList.appendChild(header);
            }
            // Reposicionar conforme ordenação
            financeList.appendChild(transaction);

            if (type === 'Receita') {
                monthlyIncome += numAmount;
            } else {
                monthlyExpenses += numAmount;
                categoryTotals[category] = (categoryTotals[category] || 0) + numAmount;
            }
        } else {
            transaction.style.display = 'none';
        }
        const type = transaction.dataset.type;
        const numAmount = parseFloat(transaction.dataset.amount);
        if (type === 'Despesa' && transactionMonth === previousMonth && transactionYear === previousYear) {
            previousMonthExpenses += numAmount;
        }
    });

    const monthlyBalance = monthlyIncome - monthlyExpenses;
    monthlyIncomeEl.textContent = monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    monthlyExpensesEl.textContent = monthlyExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    monthlyBalanceEl.textContent = monthlyBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    monthlyBalanceEl.className = 'h5 mb-0 ' + (monthlyBalance < 0 ? 'text-danger' : 'text-success');
    
    // Calcular saldos separados por fonte
    let cardIncome = 0, cardExpenses = 0;
    let cashIncome = 0, cashExpenses = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.dataset.date + 'T00:00:00');
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();
        const source = transaction.dataset.source || 'Cartão';
        const amount = parseFloat(transaction.dataset.amount);
        const type = transaction.dataset.type;
        
        if (transactionMonth === selectedMonth && transactionYear === selectedYear) {
            if (source === 'Cartão') {
                if (type === 'Receita') cardIncome += amount;
                else cardExpenses += amount;
            } else {
                if (type === 'Receita') cashIncome += amount;
                else cashExpenses += amount;
            }
        }
    });
    
    const cardBalance = cardIncome - cardExpenses;
    const cashBalance = cashIncome - cashExpenses;
    
    // Atualizar saldos separados
    const cardBalanceEl = document.getElementById('card-balance');
    const cardAvailableEl = document.getElementById('card-available');
    const cashBalanceEl = document.getElementById('cash-balance');
    const cashAvailableEl = document.getElementById('cash-available');
    
    if (cardBalanceEl) {
        cardBalanceEl.textContent = cardBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        cardBalanceEl.className = 'h4 mb-1 ' + (cardBalance >= 0 ? 'text-success' : 'text-danger');
    }
    if (cardAvailableEl) {
        cardAvailableEl.textContent = cardBalance >= 0 ? 'Disponível no cartão' : 'Limite ultrapassado';
        cardAvailableEl.className = cardBalance >= 0 ? 'text-success' : 'text-danger';
    }
    
    if (cashBalanceEl) {
        cashBalanceEl.textContent = cashBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        cashBalanceEl.className = 'h4 mb-1 ' + (cashBalance >= 0 ? 'text-info' : 'text-danger');
    }
    if (cashAvailableEl) {
        cashAvailableEl.textContent = cashBalance >= 0 ? 'Disponível em dinheiro' : 'Saldo negativo';
        cashAvailableEl.className = cashBalance >= 0 ? 'text-info' : 'text-danger';
    }
    
    // Atualizar meta de economia e saúde financeira
    updateSavingsGoal(monthlyBalance);
    updateFinancialHealth(monthlyIncome, monthlyExpenses, monthlyBalance);
    
    // Atualizar resumo do mês
    updateMonthSummary(monthlyBalance);

    expenseTrendEl.innerHTML = '';
    if (monthlyExpenses > 0 || previousMonthExpenses > 0) {
        const difference = monthlyExpenses - previousMonthExpenses;
        const absDifference = Math.abs(difference).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (difference > 0.01) expenseTrendEl.innerHTML = `<span class="text-danger fw-bold">▲ ${absDifference}</span>`;
        else if (difference < -0.01) expenseTrendEl.innerHTML = `<span class="text-success fw-bold">▼ ${absDifference}</span>`;
        else expenseTrendEl.innerHTML = `<span class="text-muted">=</span>`;
    }

    categoryList.innerHTML = '';
    const allCategoriesInView = new Set(Object.keys(categoryTotals));
    const currentPeriodKey = getCurrentPeriodKey(new Date(selectedYear, selectedMonth));
    const periodBudgets = (budgets && budgets[currentPeriodKey]) || {};
    Object.keys(periodBudgets).forEach(cat => allCategoriesInView.add(cat));
    const sortedCategories = Array.from(allCategoriesInView).sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0));

    if (sortedCategories.length > 0) {
        // cálculo para previsão mensal simples
        const now = new Date();
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const today = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() ? now.getDate() : daysInMonth;
        const daysLeft = Math.max(0, daysInMonth - today);

        sortedCategories.forEach(category => {
            const total = categoryTotals[category] || 0;
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            const budget = periodBudgets[category];
            let progressHtml = '';
            if (budget) {
                const percentage = Math.min((total / budget) * 100, 100);
                let bgColor = 'bg-success';
                if (percentage > 75) bgColor = 'bg-warning';
                if (percentage >= 100) bgColor = 'bg-danger';
                const totalFormatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const budgetFormatted = budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const spentPerDay = today > 0 ? (total / today) : 0;
                const projected = total + spentPerDay * daysLeft;
                const projectedFormatted = projected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const remaining = Math.max(0, budget - total);
                const remainingFormatted = remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                progressHtml = `
                    <small class="text-muted d-block">${totalFormatted} de ${budgetFormatted} • Restante: ${remainingFormatted} • Prev.: ${projectedFormatted}</small>
                    <div class="progress mt-1 budget-progress" role="progressbar">
                        <div class="progress-bar ${bgColor}" style="width: ${percentage}%"></div>
                    </div>`;
            }
            listItem.innerHTML = `
                <div class="d-flex justify-content-between">
                    <span>${category}</span>
                    ${!budget ? `<span class="fw-bold">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>` : ''}
                </div>
                ${progressHtml}`;
            categoryList.appendChild(listItem);
        });
    } else {
        categoryList.innerHTML = '<li class="list-group-item">Nenhuma despesa para este mês.</li>';
    }

    const chartCtx = document.getElementById('category-chart');
    if (chartCtx) {
        if (myCategoryChart) myCategoryChart.destroy();
        if (sortedCategories.length > 0) {
            // Usar cores das categorias personalizadas se disponível
            const colors = sortedCategories.map(cat => {
                const catInfo = (typeof getCategoryInfo === 'function') ? getCategoryInfo(cat) : null;
                return catInfo ? catInfo.color : '#C9CBCF';
            });
            
            myCategoryChart = new Chart(chartCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: sortedCategories.map(cat => cat),
                    datasets: [{ 
                        data: sortedCategories.map(cat => categoryTotals[cat] || 0), 
                        backgroundColor: colors.length > 0 ? colors : ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'], 
                        borderWidth: 0 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    }
    
    // Atualizar gráficos avançados se disponíveis
    if (typeof createMonthlyTrendChart === 'function') {
        setTimeout(() => createMonthlyTrendChart(), 100);
    }
    if (typeof updateProjections === 'function') {
        setTimeout(() => updateProjections(), 100);
    }
}

function setupFinanceActionListeners() {
    const list = document.getElementById('finance-list');
    if (!list) return;

    list.addEventListener('click', (event) => {
        const target = event.target;
        const item = target.closest('.list-group-item');
        if (!item) return;

        if (target.closest('.delete-btn')) {
            // guardar para desfazer
            const deleted = {
                id: item.dataset.id,
                description: item.dataset.description,
                amount: item.dataset.amount,
                type: item.dataset.type,
                date: item.dataset.date,
                category: item.dataset.category
            };
            item.remove();
            saveTransactions();
            filterTransactions();
            updateTodayTransactions();
            updateTodayDashboard();
            showToast("Transação apagada.", "info", {
                actionText: 'Desfazer',
                delay: 6000,
                onAction: () => {
                    // recriar item
                    const li = document.createElement('li');
                    li.className = 'list-group-item transaction-item';
                    li.dataset.id = deleted.id || (Date.now() + Math.random());
                    li.dataset.description = deleted.description;
                    li.dataset.amount = deleted.amount;
                    li.dataset.type = deleted.type;
                    li.dataset.date = deleted.date;
                    li.dataset.category = deleted.category;
                    if (deleted.source) li.dataset.source = deleted.source;
                    document.getElementById('finance-list').appendChild(li);
                    saveTransactions();
                    filterTransactions();
                    showToast('Transação restaurada.', 'success');
                }
            });
        }
        if (target.closest('.edit-btn')) {
            if (item.dataset.isInstallment === 'true') {
                showToast("Não é possível editar uma parcela individualmente.", "warning");
                return;
            }
            currentlyEditingItem = item;
            const { description, amount, type, date, category } = item.dataset;
            document.getElementById('finance-description').value = description;
            document.getElementById('finance-amount').value = amount;
            document.getElementById('finance-type').value = type;
            document.getElementById('finance-date').value = date;
            document.getElementById('finance-category').value = category;
            if (sourceInput) {
                sourceInput.value = item.dataset.source || 'Cartão';
            }
            const submitButton = document.getElementById('submit-btn');
            const modalTitle = document.getElementById('modal-title');
            modalTitle.textContent = "Editar Transação";
            submitButton.textContent = "Salvar Alterações";
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-success');
            transactionModal.show();
        }
    });
}

// Função para exportar dados
function exportData() {
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const budgets = loadFromStorage(STORAGE_KEYS.BUDGETS, {});

    if (transactions.length === 0) {
        showToast("Nenhuma transação para exportar.", "warning");
        return;
    }

    // Criar CSV (valor bruto + valor formatado)
    let csvContent = "Data,Descrição,Valor,ValorFormatado,Tipo,Categoria\n";
    transactions.forEach(transaction => {
        const dateISO = transaction.date; // formato YYYY-MM-DD para facilitar planilhas
        const amountRaw = Number(transaction.amount);
        const amountFormatted = amountRaw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const desc = String(transaction.description).replaceAll('"', '""');
        const cat = String(transaction.category).replaceAll('"', '""');
        csvContent += `${dateISO},"${desc}",${amountRaw},${amountFormatted},${transaction.type},"${cat}"\n`;
    });

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Dados exportados com sucesso!", "success");
}

// Relatório mensal consolidado (CSV por categoria e totais)
function exportMonthlyReport() {
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);
    const items = Array.from(document.querySelectorAll('#finance-list .transaction-item'));
    const totals = { Receita: 0, Despesa: 0 };
    const byCategory = {};
    items.forEach(it => {
        const d = new Date(it.dataset.date + 'T00:00:00');
        if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return;
        const amt = parseFloat(it.dataset.amount);
        const type = it.dataset.type;
        const cat = it.dataset.category || 'Outros';
        if (!isNaN(amt)) {
            totals[type] = (totals[type] || 0) + amt;
            if (type === 'Despesa') byCategory[cat] = (byCategory[cat] || 0) + amt;
        }
    });
    const saldo = (totals['Receita'] || 0) - (totals['Despesa'] || 0);
    let csv = `Relatório;${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}\n`;
    csv += `Receitas;${totals['Receita'] || 0}\nDespesas;${totals['Despesa'] || 0}\nSaldo;${saldo}\n\n`;
    csv += `Categoria;TotalDespesa\n`;
    Object.keys(byCategory).sort((a, b) => (byCategory[b] - byCategory[a])).forEach(cat => {
        csv += `${cat};${byCategory[cat]}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `relatorio_${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório mensal exportado.', 'success');
}

// Importar transações de JSON
function importTransactionsFromJSON(jsonData) {
    if (!Array.isArray(jsonData)) {
        showToast('Formato JSON inválido. Use uma lista de transações.', 'warning');
        return;
    }
    const financeList = document.getElementById('finance-list');
    let importedCount = 0;
    let skippedCount = 0;
    
    jsonData.forEach(t => {
        // Validação mais rigorosa
        if (!t.date || !t.description || !t.category || typeof t.amount !== 'number' || !t.type) {
            skippedCount++;
            return;
        }
        if (t.amount <= 0 || t.description.trim().length < 2) {
            skippedCount++;
            return;
        }
        if (!['Receita', 'Despesa'].includes(t.type)) {
            skippedCount++;
            return;
        }
        
        const li = document.createElement('li');
        li.className = 'list-group-item transaction-item';
        li.dataset.id = t.id || (Date.now() + Math.random());
        li.dataset.description = t.description.trim();
        li.dataset.amount = String(Math.abs(t.amount));
        li.dataset.type = t.type;
        li.dataset.date = t.date;
        li.dataset.category = t.category;
        li.dataset.source = t.source || 'Cartão';
        
        if (t.isInstallment) {
            li.dataset.isInstallment = 'true';
            if (t.installmentNumber) li.dataset.installmentNumber = t.installmentNumber.toString();
            if (t.totalInstallments) li.dataset.totalInstallments = t.totalInstallments.toString();
        }
        
        financeList.appendChild(li);
        importedCount++;
    });
    
    saveTransactions();
    filterTransactions();
    
    if (importedCount > 0) {
        const message = skippedCount > 0 
            ? `${importedCount} transação(ões) importada(s), ${skippedCount} ignorada(s).`
            : `${importedCount} transação(ões) importada(s) com sucesso!`;
        showToast(message, skippedCount > 0 ? 'info' : 'success');
    } else {
        showToast('Nenhuma transação válida encontrada para importar.', 'warning');
    }
}

// Importar transações de CSV (espera cabeçalho semelhante ao export)
function importTransactionsFromCSV(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) { showToast('CSV vazio.', 'warning'); return; }
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idxDate = header.indexOf('data') >= 0 ? header.indexOf('data') : header.indexOf('date');
    const idxDesc = header.indexOf('descrição') >= 0 ? header.indexOf('descrição') : header.indexOf('descricao');
    const idxAmountRaw = header.indexOf('valor');
    const idxType = header.indexOf('tipo');
    const idxCat = header.indexOf('categoria');
    if (idxDate < 0 || idxDesc < 0 || idxAmountRaw < 0 || idxType < 0 || idxCat < 0) {
        showToast('Cabeçalho do CSV não reconhecido.', 'warning');
        return;
    }
    const financeList = document.getElementById('finance-list');
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (!cols || cols.length < header.length) continue;
        const dateStr = cols[idxDate];
        const desc = stripQuotes(cols[idxDesc]);
        const type = cols[idxType];
        const cat = stripQuotes(cols[idxCat]);
        const amount = Number(cols[idxAmountRaw].replace(/\./g, '').replace(',', '.'));
        if (!dateStr || !desc || !cat || !type || isNaN(amount)) continue;
        const li = document.createElement('li');
        li.className = 'list-group-item transaction-item';
        li.dataset.id = Date.now() + Math.random();
        li.dataset.description = desc;
        li.dataset.amount = String(amount);
        li.dataset.type = type;
        li.dataset.date = normalizeDate(dateStr);
        li.dataset.category = cat;
        li.dataset.source = 'Cartão'; // Padrão para importação CSV
        financeList.appendChild(li);
    }
    saveTransactions();
    filterTransactions();
    showToast('Transações importadas (CSV).', 'success');
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result.map(s => s.trim());
}

function stripQuotes(s) { return s?.replace(/^"|"$/g, '') || s; }

function normalizeDate(s) {
    // aceita YYYY-MM-DD ou DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
        const d = m[1].padStart(2, '0');
        const mo = m[2].padStart(2, '0');
        return `${m[3]}-${mo}-${d}`;
    }
    return new Date(s).toISOString().split('T')[0];
}
// Função para criar transações recorrentes
function createRecurringTransactions(transaction, frequency) {
    const baseDate = new Date(transaction.date);
    const transactions = [];

    // Criar transações futuras de acordo com a frequência
    const iterations = frequency === 'weekly' ? 12 : frequency === 'monthly' ? 12 : 2; // yearly: 2 anos
    for (let i = 1; i <= iterations; i++) {
        const newDate = new Date(baseDate);

        switch (frequency) {
            case 'weekly':
                newDate.setDate(baseDate.getDate() + (i * 7));
                break;
            case 'monthly':
                newDate.setMonth(baseDate.getMonth() + i);
                break;
            case 'yearly':
                newDate.setFullYear(baseDate.getFullYear() + i);
                break;
        }

        transactions.push({
            ...transaction,
            id: Date.now() + Math.random() + i,
            date: newDate.toISOString().split('T')[0]
        });
    }

    return transactions;
}

// Função para atualizar meta de economia
function updateSavingsGoal(monthlyBalance) {
    const savingsGoalEl = document.getElementById('savings-goal');
    const savingsProgressEl = document.getElementById('savings-progress');
    const savingsStatusEl = document.getElementById('savings-status');
    
    if (!savingsGoalEl || !savingsProgressEl || !savingsStatusEl) return;
    
    const savingsGoal = loadFromStorage(STORAGE_KEYS.SAVINGS_GOAL, 0);
    
    if (savingsGoal <= 0) {
        savingsGoalEl.textContent = 'R$ 0,00';
        savingsProgressEl.style.width = '0%';
        savingsStatusEl.textContent = 'Não definida';
        return;
    }
    
    savingsGoalEl.textContent = savingsGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const progress = Math.min((monthlyBalance / savingsGoal) * 100, 100);
    savingsProgressEl.style.width = `${Math.max(0, progress)}%`;
    
    if (monthlyBalance >= savingsGoal) {
        savingsProgressEl.className = 'progress-bar bg-success';
        savingsStatusEl.textContent = '✅ Meta atingida!';
        savingsStatusEl.className = 'text-success';
    } else {
        const remaining = savingsGoal - monthlyBalance;
        savingsProgressEl.className = monthlyBalance >= savingsGoal * 0.75 ? 'progress-bar bg-warning' : 'progress-bar bg-danger';
        savingsStatusEl.textContent = `Faltam ${remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        savingsStatusEl.className = monthlyBalance >= savingsGoal * 0.75 ? 'text-warning' : 'text-danger';
    }
}

// Função para atualizar saúde financeira
function updateFinancialHealth(monthlyIncome, monthlyExpenses, monthlyBalance) {
    const healthEl = document.getElementById('financial-health');
    const healthMessageEl = document.getElementById('health-message');
    
    if (!healthEl || !healthMessageEl) return;
    
    let healthStatus = 'excelente';
    let healthMessage = '';
    let healthColor = 'success';
    
    if (monthlyIncome === 0 && monthlyExpenses === 0) {
        healthStatus = 'sem dados';
        healthMessage = 'Adicione transações para análise';
        healthColor = 'secondary';
    } else if (monthlyIncome === 0) {
        healthStatus = 'crítico';
        healthMessage = 'Sem receitas registradas';
        healthColor = 'danger';
    } else {
        const expenseRatio = (monthlyExpenses / monthlyIncome) * 100;
        
        if (expenseRatio <= 50) {
            healthStatus = 'excelente';
            healthMessage = 'Gastos controlados!';
            healthColor = 'success';
        } else if (expenseRatio <= 70) {
            healthStatus = 'bom';
            healthMessage = 'Gastos dentro do esperado';
            healthColor = 'info';
        } else if (expenseRatio <= 90) {
            healthStatus = 'atenção';
            healthMessage = 'Gastos elevados';
            healthColor = 'warning';
        } else {
            healthStatus = 'crítico';
            healthMessage = 'Gastos muito altos!';
            healthColor = 'danger';
        }
        
        if (monthlyBalance < 0) {
            healthStatus = 'negativo';
            healthMessage = 'Saldo negativo este mês';
            healthColor = 'danger';
        }
    }
    
    const statusText = {
        'excelente': 'Excelente',
        'bom': 'Bom',
        'atenção': 'Atenção',
        'crítico': 'Crítico',
        'negativo': 'Negativo',
        'sem dados': 'Sem dados'
    };
    
    healthEl.innerHTML = `<span class="badge bg-${healthColor}">${statusText[healthStatus]}</span>`;
    healthMessageEl.textContent = healthMessage;
}

// Função para atualizar transações de hoje
function updateTodayTransactions() {
    const todayList = document.getElementById('today-transactions-list');
    const todayEmpty = document.getElementById('today-empty');
    if (!todayList) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const financeList = document.getElementById('finance-list');
    const allItems = Array.from(financeList.querySelectorAll('.transaction-item'));
    
    const todayItems = allItems.filter(item => item.dataset.date === todayStr);
    
    todayList.innerHTML = '';
    
    if (todayItems.length === 0) {
        if (todayEmpty) todayEmpty.style.display = 'block';
        return;
    }
    
    if (todayEmpty) todayEmpty.style.display = 'none';
    
    todayItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.style.display = 'block';
        todayList.appendChild(clone);
    });
    
    // Reaplicar listeners
    setupFinanceActionListeners();
}

// Função para atualizar dashboard diário
function updateTodayDashboard() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const financeList = document.getElementById('finance-list');
    const allItems = Array.from(financeList.querySelectorAll('.transaction-item'));
    
    const todayItems = allItems.filter(item => item.dataset.date === todayStr);
    
    let todayIncome = 0;
    let todayExpenses = 0;
    let todayCount = 0;
    
    todayItems.forEach(item => {
        const amount = parseFloat(item.dataset.amount);
        const type = item.dataset.type;
        todayCount++;
        
        if (type === 'Receita') {
            todayIncome += amount;
        } else {
            todayExpenses += amount;
        }
    });
    
    const todayBalance = todayIncome - todayExpenses;
    
    // Atualizar elementos
    const todayIncomeEl = document.getElementById('today-income');
    const todayExpensesEl = document.getElementById('today-expenses');
    const todayBalanceEl = document.getElementById('today-balance');
    const todayCountEl = document.getElementById('today-count');
    const todayTrendEl = document.getElementById('today-trend');
    
    if (todayIncomeEl) todayIncomeEl.textContent = todayIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (todayExpensesEl) todayExpensesEl.textContent = todayExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (todayBalanceEl) {
        todayBalanceEl.textContent = todayBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        todayBalanceEl.className = 'h4 mb-0 ' + (todayBalance >= 0 ? 'text-success' : 'text-danger');
    }
    if (todayCountEl) todayCountEl.textContent = todayCount;
    
    // Calcular tendência (comparar com ontem)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayItems = allItems.filter(item => item.dataset.date === yesterdayStr);
    
    let yesterdayExpenses = 0;
    yesterdayItems.forEach(item => {
        if (item.dataset.type === 'Despesa') {
            yesterdayExpenses += parseFloat(item.dataset.amount);
        }
    });
    
    if (todayTrendEl && yesterdayExpenses > 0) {
        const diff = todayExpenses - yesterdayExpenses;
        const percent = ((diff / yesterdayExpenses) * 100).toFixed(1);
        if (diff > 0) {
            todayTrendEl.textContent = `↑ ${Math.abs(percent)}% vs ontem`;
            todayTrendEl.className = 'text-danger';
        } else if (diff < 0) {
            todayTrendEl.textContent = `↓ ${Math.abs(percent)}% vs ontem`;
            todayTrendEl.className = 'text-success';
        } else {
            todayTrendEl.textContent = '= vs ontem';
            todayTrendEl.className = 'text-muted';
        }
    } else if (todayTrendEl) {
        todayTrendEl.textContent = '-';
        todayTrendEl.className = 'text-muted';
    }
}

// Função para atualizar resumo do mês
function updateMonthSummary(monthlyBalance) {
    const monthSummaryEl = document.getElementById('month-summary');
    const monthSummaryStatusEl = document.getElementById('month-summary-status');
    
    if (!monthSummaryEl || !monthSummaryStatusEl) return;
    
    monthSummaryEl.textContent = monthlyBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    monthSummaryEl.className = 'h6 mb-1 ' + (monthlyBalance >= 0 ? 'text-success' : 'text-danger');
    monthSummaryStatusEl.textContent = monthlyBalance >= 0 ? 'Saldo positivo' : 'Saldo negativo';
    monthSummaryStatusEl.className = monthlyBalance >= 0 ? 'text-success' : 'text-danger';
}