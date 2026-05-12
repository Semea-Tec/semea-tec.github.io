/**
 * SEMEA-TEC — Site shell
 *
 *  - Bilingual content loader (PT / EN) with hash routing
 *  - Theme toggle (light / dark) with system preference fallback
 *  - Mobile drawer menu (hamburger + backdrop + ESC)
 *  - Event delegation for in-content navigation (project cards)
 */
(function () {
  'use strict';

  // ============================================================
  // Splash screen dismissal (first-visit only)
  //
  // The inline script in <head> already set data-splash="show" on
  // <html> if localStorage has no 'semea-splash-seen' flag, which
  // makes the .splash element visible via CSS. Here we schedule its
  // dismissal: wait for the splash logo image to be ready (or a
  // safety timeout), hold for ~1.4s so the user actually sees it,
  // then remove the attribute to trigger the CSS opacity fade.
  // ============================================================
  (function dismissSplash() {
    var html = document.documentElement;
    if (html.getAttribute('data-splash') !== 'show') return;
    var splash = document.getElementById('splash');
    var logo = splash && splash.querySelector('img');

    function hide() {
      try { localStorage.setItem('semea-splash-seen', '1'); } catch (e) {}
      html.removeAttribute('data-splash');
      // Remove from DOM after transition so it doesn't trap focus.
      setTimeout(function () { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 500);
    }

    function ready() {
      // 1.4s gives the eye time to register the wordmark and slogan
      setTimeout(hide, 1400);
    }

    if (logo && logo.complete && logo.naturalWidth > 0) {
      ready();
    } else if (logo) {
      // Fallback safety timer: dismiss after 2.5s even if the image fails
      var safety = setTimeout(ready, 2500);
      logo.addEventListener('load', function () { clearTimeout(safety); ready(); }, { once: true });
      logo.addEventListener('error', function () { clearTimeout(safety); ready(); }, { once: true });
    } else {
      hide();
    }
  })();

  // Disable browser scroll restoration. Otherwise F5 restores the previous
  // scroll position before our content is ready, briefly showing the footer
  // in the viewport because the page is short (just the skeleton).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // ---- DOM refs ----
  var contentEl   = document.getElementById('content');
  var navLinks    = document.querySelectorAll('.nav-link[data-page]');
  var langBtns    = document.querySelectorAll('.lang-btn');
  var langSwitch  = document.querySelector('.lang-switch');
  var themeBtn    = document.getElementById('theme-toggle');
  var menuToggle  = document.getElementById('menu-toggle');
  var navBackdrop = document.querySelector('.nav-backdrop');
  var navPrimary  = document.getElementById('primary-nav');

  // ---- i18n strings ----
  var i18n = {
    pt: {
      'title':           'SEMEA-tec — semeando tecnologia, colhendo autonomia',
      'loading':         'Carregando...',
      'skip':            'Pular para o conteúdo',
      'menu':            'Menu',
      'theme':           'Alternar tema',
      'error-title':     'Conteúdo não encontrado',
      'error-text':      'Não foi possível carregar a página solicitada.',
      'error-back':      'Voltar para o projeto',
      'nav-projeto':     'Projeto',
      'nav-javalarm':    'Javalarm',
      'nav-shitakiometer':'Shitakiometer',
      'nav-quemsomos':   'Quem Somos',
      'footer-tagline':  'Projeto de extensão da',
      'footer-partners': 'Parcerias: Portal Sem Porteiras · Akarui · Apoena',
      'page-projeto':    'SEMEA-tec — Projeto',
      'page-javalarm':   'Javalarm · SEMEA-tec',
      'page-shitakiometer':'Shitakiometer · SEMEA-tec',
      'page-quemsomos':  'Quem Somos · SEMEA-tec',
      'meta-desc':       'Projeto de extensão da UNIFESP que desenvolve tecnologias sociais de baixo custo com comunicação LoRa e sensoriamento para a agricultura familiar.'
    },
    en: {
      'title':           'SEMEA-tec — seeding tech, growing autonomy',
      'loading':         'Loading...',
      'skip':            'Skip to content',
      'menu':            'Menu',
      'theme':           'Toggle theme',
      'error-title':     'Content not found',
      'error-text':      'Could not load the requested page.',
      'error-back':      'Back to project page',
      'nav-projeto':     'Project',
      'nav-javalarm':    'Javalarm',
      'nav-shitakiometer':'Shitakiometer',
      'nav-quemsomos':   'Who We Are',
      'footer-tagline':  'An outreach project by',
      'footer-partners': 'Partners: Portal Sem Porteiras · Akarui · Apoena',
      'page-projeto':    'SEMEA-tec — Project',
      'page-javalarm':   'Javalarm · SEMEA-tec',
      'page-shitakiometer':'Shitakiometer · SEMEA-tec',
      'page-quemsomos':  'Who We Are · SEMEA-tec',
      'meta-desc':       'UNIFESP outreach project developing low-cost social technologies with LoRa communication and sensing for family farming.'
    }
  };

  var VALID_PAGES = ['projeto', 'javalarm', 'shitakiometer', 'quem-somos'];
  var TITLE_KEYS = {
    'projeto':       'page-projeto',
    'javalarm':      'page-javalarm',
    'shitakiometer': 'page-shitakiometer',
    'quem-somos':    'page-quemsomos'
  };

  // ---- State ----
  var currentLang = 'en';
  var currentPage = 'projeto';
  // `rendered*` tracks what's CURRENTLY ON SCREEN, separate from `current*`
  // which tracks what the UI has selected. They diverge briefly when the
  // user picks a new lang or page — the UI updates immediately but the new
  // content is still being fetched. The no-op guard in navigateTo() must
  // compare against renderedPage/renderedLang, otherwise a lang switch is
  // self-cancelled (the UI sets currentLang=en, then navigateTo sees
  // lang===currentLang and short-circuits before loadPage runs).
  var renderedPage = null;
  var renderedLang = null;
  var loadToken = 0;          // monotonic counter; stale fetches ignore writes
  var loadController = null;  // AbortController for the in-flight fetch

  // ---- Helpers ----
  function scrollTopInstant() {
    // The CSS sets `html { scroll-behavior: smooth }` for in-page anchors;
    // here we want a hard jump with no animation.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      var prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = prev;
    }
  }

  // ============================================================
  // Theme
  // ============================================================
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('semea-theme', theme); } catch (e) {}
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // ============================================================
  // Language
  // ============================================================
  function setLang(newLang) {
    currentLang = newLang;
    try { localStorage.setItem('semea-lang', newLang); } catch (e) {}
    document.documentElement.lang = newLang === 'pt' ? 'pt-BR' : 'en';

    langBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === newLang);
    });
    if (langSwitch) langSwitch.setAttribute('data-active', newLang);

    translateUI();
  }

  function translateUI() {
    var dict = i18n[currentLang];

    // Text content via [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!dict[key]) return;
      if (el.children.length === 0) {
        el.textContent = dict[key];
      } else {
        // Replace the first non-empty text node (mixed content like <p>...</p>)
        for (var i = 0; i < el.childNodes.length; i++) {
          var n = el.childNodes[i];
          if (n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '') {
            n.textContent = dict[key];
            break;
          }
        }
      }
    });

    // aria-label via [data-i18n-aria]
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (dict[key]) el.setAttribute('aria-label', dict[key]);
    });

    document.title = 'SEMEA-tec';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict['meta-desc']) metaDesc.setAttribute('content', dict['meta-desc']);
  }

  // ============================================================
  // Navigation
  // ============================================================
  function setActiveLink(slug) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-page') === slug);
    });
  }

  function loadPage(slug, lang) {
    lang = lang || currentLang;
    currentPage = slug;

    // Cancel any in-flight fetch so it can't overwrite the content we're
    // about to render. AbortController also frees the network request.
    if (loadController) loadController.abort();
    loadController = new AbortController();
    var myToken = ++loadToken;

    // Hard jump to top BEFORE replacing the content (otherwise the page
    // briefly shrinks while the user is still scrolled mid-page).
    scrollTopInstant();

    contentEl.setAttribute('aria-busy', 'true');
    setActiveLink(slug);

    // Document title stays fixed at "SEMEA-tec" — we don't update it per
    // page (matches the behavior of products like "WhatsApp Web" which
    // always show their brand name in the tab regardless of context).

    // Delayed skeleton: we DON'T replace the content immediately. Instead
    // we keep the previous page visible and only fall back to the skeleton
    // if the fetch hasn't returned within 150ms. For fast loads (localhost
    // or a decent connection) the skeleton is never seen — the user goes
    // straight from old content to new content with no intermediate flash.
    var skeletonTimer = setTimeout(function () {
      if (myToken !== loadToken) return;
      contentEl.innerHTML =
        '<div class="loading-skel" aria-hidden="true">' +
        '<div></div><div></div><div></div><div></div><div></div>' +
        '</div>' +
        '<span class="sr-only">' + i18n[lang]['loading'] + '</span>';
    }, 150);

    var url = 'conteudo/' + lang + '/' + slug + '.md';

    fetch(url, { signal: loadController.signal, cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(i18n[lang]['error-text'] + ' (HTTP ' + response.status + ')');
        }
        return response.text();
      })
      .then(function (markdown) {
        if (typeof marked === 'undefined') {
          // marked.js not yet loaded — wait briefly
          return new Promise(function (resolve) {
            var tries = 0;
            (function check() {
              if (typeof marked !== 'undefined' || tries > 40) return resolve(markdown);
              tries++; setTimeout(check, 50);
            })();
          });
        }
        return markdown;
      })
      .then(function (markdown) {
        // Stale response — a newer loadPage() ran while we were fetching.
        // Drop it on the floor; the newer call already owns the content.
        if (myToken !== loadToken) return;
        clearTimeout(skeletonTimer);

        marked.setOptions({ gfm: true, breaks: false });
        contentEl.innerHTML = marked.parse(markdown);
        contentEl.setAttribute('aria-busy', 'false');
        renderedPage = slug;
        renderedLang = lang;
      })
      .catch(function (error) {
        // Fetch was aborted by a newer navigation — not a real error.
        if (error.name === 'AbortError') return;
        if (myToken !== loadToken) return;
        clearTimeout(skeletonTimer);

        contentEl.innerHTML =
          '<div class="error-block">' +
            '<h2>' + i18n[lang]['error-title'] + '</h2>' +
            '<p>' + error.message + '</p>' +
            '<p><a href="#" data-page="projeto" data-fallback="true">' + i18n[lang]['error-back'] + '</a></p>' +
          '</div>';
        contentEl.setAttribute('aria-busy', 'false');
      });
  }

  function navigateTo(slug, lang) {
    lang = lang || currentLang;
    closeMenu();

    // Same page + same language + content already rendered → no-op the load
    // and just scroll to top. Avoids the skeleton flash and wasted fetch when
    // the user clicks the brand or the same nav link repeatedly. We compare
    // against rendered* (what's on screen), NOT current* (what the UI has
    // selected) — see the comment on renderedPage/renderedLang above.
    var sameTarget = slug === renderedPage
                  && lang === renderedLang
                  && contentEl.getAttribute('aria-busy') === 'false';
    if (sameTarget) {
      scrollTopInstant();
      return;
    }

    loadPage(slug, lang);
    history.pushState({ page: slug, lang: lang }, '', '#' + lang + '/' + slug);
  }

  // ============================================================
  // Hash routing
  // ============================================================
  function parseHash() {
    var hash = window.location.hash.replace('#', '');
    var parts = hash.split('/');
    var lang = null, page = null;

    if (parts.length >= 2 && (parts[0] === 'pt' || parts[0] === 'en')) {
      lang = parts[0]; page = parts[1];
    } else if (parts.length === 1 && (parts[0] === 'pt' || parts[0] === 'en')) {
      lang = parts[0]; page = 'projeto';
    }

    if (!page || VALID_PAGES.indexOf(page) === -1) page = 'projeto';
    return { lang: lang, page: page };
  }

  function detectLanguage() {
    var saved;
    try { saved = localStorage.getItem('semea-lang'); } catch (e) {}
    if (saved === 'pt' || saved === 'en') return saved;
    return 'en';
  }

  // ============================================================
  // Mobile menu
  // ============================================================
  function openMenu() {
    document.body.classList.add('menu-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    if (document.body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  }
  if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
  if (navBackdrop) navBackdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
  });
  // Close menu when resizing back to desktop
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 860) closeMenu();
    }, 120);
  });

  // ============================================================
  // Event bindings
  // ============================================================
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo(this.getAttribute('data-page'), currentLang);
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

  // Brand click resets to home page
  var brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo('projeto', currentLang);
    });
  }

  // Event delegation: in-content [data-page] links (project cards, fallback links)
  if (contentEl) {
    contentEl.addEventListener('click', function (e) {
      var target = e.target.closest('a[data-page]');
      if (!target) return;
      e.preventDefault();
      var page = target.getAttribute('data-page');
      if (VALID_PAGES.indexOf(page) !== -1) navigateTo(page, currentLang);
    });
  }

  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.page && e.state.lang) {
      setLang(e.state.lang);
      loadPage(e.state.page, e.state.lang);
    } else {
      var parsed = parseHash();
      setLang(parsed.lang || currentLang);
      loadPage(parsed.page, currentLang);
    }
  });

  // ============================================================
  // Init
  // ============================================================
  var parsed = parseHash();
  var initialLang = parsed.lang || detectLanguage();
  var initialPage = parsed.page;

  setLang(initialLang);
  loadPage(initialPage, initialLang);

  var expectedHash = '#' + initialLang + '/' + initialPage;
  if (window.location.hash !== expectedHash) {
    history.replaceState({ page: initialPage, lang: initialLang }, '', expectedHash);
  }
})();
