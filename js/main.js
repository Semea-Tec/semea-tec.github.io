/**
 * SEMEA-TEC — Bilingual Markdown Content Loader
 *
 * Features:
 *  - Portuguese (pt) and English (en) support
 *  - Language saved to localStorage, persisted across sessions
 *  - URL hash-based routing: #pt/projeto, #en/cerca-javali, etc.
 *  - Falls back to browser language detection
 */

(function () {
  'use strict';

  var contentEl = document.getElementById('content');
  var navLinks = document.querySelectorAll('.nav-link[data-page]');
  var langBtns = document.querySelectorAll('.lang-btn');

  // ---- i18n translations for UI strings ----
  var i18n = {
    pt: {
      'title': 'SEMEA-TEC — Semeando Soluções Tecnológicas na Agricultura Familiar',
      'loading': 'Carregando...',
      'error-title': 'Ops! Conteudo nao encontrado',
      'error-text': 'Nao foi possivel carregar a pagina solicitada.',
      'error-back': 'Voltar para o projeto',
      'nav-projeto': 'Projeto',
      'nav-cerca': 'Cerca do Javali',
      'nav-estufa': 'Estufa de Cogumelos',
      'nav-quemsomos': 'Quem Somos',
      'footer-tagline': 'Projeto de extensao da',
      'footer-partners': 'Parcerias: Portal Sem Porteiras · Akarui · Apoena',
      'page-projeto': 'SEMEA-TEC — Projeto',
      'page-cerca': 'Cerca do Javali',
      'page-estufa': 'Estufa de Cogumelos',
      'page-quemsomos': 'Quem Somos'
    },
    en: {
      'title': 'SEMEA-TEC — Sowing Technological Solutions in Family Farming',
      'loading': 'Loading...',
      'error-title': 'Oops! Content not found',
      'error-text': 'Could not load the requested page.',
      'error-back': 'Back to project page',
      'nav-projeto': 'Project',
      'nav-cerca': 'Wild Boar Fence',
      'nav-estufa': 'Mushroom Greenhouse',
      'nav-quemsomos': 'Who We Are',
      'footer-tagline': 'An outreach project by',
      'footer-partners': 'Partners: Portal Sem Porteiras · Akarui · Apoena',
      'page-projeto': 'SEMEA-TEC — Project',
      'page-cerca': 'Wild Boar Fence',
      'page-estufa': 'Mushroom Greenhouse',
      'page-quemsomos': 'Who We Are'
    }
  };

  // ---- State ----
  var currentLang = 'pt';
  var currentPage = 'projeto';

  // ---- Language helpers ----

  function setLang(newLang) {
    currentLang = newLang;
    localStorage.setItem('semea-lang', newLang);
    document.documentElement.lang = newLang === 'pt' ? 'pt-BR' : 'en';

    // Update lang buttons
    langBtns.forEach(function (btn) {
      if (btn.getAttribute('data-lang') === newLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Translate UI strings on the page
    translateUI();
  }

  function translateUI() {
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var translation = i18n[currentLang][key];
      if (translation) {
        // Only replace raw text nodes, keep HTML structure when there are children
        if (el.children.length === 0) {
          el.textContent = translation;
        } else {
          // Walk child text nodes for elements like <p> with mixed content
          walkTextNodes(el, function (node) {
            node.textContent = translation;
            return true; // stop after first match
          });
        }
      }
    });

    // Update <title>
    document.title = i18n[currentLang]['title'];

    // Update meta description
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = currentLang === 'pt'
        ? 'Projeto de extensao da UNIFESP que desenvolve tecnologias sociais de baixo custo com comunicacao LoRa e sensoriamento para a agricultura familiar.'
        : 'UNIFESP outreach project developing low-cost social technologies with LoRa communication and sensing for family farming.';
    }
  }

  function walkTextNodes(el, callback) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() !== '') {
        if (callback(node)) break;
      }
    }
  }

  // ---- Navigation ----

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
   * Load and render a markdown file for the given language and page slug.
   */
  function loadPage(slug, lang) {
    lang = lang || currentLang;
    currentPage = slug;

    contentEl.innerHTML = '<div class="loading">' + i18n[lang]['loading'] + '</div>';
    setActiveLink(slug);

    var url = 'conteudo/' + lang + '/' + slug + '.md';

    fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error(i18n[lang]['error-text'] + ' (HTTP ' + response.status + ')');
        }
        return response.text();
      })
      .then(function (markdown) {
        marked.setOptions({ gfm: true, breaks: false });
        contentEl.innerHTML = marked.parse(markdown);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (error) {
        contentEl.innerHTML =
          '<div class="error-block">' +
          '<h2>' + i18n[lang]['error-title'] + '</h2>' +
          '<p>' + error.message + '</p>' +
          '<p><a href="#" data-page="projeto" data-fallback="true">' + i18n[lang]['error-back'] + '</a></p>' +
          '</div>';

        var fallback = contentEl.querySelector('a[data-fallback]');
        if (fallback) {
          fallback.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('projeto', lang);
          });
        }
      });
  }

  /**
   * Navigate to a page in a given language, updating URL hash.
   */
  function navigateTo(slug, lang) {
    lang = lang || currentLang;
    loadPage(slug, lang);
    history.pushState({ page: slug, lang: lang }, '', '#' + lang + '/' + slug);
  }

  // ---- URL routing (hash-based) ----

  function parseHash() {
    var hash = window.location.hash.replace('#', '');
    // Expected format: "pt/projeto" or "en/cerca-javali"
    var parts = hash.split('/');
    var lang = null;
    var page = null;

    if (parts.length >= 2 && (parts[0] === 'pt' || parts[0] === 'en')) {
      lang = parts[0];
      page = parts[1];
    } else if (parts.length === 1 && (parts[0] === 'pt' || parts[0] === 'en')) {
      // Just a language, default to project page
      lang = parts[0];
      page = 'projeto';
    }

    // Validate page slug
    var validPages = ['projeto', 'cerca-javali', 'estufa-cogumelos', 'quem-somos'];
    if (!page || validPages.indexOf(page) === -1) {
      page = 'projeto';
    }

    return { lang: lang, page: page };
  }

  function getPageTitle(slug, lang) {
    var key = 'page-' + slug;
    return i18n[lang][key] || 'SEMEA-TEC';
  }

  // ---- Language persistence ----

  function detectLanguage() {
    // 1. localStorage
    var saved = localStorage.getItem('semea-lang');
    if (saved === 'pt' || saved === 'en') return saved;

    // 2. Browser preference
    var browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('en')) return 'en';

    // 3. Default
    return 'pt';
  }

  // ---- Event bindings ----

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var page = this.getAttribute('data-page');
      navigateTo(page, currentLang);
    });
  });

  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = this.getAttribute('data-lang');
      if (lang !== currentLang) {
        setLang(lang);
        navigateTo(currentPage, lang);
      }
    });
  });

  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.page && e.state.lang) {
      setLang(e.state.lang);
      loadPage(e.state.page, e.state.lang);
    } else {
      var parsed = parseHash();
      setLang(parsed.lang);
      loadPage(parsed.page, parsed.lang);
    }
  });

  // ---- Initialize ----

  var parsed = parseHash();
  var initialLang = parsed.lang || detectLanguage();
  var initialPage = parsed.page;

  setLang(initialLang);
  loadPage(initialPage, initialLang);

  // Ensure hash reflects current state
  var expectedHash = '#' + initialLang + '/' + initialPage;
  if (window.location.hash !== expectedHash) {
    history.replaceState(
      { page: initialPage, lang: initialLang },
      '',
      expectedHash
    );
  }

})();
