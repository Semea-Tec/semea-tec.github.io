## O que foi criado

### Estrutura local

extensão/
├── site-semea-tec/          ← repositório do site (já no GitHub)
│   ├── index.html           ← página principal com renderizador markdown
│   ├── CNAME                ← domínio semea.tec.br
│   ├── css/style.css        ← tema verde/terra responsivo
│   ├── js/main.js           ← carregador de .md via marked.js
│   └── conteudo/
│       ├── projeto.md
│       ├── cerca-javali.md
│       └── estufa-cogumelos.md
├── greenhouse-monitoring/   ← clonado do GitHub
└── resumo_para_evento_republica.md

### Repositórios no GitHub

┌─────────────┬────────────────────────────────────────────────────┐
│ Repositório │ URL                                                │
├─────────────┼────────────────────────────────────────────────────┤
│ Site        │ https://github.com/Semea-Tec/semea-tec.github.io   │
├─────────────┼────────────────────────────────────────────────────┤
│ Estufa      │ https://github.com/Semea-Tec/greenhouse-monitoring │
└─────────────┴────────────────────────────────────────────────────┘

### Site

• Tecnologia: HTML + CSS + JS puro, sem dependências de build. Usa marked.js via CDN para converter .md em HTML no navegador.
• Navegação: 3 páginas de conteúdo — Projeto, Cerca do Javali, Estufa de Cogumelos. Os links carregam os .md dinamicamente via fetch(), com suporte a voltar/avançar do navegador (History API).
• GitHub Pages: já habilitado no branch main, domínio customizado semea.tec.br configurado.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────


## O que falta fazer (você)

### 1. Configurar DNS do domínio semea.tec.br

No painel de DNS da sua registradora, adicione estes registros:

Tipo     Nome      Valor
A        @         185.199.108.153
A        @         185.199.109.153
A        @         185.199.110.153
A        @         185.199.111.153
CNAME    www       semea-tec.github.io

São os IPs fixos do GitHub Pages. Depois que propagar (pode levar até 24h na primeira vez), o site estará em https://semea.tec.br.

### 2. Habilitar HTTPS

Assim que o domínio propagar, vá em:  
https://github.com/Semea-Tec/semea-tec.github.io/settings/pages  
e marque "Enforce HTTPS" — o GitHub gera o certificado SSL automaticamente via Let's Encrypt.

### 3. Como adicionar mais páginas

Basta criar um novo .md em site-semea-tec/conteudo/ e adicionar o link no <nav> do index.html com data-page="nome-do-arquivo". Exemplo:

<a href="#" data-page="oficinas" class="nav-link">Oficinas</a>

E criar o arquivo conteudo/oficinas.md. Depois é só commit e push.

### 4. Atualizar o site

Sempre que editar algo:

cd extensão/site-semea-tec
git add -A && git commit -m "mensagem" && git push

