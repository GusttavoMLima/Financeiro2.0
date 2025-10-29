// =================================================================================
// Organização Pessoal - dashboard.js
// Versão: 1.0 - Dashboard Unificado
// =================================================================================

// Função para carregar estatísticas do dashboard
function loadDashboardStats() {
    try {
        // Estatísticas de Finanças
        const financeTransactions = JSON.parse(localStorage.getItem('finance_transactions') || '[]');
        const financeBudgets = JSON.parse(localStorage.getItem('finance_budgets') || '{}');
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = financeTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
        
        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'Receita')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'Despesa')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const budgetCount = Object.keys(financeBudgets).length;
        
        document.getElementById('finance-stats').innerHTML = `
            <div class="small">
                <div>💰 R$ ${monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div>💸 R$ ${monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div>📊 ${budgetCount} orçamentos</div>
            </div>
        `;
        
        // Estatísticas de Jogos
        const games = JSON.parse(localStorage.getItem('game_library') || '[]');
        const playingGames = games.filter(g => g.status === 'Jogando').length;
        const finishedGames = games.filter(g => g.status === 'Finalizado').length;
        const backlogGames = games.filter(g => g.status === 'Backlog').length;
        
        document.getElementById('games-stats').innerHTML = `
            <div class="small">
                <div>🎮 ${games.length} jogos</div>
                <div>▶️ ${playingGames} jogando</div>
                <div>✅ ${finishedGames} finalizados</div>
                <div>📚 ${backlogGames} backlog</div>
            </div>
        `;
        
        // Estatísticas de Hot Wheels
        const hotwheels = JSON.parse(localStorage.getItem('hotwheels_collection') || '[]');
        const series = new Set(hotwheels.map(h => h.series).filter(s => s)).size;
        const years = new Set(hotwheels.map(h => h.year)).size;
        
        document.getElementById('hotwheels-stats').innerHTML = `
            <div class="small">
                <div>🚗 ${hotwheels.length} carros</div>
                <div>📦 ${series} séries</div>
                <div>📅 ${years} anos</div>
            </div>
        `;
        
        // Estatísticas de Backup
        const backupStats = getBackupStats();
        const totalItems = backupStats.finances.transactions + backupStats.games + backupStats.hotwheels;
        const sizeKB = Math.round(backupStats.totalSize / 1024);
        
        document.getElementById('backup-stats').innerHTML = `
            <div class="small">
                <div>📦 ${totalItems} itens</div>
                <div>💾 ${sizeKB} KB</div>
                <div>🔄 Auto-backup ativo</div>
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        
        // Mostrar mensagens de erro
        document.getElementById('finance-stats').textContent = 'Erro ao carregar';
        document.getElementById('games-stats').textContent = 'Erro ao carregar';
        document.getElementById('hotwheels-stats').textContent = 'Erro ao carregar';
        document.getElementById('backup-stats').textContent = 'Erro ao carregar';
    }
}

// Função para atualizar estatísticas em tempo real
function updateDashboardStats() {
    loadDashboardStats();
}

// Carregar estatísticas quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    
    // Atualizar estatísticas a cada 30 segundos
    setInterval(updateDashboardStats, 30000);
});

// Função para mostrar notificações de backup
function showBackupNotification() {
    const lastBackup = localStorage.getItem('last_auto_backup');
    if (!lastBackup) {
        showToast('💡 Dica: Configure o backup automático para proteger seus dados!', 'info');
    }
}

// Mostrar notificação de backup após 5 segundos
setTimeout(showBackupNotification, 5000);
