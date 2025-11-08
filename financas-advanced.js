// =================================================================================
// Funcionalidades Avançadas do Sistema Financeiro
// =================================================================================

let monthlyTrendChart = null;
let customCategories = [];
let templates = [];
let accounts = [];
let advancedSearchFilters = {};

// ==================== CATEGORIAS PERSONALIZADAS ====================

function loadCustomCategories() {
    const saved = loadFromStorage(STORAGE_KEYS.CUSTOM_CATEGORIES, []);
    customCategories = saved.length > 0 ? saved : DEFAULT_CATEGORIES.map(c => ({ ...c }));
    updateCategoriesDropdown();
    renderCategoriesList();
}

function saveCustomCategories() {
    saveToStorage(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategories);
}

function addCustomCategory(name, icon, color) {
    if (!name || name.trim() === '') {
        showToast('Nome da categoria é obrigatório', 'warning');
        return;
    }
    if (customCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('Categoria já existe', 'warning');
        return;
    }
    customCategories.push({ name: name.trim(), icon, color });
    saveCustomCategories();
    updateCategoriesDropdown();
    renderCategoriesList();
    showToast('Categoria adicionada!', 'success');
}

function deleteCustomCategory(name) {
    if (DEFAULT_CATEGORIES.some(c => c.name === name)) {
        showToast('Não é possível excluir categorias padrão', 'warning');
        return;
    }
    customCategories = customCategories.filter(c => c.name !== name);
    saveCustomCategories();
    updateCategoriesDropdown();
    renderCategoriesList();
    showToast('Categoria excluída!', 'info');
}

function updateCategoriesDropdown() {
    const dropdown = document.getElementById('finance-category');
    const bulkCategory = document.getElementById('bulk-category');
    const searchCategories = document.getElementById('search-categories');
    
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Selecione a Categoria</option>';
    if (bulkCategory) bulkCategory.innerHTML = '<option value="">—</option>';
    if (searchCategories) searchCategories.innerHTML = '';
    
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        dropdown.appendChild(option);
        
        if (bulkCategory) {
            const bulkOption = option.cloneNode(true);
            bulkCategory.appendChild(bulkOption);
        }
        
        if (searchCategories) {
            const searchOption = document.createElement('option');
            searchOption.value = cat.name;
            searchOption.textContent = cat.name;
            searchCategories.appendChild(searchOption);
        }
    });
}

