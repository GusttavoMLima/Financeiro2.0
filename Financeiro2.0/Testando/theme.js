// =================================================================================
// Organização Pessoal - theme.js
// Versão: 1.0 - Lógica do Modo Escuro
// =================================================================================

(() => {
    'use strict'

    // Função para obter o tema guardado no LocalStorage ou a preferência do sistema
    const getStoredTheme = () => localStorage.getItem('theme')
    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }
        // Se não houver nada guardado, usa a preferência do sistema operativo do utilizador
            // Se não houver nada guardado, usa 'light' por padrão (evita forçar dark automaticamente)
            return 'light'
    }

    // Função para aplicar o tema ao site
    const setTheme = theme => {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark')
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    // Aplica o tema assim que a página carrega
    setTheme(getPreferredTheme())

    // Fica à "escuta" de quando o utilizador muda a preferência no sistema operativo
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getStoredTheme() !== 'light' && getStoredTheme() !== 'dark') {
            setTheme(getPreferredTheme())
        }
    })

    // Adiciona a funcionalidade aos botões de troca de tema
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const theme = toggle.getAttribute('data-bs-theme-value')
                localStorage.setItem('theme', theme) // Guarda a escolha do utilizador
                setTheme(theme)
            })
        })
    })
})()