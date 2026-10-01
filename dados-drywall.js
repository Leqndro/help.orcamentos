  itensPorCategoria.gesso = [
      { id: 'parede',       nome: 'Parede de dry wall', tipo: 'area',
        campos: [{ id: 'altura', label: 'Altura (m)' }, { id: 'largura', label: 'Largura (m)' }] },
      { id: 'forro',        nome: 'Forro', tipo: 'area',
        campos: [{ id: 'largura', label: 'Largura (m)' }, { id: 'comprimento', label: 'Comprimento (m)' }] },
      { id: 'sanca',        nome: 'Sanca', tipo: 'linear-x2',
        campos: [{ id: 'largura', label: 'Largura (m)' }, { id: 'comprimento', label: 'Comprimento (m)' }] },
      { id: 'moldura',      nome: 'Moldura', tipo: 'linear-x2',
        campos: [{ id: 'largura', label: 'Largura (m)' }, { id: 'comprimento', label: 'Comprimento (m)' }] },
      { id: 'fechamento',   nome: 'Fechamento', tipo: 'linear-x2',
        campos: [{ id: 'largura', label: 'Largura (m)' }, { id: 'comprimento', label: 'Comprimento (m)' }, { id: 'altura', label: 'Altura (m)' }] },
      { id: 'revestimento', nome: 'Revestimento', tipo: 'area',
        campos: [{ id: 'largura', label: 'Largura (m)' }, { id: 'comprimento', label: 'Comprimento (m)' }] },
      { id: 'outros-gesso', nome: 'Outros', unidade: 'un', personalizado: true },
  ];

  /* ---------- CONSUMO DE MATERIAIS: DRY WALL (Parede e Forro) ----------
     Valores médios de mercado (parede simples, 1 chapa por lado, montante a cada 60cm).
     Itens vendidos em barra (3m) ou placa (2,16 m²) são convertidos para quantidade
     de itens inteiros, arredondando sempre para cima. */
  const TAMANHO_BARRA_M = 3;
  const TAMANHO_PLACA_M2 = 2.16;
  const ESPACAMENTO_MONTANTE = 0.6;

  const MATERIAIS_DRYWALL = {
    parede: {
      titulo: 'Parede de dry wall',
      itens: [
        { nome: 'Chapa de drywall', consumoPorM2: 2.16, tamanhoUnidade: TAMANHO_PLACA_M2, unidade: 'placas' },
        { nome: 'Parafuso GN25', consumoPorM2: 30, tamanhoUnidade: null, unidade: 'un' },
        { nome: 'Parafuso metal-metal', consumoPorM2: 8, tamanhoUnidade: null, unidade: 'un' },
        { nome: 'Massa para juntas', consumoPorM2: 0.6, tamanhoUnidade: null, unidade: 'kg', decimal: true },
        { nome: 'Fita de papel', consumoPorM2: 2.2, tamanhoUnidade: null, unidade: 'm', decimal: true },
      ],
    },
    forro: {
      titulo: 'Forro de dry wall',
      itens: [
        { nome: 'Chapa de drywall', consumoPorM2: 1.08, tamanhoUnidade: TAMANHO_PLACA_M2, unidade: 'placas' },
        { nome: 'Pendural regulável', consumoPorM2: 0.9, tamanhoUnidade: null, unidade: 'un' },
        { nome: 'Parafuso GN25', consumoPorM2: 18, tamanhoUnidade: null, unidade: 'un' },
        { nome: 'Massa para juntas', consumoPorM2: 0.5, tamanhoUnidade: null, unidade: 'kg', decimal: true },
        { nome: 'Fita de papel', consumoPorM2: 1.6, tamanhoUnidade: null, unidade: 'm', decimal: true },
      ],
    },
  };

  // Montante e Guia da parede são calculados pela geometria real (largura/altura de cada parede),
  // não por uma proporção genérica de m² — ver explicação no calcularMateriaisDrywall().
  function calcularMontanteEGuiaParede() {
    const paredes = orcamentoAtual.filter(it => it.categoria === 'Gesso' && it.nome === 'Parede de dry wall');
    let totalLinearMontante = 0;
    let totalPerimetroGuia = 0;

    paredes.forEach(p => {
      const largura = p.largura || 0;
      const altura = p.altura || 0;
      if (largura <= 0 || altura <= 0) return;

      // Guia = perímetro da parede (chão + teto + as duas pontas)
      totalPerimetroGuia += 2 * (largura + altura);

      // Montante = postes a cada 60cm ao longo da largura; as duas pontas já são
      // cobertas pela guia lateral, então contamos só os postes intermediários
      const vaos = Math.ceil(largura / ESPACAMENTO_MONTANTE);
      const postesIntermediarios = Math.max(vaos - 1, 0);
      totalLinearMontante += postesIntermediarios * altura;
    });

    return {
      montanteBarras: Math.ceil(totalLinearMontante / TAMANHO_BARRA_M),
      guiaBarras: Math.ceil(totalPerimetroGuia / TAMANHO_BARRA_M),
    };
  }

  // Canaleta F530 do forro: barras a cada 60cm ao longo da largura, cada uma
  // percorrendo todo o comprimento do forro.
  function calcularCanaletaF530Forro() {
    const forros = orcamentoAtual.filter(it => it.categoria === 'Gesso' && it.nome === 'Forro');
    let totalLinearCanaleta = 0;

    forros.forEach(f => {
      const largura = f.largura || 0;
      const comprimento = f.comprimento || 0;
      if (largura <= 0 || comprimento <= 0) return;

      const canaletas = Math.ceil(largura / ESPACAMENTO_MONTANTE) + 1;
      totalLinearCanaleta += canaletas * comprimento;
    });

    return Math.ceil(totalLinearCanaleta / TAMANHO_BARRA_M);
  }

  function calcularMateriaisDrywall() {
    const areaParede = orcamentoAtual
      .filter(it => it.categoria === 'Gesso' && it.nome === 'Parede de dry wall')
      .reduce((soma, it) => soma + it.quantidade, 0);
    const areaForro = orcamentoAtual
      .filter(it => it.categoria === 'Gesso' && it.nome === 'Forro')
      .reduce((soma, it) => soma + it.quantidade, 0);

    const resultado = [];
    [['parede', areaParede], ['forro', areaForro]].forEach(([chave, area]) => {
      if (area > 0) {
        const tabela = MATERIAIS_DRYWALL[chave];
        const itensCalculados = tabela.itens.map(item => {
          const valorNecessario = item.consumoPorM2 * area;
          let quantidade;
          if (item.tamanhoUnidade) {
            // Vendido em barra/placa: converte para quantidade de itens inteiros
            quantidade = Math.ceil(valorNecessario / item.tamanhoUnidade);
          } else if (item.decimal) {
            quantidade = Math.round(valorNecessario * 100) / 100;
          } else {
            quantidade = Math.ceil(valorNecessario);
          }
          return { nome: item.nome, quantidade: quantidade, unidade: item.unidade };
        });

        // Insere Montante e Guia (calculados pela geometria real) logo após a Chapa
        if (chave === 'parede') {
          const { montanteBarras, guiaBarras } = calcularMontanteEGuiaParede();
          itensCalculados.splice(1, 0,
            { nome: 'Montante', quantidade: montanteBarras, unidade: 'barras' },
            { nome: 'Guia', quantidade: guiaBarras, unidade: 'barras' }
          );
        }

        // Insere Canaleta F530 (calculada pela geometria real) logo após a Chapa
        if (chave === 'forro') {
          const canaletaBarras = calcularCanaletaF530Forro();
          itensCalculados.splice(1, 0,
            { nome: 'Canaleta F530', quantidade: canaletaBarras, unidade: 'barras' }
          );
        }

        resultado.push({ titulo: tabela.titulo, area, itens: itensCalculados });
      }
    });
    return resultado;
  }
