// =================================================================================
// Organização Pessoal - advanced-features.js
// Versão: 1.0 - Funcionalidades Avançadas
// =================================================================================

// Sistema de metas e objetivos
const GOALS_STORAGE_KEY = 'app_goals';

// Estrutura de metas
const defaultGoals = {
    finance: {
        monthlySavings: 0,
        debtReduction: 0,
        investmentTarget: 0
    },
    games: {
        gamesToFinish: 0,
        hoursPerWeek: 0,
        backlogReduction: 0
    },
    hotwheels: {
        collectionTarget: 0,
        seriesToComplete: [],
        monthlyBudget: 0
    }
};

// Carregar metas salvas
function loadGoals() {
    try {
        const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
        return savedGoals ? JSON.parse(savedGoals) : defaultGoals;
    } catch (error) {
        console.error('Erro ao carregar metas:', error);
        return defaultGoals;
    }
}

// Salvar metas
function saveGoals(goals) {
    try {
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
        return true;
    } catch (error) {
        console.error('Erro ao salvar metas:', error);
        return false;
    }
}

// Sistema de notificações inteligentes
function setupSmartNotifications() {
    // Verificar metas de finanças
    checkFinanceGoals();
    
    // Verificar metas de jogos
    checkGameGoals();
    
    // Verificar metas de Hot Wheels
    checkHotWheelsGoals();
}

// Verificar metas financeiras
function checkFinanceGoals() {
    const goals = loadGoals();
    const transactions = JSON.parse(localStorage.getItem('finance_transactions') || '[]');
    
    if (goals.finance.monthlySavings > 0) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
        
        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'Receita')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'Despesa')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const currentSavings = monthlyIncome - monthlyExpenses;
        const savingsProgress = (currentSavings / goals.finance.monthlySavings) * 100;
        
        if (savingsProgress >= 100) {
            showToast(`🎉 Parabéns! Você atingiu sua meta de poupança mensal!`, 'success');
        } else if (savingsProgress >= 75) {
            showToast(`💪 Você está a ${Math.round(100 - savingsProgress)}% da sua meta de poupança!`, 'info');
        }
    }
}

// Verificar metas de jogos
function checkGameGoals() {
    const goals = loadGoals();
    const games = JSON.parse(localStorage.getItem('game_library') || '[]');
    
    if (goals.games.gamesToFinish > 0) {
        const finishedGames = games.filter(g => g.status === 'Finalizado').length;
        const finishProgress = (finishedGames / goals.games.gamesToFinish) * 100;
        
        if (finishProgress >= 100) {
            showToast(`🎮 Parabéns! Você finalizou sua meta de jogos!`, 'success');
        } else if (finishProgress >= 75) {
            showToast(`🎯 Você está a ${Math.round(100 - finishProgress)}% da sua meta de jogos!`, 'info');
        }
    }
}

// Verificar metas de Hot Wheels
function checkHotWheelsGoals() {
    const goals = loadGoals();
    const hotwheels = JSON.parse(localStorage.getItem('hotwheels_collection') || '[]');
    
    if (goals.hotwheels.collectionTarget > 0) {
        const collectionProgress = (hotwheels.length / goals.hotwheels.collectionTarget) * 100;
        
        if (collectionProgress >= 100) {
            showToast(`🚗 Parabéns! Você atingiu sua meta de coleção!`, 'success');
        } else if (collectionProgress >= 75) {
            showToast(`🏁 Você está a ${Math.round(100 - collectionProgress)}% da sua meta de coleção!`, 'info');
        }
    }
}

// Sistema de análise de tendências
function analyzeTrends() {
    const trends = {
        finance: analyzeFinanceTrends(),
        games: analyzeGameTrends(),
        hotwheels: analyzeHotWheelsTrends()
    };
    
    return trends;
}

