

# Doce Preço Fácil — Correções e Melhorias Completas

## Resumo
Redesign visual completo do app com design mais moderno, vibrante e intuitivo, além de correções funcionais em todas as abas. A paleta rosa/dourado será mantida mas com mais contraste e elementos visuais 3D.

---

## 1. Design System Global
- Atualizar CSS com cores mais vibrantes, sombras 3D em botões, gradientes mais expressivos
- Botões com estilo "raised/3D" (box-shadow com profundidade)
- Cards com hover effects e sombras mais pronunciadas
- Tipografia com mais hierarquia visual

## 2. Tela de Login/Cadastro
- Logo maior (w-32 h-32 ao invés de w-24 h-24)
- Botão de mostrar/ocultar senha (ícone Eye/EyeOff) em todos os campos de senha
- Background com gradiente mais vivo

## 3. Aba PLANOS
- Cards com gradientes coloridos por plano (prata=cinza elegante, ouro=dourado, diamante=rosa)
- Ícones mais elaborados (Shield, Gem, Crown)
- Badges com efeito brilho
- Botões com efeito 3D

## 4. Aba INFORMAÇÕES (BusinessInfo)
- Topo: upload de logo da loja
- Textos explicativos e amigáveis falando diretamente com a pessoa
- Seção "Descubra o valor da sua hora" com campos vazios e labels explicativas
- Custos fixos: fluxo de adicionar um por vez (nome + valor + botão Adicionar), lista com editar/excluir, total no final
- Custos variáveis: mesmo fluxo dos fixos, com total

## 5. Cardápio Digital
- Layout estilo iFood: capa, logo, horário, categorias com produtos
- Produtos com imagem, nome, preço, descrição
- Toggle visível/oculto
- Botão compartilhar via WhatsApp e link

## 6. Calculadora de Compras
- Adicionar botões Copiar e Editar nos itens
- Total com botão 3D chamativo

## 7. Finanças (Entradas e Saídas)
- Design mais moderno nos cards e seletores
- Formas de pagamento em estilo 3D (Pix, Cartão débito, Cartão crédito)
- Gráfico de categorias (recharts PieChart)
- Indicador positivo/negativo
- Títulos mais pessoais

## 8. Insumos e Embalagens
- Ingredientes: remover campo categoria, unidades fixas (g, ml, kg, l)
- Embalagens: remover campo categoria, unidades fixas (unidade, pacote, caixa fechada)

## 9. Precificação (Wizard completo)
- Step 1: adicionar imagem, categorias fixas (Massa, Recheio, Bolo, Fatias, Cupcakes, Salgados, Doces), tipo de venda (Unidade, Fatias, Porções, Kg), nada pré-preenchido
- Step 2: puxar ingredientes/embalagens do estoque automaticamente, editar/excluir cada item
- Step 3: buscar valor/hora do perfil automaticamente, custos fixos sugeridos com ajuste %, dicas explicativas
- Step 4: margem de lucro com sugestão editável, lucro em verde, taxas opcionais (iFood %, delivery, maquininha %)
- Step 5: preço final destacado, gráfico composição (PieChart), dica de divisão financeira, resumo completo, botão Salvar

## 10. Clientes
- Clientes já serão referenciados na criação de encomendas (select dropdown)

## 11. Encomendas
- Títulos com primeira letra maiúscula
- Design mais moderno e colorido
- Formas de pagamento: Pix, Cartão crédito, Cartão débito
- Taxas opcionais: maquininha, decoração, embalagem, topo de bolo, outros
- "Outros" com editar/duplicar/excluir
- Enviar por WhatsApp e link
- Puxar clientes automaticamente

## 12. Produtos
- Exibir custo, lucro e preço final
- Opções: editar, copiar, excluir

---

## Escopo de Implementação

Dado o volume de mudanças, sugiro implementar em **3 fases**:

**Fase 1** — Design system + Login + Planos + Informações (custos fixos/variáveis dinâmicos)
**Fase 2** — Precificação completa + Produtos + Insumos
**Fase 3** — Encomendas + Finanças + Calculadora + Cardápio Digital

Cada fase será uma mensagem separada para manter qualidade e evitar erros.

