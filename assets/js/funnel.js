/* FUNIL J. C. DIAS - nucleo de roteamento e tracking
   funnel = rcp_interativo
   Este arquivo NAO contem copy. Ele so define para onde cada botao leva e o que e medido.
   Para mudar o funil inteiro, mexa apenas no objeto CONFIG abaixo. */

const CONFIG = {
  funnel: 'rcp_interativo',
  pixelId: '2122287675194601',   // dataset 'Funil de Vendas V1 - Brasil', o mesmo da marca
  instagram: '',          // PENDENTE: URL do perfil oficial

  // Rotas de cada etapa. Dominio: jornada.jcdias.com
  // Confirmados pelo JC em 2026-08-21. Os marcados PENDENTE aguardam definicao.
  dominio: 'https://jornada.jcdias.com',
  routes: {
    rcp:         '/recomecar/',
    labirinto:   '/labirinto/',
    qmpd:        '/qmpd/',
    qmpdEbook:   '/qmpd-ebook/',
    historia:    '/ashir/',
    dvpn:        '/dvpn/',
    dvpnEbook:   '/dvpn-ebook/',
    caverna:     '/caverna/',
    jornada:     '/final/',
    obrigado:    '/obrigado/'
  },


  // Produtos e checkouts. PENDENTE: colar os links reais.
  products: {
    rcp:       { id: 'rcp',        nome: 'Recomecar com Proposito', formato: 'ebook+audiobook', valor: 27, checkout: '' },
    bussola:   { id: 'bussola',    nome: 'A Bussola',               formato: 'order bump',      valor: 17, checkout: '' },
    qmpd:      { id: 'qmpd_ebook_audio', nome: 'Quando Morri por Dentro', formato: 'ebook+audiobook', valor: 47, checkout: '' },
    qmpdEbook: { id: 'qmpd_ebook', nome: 'Quando Morri por Dentro', formato: 'ebook',           valor: 37, checkout: '' },
    dvpn:      { id: 'dvpn_ebook_audio', nome: 'De Volta Para o Nada', formato: 'ebook+audiobook', valor: 47, checkout: '' },
    dvpnEbook: { id: 'dvpn_ebook', nome: 'De Volta Para o Nada',    formato: 'ebook',           valor: 37, checkout: '' },
    caverna:   { id: 'caverna_ebook', nome: 'A Caverna Interior',   formato: 'ebook',           valor: 67, checkout: '' }
  },

  // Para onde vai o ACEITE e a RECUSA de cada etapa.
  flow: {
    labirinto: { next: 'qmpd' },
    qmpd:      { accept: 'historia',  decline: 'qmpdEbook' },
    qmpdEbook: { accept: 'historia',  decline: 'historia'  },
    historia:  { next: 'dvpn' },
    dvpn:      { accept: 'caverna',   decline: 'dvpnEbook' },
    dvpnEbook: { accept: 'caverna',   decline: 'caverna'   },
    caverna:   { accept: 'jornada',   decline: 'obrigado'  }
  }
};

/* Preserva utm_* e demais parametros da URL entre as etapas. */
function comParametros(url) {
  const atuais = new URLSearchParams(window.location.search);
  atuais.set('funnel', CONFIG.funnel);
  const destino = new URL(url, window.location.origin);
  atuais.forEach((v, k) => { if (!destino.searchParams.has(k)) destino.searchParams.set(k, v); });
  return destino.toString();
}

/* Envia evento para o Pixel e para o analytics. Nunca envia resposta pessoal das interacoes. */
function track(evento, dados = {}) {
  const payload = Object.assign({ funnel: CONFIG.funnel }, dados);
  if (window.fbq) window.fbq('track', evento, payload);
  if (window.dataLayer) window.dataLayer.push(Object.assign({ event: evento }, payload));
}

function trackCustom(evento, dados = {}) {
  const payload = Object.assign({ funnel: CONFIG.funnel }, dados);
  if (window.fbq) window.fbq('trackCustom', evento, payload);
  if (window.dataLayer) window.dataLayer.push(Object.assign({ event: evento }, payload));
}

/* Marca a entrada na etapa. Chamar uma vez por pagina. */
function entrarEtapa(etapa, produtoKey) {
  const p = produtoKey ? CONFIG.products[produtoKey] : null;
  track('ViewContent', p
    ? { step: etapa, content_ids: [p.id], value: p.valor, currency: 'BRL' }
    : { step: etapa });
}

/* Botao ACEITAR de um upsell: abre o checkout do produto. */
function aceitar(etapa, produtoKey) {
  const p = CONFIG.products[produtoKey];
  track('InitiateCheckout', { step: etapa, content_ids: [p.id], value: p.valor, currency: 'BRL' });
  if (!p.checkout) { console.warn('checkout pendente para', produtoKey); return; }
  window.location.href = comParametros(p.checkout);
}

/* Botao RECUSAR. */
function recusar(etapa) {
  trackCustom('Recusou', { step: etapa });
  irPara(CONFIG.flow[etapa].decline);
}

/* Botao CONTINUAR das interacoes e da ponte. */
function continuar(etapa) {
  trackCustom('EtapaConcluida', { step: etapa });
  irPara(CONFIG.flow[etapa].next);
}

function irPara(chaveRota) {
  const rota = CONFIG.routes[chaveRota];
  if (!rota) { console.warn('rota pendente:', chaveRota); return; }
  window.location.href = comParametros(rota);
}
