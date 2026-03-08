

## Plano: Botões de Adicionar Entrada/Saída direto na Dashboard

### O que muda
Os botões "Entrada" e "Saída" na Dashboard vão abrir um formulário direto na própria página (via Dialog/modal), sem redirecionar para Finanças. Assim fica autoexplicativo e rápido.

### Alterações em `src/pages/Dashboard.tsx`

1. **Renomear botões** para "Adicionar Entrada" e "Adicionar Saída"
2. **Adicionar estado e Dialog** — reutilizar a mesma lógica de salvamento que existe em `Finance.tsx`:
   - Estado para `dialogType` ("income" | "expense" | null), `amount`, `category`, `date`, `paymentMethod`, `clientName`, `notes`, `supplier`, `description`
   - Dialog com formulário de valor, categoria (select com categorias de confeitaria), data, forma de pagamento (para entrada), fornecedor (para saída)
   - Ao salvar, inserir no banco (`financial_income` ou `financial_expense`) e atualizar os dados do resumo do mês
3. **Imports adicionais**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Input`, `Select`, `Button`, `useToast`, ícones de pagamento

### Fluxo do usuário
- Clica "Adicionar Entrada" → abre modal com campos → preenche → salva → toast de confirmação → dados do resumo atualizam
- Mesmo fluxo para "Adicionar Saída"

