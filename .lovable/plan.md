
Objetivo: validar o dashboard ponta a ponta e corrigir divergências para ficar idêntico ao preview.

Diagnóstico rápido (com base no código + logs + screenshot OCR):
- Ainda existe fallback proibido “Confeiteira” em:
  - `src/pages/Dashboard.tsx` (saudação principal)
  - `src/components/layout/AppLayout.tsx` (header)
- `index.html` está com `lang="en"` (favorece tradução automática).
- Logs mostram warning de `ref` envolvendo `FinanceDialog`/`DialogContent`, que pode afetar renderização do botão “Adicionar Saída”.
- OCR da captura confirma divergências: “Resumo do mês”, “LANCAMENTOS” e botão de saída inconsistente.

Plano de execução (na próxima etapa de implementação):
1) Travar textos críticos da dashboard
- Garantir:
  - “📊 Resumo Financeiro do Mês”
  - “ENTRADAS | SAÍDAS | LUCRO”
  - Botões: “Adicionar Entrada”, “Adicionar Saída”, “Calculadora de Compras”, “Nova Encomenda”.

2) Corrigir saudação do nome da usuária
- Dashboard: usar `profile.name` quando existir.
- Fallback obrigatório: `Oi! 👋` (nunca “Confeiteira”).
- Aplicar o mesmo padrão no header do `AppLayout`.

3) Bloquear tradução automática do navegador
- Atualizar `index.html` para `lang="pt-BR"` e adicionar atributo anti-tradução (`translate="no"` no documento/app root).

4) Corrigir o bug visual do botão “Adicionar Saída”
- Revisar cadeia `Dashboard -> FinanceDialog -> Dialog/CurrencyInput`.
- Eliminar warning de `ref` no modal (ajuste de componentes que recebem `ref` no fluxo do Dialog).
- Validar ícone `ArrowDownRight` + texto visível no botão vermelho.

5) Teste completo do dashboard (funcional + visual)
- CTA “VAMOS PRECIFICAR HOJE?” navega para `/pricing`.
- Abrir modal de Entrada e Saída, preencher e salvar (criando dados de teste).
- Confirmar atualização de cards e “Atividades recentes”.
- Verificar calendário (mudar mês, abrir detalhe por data com pedido).
- Verificar alerta de estoque baixo e navegação para insumos.
- Validar desktop + mobile e ausência de warnings no console.
- Comparar preview e publicado para garantir paridade visual/textual.

Critérios de aceite
- Nenhum “Confeiteira” na interface.
- Sem “Lançamentos/LANCAMENTOS” no card principal.
- Botão “Adicionar Saída” com ícone + texto, estilo vermelho intacto.
- Dashboard igual ao preview (textos, cores, ícones, estrutura).
- Sem warning de `ref` relacionado ao FinanceDialog/Dialog.

Detalhes técnicos (arquivos previstos)
- `src/pages/Dashboard.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/dashboard/FinanceDialog.tsx`
- `src/components/ui/dialog.tsx` (se necessário para correção do warning)
- `index.html`
