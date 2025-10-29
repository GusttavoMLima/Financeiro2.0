// =================================================================================
// Organização Pessoal - utils.js
// Versão: 1.0 - Funções Utilitárias (Ex: Toasts)
// =================================================================================

/**
 * Mostra uma notificação "Toast" do Bootstrap.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de notificação ('success', 'danger', 'warning', 'info').
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    // Mapeia o tipo para as classes de cor e ícone do Bootstrap
    const toastDetails = {
        success: { icon: 'bi-check-circle-fill', color: 'text-bg-success' },
        danger: { icon: 'bi-exclamation-triangle-fill', color: 'text-bg-danger' },
        warning: { icon: 'bi-exclamation-triangle-fill', color: 'text-bg-warning' },
        info: { icon: 'bi-info-circle-fill', color: 'text-bg-info' }
    };

    const details = toastDetails[type] || toastDetails.info;

    // Cria o HTML do Toast dinamicamente
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center ${details.color} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi ${details.icon} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // O toast desaparece após 3 segundos
    });

    // Remove o elemento do HTML depois de desaparecer para não acumular
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
}