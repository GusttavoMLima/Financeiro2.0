// =================================================================================
// Organização Pessoal - financas.js
// Versão: 4.0 (Sistema Completo com localStorage e Melhorias)
// =================================================================================

let myCategoryChart = null;
let currentlyEditingItem = null;
let transactionModal = null;
let budgetsModal = null;

// Objeto para guardar os orçamentos com persistência
let budgets = {}; // Ex: { "Alimentação": 500, "Lazer": 200 }

// Sistema de localStorage para persistência de dados
const STORAGE_KEYS = {
    TRANSACTIONS: 'finance_transactions',
    BUDGETS: 'finance_budgets',
    SETTINGS: 'finance_settings'
};

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
            financeList.appendChild(listItem);
        });
    }
    
    // Carregar orçamentos salvos
    budgets = savedBudgets;
}

// Salvar transações
function saveTransactions() {
    const transactions = [];
    const financeList = document.getElementById('finance-list');
    const items = financeList.querySelectorAll('.transaction-item');
    
    items.forEach(item => {
        transactions.push({
            id: item.dataset.id || Date.now() + Math.random(),
            description: item.dataset.description,
            amount: parseFloat(item.dataset.amount),
            type: item.dataset.type,
            date: item.dataset.date,
            category: item.dataset.category
        });
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

    // Seleção de todos os elementos do DOM
    const descriptionInput = document.getElementById('finance-description');
    const amountInput = document.getElementById('finance-amount');
    const typeInput = document.getElementById('finance-type');
    const dateInput = document.getElementById('finance-date');
    const categoryInput = document.getElementById('finance-category');
    const financeList = document.getElementById('finance-list');
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const searchFilter = document.getElementById('search-filter');
    const sortFilter = document.getElementById('sort-filter');
    const submitButton = document.getElementById('submit-btn');
    const modalTitle = document.getElementById('modal-title');
    const saveBudgetsBtn = document.getElementById('save-budgets-btn');
    const budgetsForm = document.getElementById('budgets-form');

    // Define a data atual como padrão no formulário de transação
    dateInput.value = new Date().toISOString().split('T')[0];

    // Controle de transações recorrentes
    const recurringCheckbox = document.getElementById('recurring-checkbox');
    const recurringOptions = document.getElementById('recurring-options');
    
    if (recurringCheckbox && recurringOptions) {
        recurringCheckbox.addEventListener('change', () => {
            recurringOptions.style.display = recurringCheckbox.checked ? 'block' : 'none';
        });
    }

    // Botão de exportar dados
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
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

    function resetForm() {
        financeForm.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        currentlyEditingItem = null;
        modalTitle.textContent = "Adicionar Nova Transação";
        submitButton.textContent = "Adicionar";
        submitButton.classList.remove('btn-success');
        submitButton.classList.add('btn-primary');
        
        // Limpar campos de transação recorrente
        const recurringCheckbox = document.getElementById('recurring-checkbox');
        const recurringOptions = document.getElementById('recurring-options');
        if (recurringCheckbox) recurringCheckbox.checked = false;
        if (recurringOptions) recurringOptions.style.display = 'none';
    }

    function populateBudgetsForm() {
        const categories = ["Alimentação", "Moradia", "Transporte", "Lazer", "Saúde", "Trabalho", "Outros"];
        budgetsForm.innerHTML = '';
        categories.forEach(category => {
            const value = budgets[category] || '';
            const formRow = `<div class="input-group mb-2"><span class="input-group-text" style="width: 120px;">${category}</span><input type="number" class="form-control" data-category="${category}" value="${value}" placeholder="0" min="0"></div>`;
            budgetsForm.insertAdjacentHTML('beforeend', formRow);
        });
    }

    document.querySelector('[data-bs-target="#budgets-modal"]').addEventListener('click', populateBudgetsForm);
    
    saveBudgetsBtn.addEventListener('click', () => {
        const inputs = budgetsForm.querySelectorAll('input');
        budgets = {}; // Limpa os orçamentos antigos antes de salvar
        inputs.forEach(input => {
            const category = input.dataset.category;
            const amount = parseFloat(input.value);
            if (amount > 0) {
                budgets[category] = amount;
            }
        });
        saveBudgets(); // Salvar no localStorage
        showToast("Orçamentos salvos com sucesso!", "success");
        budgetsModal.hide();
        filterTransactions();
    });

    financeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const description = descriptionInput.value; const amount = parseFloat(amountInput.value);
        const type = typeInput.value; const date = dateInput.value; const category = categoryInput.value;
        if (!date || !description || isNaN(amount) || amount <= 0 || !category) {
            showToast("Por favor, preencha todos os campos com valores válidos.", "warning"); return;
        }
        const successMessage = currentlyEditingItem ? "Transação atualizada!" : "Transação adicionada!";
        
        // Verificar se é transação recorrente
        const isRecurring = document.getElementById('recurring-checkbox').checked;
        const frequency = document.getElementById('recurring-frequency').value;
        
        if (currentlyEditingItem === null) {
            const transactionData = {
                description, amount, type, date, category,
                id: Date.now() + Math.random()
            };
            
            // Adicionar transação principal
            const listItem = document.createElement('li'); 
            listItem.className = 'list-group-item transaction-item';
            listItem.dataset.description = description; 
            listItem.dataset.amount = amount;
            listItem.dataset.type = type; 
            listItem.dataset.date = date; 
            listItem.dataset.category = category;
            listItem.dataset.id = transactionData.id;
            financeList.appendChild(listItem);
            
            // Se for recorrente, criar transações futuras
            if (isRecurring) {
                const recurringTransactions = createRecurringTransactions(transactionData, frequency);
                recurringTransactions.forEach(rt => {
                    const recurringItem = document.createElement('li');
                    recurringItem.className = 'list-group-item transaction-item';
                    recurringItem.dataset.description = rt.description;
                    recurringItem.dataset.amount = rt.amount;
                    recurringItem.dataset.type = rt.type;
                    recurringItem.dataset.date = rt.date;
                    recurringItem.dataset.category = rt.category;
                    recurringItem.dataset.id = rt.id;
                    financeList.appendChild(recurringItem);
                });
                showToast(`${successMessage} ${recurringTransactions.length + 1} transações criadas!`, "success");
            }
        } else {
            currentlyEditingItem.dataset.description = description; 
            currentlyEditingItem.dataset.amount = amount;
            currentlyEditingItem.dataset.type = type; 
            currentlyEditingItem.dataset.date = date; 
            currentlyEditingItem.dataset.category = category;
        }
        
        saveTransactions(); // Salvar no localStorage
        resetForm();
        filterTransactions();
        transactionModal.hide();
        
        if (!isRecurring) {
            showToast(successMessage, "success");
        }
    });

    document.getElementById('transaction-modal').addEventListener('hidden.bs.modal', resetForm);
    populateFilters();
    filterTransactions();
    monthFilter.addEventListener('change', filterTransactions);
    yearFilter.addEventListener('change', filterTransactions);
    if (sortFilter) sortFilter.addEventListener('change', filterTransactions);
    // Debounce para reduzir re-render a cada tecla digitada
    function debounce(fn, delay = 250) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    searchFilter.addEventListener('input', debounce(filterTransactions, 250));
    setupFinanceActionListeners();
});