// Análise de tendências financeiras
function analyzeFinanceTrends() {
    const transactions = JSON.parse(localStorage.getItem('finance_transactions') || '[]');
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    
    const currentMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
    });
    
    const lastMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear();
    });
    
    const currentExpenses = currentMonthTransactions
        .filter(t => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthExpenses = lastMonthTransactions
        .filter(t => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseChange = lastMonthExpenses > 0 ? ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
    
    return {
        expenseChange: Math.round(expenseChange),
        currentExpenses,
        lastMonthExpenses,
        trend: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'stable'
    };
}

// Análise de tendências de jogos
function analyzeGameTrends() {
    const games = JSON.parse(localStorage.getItem('game_library') || '[]');
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    
    const currentMonthGames = games.filter(g => {
        const gDate = new Date(g.dateAdded);
        return gDate.getMonth() === currentDate.getMonth() && gDate.getFullYear() === currentDate.getFullYear();
    });
    
    const lastMonthGames = games.filter(g => {
        const gDate = new Date(g.dateAdded);
        return gDate.getMonth() === lastMonth.getMonth() && gDate.getFullYear() === lastMonth.getFullYear();
    });
    
    const gameGrowth = lastMonthGames.length > 0 ? ((currentMonthGames.length - lastMonthGames.length) / lastMonthGames.length) * 100 : 0;
    
    return {
        gameGrowth: Math.round(gameGrowth),
        currentMonthGames: currentMonthGames.length,
        lastMonthGames: lastMonthGames.length,
        trend: gameGrowth > 0 ? 'up' : gameGrowth < 0 ? 'down' : 'stable'
    };
}

// Análise de tendências de Hot Wheels
function analyzeHotWheelsTrends() {
    const hotwheels = JSON.parse(localStorage.getItem('hotwheels_collection') || '[]');
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    
    const currentMonthCars = hotwheels.filter(h => {
        const hDate = new Date(h.dateAdded);
        return hDate.getMonth() === currentDate.getMonth() && hDate.getFullYear() === currentDate.getFullYear();
    });
    
    const lastMonthCars = hotwheels.filter(h => {
        const hDate = new Date(h.dateAdded);
        return hDate.getMonth() === lastMonth.getMonth() && hDate.getFullYear() === lastMonth.getFullYear();
    });
    
    const carGrowth = lastMonthCars.length > 0 ? ((currentMonthCars.length - lastMonthCars.length) / lastMonthCars.length) * 100 : 0;
    
    return {
        carGrowth: Math.round(carGrowth),
        currentMonthCars: currentMonthCars.length,
        lastMonthCars: lastMonthCars.length,
        trend: carGrowth > 0 ? 'up' : carGrowth < 0 ? 'down' : 'stable'
    };
}

// Sistema de lembretes inteligentes
function setupSmartReminders() {
    // Lembrete de backup semanal
    const lastBackup = localStorage.getItem('last_backup_reminder');
    const now = new Date().getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > oneWeek) {
        showToast('💾 Lembrete: Faça backup dos seus dados para mantê-los seguros!', 'info');
        localStorage.setItem('last_backup_reminder', now.toString());
    }
    
    // Lembrete de metas mensais
    const lastGoalReminder = localStorage.getItem('last_goal_reminder');
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    
    if (!lastGoalReminder || (now - parseInt(lastGoalReminder)) > oneMonth) {
        showToast('🎯 Dica: Defina metas para manter o foco nos seus objetivos!', 'info');
        localStorage.setItem('last_goal_reminder', now.toString());
    }
}

// Inicializar funcionalidades avançadas
document.addEventListener('DOMContentLoaded', () => {
    // Configurar notificações inteligentes
    setupSmartNotifications();
    
    // Configurar lembretes
    setupSmartReminders();
    
    // Verificar tendências a cada 5 minutos
    setInterval(() => {
        const trends = analyzeTrends();
        console.log('Tendências analisadas:', trends);
    }, 5 * 60 * 1000);
});