function renderCategoriesList() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    
    list.innerHTML = '';
    customCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${cat.icon} me-2" style="color: ${cat.color}"></i>
                <span>${cat.name}</span>
            </div>
            ${!DEFAULT_CATEGORIES.some(c => c.name === cat.name) ? 
                `<button class="btn btn-sm btn-outline-danger" onclick="deleteCustomCategory('${cat.name}')">
                    <i class="bi bi-trash"></i>
                </button>` : 
                '<small class="text-muted">Padrão</small>'
            }
        `;
        list.appendChild(item);
    });
}

function getCategoryInfo(categoryName) {
    return customCategories.find(c => c.name === categoryName) || 
           DEFAULT_CATEGORIES.find(c => c.name === categoryName) || 
           { name: categoryName, icon: 'bi-tag', color: '#6c757d' };
}

// ==================== TEMPLATES DE TRANSAÇÕES ====================

function loadTemplates() {
    templates = loadFromStorage(STORAGE_KEYS.TEMPLATES, []);
    renderTemplatesList();
}

function saveTemplates() {
    saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
}

function createTemplateFromCurrent() {
    const description = document.getElementById('finance-description')?.value;
    const amount = document.getElementById('finance-amount')?.value;
    const category = document.getElementById('finance-category')?.value;
    const type = document.getElementById('finance-type')?.value;
    
    if (!description || !amount || !category) {
        showToast('Preencha todos os campos para criar um template', 'warning');
        return;
    }
    
    const template = {
        id: Date.now(),
        name: description,
        description,
        amount: parseFloat(amount),
        category,
        type,
        createdAt: new Date().toISOString()
    };
    
    templates.push(template);
    saveTemplates();
    renderTemplatesList();
    showToast('Template criado!', 'success');
}

function useTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    document.getElementById('finance-description').value = template.description;
    document.getElementById('finance-amount').value = template.amount;
    document.getElementById('finance-category').value = template.category;
    document.getElementById('finance-type').value = template.type;
    
    const quickType = template.type === 'Receita' ? 'quick-receita' : 'quick-despesa';
    document.getElementById(quickType).checked = true;
    document.getElementById('quick-receita').dispatchEvent(new Event('change'));
    
    showToast('Template aplicado!', 'success');
}

function deleteTemplate(templateId) {
    templates = templates.filter(t => t.id !== templateId);
    saveTemplates();
    renderTemplatesList();
    showToast('Template excluído!', 'info');
}

function renderTemplatesList() {
    const list = document.getElementById('templates-list');
    if (!list) return;
    
    if (templates.length === 0) {
        list.innerHTML = '<p class="text-muted text-center py-3">Nenhum template criado ainda</p>';
        return;
    }
    
    list.innerHTML = '';
    templates.forEach(template => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${template.name}</h6>
                    <small class="text-muted">
                        ${template.type} • ${template.category} • 
                        ${template.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </small>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="useTemplate(${template.id})">
                        <i class="bi bi-check-lg"></i> Usar
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteTemplate(${template.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// ==================== MÚLTIPLAS CONTAS/CARTEIRAS ====================

function loadAccounts() {
    accounts = loadFromStorage(STORAGE_KEYS.ACCOUNTS, []);
    if (accounts.length === 0) {
        accounts = [{ id: 'default', name: 'Conta Principal', balance: 0 }];
        saveAccounts();
    }
    renderAccountsList();
    updateAccountDropdown();
}

function saveAccounts() {
    saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
}

function addAccount(name) {
    if (!name || name.trim() === '') {
        showToast('Nome da conta é obrigatório', 'warning');
        return;
    }
    const account = {
        id: Date.now().toString(),
        name: name.trim(),
        balance: 0
    };
    accounts.push(account);
    saveAccounts();
    renderAccountsList();
    updateAccountDropdown();
    showToast('Conta adicionada!', 'success');
}

function deleteAccount(accountId) {
    if (accounts.length <= 1) {
        showToast('Você precisa ter pelo menos uma conta', 'warning');
        return;
    }
    accounts = accounts.filter(a => a.id !== accountId);
    saveAccounts();
    renderAccountsList();
    updateAccountDropdown();
    showToast('Conta excluída!', 'info');
}

function renderAccountsList() {
    const list = document.getElementById('accounts-list');
    if (!list) return;
    
    list.innerHTML = '';
    accounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <h6 class="mb-0">${account.name}</h6>
                <small class="text-muted">Saldo: ${account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</small>
            </div>
            ${accounts.length > 1 ? 
                `<button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${account.id}')">
                    <i class="bi bi-trash"></i>
                </button>` : 
                '<small class="text-muted">Padrão</small>'
            }
        `;
        list.appendChild(item);
    });
}

function updateAccountDropdown() {
    const dropdown = document.getElementById('finance-account');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Conta Principal</option>';
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name;
        dropdown.appendChild(option);
    });
}

// ==================== PESQUISA AVANÇADA ====================

function setupAdvancedSearch() {
    const btn = document.getElementById('advanced-search-btn');
    const panel = document.getElementById('advanced-search-panel');
    const applyBtn = document.getElementById('apply-advanced-search');
    const clearBtn = document.getElementById('clear-advanced-search');
    
    if (btn && panel) {
        btn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyAdvancedSearch);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAdvancedSearch);
    }
}

