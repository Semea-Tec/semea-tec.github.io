/**
 * SEMEA-TEC — Carregador de conteúdo Markdown
 *
 * Usa a biblioteca marked.js (CDN) para converter .md em HTML.
 * A navegação é feita por links com data-page="nome-do-arquivo".
 * O conteúdo é carregado da pasta /conteudo/nome-do-arquivo.md.
 */

(function () {
  'use strict';

  const contentEl = document.getElementById('content');
  const navLinks = document.querySelectorAll('.nav-link[data-page]');

  // Mapeia slug -> título da página (fallback)
  const pageTitles = {
    'projeto': 'SEMEA-TEC — Projeto',
    'cerca-javali': 'Cerca do Javali',
    'estufa-cogumelos': 'Estufa de Cogumelos'
  };

  /**
   * Atualiza o link ativo na navegação.
   */
  function setActiveLink(slug) {
    navLinks.forEach(function (link) {
      var page = link.getAttribute('data-page');
      if (page === slug) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Atualiza o <title> da página.
   */
  function setPageTitle(slug) {
    var title = pageTitles[slug] || 'SEMEA-TEC';
    document.title = title + ' — Semeando Soluções Tecnológicas na Agricultura Familiar';
  }

  /**
   * Carrega e renderiza um arquivo markdown.
   */
  function loadPage(slug) {
    contentEl.innerHTML = '<div class="loading">Carregando...</div>';
    setActiveLink(slug);
    setPageTitle(slug);

    var url = 'conteudo/' + slug + '.md';

    fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Arquivo não encontrado (HTTP ' + response.status + ')');
        }
        return response.text();
      })
      .then(function (markdown) {
        // Configura marked para abrir links externos em nova aba
        marked.setOptions({
          gfm: true,
          breaks: false
        });

        var html = marked.parse(markdown);
        contentEl.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (error) {
        contentEl.innerHTML =
          '<div class="error-block">' +
          '<h2>Ops! Conteúdo não encontrado</h2>' +
          '<p>Não foi possível carregar a página solicitada.</p>' +
          '<p><small>' + error.message + '</small></p>' +
          '<p><a href="#" data-page="projeto">Voltar para o projeto</a></p>' +
          '</div>';

        // Rebind the fallback link
        var fallback = contentEl.querySelector('a[data-page]');
        if (fallback) {
          fallback.addEventListener('click', function (e) {
            e.preventDefault();
            var p = this.getAttribute('data-page');
            loadPage(p);
            history.pushState({ page: p }, '', '#' + p);
          });
        }
      });
  }

  /**
   * Navegação via clique nos links.
   */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var page = this.getAttribute('data-page');
      loadPage(page);
      history.pushState({ page: page }, '', '#' + page);
    });
  });

  /**
   * Detecta a página a partir do hash da URL ou carrega a padrão.
   */
  function getPageFromHash() {
    var hash = window.location.hash.replace('#', '');
    // Verifica se é um slug válido
    if (hash && pageTitles.hasOwnProperty(hash)) {
      return hash;
    }
    return 'projeto'; // página padrão
  }

  // Carrega a página inicial
  var initialPage = getPageFromHash();
  loadPage(initialPage);
  // Garante que o hash da URL reflita a página carregada
  if (window.location.hash.replace('#', '') !== initialPage) {
    history.replaceState({ page: initialPage }, '', '#' + initialPage);
  }

  // Navegação pelo botão voltar/avançar do navegador
  window.addEventListener('popstate', function (e) {
    var page = (e.state && e.state.page) ? e.state.page : getPageFromHash();
    loadPage(page);
  });

})();
