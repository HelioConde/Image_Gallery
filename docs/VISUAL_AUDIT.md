# Auditoria visual automática e GitHub Pages

A galeria é testada automaticamente no GitHub Actions, sem necessidade de comandos manuais a cada melhoria.

## O que é fotografado

O Playwright captura a página inteira de **Início** e a página de compatibilidade **enviado.html** nestas resoluções:

| Perfil | Resolução |
| --- | --- |
| Celular compacto | 320×720 |
| Celular | 375×812 |
| Celular atual | 390×844 |
| Tablet | 768×1024 |
| Tablet horizontal | 1024×768 |
| Notebook | 1280×800 |
| Browser real do usuário | 1366×650 |
| Desktop | 1440×900 |
| Desktop panorâmico | 1600×900 |
| Full HD | 1920×1080 |

Nos perfis 390, 1366 e 1440 o relatório também fotografa a galeria com seleção ativa e com o visualizador aberto. São **26 capturas por auditoria** e 20 verificações de páginas. Inclui também checagem de que o resumo de seleção não se sobrepõe às fotografias em 390, 1366 e 1440 px.

## O que gera erro no pipeline
- **JavaScript:** exceções de página e mensagens `console.error`.
- **Rede:** requisições que falham e respostas HTTP 4xx/5xx dos recursos do mesmo site.
- **Imagens:** fotografias quebradas, incompletas ou não carregadas.
- **Layout:** página com rolagem horizontal inesperada, contêineres fora da área visível, texto cortado em ações ou modal fora da tela.
- **Fluxos:** os testes funcionais adicionais incluem seleção, filtros, favoritos, modal, teclado, redução de movimento e conclusão local com download CSV.

O relatório fornece `summary.json`, `SUMMARY.md`, índice `index.html`, JSON por página e PNGs em `test-results/visual-audit/`. O GitHub Actions também produz o relatório HTML do Playwright e traces dos testes que falharem.

## Quando é executado
- Em push para `main` e branches `feat/**`.
- Em cada pull request.
- Semanalmente, às segundas-feiras (10:00 UTC).
- Manualmente, por **Actions → Quality and visual audit → Run workflow**.
- Antes de publicar no GitHub Pages.
- Após publicar, diretamente na URL pública, para detectar falhas de hospedagem ou caminhos de arquivos.

Abra **Actions → execução → Artifacts** e baixe `image-gallery-quality`, `image-gallery-pages-qa` ou `image-gallery-live-site-qa`. Abra o arquivo `test-results/visual-audit/index.html` para percorrer as capturas sem procurar cada PNG individualmente.

## Execução local

    npm install
    npx playwright install chromium
    npm run qa:all

Para fotografar uma página já publicada:

    VISUAL_BASE_URL=https://helioconde.github.io/Image_Gallery/ npm run test:visual
    npm run qa:report

O endereço externo deve apontar para a raiz da **subpasta do projeto** e não para o domínio raiz.

## GitHub Pages
O workflow `.github/workflows/pages.yml` publica apenas `index.html`, `enviado.html`, `images.json`, `css/`, `js/` e `img/`. Ele nunca publica `save.php`, pastas de teste, registros JSON ou dados pessoais.

Para ativar o site, o repositório precisa estar com **Settings → Pages → Build and deployment → Source: GitHub Actions**. Se o Pages não estiver habilitado, essa escolha é uma configuração de proprietário do repositório: apenas editar o workflow não ativa o serviço automaticamente. O deploy é bloqueado se a auditoria local falhar.

Na versão estática, ao clicar **Concluir e baixar seleção**, o navegador baixa um CSV com o nome informado e as fotos selecionadas. Nenhum dado é enviado ao PHP. Para compartilhamento entre navegadores sem download, use o botão de copiar link (apenas IDs de fotos). Não há banco de dados nem persistência multiusuário; isso exigiria backend.

## Interpretação dos resultados
- **0 problemas** no resumo: nenhuma das verificações automatizadas encontrou falhas.
- **Erros JavaScript:** abra a entrada `type: javascript` para a mensagem da exceção.
- **Erro 404:** confira os caminhos relativos e se o artefato de Pages inclui o recurso.
- **horizontal-overflow / out-of-viewport:** compare PNGs em tamanhos próximos (como 320 e 375 pixels).
- **clipped-control-text:** revise texto, flexbox, quebras e larguras mínimas.

A auditoria aponta problemas técnicos mensuráveis, mas **não substitui revisão humana** de hierarquia visual, qualidade das fotografias ou contraste em condições reais.
