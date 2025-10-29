// =================================================================================
// Organização Pessoal - backup.js
// Versão: 1.0 - Sistema de Backup Global
// =================================================================================

// Sistema de backup global para todos os módulos
const BACKUP_KEYS = {
    FINANCE: 'finance_transactions',
    FINANCE_BUDGETS: 'finance_budgets',
    GAMES: 'game_library',
    HOTWHEELS: 'hotwheels_collection',
    SETTINGS: 'app_settings'
};

// Função para criar backup completo
function createFullBackup() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                finances: {
                    transactions: JSON.parse(localStorage.getItem(BACKUP_KEYS.FINANCE) || '[]'),
                    budgets: JSON.parse(localStorage.getItem(BACKUP_KEYS.FINANCE_BUDGETS) || '{}')
                },
                games: JSON.parse(localStorage.getItem(BACKUP_KEYS.GAMES) || '[]'),
                hotwheels: JSON.parse(localStorage.getItem(BACKUP_KEYS.HOTWHEELS) || '[]'),
                settings: JSON.parse(localStorage.getItem(BACKUP_KEYS.SETTINGS) || '{}')
            }
        };

        // Criar arquivo de backup
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `backup_painel_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Backup criado com sucesso!', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showToast('Erro ao criar backup. Tente novamente.', 'danger');
        return false;
    }
}

// Função para restaurar backup
function restoreBackup(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validar estrutura do backup
            if (!backup.data || !backup.timestamp) {
                throw new Error('Arquivo de backup inválido');
            }

            // Restaurar dados
            if (backup.data.finances) {
                if (backup.data.finances.transactions) {
                    localStorage.setItem(BACKUP_KEYS.FINANCE, JSON.stringify(backup.data.finances.transactions));
                }
                if (backup.data.finances.budgets) {
                    localStorage.setItem(BACKUP_KEYS.FINANCE_BUDGETS, JSON.stringify(backup.data.finances.budgets));
                }
            }
            
            if (backup.data.games) {
                localStorage.setItem(BACKUP_KEYS.GAMES, JSON.stringify(backup.data.games));
            }
            
            if (backup.data.hotwheels) {
                localStorage.setItem(BACKUP_KEYS.HOTWHEELS, JSON.stringify(backup.data.hotwheels));
            }
            
            if (backup.data.settings) {
                localStorage.setItem(BACKUP_KEYS.SETTINGS, JSON.stringify(backup.data.settings));
            }

            showToast('Backup restaurado com sucesso! Recarregue a página.', 'success');
            
            // Recarregar página após 2 segundos
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            showToast('Erro ao restaurar backup. Arquivo inválido.', 'danger');
        }
    };
    
    reader.readAsText(file);
}

// Função para limpar todos os dados
function clearAllData() {
    if (confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados permanentemente!\n\nTem certeza que deseja continuar?')) {
        if (confirm('Esta ação é IRREVERSÍVEL! Clique OK apenas se tem certeza absoluta.')) {
            try {
                // Limpar todos os dados
                Object.values(BACKUP_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
                
                showToast('Todos os dados foram apagados. A página será recarregada.', 'warning');
                
                // Recarregar página após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Erro ao limpar dados:', error);
                showToast('Erro ao limpar dados.', 'danger');
            }
        }
    }
}

// Função para obter estatísticas do backup
function getBackupStats() {
    const stats = {
        finances: {
            transactions: JSON.parse(localStorage.getItem(BACKUP_KEYS.FINANCE) || '[]').length,
            budgets: Object.keys(JSON.parse(localStorage.getItem(BACKUP_KEYS.FINANCE_BUDGETS) || '{}')).length
        },
        games: JSON.parse(localStorage.getItem(BACKUP_KEYS.GAMES) || '[]').length,
        hotwheels: JSON.parse(localStorage.getItem(BACKUP_KEYS.HOTWHEELS) || '[]').length,
        totalSize: 0
    };
    
    // Calcular tamanho aproximado
    Object.values(BACKUP_KEYS).forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            stats.totalSize += data.length;
        }
    });
    
    return stats;
}

// Função para backup automático (executa a cada 30 minutos)
function setupAutoBackup() {
    setInterval(() => {
        const lastBackup = localStorage.getItem('last_auto_backup');
        const now = new Date().getTime();
        
        // Se passou mais de 30 minutos desde o último backup
        if (!lastBackup || (now - parseInt(lastBackup)) > 30 * 60 * 1000) {
            createFullBackup();
            localStorage.setItem('last_auto_backup', now.toString());
        }
    }, 5 * 60 * 1000); // Verifica a cada 5 minutos
}

// Inicializar backup automático quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setupAutoBackup();
});
