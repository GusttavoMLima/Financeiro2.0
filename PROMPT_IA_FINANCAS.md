# PROMPT PARA IA DE DESENVOLVIMENTO WEB
## Sistema de Controle Financeiro Pessoal Completo

Crie um sistema completo de controle financeiro pessoal em HTML, CSS e JavaScript puro (sem frameworks), com as seguintes especificações:

---

## 🎨 DESIGN E INTERFACE

### Estilo Visual
- **Design Moderno e Minimalista**: Interface limpa com efeito glassmorphism (cards com fundo semi-transparente e blur)
- **Tema Escuro/Claro**: Sistema de alternância de temas com persistência no localStorage
- **Responsivo**: Totalmente adaptável para mobile, tablet e desktop usando Bootstrap 5
- **Cores**: 
  - Receitas: Verde (#28a745)
  - Despesas: Vermelho (#dc3545)
  - Cartão: Azul primário
  - Dinheiro: Ciano/Info
- **Tipografia**: Fonte Inter para textos gerais, Orbitron para títulos (Google Fonts)
- **Ícones**: Bootstrap Icons para todos os ícones

### Layout Principal
- **Navbar Superior**: Navegação com seletor de tema
- **Dashboard Diário** (4 cards no topo):
  - Card "Hoje": Receitas e despesas do dia atual
  - Card "Saldo Hoje": Saldo do dia
  - Card "Transações Hoje": Quantidade de transações do dia
  - Card "Mês Atual": Resumo do mês
- **Dashboard Mensal** (2 colunas):
  - Coluna esquerda: Lista de transações com filtros
  - Coluna direita: Resumo financeiro, gráficos e métricas

---

## 📊 FUNCIONALIDADES PRINCIPAIS

### 1. GESTÃO DE TRANSAÇÕES

#### Adicionar Transação
- **Modal** com formulário contendo:
  - Descrição (obrigatório, mínimo 2 caracteres)
  - Valor (obrigatório, número positivo)
  - Data (obrigatório, padrão: data atual)
  - Categoria (dropdown com categorias padrão + personalizadas)
  - Tipo: Receita ou Despesa (botões rápidos + select)
  - **Fonte**: Salário/Cartão ou Vale/Dinheiro (obrigatório, padrão: Cartão)
  - Conta/Carteira (opcional, dropdown)
  - Checkbox para transação recorrente (parcelas)
  - Botões de valores rápidos (R$ 10, 20, 50, 100) - visíveis apenas para despesas
  - Seção de "Categorias Frequentes" (botões clicáveis)
- **Botão Flutuante** (FAB) no canto inferior direito para adicionar transação rapidamente
- **Atalhos de Teclado**:
  - `N`: Abrir modal de nova transação
  - `ESC`: Fechar modal
  - `Ctrl+Enter`: Salvar transação

#### Editar/Excluir Transação
- Botões de editar e excluir em cada transação
- Edição abre modal pré-preenchido
- Exclusão com confirmação
- Restaurar transação excluída (última exclusão)

#### Transações Recorrentes (Parcelas)
- Checkbox "Transação Recorrente"
- Campo para número de parcelas (2 a 120)
- Cria automaticamente múltiplas transações (uma por mês)
- Parcelas são sempre despesas
- Não permite editar parcelas individuais

#### Lista de Transações
- Agrupadas por data (cabeçalhos de data)
- Ordenação: Data (desc/asc), Valor (desc/asc)
- Filtros:
  - Mês e Ano (dropdowns)
  - Busca por texto (descrição, categoria, tipo)
  - Filtro por categoria
  - Pesquisa avançada (painel expansível):
    - Valor mínimo/máximo
    - Data inicial/final
    - Múltiplas categorias
    - Tipo (Receita/Despesa)
- Badges visuais:
  - Tipo: ícone verde (↑) para receita, vermelho (↓) para despesa
  - Fonte: badge azul "💳 Cartão" ou badge ciano "💵 Dinheiro"
- Seleção múltipla com checkboxes
- Ações em massa: excluir selecionadas, aplicar categoria

---

### 2. SEPARAÇÃO SALÁRIO/VALE

#### Controle de Fontes
- Cada transação possui campo "Fonte":
  - **Salário/Cartão**: Para receitas de salário e despesas no cartão
  - **Vale/Dinheiro**: Para receitas de vale e despesas em dinheiro físico

#### Saldos Separados no Dashboard
- **Saldo Cartão**: 
  - Receitas (Cartão) - Despesas (Cartão)
  - Mostra quanto ainda pode gastar no cartão
  - Cor verde se positivo, vermelho se negativo
  - Status: "Disponível no cartão" ou "Limite ultrapassado"
- **Saldo Vale**:
  - Receitas (Dinheiro) - Despesas (Dinheiro)
  - Mostra quanto tem disponível em dinheiro
  - Cor ciano se positivo, vermelho se negativo
  - Status: "Disponível em dinheiro" ou "Saldo negativo"

---

### 3. CATEGORIAS

#### Categorias Padrão
- Alimentação, Moradia, Transporte, Lazer, Saúde, Trabalho, Outros
- Cada categoria tem ícone e cor associados

#### Categorias Personalizadas
- Modal para gerenciar categorias
- Adicionar: Nome, ícone (Bootstrap Icons), cor (color picker)
- Lista de categorias existentes com opção de excluir
- Categorias padrão não podem ser excluídas
- Categorias frequentes aparecem como botões rápidos no formulário

---

### 4. ORÇAMENTOS

#### Configuração de Orçamentos
- Modal com lista de categorias
- Campo de valor para cada categoria
- Orçamento por período (mês/ano)
- Barra de progresso por categoria:
  - Verde: 0-75% usado
  - Amarelo: 75-100% usado
  - Vermelho: 100%+ usado
- Mostra: Total gasto, Orçamento, Restante, Projeção mensal

---

### 5. DASHBOARD E MÉTRICAS

#### Resumo Mensal
- **Receitas**: Total do mês (verde)
- **Despesas**: Total do mês (vermelho) + tendência (comparação com mês anterior)
- **Saldo**: Receitas - Despesas (verde se positivo, vermelho se negativo)
- **Meta de Economia**: 
  - Campo para definir meta mensal
  - Barra de progresso
  - Status: "Meta atingida!" ou "Faltam R$ X"
- **Saúde Financeira**: 
  - Badge com status (Excelente, Bom, Regular, Crítico)
  - Mensagem descritiva baseada em:
    - Razão despesas/receitas
    - Saldo positivo/negativo
    - Consistência de receitas

#### Gráficos
- **Gráfico de Rosca (Doughnut)**: Distribuição de gastos por categoria
- **Gráfico de Linha**: Evolução mensal (receitas vs despesas)
- Usa Chart.js para renderização
- Cores personalizadas baseadas nas categorias

#### Projeções
- Projeção de receitas do mês (baseado em média diária)
- Projeção de despesas do mês
- Saldo projetado

---

### 6. TEMPLATES DE TRANSAÇÕES

#### Funcionalidade
- Criar template a partir de transação atual
- Lista de templates salvos
- Usar template com 1 clique (preenche formulário automaticamente)
- Gerenciar templates (criar, excluir)

---

### 7. MÚLTIPLAS CONTAS/CARTEIRAS

#### Funcionalidade
- Criar múltiplas contas/carteiras
- Selecionar conta ao adicionar transação
- Gerenciar contas (adicionar, excluir)
- Saldo por conta
- Conta principal como padrão

---

### 8. PESQUISA E FILTROS AVANÇADOS

#### Pesquisa Avançada
- Painel expansível com botão "Pesquisa Avançada"
- Filtros:
  - Valor mínimo e máximo
  - Data inicial e final
  - Seleção múltipla de categorias
  - Tipo (Receita/Despesa)
- Botões: Aplicar filtros, Limpar filtros

---

### 9. EXPORTAÇÃO E IMPORTAÇÃO

#### Exportar Dados
- **CSV**: Exportar transações do mês atual
- **JSON**: Exportar todas as transações
- **PDF/HTML**: Relatório formatado com todas as transações do mês

#### Importar Dados
- **CSV**: Importar transações de arquivo CSV
- **JSON**: Importar transações de arquivo JSON
- Validação de dados antes de importar
- Feedback de quantas transações foram importadas

---

### 10. BACKUP E RESTAURAR

#### Backup
- Criar backup completo (transações, orçamentos, categorias, templates, contas)
- Download automático em JSON
- Histórico dos últimos 10 backups

#### Restaurar
- Upload de arquivo JSON de backup
- Confirmação antes de restaurar (substitui dados atuais)
- Restaura todos os dados salvos

---

### 11. NOTIFICAÇÕES E ALERTAS

#### Notificações Inteligentes
- Alerta quando orçamento está em 80% do limite
- Alerta quando orçamento ultrapassa 100%
- Notificação quando meta de economia é atingida
- Alertas de saúde financeira
- Notificações aparecem como toasts (mensagens temporárias)

---

### 12. ANÁLISE DE PADRÕES

#### Funcionalidade
- Identificação de despesas recorrentes
- Sugestões de economia baseadas em categorias
- Análise de gastos mais altos
- Função disponível para análise futura

---

## 💾 PERSISTÊNCIA DE DADOS

### localStorage
Todos os dados são salvos no localStorage do navegador usando as seguintes chaves:
- `finance_transactions`: Lista de transações
- `finance_budgets`: Orçamentos por período
- `finance_custom_categories`: Categorias personalizadas
- `finance_templates`: Templates de transações
- `finance_accounts`: Contas/carteiras
- `finance_savings_goal`: Meta de economia
- `finance_backups`: Histórico de backups
- `finance_notifications`: Notificações

### Estrutura de Dados
```javascript
// Transação
{
  id: string,
  description: string,
  amount: number,
  type: 'Receita' | 'Despesa',
  date: string (YYYY-MM-DD),
  category: string,
  source: 'Cartão' | 'Dinheiro',
  isInstallment: boolean (opcional),
  installmentNumber: number (opcional),
  totalInstallments: number (opcional)
}

// Orçamento
{
  'YYYY-MM': {
    'Categoria': number
  }
}
```

---

## 🛠️ TECNOLOGIAS E BIBLIOTECAS

### CDN e Bibliotecas Externas
- **Bootstrap 5.3.3**: Framework CSS e componentes
- **Bootstrap Icons**: Ícones
- **Chart.js**: Gráficos (doughnut e linha)
- **Google Fonts**: Inter e Orbitron

### JavaScript
- JavaScript puro (ES6+)
- Sem frameworks (Vanilla JS)
- Modularização em arquivos separados:
  - `financas.js`: Lógica principal
  - `financas-advanced.js`: Funcionalidades avançadas
  - `style.css`: Estilos customizados

---

## 📱 RESPONSIVIDADE

### Breakpoints
- Mobile: < 768px (1 coluna, cards empilhados)
- Tablet: 768px - 992px (2 colunas)
- Desktop: > 992px (layout completo)

### Adaptações Mobile
- Modal em tela cheia
- Botões maiores para toque
- Cards compactos
- Navegação simplificada

---

## ⌨️ ATALHOS DE TECLADO

- `N`: Nova transação
- `ESC`: Fechar modal
- `Ctrl+Enter`: Salvar formulário
- `Ctrl+F`: Focar na busca

---

## 🎯 FUNCIONALIDADES ESPECIAIS

### Dashboard Diário
- Cards destacando informações do dia atual
- Atualização automática ao adicionar transações

### Transações de Hoje
- Card dedicado mostrando todas as transações do dia
- Atualização em tempo real

### Valores Rápidos
- Botões para valores comuns (R$ 10, 20, 50, 100)
- Visíveis apenas quando tipo é "Despesa"

### Categorias Frequentes
- Mostra as 5 categorias mais usadas
- Botões clicáveis para preencher rapidamente

### Tendência de Gastos
- Comparação com mês anterior
- Indicador visual (▲ aumento, ▼ redução)

---

## 📋 ESTRUTURA DE ARQUIVOS

```
/
├── financas.html          # Página principal
├── financas.js            # Lógica principal
├── financas-advanced.js   # Funcionalidades avançadas
├── style.css              # Estilos customizados
└── (outros arquivos do projeto)
```

---

## ✅ VALIDAÇÕES E REGRAS

### Validações de Formulário
- Descrição: mínimo 2 caracteres
- Valor: número positivo obrigatório
- Data: obrigatória, não pode ser mais de 1 ano no futuro
- Categoria: obrigatória
- Fonte: obrigatória (Cartão ou Dinheiro)
- Parcelas: entre 2 e 120

### Regras de Negócio
- Parcelas são sempre despesas
- Não é possível editar parcelas individuais
- Transações antigas sem fonte são marcadas como "Cartão" por padrão
- Orçamentos são por período (mês/ano)

---

## 🎨 ELEMENTOS VISUAIS ESPECÍFICOS

### Cards Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}
```

### Cores de Status
- Sucesso/Positivo: Verde (#28a745)
- Perigo/Negativo: Vermelho (#dc3545)
- Info/Cartão: Azul (#0d6efd)
- Dinheiro: Ciano (#0dcaf0)
- Aviso: Amarelo (#ffc107)

---

## 🚀 FUNCIONALIDADES EXTRAS

- Sistema de temas (claro/escuro) com persistência
- Animações suaves em transições
- Feedback visual em todas as ações (toasts)
- Confirmações para ações destrutivas
- Loading states quando necessário
- Mensagens de erro amigáveis

---

## 📝 NOTAS IMPORTANTES

1. **Compatibilidade**: O sistema deve funcionar em navegadores modernos (Chrome, Firefox, Edge, Safari)
2. **Performance**: Otimizado para lidar com centenas de transações
3. **Acessibilidade**: Uso de labels, aria-labels e navegação por teclado
4. **Segurança**: Validação de dados no cliente e sanitização de inputs
5. **UX**: Feedback imediato em todas as ações do usuário

---

## 🎯 RESULTADO ESPERADO

Um sistema completo de controle financeiro pessoal que permite:
- ✅ Adicionar, editar e excluir transações
- ✅ Separar salário (cartão) de vale (dinheiro)
- ✅ Ver saldos separados e quanto pode gastar no cartão
- ✅ Gerenciar categorias personalizadas
- ✅ Configurar orçamentos e acompanhar gastos
- ✅ Visualizar gráficos e análises
- ✅ Usar templates para transações frequentes
- ✅ Fazer backup e restaurar dados
- ✅ Exportar e importar dados
- ✅ Pesquisar e filtrar transações avançadamente
- ✅ Receber notificações inteligentes
- ✅ Interface moderna, responsiva e intuitiva

---

**IMPORTANTE**: O sistema deve ser totalmente funcional, com todas as funcionalidades implementadas e integradas. Use JavaScript puro, sem dependências de build tools ou frameworks complexos. O código deve ser limpo, comentado e bem organizado.