function applyAdvancedSearch() {
    advancedSearchFilters = {
        minAmount: parseFloat(document.getElementById('search-min-amount')?.value) || null,
        maxAmount: parseFloat(document.getElementById('search-max-amount')?.value) || null,
        startDate: document.getElementById('search-start-date')?.value || null,
        endDate: document.getElementById('search-end-date')?.value || null,
        categories: Array.from(document.getElementById('search-categories')?.selectedOptions || []).map(o => o.value),
        type: document.getElementById('search-type')?.value || null
    };
    
    filterTransactions();
    showToast('Filtros aplicados!', 'success');
}

function clearAdvancedSearch() {
    document.getElementById('search-min-amount').value = '';
    document.getElementById('search-max-amount').value = '';
    document.getElementById('search-start-date').value = '';
    document.getElementById('search-end-date').value = '';
    document.getElementById('search-categories').selectedIndex = -1;
    document.getElementById('search-type').value = '';
    advancedSearchFilters = {};
    filterTransactions();
    showToast('Filtros limpos!', 'info');
}

// ==================== GRÁFICOS AVANÇADOS ====================

function createMonthlyTrendChart() {
    const ctx = document.getElementById('monthly-trend-chart');
    if (!ctx) return;
    
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const currentYear = new Date().getFullYear();
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 0; i < 12; i++) {
        const monthDate = new Date(currentYear, i, 1);
        months.push(monthDate.toLocaleDateString('pt-BR', { month: 'short' }));
        
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === i && tDate.getFullYear() === currentYear;
        });
        
        const income = monthTransactions
            .filter(t => t.type === 'Receita')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = monthTransactions
            .filter(t => t.type === 'Despesa')
            .reduce((sum, t) => sum + t.amount, 0);
        
        incomeData.push(income);
        expenseData.push(expenses);
    }
    
    if (monthlyTrendChart) monthlyTrendChart.destroy();
    
    monthlyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Receitas',
                data: incomeData,
                borderColor: '#34d399',
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                tension: 0.4
            }, {
                label: 'Despesas',
                data: expenseData,
                borderColor: '#fb7185',
                backgroundColor: 'rgba(251, 113, 133, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// ==================== PROJEÇÕES ====================

function updateProjections() {
    const container = document.getElementById('projections-content');
    if (!container) return;
    
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayDay = today.getDate();
    const daysLeft = daysInMonth - todayDay;
    
    // Calcular média diária do mês atual
    const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    
    const monthExpenses = monthTransactions
        .filter(t => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthIncome = monthTransactions
        .filter(t => t.type === 'Receita')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const avgDailyExpense = todayDay > 0 ? monthExpenses / todayDay : 0;
    const avgDailyIncome = todayDay > 0 ? monthIncome / todayDay : 0;
    
    const projectedExpense = monthExpenses + (avgDailyExpense * daysLeft);
    const projectedIncome = monthIncome + (avgDailyIncome * daysLeft);
    const projectedBalance = projectedIncome - projectedExpense;
    
    container.innerHTML = `
        <div class="row g-3">
            <div class="col-6">
                <small class="text-muted d-block">Projeção de Receitas</small>
                <h6 class="text-success mb-0">${projectedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h6>
            </div>
            <div class="col-6">
                <small class="text-muted d-block">Projeção de Despesas</small>
                <h6 class="text-danger mb-0">${projectedExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h6>
            </div>
            <div class="col-12">
                <hr class="my-2">
                <small class="text-muted d-block">Saldo Projetado</small>
                <h5 class="${projectedBalance >= 0 ? 'text-success' : 'text-danger'} mb-0">
                    ${projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h5>
            </div>
        </div>
    `;
}

// ==================== BACKUP AUTOMÁTICO ====================

function createBackup() {
    const data = {
        transactions: loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
        budgets: loadFromStorage(STORAGE_KEYS.BUDGETS, {}),
        categories: customCategories,
        templates: templates,
        accounts: accounts,
        savingsGoal: loadFromStorage(STORAGE_KEYS.SAVINGS_GOAL, 0),
        timestamp: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_financas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Salvar histórico de backups
    const backups = loadFromStorage(STORAGE_KEYS.BACKUPS, []);
    backups.push({
        date: new Date().toISOString(),
        size: JSON.stringify(data).length
    });
    // Manter apenas últimos 10 backups
    if (backups.length > 10) backups.shift();
    saveToStorage(STORAGE_KEYS.BACKUPS, backups);
    
    showToast('Backup criado com sucesso!', 'success');
}

function restoreBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.transactions) saveToStorage(STORAGE_KEYS.TRANSACTIONS, data.transactions);
            if (data.budgets) saveToStorage(STORAGE_KEYS.BUDGETS, data.budgets);
            if (data.categories) {
                customCategories = data.categories;
                saveCustomCategories();
            }
            if (data.templates) {
                templates = data.templates;
                saveTemplates();
            }
            if (data.accounts) {
                accounts = data.accounts;
                saveAccounts();
            }
            if (data.savingsGoal !== undefined) {
                saveToStorage(STORAGE_KEYS.SAVINGS_GOAL, data.savingsGoal);
            }
            
            showToast('Backup restaurado com sucesso! Recarregue a página.', 'success');
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            showToast('Erro ao restaurar backup. Arquivo inválido.', 'danger');
        }
    };
    reader.readAsText(file);
}

