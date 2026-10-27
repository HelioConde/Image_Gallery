# Image Gallery · Design System

## Objetivo
Interface de seleção de fotografias sem dependências JavaScript em produção, com foco em leitura, performance, acessibilidade e dispositivos móveis.

## Fundamentos
- **Fotografia primeiro:** a grade é o conteúdo principal.
- **Interações separadas:** visualizar, selecionar e favoritar não se confundem.
- **Acessível por padrão:** elementos semânticos, foco visível, teclado e estados anunciados.
- **Mobile de verdade:** grade de duas colunas, formulário em coluna e barra inferior compacta.
- **Segurança:** nenhum upload; nome e IDs validados no backend, registros fora do webroot.

## Tokens CSS
| Categoria | Tokens | Uso |
| --- | --- | --- |
| Superfícies | --bg, --surface, --surface-raised | Fundo e cartões |
| Identidade | --brand, --brand-strong | Destaques e ações |
| Mensagens | --success, --danger | Confirmação e erro |
| Texto | --text, --muted, --subtle | Contraste e hierarquia |
| Espaçamentos | --space-1 a --space-12 | Escala 4–48px |
| Cantos | --radius-sm, --radius, --radius-lg | Consistência |
| Foco | --focus, :focus-visible | Teclado |
| Layout | --max-content: 1260px | Área útil |

## Componentes
**Cabeçalho:** logo clicável, uma linha e baixo peso visual.
**Cartão:** imagem em botão para ampliar; checkbox com label para selecionar; botão com aria-pressed para favorito; borda e texto para indicar seleção (nunca apenas cor).
**Galeria:** CSS Grid fluida, miniaturas 4:3 com object-fit cover sem cortar o arquivo original.
**Modal:** dialog nativo; botão fechar, Escape e setas do teclado; seleção e favorito.
**Formulário:** label, required, autocomplete, erro e sucesso em role=status.
**Barra inferior:** resumo e ações claras; no mobile, 3 ações sem rolagem horizontal.
**Pesquisa/filtros:** controles semânticos com estado aria-pressed.

## Responsividade
- Desktop: grid fluida; área de envio lado a lado; barra de ações centralizada.
- Até 800px: envio em coluna.
- Até 640px: grade 2 colunas, campo de pesquisa largura total, barra de seleção em 2 linhas.
- Validar a partir de 320px sem overflow e com alvos tocáveis de pelo menos 44px.

## Movimento e acessibilidade
- Estado de foco através de :focus-visible.
- Pular para galeria via skip-link.
- Dialog controla armadilha e restauração do foco pelo comportamento nativo.
- prefers-reduced-motion reduz transições e remove scroll suave.
- Toda imagem tem alt; ao trocar o catálogo, trocar também descrições genéricas.
- Revisar contraste e zoom de texto após mudanças.

## Dados e privacidade
Apenas IDs ficam armazenados no localStorage. O nome não é persistido no navegador; só segue ao PHP quando há submissão. Compartilhamento usa IDs em URL. Backend precisa do diretório GALLERY_STORAGE_DIR já existente fora do document root.

## QA
Veja tests e .github/workflows/quality.yml para testes de catálogo, segurança PHP, seleção, filtros, lightbox, redução de movimentos, exportação e responsividade.
