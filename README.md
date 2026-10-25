<div align="center">
  <h1>🖼️ Image Gallery</h1>
  <p><strong>Uma galeria experimental de imagens com interface web e rotina PHP de recebimento.</strong></p>
  <p><img alt="HTML5" src="https://img.shields.io/badge/HTML5-Interface-E34F26?logo=html5&logoColor=white"> <img alt="PHP" src="https://img.shields.io/badge/PHP-Servidor-777BB4?logo=php&logoColor=white"> <img alt="Status" src="https://img.shields.io/badge/status-projeto%20de%20estudo-64748b"></p>
</div>

## Sobre

Este repositório reúne uma **interface de galeria** feita com HTML, CSS e JavaScript e uma rotina PHP separada para operações de envio/recebimento. É uma experiência antiga de frontend e integração com servidor, não um serviço de hospedagem de imagens pronto para uso público.

## Conteúdo

| Arquivo | Finalidade |
| --- | --- |
| `index.html` | Página da galeria |
| `enviado.html` | Página auxiliar do fluxo de envio |
| `js/script.js` | Comportamentos da interface |
| `css/` | Apresentação visual |
| `img/` | Imagens de demonstração |
| `save.php` | Operação PHP relacionada a arquivos |

## Executar no computador

Requer PHP para testar também o endpoint de servidor:

```bash
git clone https://github.com/HelioConde/Image_Gallery.git
cd Image_Gallery
php -S 127.0.0.1:8000
```

Acesse `http://127.0.0.1:8000`. Para testar apenas a apresentação HTML, basta um servidor estático.

## Segurança antes de publicar

**Não exponha `save.php` na internet sem auditoria.** Em fluxos de upload é essencial verificar tipos MIME, extensão real, tamanho, caminho de destino e nomes dos arquivos; também é preciso impedir execução dos conteúdos enviados, limitar requisições e controlar acesso.

Nenhuma dessas proteções foi validada nesta revisão de README. Use **somente imagens fictícias** durante os testes.

## Evoluções sugeridas

Melhorar visualização responsiva, estados de erro, acessibilidade da galeria e documentação dos formatos aceitos. Adicionar testes do fluxo de envio antes de considerar disponibilização pública.

Criado por [Hélio Conde](https://github.com/HelioConde).