// ==================== EXPORTAÇÃO PDF ====================

function exportToPDF() {
    // Usar jsPDF ou html2pdf para gerar PDF
    // Por enquanto, criar uma versão HTML formatada para impressão
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);
    
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });
    
    const income = monthTransactions.filter(t => t.type === 'Receita').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'Despesa').reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório Financeiro - ${selectedYear}/${String(selectedMonth + 1).padStart(2, '0')}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary { margin-top: 20px; padding: 15px; background: #f9f9f9; }
            </style>
        </head>
        <body>
            <h1>Relatório Financeiro</h1>
            <p><strong>Período:</strong> ${selectedYear}/${String(selectedMonth + 1).padStart(2, '0')}</p>
            
            <div class="summary">
                <h3>Resumo</h3>
                <p><strong>Receitas:</strong> ${income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Despesas:</strong> ${expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Saldo:</strong> ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthTransactions.map(t => `
                        <tr>
                            <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
                            <td>${t.description}</td>
                            <td>${t.category}</td>
                            <td>${t.type}</td>
                            <td>${t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
                Gerado em ${new Date().toLocaleString('pt-BR')}
            </p>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Relatório HTML gerado! Use "Imprimir para PDF" no navegador.', 'success');
}

// ==================== ANÁLISE DE PADRÕES ====================

function analyzePatterns() {
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const patterns = {
        recurringExpenses: [],
        suggestions: []
    };
    
    // Identificar despesas recorrentes
    const expenseMap = {};
    transactions.filter(t => t.type === 'Despesa').forEach(t => {
        const key = `${t.description.toLowerCase()}_${t.category}`;
        if (!expenseMap[key]) {
            expenseMap[key] = { count: 0, total: 0, category: t.category, description: t.description };
        }
        expenseMap[key].count++;
        expenseMap[key].total += t.amount;
    });
    
    Object.entries(expenseMap).forEach(([key, data]) => {
        if (data.count >= 3) {
            patterns.recurringExpenses.push({
                description: data.description,
                category: data.category,
                frequency: data.count,
                avgAmount: data.total / data.count
            });
        }
    });
    
    // Sugestões de economia
    const categoryTotals = {};
    transactions.filter(t => t.type === 'Despesa').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const highestCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];
    
    if (highestCategory) {
        patterns.suggestions.push({
            type: 'highest_category',
            message: `Você gasta mais em ${highestCategory[0]}. Considere revisar esses gastos.`,
            category: highestCategory[0],
            amount: highestCategory[1]
        });
    }
    
    return patterns;
}

// ==================== NOTIFICAÇÕES INTELIGENTES ====================

function checkNotifications() {
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    const budgets = loadFromStorage(STORAGE_KEYS.BUDGETS, {});
    const savingsGoal = loadFromStorage(STORAGE_KEYS.SAVINGS_GOAL, 0);
    
    const today = new Date();
    const currentPeriod = getCurrentPeriodKey(today);
    const periodBudgets = budgets[currentPeriod] || {};
    
    // Verificar orçamentos
    Object.entries(periodBudgets).forEach(([category, budget]) => {
        const spent = transactions
            .filter(t => t.category === category && t.type === 'Despesa' && 
                   new Date(t.date).getMonth() === today.getMonth() &&
                   new Date(t.date).getFullYear() === today.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
        
        const percentage = (spent / budget) * 100;
        
        if (percentage >= 100) {
            showToast(`⚠️ Orçamento de ${category} ultrapassado!`, 'danger', { delay: 8000 });
        } else if (percentage >= 80) {
            showToast(`⚠️ Orçamento de ${category} está em ${percentage.toFixed(0)}%`, 'warning', { delay: 6000 });
        }
    });
    
    // Verificar meta de economia
    if (savingsGoal > 0) {
        const monthIncome = transactions
            .filter(t => t.type === 'Receita' && 
                   new Date(t.date).getMonth() === today.getMonth() &&
                   new Date(t.date).getFullYear() === today.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthExpenses = transactions
            .filter(t => t.type === 'Despesa' && 
                   new Date(t.date).getMonth() === today.getMonth() &&
                   new Date(t.date).getFullYear() === today.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
        
        const currentSavings = monthIncome - monthExpenses;
        const progress = (currentSavings / savingsGoal) * 100;
        
        if (progress >= 100) {
            showToast('🎉 Parabéns! Você atingiu sua meta de economia!', 'success', { delay: 5000 });
        } else if (progress >= 75) {
            showToast(`💪 Você está a ${(100 - progress).toFixed(0)}% da sua meta de economia!`, 'info', { delay: 5000 });
        }
    }
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados
    loadCustomCategories();
    loadTemplates();
    loadAccounts();
    updateAccountDropdown();
    
    // Event listeners
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const name = document.getElementById('new-category-name')?.value;
            const icon = document.getElementById('new-category-icon')?.value;
            const color = document.getElementById('new-category-color')?.value;
            if (name) {
                addCustomCategory(name, icon, color);
                document.getElementById('new-category-name').value = '';
            }
        });
    }
    
    const createTemplateBtn = document.getElementById('create-template-btn');
    if (createTemplateBtn) {
        createTemplateBtn.addEventListener('click', createTemplateFromCurrent);
    }
    
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => {
            const name = document.getElementById('new-account-name')?.value;
            if (name) {
                addAccount(name);
                document.getElementById('new-account-name').value = '';
            }
        });
    }
    
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', createBackup);
    }
    
    const restoreBtn = document.getElementById('restore-btn');
    const restoreInput = document.getElementById('restore-file-input');
    if (restoreBtn && restoreInput) {
        restoreBtn.addEventListener('click', () => restoreInput.click());
        restoreInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                if (confirm('Tem certeza? Isso irá substituir todos os dados atuais!')) {
                    restoreBackup(file);
                }
                restoreInput.value = '';
            }
        });
    }
    
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }
    
    // Pesquisa avançada
    setupAdvancedSearch();
    
    // Gráficos e projeções
    setTimeout(() => {
        createMonthlyTrendChart();
        updateProjections();
    }, 500);
    
    // Notificações
    setTimeout(() => {
        checkNotifications();
    }, 1000);
    
    // Atualizar projeções periodicamente
    setInterval(() => {
        updateProjections();
        createMonthlyTrendChart();
    }, 30000);
});

// Exportar funções globais
window.deleteCustomCategory = deleteCustomCategory;
window.useTemplate = useTemplate;
window.deleteTemplate = deleteTemplate;
window.deleteAccount = deleteAccount;

