<div align="center">
<h1>🖼️ Image Gallery</h1>
<p><strong>Galeria de fotografias responsiva para explorar, selecionar, favoritar e compartilhar.</strong></p>
<p><img src="https://img.shields.io/badge/HTML5-frontend-E34F26?logo=html5" alt="HTML5"> <img src="https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript" alt="JavaScript"> <img src="https://img.shields.io/badge/PHP-registro%20privado-777BB4?logo=php" alt="PHP"> <img src="https://img.shields.io/badge/QA-Playwright-45ba4b" alt="QA Playwright"></p>
</div>

## O projeto
Modernização de uma antiga galeria: **explorar imagens, selecionar várias e registrar escolhas pelo nome**. Preserva as nove imagens originais, com CSS moderno e JavaScript modular. **Não permite upload** nem hospeda fotos de terceiros.

## Ajustes de experiência
No GitHub Pages, o aviso de operação local fica **no rodapé, depois do formulário**, sem ocupar o topo da galeria. A busca mostra a quantidade de resultados e o formulário confirma quantas fotografias estão prontas para exportar. Os links compartilhados incluem apenas os IDs das fotografias, não parâmetros de campanhas.

## Funcionalidades
A barra de seleção fica abaixo da grade, aparece apenas quando houver fotos selecionadas e não cobre as imagens nem o rodapé. A grade usa cinco colunas em telas largas, preservando as imagens originais.

- Grade responsiva, busca e filtros (todas, selecionadas e favoritas).
- Seleção múltipla, selecionar visíveis e limpar seleção.
- Visualizador ampliado acessível, teclado Escape e setas; botões no celular.
- Persistência local de seleção e favoritos, sem armazenar o nome.
- Compartilhamento de link com IDs e download CSV.
- Registro PHP com nome e IDs validados, apenas se servidor for configurado.
- Demonstração estática GitHub Pages e testes automatizados.

## Executar sem backend (GitHub Pages ou servidor estático)
    git clone https://github.com/HelioConde/Image_Gallery.git
    cd Image_Gallery
    python3 -m http.server 4173

Acesse http://localhost:4173/?demo=1. O GitHub Pages ativa o modo estático automaticamente. Seleção, favoritos, filtros e compartilhamento funcionam. Ao concluir com seu nome, o navegador **baixa um CSV com a seleção**, sem servidor e sem banco de dados. GitHub Pages não executa PHP.

## Backend PHP — instalação segura
PHP 8.1+ e diretório privado pré-criado e gravável, **fora do document root**:

    mkdir -p /tmp/gallery-private
    GALLERY_STORAGE_DIR=/tmp/gallery-private php -S 127.0.0.1:8000

Acesse http://127.0.0.1:8000. O backend aceita apenas POST do mesmo site, IDs cadastrados no catálogo e nomes válidos. Os registros JSON recebem nomes aleatórios e nunca são criados na pasta pública. Sem configuração, a API devolve HTTP 503 e não grava arquivos.

**Produção:** HTTPS, storage persistente, permissões mínimas, rate limiting no proxy, política de retenção e exclusão de dados. Não há controle de contas, nem painel administrativo autenticado. Não exponha seleções reais publicamente.

## Catálogo
O arquivo images.json contém IDs, título, caminho local e descrição de cada foto. Tanto o backend quanto o frontend usam esse manifesto. Os caminhos aceitos no navegador seguem o padrão img/N.jpg.

## Testes
Requer Node.js 20+ e PHP 8.1+:

    npm install
    npm run test:static
    npm run test:php
    npx playwright install chromium
    npm run test:e2e
    npm run test:visual
    npm run qa:report

A integração contínua executa testes funcionais, 26 capturas em 10 resoluções e auditoria de erros JavaScript, rede e layout. A publicação só ocorre após os testes passarem e é auditada novamente no endereço público. Consulte [Auditoria visual](docs/VISUAL_AUDIT.md) para relatórios e instruções.

## Estrutura
| Caminho | Descrição |
| --- | --- |
| index.html | Página principal |
| images.json | Catálogo compartilhado |
| js/script.js | Galeria, filtros, seleção e envio |
| css/style.css | Tokens e interface |
| save.php | Registro privado de seleções |
| enviado.html | Compatibilidade de links antigos |
| docs/DESIGN_SYSTEM.md | Design system |
| tests/ | Testes automatizados e auditoria visual |
| docs/VISUAL_AUDIT.md | Capturas de tela, erros e publicação |
| .github/workflows/quality.yml | CI |

## Privacidade e roadmap
O nome só é enviado quando a pessoa submete o formulário em um PHP configurado. O armazenamento local tem apenas IDs. Os registros PHP incluem nome, IDs, data e protocolo. Futuros aprimoramentos opcionais: miniaturas WebP dedicadas para catálogos grandes, autorização multiusuário, painel administrativo autenticado e PDF. **Essas opções não estão implementadas**.

Criado por [Hélio Conde](https://github.com/HelioConde). Consulte [o guia de design](docs/DESIGN_SYSTEM.md).
