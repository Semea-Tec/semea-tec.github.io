# SEMEA-TEC · Site Institucional

**semea.tec.br** — Site do projeto de extensão da UNIFESP que desenvolve tecnologias sociais de baixo custo com comunicação LoRa e sensoriamento para a agricultura familiar.

---

## Sobre o projeto

O **SEMEA-TEC** atua na interseção entre computação, eletrônica e extensão rural, utilizando metodologias participativas (Action Design Research) para cocriar soluções com agricultores familiares. O projeto está vinculado ao ICT/UNIFESP — São José dos Campos e ao PPGIT/UNIFESP (doutorado em *Harvest Energy* e transmissores de baixa potência como tecnologia social).

**Parcerias:** Portal Sem Porteiras · Akarui · Apoena

---

## Sobre o site

Site estático, bilíngue (português/inglês), hospedado via **GitHub Pages** no domínio `semea.tec.br`.

### Tecnologia

- **HTML + CSS + JS** puro — sem frameworks, sem build
- **[marked.js](https://github.com/markedjs/marked)** via CDN para renderizar `.md` em HTML no navegador
- **Navegação SPA**: conteúdo carregado dinamicamente com `fetch()`, roteamento por hash (`#pt/projeto`, `#en/wild-boar-fence`), History API para voltar/avançar
- **Detecção de idioma**: preferência salva em `localStorage`, fallback para idioma do navegador, padrão português
- **Seletor PT | EN** no header com troca instantânea de conteúdo

### Estrutura

```
├── index.html              # shell da aplicação (header, nav, footer)
├── CNAME                   # semea.tec.br
├── css/style.css           # tema verde/terra responsivo
├── js/main.js              # carregador bilíngue de markdown + i18n + roteamento
├── conteudo/
│   ├── pt/                 # conteúdo em português
│   │   ├── projeto.md
│   │   ├── cerca-javali.md
│   │   └── estufa-cogumelos.md
│   └── en/                 # conteúdo em inglês
│       ├── projeto.md
│       ├── cerca-javali.md
│       └── estufa-cogumelos.md
└── readme.md
```

---

## Rodando localmente

Qualquer servidor HTTP estático serve. Exemplo com Python:

```bash
cd site-semea-tec
python3 -m http.server 8080
```

Acesse `http://localhost:8080`.

> O site precisa de internet para carregar o `marked.js` do CDN. Para uso offline, baixe a biblioteca para `js/vendor/`.

---

## Adicionando novas páginas

1. Crie o arquivo `.md` em `conteudo/pt/` e `conteudo/en/`:

```bash
touch conteudo/pt/oficinas.md
touch conteudo/en/oficinas.md
```

2. Adicione o link de navegação no `<nav>` do `index.html`:

```html
<a href="#" data-page="oficinas" data-i18n="nav-oficinas">Oficinas</a>
```

3. Registre as traduções no objeto `i18n` em `js/main.js`:

```js
'nav-oficinas': 'Oficinas',    // pt
'nav-oficinas': 'Workshops',   // en
```

4. Commit e push:

```bash
git add -A && git commit -m "Nova página: oficinas" && git push
```

---

## Repositórios relacionados

| Repositório | Descrição |
|---|---|
| [greenhouse-monitoring](https://github.com/Semea-Tec/greenhouse-monitoring) | Sensoriamento ambiental autônomo para estufas de cogumelos (LoRa + ESP32 + solar) |

---

## Licença

Este site e seu conteúdo estão disponíveis sob a licença [MIT](LICENSE).

---

**SEMEA-TEC** · UNIFESP · ICT São José dos Campos  
[semea.tec.br](https://semea.tec.br) · [github.com/Semea-Tec](https://github.com/Semea-Tec)
