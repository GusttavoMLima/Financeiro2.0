// =================================================================================
// Organização Pessoal - utils.js
// Versão: 1.0 - Funções Utilitárias (Ex: Toasts)
// =================================================================================

/**
 * Mostra uma notificação "Toast" do Bootstrap.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de notificação ('success', 'danger', 'warning', 'info').
 */
function showToast(message, type = 'info', options) {
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
        <div class="d-flex align-items-center">
            <div class="toast-body flex-grow-1">
                <i class="bi ${details.icon} me-2"></i>
                ${message}
            </div>
            ${options && options.actionText ? `<button type="button" class="btn btn-sm btn-light me-2 toast-action">${options.actionText}</button>` : ''}
            <button type="button" class="btn-close ${details.color.includes('text-bg-') ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement, {
        delay: options && typeof options.delay === 'number' ? options.delay : 3000
    });

    if (options && typeof options.onAction === 'function') {
        const actionBtn = toastElement.querySelector('.toast-action');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                try { options.onAction(); } catch (_) {}
                toast.hide();
            });
        }
    }

    // Remove o elemento do HTML depois de desaparecer para não acumular
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
}