function filterTransactions() {
    const financeList = document.getElementById('finance-list');
    if (!financeList) return;

    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const searchFilter = document.getElementById('search-filter');
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);
    const searchTerm = searchFilter.value.toLowerCase();
    const transactions = Array.from(financeList.querySelectorAll('.list-group-item'));
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpensesEl = document.getElementById('monthly-expenses');
    const monthlyBalanceEl = document.getElementById('monthly-balance');
    const categoryList = document.getElementById('category-list');
    const expenseTrendEl = document.getElementById('expense-trend');

    let monthlyIncome = 0, monthlyExpenses = 0, previousMonthExpenses = 0;
    const categoryTotals = {};
    const previousMonthDate = new Date(selectedYear, selectedMonth - 1);
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

    sorted.forEach(transaction => {
        const transactionDate = new Date(transaction.dataset.date + 'T00:00:00');
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();
        const descriptionLower = transaction.dataset.description.toLowerCase();
        const categoryLower = (transaction.dataset.category || '').toLowerCase();
        const typeLower = (transaction.dataset.type || '').toLowerCase();
        const isMonthMatch = transactionMonth === selectedMonth && transactionYear === selectedYear;
        const isSearchMatch = searchTerm === '' || descriptionLower.includes(searchTerm) || categoryLower.includes(searchTerm) || typeLower.includes(searchTerm);
        if (isMonthMatch && isSearchMatch) {
            transaction.style.display = 'block';
            const { amount, type, date, category } = transaction.dataset;
            const descriptionRaw = transaction.dataset.description;
            const numAmount = parseFloat(amount);
            
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
            leftTextWrap.appendChild(title);
            leftTextWrap.appendChild(meta);
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
    monthlyBalanceEl.className = 'h5 mb-0 ' + (monthlyBalance < 0 ? 'text-danger' : 'text-dark');
    
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
    Object.keys(budgets).forEach(cat => allCategoriesInView.add(cat));
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
            const budget = budgets[category];
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

    const chartCtx = document.getElementById('category-chart').getContext('2d');
    if (myCategoryChart) myCategoryChart.destroy();
    if (sortedCategories.length > 0) {
        myCategoryChart = new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: sortedCategories.map(cat => cat),
                datasets: [{ data: sortedCategories.map(cat => categoryTotals[cat] || 0), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
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
                    document.getElementById('finance-list').appendChild(li);
                    saveTransactions();
                    filterTransactions();
                    showToast('Transação restaurada.', 'success');
                }
            });
        }
        if (target.closest('.edit-btn')) {
            currentlyEditingItem = item;
            const { description, amount, type, date, category } = item.dataset;
            document.getElementById('finance-description').value = description;
            document.getElementById('finance-amount').value = amount;
            document.getElementById('finance-type').value = type;
            document.getElementById('finance-date').value = date;
            document.getElementById('finance-category').value = category;
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

// Função para adicionar dashboard com métricas avançadas
function addAdvancedMetrics() {
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calcular métricas
    const monthlyTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    
    const totalIncome = monthlyTransactions
        .filter(t => t.type === 'Receita')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = monthlyTransactions
        .filter(t => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Adicionar indicadores visuais
    const balanceElement = document.getElementById('monthly-balance');
    if (balanceElement) {
        const balanceClass = balance >= 0 ? 'text-success' : 'text-danger';
        balanceElement.className = `h5 mb-0 ${balanceClass}`;
        
        // Adicionar emoji baseado no saldo
        const emoji = balance >= 0 ? '💰' : '⚠️';
        balanceElement.innerHTML = `${emoji} ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }
}