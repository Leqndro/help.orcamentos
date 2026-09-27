  /* ---------- ARMAZENAMENTO LOCAL (localStorage) ---------- */
  const LS_CONFIG_KEY = 'helpOrc_config';
  const LS_ORCAMENTOS_KEY = 'helpOrc_orcamentos_salvos';

  function carregarConfig() {
    try {
      const raw = localStorage.getItem(LS_CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.error('Erro ao ler config salva:', e); }
    return { empresaNome: '', empresaCnpj: '', meuNome: '', meuTelefone: '' };
  }

  function salvarConfig() {
    try {
      localStorage.setItem(LS_CONFIG_KEY, JSON.stringify({ empresaNome, empresaCnpj, meuNome, meuTelefone }));
    } catch (e) { console.error('Erro ao salvar config:', e); }
  }

  function carregarOrcamentosSalvos() {
    try {
      const raw = localStorage.getItem(LS_ORCAMENTOS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.error('Erro ao ler orçamentos salvos:', e); }
    return [];
  }

  function persistirOrcamentosSalvos() {
    try {
      localStorage.setItem(LS_ORCAMENTOS_KEY, JSON.stringify(orcamentosSalvos));
    } catch (e) {
      console.error('Erro ao salvar orçamentos:', e);
      alert('Não foi possível salvar o orçamento neste dispositivo (armazenamento cheio ou bloqueado).');
    }
  }

  function idUnico() {
    return 'orc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- ESTADO ---------- */
  let categoriaAtual = null;
  let itemSelecionado = null;
  let camposX2Ativos = new Set();
  let orcamentoAtual = []; // { categoria, nome, quantidade, unidade, maoDeObraUnit, valorFixo, total }
  let dadosCliente = { nome: '', empresa: '', telefone: '', endereco: '', obs: '' };
  const configSalva = carregarConfig();
  let meuTelefone = configSalva.meuTelefone || '';
  let empresaNome = configSalva.empresaNome || '';
  let empresaCnpj = configSalva.empresaCnpj || '';
  let meuNome = configSalva.meuNome || '';
  let modoMedidasDryWall = false;
  let drywallMedidasAtual = null;
  let orcamentosSalvos = carregarOrcamentosSalvos();
  let orcamentoEmEdicaoId = null;
  let orcamentoSelecionadoId = null;

  /* ---------- NAVEGAÇÃO ---------- */
  function irPara(idTela) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById(idTela).classList.add('ativa');
  }

  /* ---------- TELA 0: SPLASH / NOVO ORÇAMENTO ---------- */
  function novoOrcamento() {
    orcamentoAtual = [];
    orcamentoEmEdicaoId = null;
    dadosCliente = { nome: '', empresa: '', telefone: '', endereco: '', obs: '' };
    document.getElementById('cliente-nome').value = '';
    document.getElementById('cliente-empresa').value = '';
    document.getElementById('cliente-telefone').value = '';
    document.getElementById('cliente-endereco').value = '';
    document.getElementById('cliente-obs').value = '';
    document.getElementById('meu-telefone').value = meuTelefone;
    document.getElementById('empresa-nome').value = empresaNome;
    document.getElementById('empresa-cnpj').value = empresaCnpj;
    document.getElementById('meu-nome').value = meuNome;
    irPara('tela-cliente');
  }

  function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      } else if (v.length > 5) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      } else if (v.length > 0) {
        v = v.replace(/(\d{0,2})/, '($1');
      }
      this.value = v;
    });
  }
  aplicarMascaraTelefone(document.getElementById('cliente-telefone'));
  aplicarMascaraTelefone(document.getElementById('meu-telefone'));

  document.getElementById('empresa-cnpj').addEventListener('input', function () {
    let d = this.value.replace(/\D/g, '').slice(0, 14);
    let v = d;
    if (d.length > 12) {
      v = d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    } else if (d.length > 8) {
      v = d.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else if (d.length > 5) {
      v = d.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (d.length > 2) {
      v = d.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    }
    this.value = v;
  });

  function salvarCliente() {
    dadosCliente.nome = document.getElementById('cliente-nome').value.trim();
    dadosCliente.empresa = document.getElementById('cliente-empresa').value.trim();
    dadosCliente.telefone = document.getElementById('cliente-telefone').value.trim();
    dadosCliente.endereco = document.getElementById('cliente-endereco').value.trim();
    dadosCliente.obs = document.getElementById('cliente-obs').value.trim();
    meuTelefone = document.getElementById('meu-telefone').value.trim();
    empresaNome = document.getElementById('empresa-nome').value.trim();
    empresaCnpj = document.getElementById('empresa-cnpj').value.trim();
    meuNome = document.getElementById('meu-nome').value.trim();
    salvarConfig();
    renderizarResumo();
    irPara('tela-home');
  }

  /* ---------- TELA 1: HOME ---------- */
  const containerCategorias = document.getElementById('lista-categorias');
  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'categoria';
    btn.innerHTML = `
      <div class="icone">${cat.icone}</div>
      <div class="info">
        <p class="nome">${cat.nome}</p>
        <p class="desc">${cat.desc}</p>
      </div>
      <div class="seta">›</div>
    `;
    btn.addEventListener('click', () => abrirCategoria(cat.id));
    containerCategorias.appendChild(btn);
  });

  function abrirCategoria(id) {
    const itens = itensPorCategoria[id];
    if (!itens) {
      alert('Essa categoria ainda será construída nas próximas telas.');
      return;
    }
    categoriaAtual = categorias.find(c => c.id === id);
    renderizarTelaItens();
    irPara('tela-itens');
  }

  /* ---------- TELA 2: LISTA DE ITENS ---------- */
  function renderizarTelaItens() {
    document.getElementById('itens-eyebrow').textContent = categoriaAtual.nome.toUpperCase();
    document.getElementById('itens-titulo').textContent = categoriaAtual.nome;

    const lista = document.getElementById('lista-itens');
    lista.innerHTML = '';
    itensPorCategoria[categoriaAtual.id].forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'item-servico';
      const badge = item.tipo === 'lista-materiais' ? 'lista' : (item.tipo === 'direto' ? 'valor' : (item.tipo ? 'm²' : (item.unidade === 'm' ? 'metros' : 'unid.')));
      btn.innerHTML = `
        <span class="nome">${item.nome}</span>
        <span class="badge">${badge}</span>
      `;
      btn.addEventListener('click', () => {
        if (item.tipo === 'lista-materiais') abrirTelaMateriais();
        else if (item.tipo) abrirFormularioMedidas(item);
        else abrirFormulario(item);
      });
      lista.appendChild(btn);
    });
  }

  function nomeExibicao(it) {
    return it.comodo ? `${it.nome} — ${it.comodo}` : it.nome;
  }

  function renderizarResumo() {
    const subCliente = document.getElementById('home-cliente-sub');
    if (subCliente) {
      subCliente.textContent = dadosCliente.nome
        ? `Cliente: ${dadosCliente.nome}`
        : 'Selecione a categoria para montar o orçamento';
    }

    const resumo = document.getElementById('resumo-home');
    if (orcamentoAtual.length === 0) {
      resumo.innerHTML = '<p class="resumo-vazio">Nenhum item ainda</p>';
      return;
    }
    resumo.innerHTML = '';
    orcamentoAtual.forEach((it, idx) => {
      const linha = document.createElement('div');
      linha.className = 'resumo-linha';
      const unidadeTxt = it.unidade === 'm' ? 'm' : (it.unidade === 'm²' ? 'm²' : 'un');
      const qtdTexto = it.unidade === '' ? '' : `${it.quantidade.toFixed(2)} ${unidadeTxt} · `;
      linha.innerHTML = `
        <span>[${it.categoria}] ${nomeExibicao(it)} — ${qtdTexto}R$ ${it.total.toFixed(2)}</span>
        <button class="remover" onclick="removerItem(${idx})">✕</button>
      `;
      resumo.appendChild(linha);
    });
  }

  function removerItem(idx) {
    orcamentoAtual.splice(idx, 1);
    renderizarResumo();
  }

  /* ---------- TELA 3: FORMULÁRIO ---------- */
  function abrirFormulario(item) {
    itemSelecionado = item;
    document.getElementById('form-titulo').textContent = item.nome;
    document.getElementById('form-campo-nome').style.display = item.personalizado ? 'flex' : 'none';
    document.getElementById('form-nome-personalizado').value = '';
    document.getElementById('form-comodo').value = '';
    document.getElementById('form-label-qtd').textContent =
      item.unidade === 'm' ? 'Quantidade (metros)' : 'Quantidade (unidades)';
    document.getElementById('form-label-mao').textContent =
      item.valorFixo ? 'Valor da mão de obra - total (R$)' : 'Valor da mão de obra - por unidade (R$)';
    document.getElementById('form-quantidade').value = '';
    document.getElementById('form-maodeobra').value = '';
    document.getElementById('form-preview-total').style.display = item.valorFixo ? 'none' : 'flex';
    atualizarPreviewTotal();
    irPara('tela-form');
  }

  function atualizarPreviewTotal() {
    const qtd = parseFloat(document.getElementById('form-quantidade').value) || 0;
    const valorUnit = parseFloat(document.getElementById('form-maodeobra').value) || 0;
    const total = qtd * valorUnit;
    document.getElementById('form-total-valor').textContent =
      'R$ ' + total.toFixed(2).replace('.', ',');
  }

  document.getElementById('form-quantidade').addEventListener('input', atualizarPreviewTotal);
  document.getElementById('form-maodeobra').addEventListener('input', atualizarPreviewTotal);

  function confirmarItem() {
    const qtd = parseFloat(document.getElementById('form-quantidade').value);
    const valor = parseFloat(document.getElementById('form-maodeobra').value);
    const nomePersonalizado = document.getElementById('form-nome-personalizado').value.trim();

    if (itemSelecionado.personalizado && !nomePersonalizado) {
      alert('Informe o nome do item a ser instalado.');
      return;
    }
    if (!qtd || qtd <= 0) { alert('Informe a quantidade.'); return; }
    if (isNaN(valor) || valor < 0) { alert('Informe o valor da mão de obra.'); return; }

    const totalItem = itemSelecionado.valorFixo ? valor : (qtd * valor);
    const nomeFinal = itemSelecionado.personalizado
      ? `${itemSelecionado.nome}: ${nomePersonalizado}`
      : itemSelecionado.nome;
    const comodo = document.getElementById('form-comodo').value.trim();

    orcamentoAtual.push({
      categoria: categoriaAtual.nome,
      nome: nomeFinal,
      comodo: comodo,
      quantidade: qtd,
      unidade: itemSelecionado.unidade,
      maoDeObraUnit: valor,
      valorFixo: !!itemSelecionado.valorFixo,
      total: totalItem,
    });

    renderizarResumo();
    irPara('tela-itens');
  }

  /* ---------- TELA 3B: FORMULÁRIO POR MEDIDAS (GESSO) ---------- */
  function ehMedidaDryWall(item) {
    return categoriaAtual && categoriaAtual.id === 'gesso' &&
      ['parede', 'forro', 'sanca', 'moldura'].includes(item.id);
  }

  function voltarDaTelaMedidas() {
    if (modoMedidasDryWall) {
      drywallMedidasAtual = null;
      modoMedidasDryWall = false;
    }
    irPara('tela-itens');
  }

  function abrirFormularioMedidas(item) {
    itemSelecionado = item;
    modoMedidasDryWall = ehMedidaDryWall(item);

    if (modoMedidasDryWall) {
      drywallMedidasAtual = { itemId: item.id, registros: [], valorM2: 0 };
    }

    document.getElementById('medidas-titulo').textContent = item.nome;
    document.getElementById('medidas-comodo').value = '';

    const container = document.getElementById('medidas-campos');
    container.innerHTML = '';

    item.campos.forEach(campo => {
      const div = document.createElement('div');
      div.className = 'campo';
      const tipoInput = campo.inputType === 'text' ? 'text' : 'number';
      const inputmodeAttr = tipoInput === 'text' ? '' : 'inputmode="decimal"';
      div.innerHTML = `
        <label>${campo.label}</label>
        <input type="${tipoInput}" ${inputmodeAttr} class="medida-input" data-campo="${campo.id}"
          placeholder="${tipoInput === 'text' ? 'Digite aqui...' : '0,00'}"
          ${tipoInput === 'number' ? 'min="0" step="0.01"' : ''}>
      `;
      container.appendChild(div);
    });

    // O cômodo fica separado dos demais campos e permanece simples para os outros serviços.
    const comodo = document.getElementById('medidas-comodo');
    if (comodo) {
      comodo.parentElement.style.display = modoMedidasDryWall ? 'flex' : 'none';
    }

    // Para Dry Wall, o valor é informado uma vez e reaproveitado em todos os cômodos.
    const valorInput = document.getElementById('medidas-valor-m2');
    valorInput.value = '';
    valorInput.readOnly = false;
    valorInput.style.opacity = '1';

    const valorLabel = document.getElementById('medidas-valor-label');
    const previewLabel = document.getElementById('medidas-preview-label');
    const subtitulo = document.getElementById('medidas-subtitulo');

    if (modoMedidasDryWall) {
      const linear = ['sanca', 'moldura'].includes(item.id);
      valorLabel.textContent = linear ? 'Valor por metro (R$)' : 'Valor por m² (R$)';
      previewLabel.textContent = linear ? 'Metragem linear deste cômodo' : 'Área deste cômodo';
      subtitulo.textContent = linear
        ? 'Digite o valor uma vez e adicione cada cômodo'
        : 'Digite o valor uma vez e adicione cada cômodo';
    } else {
      valorLabel.textContent = item.tipo === 'direto' ? 'Valor (R$)' : 'Valor por m² (R$)';
      previewLabel.textContent = item.tipo === 'area' ? 'Área total' : (item.tipo === 'direto' ? 'Resumo' : 'Medida total');
      subtitulo.textContent = 'Informe as medidas';
    }

    document.getElementById('medidas-preview-campo').style.display =
      item.tipo === 'direto' ? 'none' : 'flex';
    document.getElementById('medidas-preview-total-campo').style.display = 'flex';

    const listaBox = document.getElementById('medidas-itens-adicionados');
    listaBox.style.display = modoMedidasDryWall ? 'block' : 'none';

    document.querySelectorAll('.medida-input').forEach(inp =>
      inp.addEventListener('input', atualizarPreviewMedidas)
    );
    valorInput.addEventListener('input', atualizarPreviewMedidas);

    atualizarPreviewMedidas();
    renderizarMedidasAdicionadas();
    irPara('tela-form-medidas');
  }

  function calcularMedidaDryWallAtual() {
    const get = id => {
      const el = document.querySelector(`.medida-input[data-campo="${id}"]`);
      return el ? (parseFloat(el.value) || 0) : 0;
    };

    const largura = get('largura');
    const comprimento = get('comprimento');
    const altura = get('altura');

    let quantidade = 0;
    let unidade = 'm²';

    if (itemSelecionado.id === 'parede') {
      quantidade = largura * altura;
      unidade = 'm²';
    } else if (itemSelecionado.id === 'forro') {
      quantidade = largura * comprimento;
      unidade = 'm²';
    } else {
      // Sanca e Moldura são lineares: os dois lados são considerados automaticamente.
      quantidade = (largura * 2) + (comprimento * 2);
      unidade = 'm';
    }

    const valor = parseFloat(document.getElementById('medidas-valor-m2').value) || 0;
    return { largura, comprimento, altura, quantidade, unidade, valor, total: quantidade * valor };
  }

  function atualizarPreviewMedidas() {
    if (modoMedidasDryWall) {
      const r = calcularMedidaDryWallAtual();
      document.getElementById('medidas-preview-area').textContent =
        r.quantidade.toFixed(2).replace('.', ',') + ' ' + r.unidade;
      document.getElementById('medidas-preview-total').textContent =
        'R$ ' + r.total.toFixed(2).replace('.', ',');
      return;
    }

    const { total } = calcularMedidas();
    if (itemSelecionado.tipo !== 'direto') {
      const { quantidade } = calcularMedidas();
      const sufixo = itemSelecionado.tipo === 'area' ? ' m²' : ' m';
      document.getElementById('medidas-preview-area').textContent =
        quantidade.toFixed(2).replace('.', ',') + sufixo;
    }
    document.getElementById('medidas-preview-total').textContent =
      'R$ ' + total.toFixed(2).replace('.', ',');
  }

  function renderizarMedidasAdicionadas() {
    const lista = document.getElementById('lista-medidas-adicionadas');
    if (!lista) return;

    if (!modoMedidasDryWall || !drywallMedidasAtual || drywallMedidasAtual.registros.length === 0) {
      lista.innerHTML = '<p class="resumo-vazio">Nenhum cômodo adicionado</p>';
      return;
    }

    lista.innerHTML = '';
    drywallMedidasAtual.registros.forEach((r, idx) => {
      const linha = document.createElement('div');
      linha.className = 'resumo-linha';
      const dim = r.itemId === 'parede'
        ? `${r.largura.toFixed(2)} × ${r.altura.toFixed(2)} m`
        : `${r.largura.toFixed(2)} × ${r.comprimento.toFixed(2)} m`;
      linha.innerHTML = `
        <span>${r.comodo || 'Sem cômodo'} — ${dim} = ${r.quantidade.toFixed(2)} ${r.unidade} · R$ ${r.total.toFixed(2)}</span>
        <button class="remover" onclick="removerMedidaDryWall(${idx})">✕</button>
      `;
      lista.appendChild(linha);
    });
  }

  function removerMedidaDryWall(idx) {
    if (!drywallMedidasAtual) return;
    const registro = drywallMedidasAtual.registros[idx];
    const pos = orcamentoAtual.findIndex(it => it._drywallRegistroId === registro.id);
    if (pos >= 0) orcamentoAtual.splice(pos, 1);
    drywallMedidasAtual.registros.splice(idx, 1);
    renderizarResumo();
    renderizarMedidasAdicionadas();
  }

  function calcularMedidas() {
    if (itemSelecionado.tipo === 'direto') {
      const valor = parseFloat(document.getElementById('medidas-valor-m2').value) || 0;
      return { quantidade: 1, total: valor, valorM2: valor };
    }

    const valores = itemSelecionado.campos.map(campo => {
      const input = document.querySelector(`.medida-input[data-campo="${campo.id}"]`);
      const v = parseFloat(input.value) || 0;
      return camposX2Ativos.has(campo.id) ? v * 2 : v;
    });
    const valorM2 = parseFloat(document.getElementById('medidas-valor-m2').value) || 0;

    let quantidade;
    if (itemSelecionado.tipo === 'area') {
      quantidade = valores[0] * valores[1];
    } else {
      // linear-x2: soma os campos (cada um já dobrado se seu X2 estiver ativo)
      quantidade = valores.reduce((soma, v) => soma + v, 0);
    }
    return { quantidade, total: quantidade * valorM2, valorM2 };
  }

  function confirmarItemMedidas() {
    if (modoMedidasDryWall) {
      const r = calcularMedidaDryWallAtual();
      const comodo = document.getElementById('medidas-comodo').value.trim();

      if (!comodo) { alert('Informe o nome do cômodo.'); return; }
      if (r.largura <= 0 || (itemSelecionado.id !== 'parede' && r.comprimento <= 0) ||
          (itemSelecionado.id === 'parede' && r.altura <= 0)) {
        alert('Informe todas as medidas do cômodo.');
        return;
      }
      if (r.valor <= 0) { alert('Informe o valor por metro/m².'); return; }

      if (drywallMedidasAtual.registros.length === 0) {
        drywallMedidasAtual.valorM2 = r.valor;
        document.getElementById('medidas-valor-m2').readOnly = true;
        document.getElementById('medidas-valor-m2').style.opacity = '0.7';
      } else if (Math.abs(r.valor - drywallMedidasAtual.valorM2) > 0.0001) {
        alert('O valor por metro/m² já foi definido para esta categoria. Ele será usado nos próximos cômodos.');
        document.getElementById('medidas-valor-m2').value = drywallMedidasAtual.valorM2;
        return;
      }

      const registro = {
        id: Date.now() + Math.random(),
        itemId: itemSelecionado.id,
        nome: itemSelecionado.nome,
        comodo,
        largura: r.largura,
        comprimento: r.comprimento,
        altura: r.altura,
        quantidade: r.quantidade,
        unidade: r.unidade,
        valor: drywallMedidasAtual.valorM2,
        total: r.quantidade * drywallMedidasAtual.valorM2
      };

      drywallMedidasAtual.registros.push(registro);
      orcamentoAtual.push({
        categoria: categoriaAtual.nome,
        nome: itemSelecionado.nome,
        comodo,
        quantidade: registro.quantidade,
        unidade: registro.unidade,
        maoDeObraUnit: registro.valor,
        valorFixo: false,
        total: registro.total,
        largura: registro.largura,
        comprimento: registro.comprimento,
        altura: registro.altura,
        _drywallRegistroId: registro.id
      });

      renderizarResumo();
      renderizarMedidasAdicionadas();

      // Limpa somente as medidas do novo cômodo. O valor continua preenchido.
      document.getElementById('medidas-comodo').value = '';
      document.querySelectorAll('.medida-input').forEach(inp => inp.value = '');
      atualizarPreviewMedidas();
      return;
    }

    const { quantidade, total, valorM2 } = calcularMedidas();

    if (itemSelecionado.tipo === 'direto') {
      if (!valorM2 || valorM2 <= 0) { alert('Informe o valor.'); return; }

      const detalhes = itemSelecionado.campos
        .map(campo => {
          const input = document.querySelector(`.medida-input[data-campo="${campo.id}"]`);
          const v = input.value.trim();
          return v ? `${campo.label}: ${v}` : null;
        })
        .filter(Boolean)
        .join(', ');

      orcamentoAtual.push({
        categoria: categoriaAtual.nome,
        nome: detalhes ? `${itemSelecionado.nome} (${detalhes})` : itemSelecionado.nome,
        comodo: document.getElementById('medidas-comodo').value.trim(),
        quantidade: 1,
        unidade: '',
        maoDeObraUnit: valorM2,
        valorFixo: true,
        total: total,
      });

      renderizarResumo();
      irPara('tela-itens');
      return;
    }

    if (quantidade <= 0) { alert('Informe as medidas do item.'); return; }
    if (!valorM2 || valorM2 <= 0) { alert('Informe o valor por m².'); return; }

    const novoItem = {
      categoria: categoriaAtual.nome,
      nome: itemSelecionado.nome,
      comodo: document.getElementById('medidas-comodo').value.trim(),
      quantidade: quantidade,
      unidade: itemSelecionado.tipo === 'area' ? 'm²' : 'm',
      maoDeObraUnit: valorM2,
      valorFixo: false,
      total: total,
    };

    // Guarda altura/largura separadas para o cálculo de materiais da Parede de dry wall
    if (itemSelecionado.id === 'parede') {
      const inputAltura = document.querySelector('.medida-input[data-campo="altura"]');
      const inputLargura = document.querySelector('.medida-input[data-campo="largura"]');
      novoItem.altura = parseFloat(inputAltura.value) || 0;
      novoItem.largura = parseFloat(inputLargura.value) || 0;
    }

    // Guarda largura/comprimento separados para o cálculo da Canaleta F530 do Forro
    if (itemSelecionado.id === 'forro') {
      const inputLargura = document.querySelector('.medida-input[data-campo="largura"]');
      const inputComprimento = document.querySelector('.medida-input[data-campo="comprimento"]');
      novoItem.largura = parseFloat(inputLargura.value) || 0;
      novoItem.comprimento = parseFloat(inputComprimento.value) || 0;
    }

    orcamentoAtual.push(novoItem);

    renderizarResumo();
    irPara('tela-itens');
  }

  /* ---------- TELA 4: RELATÓRIO ---------- */
  function finalizarOrcamento() {
    if (orcamentoAtual.length === 0) {
      alert('Adicione ao menos um item antes de finalizar.');
      return;
    }

    const categoriasEnvolvidas = [...new Set(orcamentoAtual.map(it => it.categoria))];
    document.getElementById('relatorio-categoria').textContent = categoriasEnvolvidas.join(' · ');

    const lista = document.getElementById('relatorio-lista');
    lista.innerHTML = '';
    let total = 0;

    if (dadosCliente.nome || dadosCliente.empresa || dadosCliente.telefone || dadosCliente.endereco) {
      const clienteBox = document.createElement('div');
      clienteBox.className = 'resumo-box';
      clienteBox.style.marginBottom = '4px';
      clienteBox.innerHTML = `
        <p class="resumo-titulo">DADOS DO CLIENTE</p>
        ${dadosCliente.nome ? `<div class="resumo-linha"><span>${dadosCliente.nome}</span></div>` : ''}
        ${dadosCliente.empresa ? `<div class="resumo-linha"><span>Empresa: ${dadosCliente.empresa}</span></div>` : ''}
        ${dadosCliente.telefone ? `<div class="resumo-linha"><span>${dadosCliente.telefone}</span></div>` : ''}
        ${dadosCliente.endereco ? `<div class="resumo-linha"><span>${dadosCliente.endereco}</span></div>` : ''}
        ${dadosCliente.obs ? `<div class="resumo-linha"><span>${dadosCliente.obs}</span></div>` : ''}
      `;
      lista.appendChild(clienteBox);
    }

    categoriasEnvolvidas.forEach(cat => {
      const tituloCat = document.createElement('p');
      tituloCat.className = 'resumo-titulo';
      tituloCat.style.marginTop = '4px';
      tituloCat.textContent = cat.toUpperCase();
      lista.appendChild(tituloCat);

      const itensCategoria = orcamentoAtual.filter(it => it.categoria === cat);

      // Agrupa por nome mantendo a ordem de primeira aparição
      const gruposOrdenados = [];
      const indiceGrupo = {};
      itensCategoria.forEach(it => {
        if (!(it.nome in indiceGrupo)) {
          indiceGrupo[it.nome] = gruposOrdenados.length;
          gruposOrdenados.push({ nome: it.nome, itens: [] });
        }
        gruposOrdenados[indiceGrupo[it.nome]].itens.push(it);
      });

      gruposOrdenados.forEach(grupo => {
        grupo.itens.forEach(it => {
          total += it.total;
          const unidadeTxt = it.unidade === 'm' ? 'metros' : (it.unidade === 'm²' ? 'm²' : 'unidades');
          const linhaDetalhe = it.unidade === ''
            ? ''
            : `${it.quantidade.toFixed(2)} ${unidadeTxt}${it.valorFixo ? '' : ' × R$ ' + it.maoDeObraUnit.toFixed(2)}`;
          const linha = document.createElement('div');
          linha.className = 'relatorio-item';
          linha.innerHTML = `
            <div>
              <div>${nomeExibicao(it)}</div>
              <div class="qtd">${linhaDetalhe}</div>
            </div>
            <div>R$ ${it.total.toFixed(2)}</div>
          `;
          lista.appendChild(linha);
        });

        // Subtotal automático logo após o grupo, quando o mesmo item aparece mais de uma vez
        if (grupo.itens.length >= 2) {
          const somaQtd = grupo.itens.reduce((s, it) => s + it.quantidade, 0);
          const somaTotal = grupo.itens.reduce((s, it) => s + it.total, 0);
          const unidadeTxt = grupo.itens[0].unidade === 'm' ? 'metros' : (grupo.itens[0].unidade === 'm²' ? 'm²' : (grupo.itens[0].unidade === '' ? '' : 'unidades'));
          const subtotal = document.createElement('div');
          subtotal.className = 'relatorio-item';
          subtotal.style.fontWeight = '700';
          subtotal.style.borderTop = '1px dashed var(--linha)';
          subtotal.style.paddingTop = '6px';
          subtotal.innerHTML = `
            <div>
              <div>Total ${grupo.nome}</div>
              <div class="qtd">${unidadeTxt ? somaQtd.toFixed(2) + ' ' + unidadeTxt : ''}</div>
            </div>
            <div>R$ ${somaTotal.toFixed(2)}</div>
          `;
          lista.appendChild(subtotal);
        }
      });
    });

    const materiaisDrywall = calcularMateriaisDrywall();
    document.getElementById('btn-pdf-drywall').style.display = materiaisDrywall.length > 0 ? 'block' : 'none';
    document.getElementById('btn-pdf-medidas-drywall').style.display = orcamentoAtual.some(it => it.categoria === 'Dry Wall') ? 'block' : 'none';
    materiaisDrywall.forEach(bloco => {
      const box = document.createElement('div');
      box.className = 'resumo-box';
      box.style.marginTop = '4px';
      let linhasHtml = bloco.itens.map(item =>
        `<div class="resumo-linha"><span>${item.nome}</span><span>${item.quantidade} ${item.unidade}</span></div>`
      ).join('');
      box.innerHTML = `
        <p class="resumo-titulo">MATERIAIS ESTIMADOS — ${bloco.titulo.toUpperCase()} (${bloco.area.toFixed(2)} m²)</p>
        ${linhasHtml}
        <p style="color:var(--texto-suave); font-size:11px; margin:8px 0 0 0;">Estimativa de mercado — confirme com seu fornecedor.</p>
      `;
      lista.appendChild(box);
    });

    document.getElementById('relatorio-total').textContent =
      'R$ ' + total.toFixed(2).replace('.', ',');

    irPara('tela-relatorio');
  }

  /* ---------- ORÇAMENTOS SALVOS ---------- */
  function formatarDataHora(iso) {
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hh}:${mm}`;
  }

  function salvarOrcamentoAtual() {
    if (orcamentoAtual.length === 0) {
      alert('Adicione ao menos um item antes de salvar.');
      return;
    }
    const total = orcamentoAtual.reduce((s, it) => s + it.total, 0);
    const agora = new Date().toISOString();

    if (orcamentoEmEdicaoId) {
      const idx = orcamentosSalvos.findIndex(o => o.id === orcamentoEmEdicaoId);
      if (idx >= 0) {
        orcamentosSalvos[idx] = {
          ...orcamentosSalvos[idx],
          dadosCliente: JSON.parse(JSON.stringify(dadosCliente)),
          itens: JSON.parse(JSON.stringify(orcamentoAtual)),
          total,
          dataAtualizacao: agora,
        };
      } else {
        orcamentoEmEdicaoId = null;
      }
    }
    if (!orcamentoEmEdicaoId) {
      orcamentoEmEdicaoId = idUnico();
      orcamentosSalvos.push({
        id: orcamentoEmEdicaoId,
        dadosCliente: JSON.parse(JSON.stringify(dadosCliente)),
        itens: JSON.parse(JSON.stringify(orcamentoAtual)),
        total,
        dataCriacao: agora,
        dataAtualizacao: agora,
      });
    }

    persistirOrcamentosSalvos();
    abrirDetalheOrcamentoSalvo(orcamentoEmEdicaoId);
  }

  function abrirTelaOrcamentosSalvos() {
    renderizarListaOrcamentosSalvos();
    irPara('tela-orcamentos-salvos');
  }

  function renderizarListaOrcamentosSalvos() {
    const container = document.getElementById('lista-orcamentos-salvos');
    if (orcamentosSalvos.length === 0) {
      container.innerHTML = '<p class="resumo-vazio">Nenhum orçamento salvo ainda</p>';
      return;
    }
    const ordenados = [...orcamentosSalvos].sort((a, b) => b.dataAtualizacao.localeCompare(a.dataAtualizacao));
    container.innerHTML = '';
    ordenados.forEach(orc => {
      const btn = document.createElement('button');
      btn.className = 'categoria';
      const nomeCliente = orc.dadosCliente?.nome || 'Cliente não informado';
      btn.innerHTML = `
        <div class="icone">📋</div>
        <div class="info">
          <p class="nome">${nomeCliente}</p>
          <p class="desc">${formatarDataHora(orc.dataAtualizacao)} · R$ ${orc.total.toFixed(2)}</p>
        </div>
        <div class="seta">›</div>
      `;
      btn.addEventListener('click', () => abrirDetalheOrcamentoSalvo(orc.id));
      container.appendChild(btn);
    });
  }

  function abrirDetalheOrcamentoSalvo(id) {
    const orc = orcamentosSalvos.find(o => o.id === id);
    if (!orc) { abrirTelaOrcamentosSalvos(); return; }
    orcamentoSelecionadoId = id;

    document.getElementById('detalhe-titulo').textContent = orc.dadosCliente?.nome || 'Cliente não informado';
    document.getElementById('detalhe-data').textContent =
      `Salvo em ${formatarDataHora(orc.dataAtualizacao)} · R$ ${orc.total.toFixed(2)}`;

    const cont = document.getElementById('detalhe-conteudo');
    cont.innerHTML = '';

    const cli = orc.dadosCliente || {};
    if (cli.nome || cli.empresa || cli.telefone || cli.endereco) {
      const box = document.createElement('div');
      box.className = 'resumo-box';
      box.innerHTML = `
        <p class="resumo-titulo">DADOS DO CLIENTE</p>
        ${cli.nome ? `<div class="resumo-linha"><span>${cli.nome}</span></div>` : ''}
        ${cli.empresa ? `<div class="resumo-linha"><span>Empresa: ${cli.empresa}</span></div>` : ''}
        ${cli.telefone ? `<div class="resumo-linha"><span>${cli.telefone}</span></div>` : ''}
        ${cli.endereco ? `<div class="resumo-linha"><span>${cli.endereco}</span></div>` : ''}
      `;
      cont.appendChild(box);
    }

    const categorias = [...new Set(orc.itens.map(it => it.categoria))];
    categorias.forEach(cat => {
      const titulo = document.createElement('p');
      titulo.className = 'resumo-titulo';
      titulo.style.marginTop = '4px';
      titulo.textContent = cat.toUpperCase();
      cont.appendChild(titulo);

      orc.itens.filter(it => it.categoria === cat).forEach(it => {
        const linha = document.createElement('div');
        linha.className = 'relatorio-item';
        const unidadeTxt = it.unidade === 'm' ? 'metros' : (it.unidade === 'm²' ? 'm²' : (it.unidade === '' ? '' : 'unidades'));
        linha.innerHTML = `
          <div>
            <div>${nomeExibicao(it)}</div>
            <div class="qtd">${unidadeTxt ? it.quantidade.toFixed(2) + ' ' + unidadeTxt : ''}</div>
          </div>
          <div>R$ ${it.total.toFixed(2)}</div>
        `;
        cont.appendChild(linha);
      });
    });

    irPara('tela-orcamento-detalhe');
  }

  function editarOrcamentoSalvo() {
    const orc = orcamentosSalvos.find(o => o.id === orcamentoSelecionadoId);
    if (!orc) return;
    dadosCliente = JSON.parse(JSON.stringify(orc.dadosCliente));
    orcamentoAtual = JSON.parse(JSON.stringify(orc.itens));
    orcamentoEmEdicaoId = orc.id;
    renderizarResumo();
    irPara('tela-home');
  }

  function enviarOrcamentoSalvo() {
    const orc = orcamentosSalvos.find(o => o.id === orcamentoSelecionadoId);
    if (!orc) return;
    const orcamentoAtualBackup = orcamentoAtual;
    const dadosClienteBackup = dadosCliente;
    orcamentoAtual = orc.itens;
    dadosCliente = orc.dadosCliente;
    try {
      gerarEEnviarPDF();
    } finally {
      orcamentoAtual = orcamentoAtualBackup;
      dadosCliente = dadosClienteBackup;
    }
  }

  function excluirOrcamentoSalvo() {
    if (!confirm('Excluir este orçamento salvo? Essa ação não pode ser desfeita.')) return;
    orcamentosSalvos = orcamentosSalvos.filter(o => o.id !== orcamentoSelecionadoId);
    if (orcamentoEmEdicaoId === orcamentoSelecionadoId) orcamentoEmEdicaoId = null;
    persistirOrcamentosSalvos();
    orcamentoSelecionadoId = null;
    abrirTelaOrcamentosSalvos();
  }

  /* ---------- TELA 3C: LISTA DE MATERIAIS (PINTURA) ---------- */
  function abrirTelaMateriais() {
    const container = document.getElementById('materiais-campos');
    container.innerHTML = '';
    adicionarCamposMateriais(5);
    irPara('tela-materiais');
  }

  function adicionarCamposMateriais(qtd) {
    const container = document.getElementById('materiais-campos');
    for (let i = 0; i < qtd; i++) {
      const div = document.createElement('div');
      div.className = 'campo';
      div.innerHTML = `<input type="text" class="material-input" placeholder="Ex: 2 latas de tinta branca 18L">`;
      container.appendChild(div);
    }
  }


  /* ---------- INICIALIZAÇÃO ---------- */
  renderizarResumo();

  /* ---------- PWA: REGISTRO DO SERVICE WORKER ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
