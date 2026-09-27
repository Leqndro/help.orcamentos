  /* ---------- MARCA D'ÁGUA (usada em todos os PDFs) ---------- */
  function adicionarMarcaDagua(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPaginas; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      // Cantos superiores (sobre a faixa escura do cabeçalho)
      doc.setTextColor(255, 255, 255);
      doc.text('Help Orçamentos', 4, 6);
      doc.text('Help Orçamentos', pageWidth - 4, 6, { align: 'right' });
      // Cantos inferiores (fundo branco)
      doc.setTextColor(200, 200, 200);
      doc.text('Help Orçamentos', 4, pageHeight - 3);
      doc.text('Help Orçamentos', pageWidth - 4, pageHeight - 3, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0);
  }

  function gerarPDFMedidasDryWall() {
    const itens = orcamentoAtual.filter(it => it.categoria === 'Dry Wall' && it._drywallRegistroId);
    if (itens.length === 0) {
      alert('Adicione medidas de Dry Wall ao orçamento antes de gerar o PDF.');
      return;
    }

    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Não foi possível carregar a biblioteca de PDF. Verifique sua conexão com a internet.');
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margemEsq = 14;
      const margemDir = pageWidth - 14;
      const centro = pageWidth / 2;
      const CONCRETO = [43, 47, 51];
      const AMARELO = [245, 166, 35];
      const CINZA_CLARO = [244, 244, 244];
      const CINZA_TEXTO = [110, 110, 110];
      const PRETO = [25, 25, 25];

      const headerH = 58;
      doc.setFillColor(...CONCRETO);
      doc.rect(0, 0, pageWidth, headerH, 'F');
      doc.setFillColor(...AMARELO);
      doc.rect(0, headerH, pageWidth, 1.5, 'F');
      const logoSize = 46;
      doc.addImage(LOGO_BASE64, 'PNG', centro - logoSize/2, (headerH-logoSize)/2, logoSize, logoSize);

      let y = headerH + 14;
      const hoje = new Date();
      const dataEmissao = String(hoje.getDate()).padStart(2, '0') + '/' +
        String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();

      doc.setFontSize(9);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text('MEDIDAS DRY WALL', margemEsq, y);
      doc.text('Emitido em: ' + dataEmissao, margemDir, y, { align: 'right' });
      doc.setTextColor(...PRETO);
      y += 12;

      const categorias = [...new Set(itens.map(it => it.nome))];
      categorias.forEach(nome => {
        const grupo = itens.filter(it => it.nome === nome);
        if (y > 260) { doc.addPage(); y = 20; }

        doc.setFillColor(...AMARELO);
        doc.rect(margemEsq, y, margemDir - margemEsq, 7, 'F');
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...CONCRETO);
        doc.text(nome.toUpperCase(), margemEsq + 3, y + 5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...PRETO);
        y += 11;

        let zebra = false;
        grupo.forEach(it => {
          if (y > 270) { doc.addPage(); y = 20; }

          if (zebra) {
            doc.setFillColor(...CINZA_CLARO);
            doc.rect(margemEsq, y - 4.5, margemDir - margemEsq, 8, 'F');
          }
          zebra = !zebra;

          const linhaMedidas = it.nome === 'Parede de dry wall'
            ? `Largura: ${it.largura.toFixed(2)} m   Altura: ${it.altura.toFixed(2)} m`
            : `Largura: ${it.largura.toFixed(2)} m   Comprimento: ${it.comprimento.toFixed(2)} m`;

          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(it.comodo || 'Sem cômodo', margemEsq + 2, y);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...CINZA_TEXTO);
          doc.text(linhaMedidas, margemEsq + 2, y + 5);
          doc.setTextColor(...PRETO);
          doc.setFontSize(10);
          doc.text(`= ${it.quantidade.toFixed(2)} ${it.unidade}`, margemDir - 2, y + 5, { align: 'right' });
          y += 12;
        });

        const totalGrupo = grupo.reduce((sum, it) => sum + it.quantidade, 0);
        const valorGrupo = grupo.reduce((sum, it) => sum + it.total, 0);
        y += 2;
        doc.setFont(undefined, 'bold');
        doc.text(`Subtotal: ${totalGrupo.toFixed(2)} ${grupo[0].unidade}`, margemEsq + 2, y);
        doc.text(`R$ ${valorGrupo.toFixed(2)}`, margemDir - 2, y, { align: 'right' });
        doc.setFont(undefined, 'normal');
        y += 10;
      });

      const totalMetragem = itens.reduce((sum, it) => sum + it.quantidade, 0);
      const totalValor = itens.reduce((sum, it) => sum + it.total, 0);

      if (y > 255) { doc.addPage(); y = 25; }
      doc.setFillColor(...AMARELO);
      doc.roundedRect(margemEsq, y, margemDir - margemEsq, 18, 3, 3, 'F');
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...CONCRETO);
      doc.text(`TOTAL DE METRAGEM: ${totalMetragem.toFixed(2)} ${itens.some(it => it.unidade === 'm²') ? 'm²' : 'm'}`, margemEsq + 4, y + 7);
      doc.text(`VALOR TOTAL: R$ ${totalValor.toFixed(2)}`, margemDir - 4, y + 7, { align: 'right' });
      doc.setFont(undefined, 'normal');

      // Dados do cliente, seguindo o mesmo padrão dos demais PDFs.
      if (dadosCliente.nome || dadosCliente.empresa || dadosCliente.telefone || dadosCliente.endereco) {
        y += 27;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('CLIENTE', margemEsq, y);
        y += 6;
        doc.setTextColor(...PRETO);
        doc.setFontSize(10);
        if (dadosCliente.nome) { doc.text(dadosCliente.nome, margemEsq, y); y += 5; }
        if (dadosCliente.empresa) { doc.text('Empresa: ' + dadosCliente.empresa, margemEsq, y); y += 5; }
        if (dadosCliente.telefone) { doc.text('Telefone: ' + dadosCliente.telefone, margemEsq, y); y += 5; }
        if (dadosCliente.endereco) { doc.text('Endereço: ' + dadosCliente.endereco, margemEsq, y); }
      }

      const totalPaginas = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p);
        doc.setDrawColor(210, 210, 210);
        doc.line(margemEsq, pageHeight - 22, margemDir, pageHeight - 22);
        doc.setFontSize(8);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('Página ' + p + ' de ' + totalPaginas, margemEsq, pageHeight - 15);
      }

      adicionarMarcaDagua(doc);
      const nomeArquivo = 'medidas.pdf';
      const blob = doc.output('blob');
      const arquivo = new File([blob], nomeArquivo, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        navigator.share({
          files: [arquivo],
          title: 'Medidas Dry Wall',
          text: 'Segue o PDF de medidas do Dry Wall em anexo.',
        }).catch(() => doc.save(nomeArquivo));
      } else {
        doc.save(nomeArquivo);
        alert('Seu navegador não suporta compartilhamento direto. O PDF foi baixado — envie manualmente pelo WhatsApp.');
      }
    } catch (erro) {
      console.error(erro);
      alert('Ocorreu um erro ao gerar o PDF: ' + erro.message);
    }
  }

  function gerarPDFMateriaisDrywall() {
    const materiaisDrywall = calcularMateriaisDrywall();
    if (materiaisDrywall.length === 0) {
      alert('Adicione itens de Parede de dry wall ou Forro ao orçamento para calcular os materiais.');
      return;
    }

    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Não foi possível carregar a biblioteca de PDF. Verifique sua conexão com a internet e tente novamente.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margemEsq = 14;
      const margemDir = pageWidth - 14;
      const centro = pageWidth / 2;

      const CONCRETO = [43, 47, 51];
      const AMARELO = [245, 166, 35];
      const CINZA_CLARO = [244, 244, 244];
      const CINZA_TEXTO = [110, 110, 110];
      const PRETO = [25, 25, 25];

      const headerH = 58;
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, headerH, 'F');
      doc.setFillColor(...AMARELO);
      doc.rect(0, headerH, pageWidth, 1.5, 'F');
      const logoSize = 46;
      doc.addImage(LOGO_BASE64, 'PNG', centro - logoSize/2, (headerH-logoSize)/2, logoSize, logoSize);

      let y = headerH + 14;
      const hoje = new Date();
      const dataEmissao = String(hoje.getDate()).padStart(2, '0') + '/' +
        String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
      doc.setFontSize(9);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text('MATERIAIS DRY WALL', margemEsq, y);
      doc.text('Emitido em: ' + dataEmissao, margemDir, y, { align: 'right' });
      doc.setTextColor(...PRETO);
      y += 12;

      materiaisDrywall.forEach(bloco => {
        if (y > 260) { doc.addPage(); y = 20; }

        doc.setFillColor(...AMARELO);
        doc.rect(margemEsq, y, margemDir - margemEsq, 7, 'F');
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...CONCRETO);
        doc.text(`${bloco.titulo.toUpperCase()} (${bloco.area.toFixed(2)} m²)`, margemEsq + 3, y + 5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...PRETO);
        y += 11;

        let zebra = false;
        bloco.itens.forEach(item => {
          if (y > 270) { doc.addPage(); y = 20; }
          if (zebra) {
            doc.setFillColor(...CINZA_CLARO);
            doc.rect(margemEsq, y - 4.5, margemDir - margemEsq, 7, 'F');
          }
          zebra = !zebra;
          doc.setFontSize(10);
          doc.text(item.nome, margemEsq + 2, y);
          doc.text(`${item.quantidade} ${item.unidade}`, margemDir - 2, y, { align: 'right' });
          y += 7;
        });

        y += 3;
        doc.setFontSize(8);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('Estimativa de mercado — confirme com seu fornecedor.', margemEsq + 2, y);
        doc.setTextColor(...PRETO);
        y += 8;
      });

      const totalPaginas = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p);
        doc.setDrawColor(210, 210, 210);
        doc.line(margemEsq, pageHeight - 22, margemDir, pageHeight - 22);
        doc.setFontSize(8);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('Página ' + p + ' de ' + totalPaginas, margemEsq, pageHeight - 15);

        if (p === totalPaginas && (meuNome || meuTelefone || empresaNome || empresaCnpj)) {
          const linhasRodape = [];
          if (empresaNome) linhasRodape.push({ texto: 'Empresa: ' + empresaNome, tamanho: 9, cor: PRETO });
          if (empresaCnpj) linhasRodape.push({ texto: 'CNPJ: ' + empresaCnpj, tamanho: 8, cor: CINZA_TEXTO });
          if (meuNome) linhasRodape.push({ texto: 'Enviado por: ' + meuNome, tamanho: 9, cor: PRETO });
          if (meuTelefone) linhasRodape.push({ texto: meuTelefone, tamanho: 8, cor: CINZA_TEXTO });
          let yRodape = pageHeight - 16 - (linhasRodape.length - 1) * 5;
          linhasRodape.forEach(linha => {
            doc.setFontSize(linha.tamanho);
            doc.setTextColor(...linha.cor);
            doc.text(linha.texto, margemDir, yRodape, { align: 'right' });
            yRodape += 5;
          });
        }
      }

      const nomeArquivo = 'materiais-drywall.pdf';
      adicionarMarcaDagua(doc);
      const blob = doc.output('blob');
      const arquivo = new File([blob], nomeArquivo, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        navigator.share({
          files: [arquivo],
          title: 'Materiais Dry Wall',
          text: 'Segue a lista de materiais de dry wall em anexo.',
        }).catch(() => doc.save(nomeArquivo));
      } else {
        doc.save(nomeArquivo);
        alert('Seu navegador não suporta compartilhamento direto. O PDF foi baixado — envie manualmente pelo WhatsApp.');
      }
    } catch (erro) {
      console.error(erro);
      alert('Ocorreu um erro ao gerar o PDF: ' + erro.message);
    }
  }

  function gerarPDFMateriais() {
    const valores = Array.from(document.querySelectorAll('.material-input'))
      .map(inp => inp.value.trim())
      .filter(v => v.length > 0);

    if (valores.length === 0) {
      alert('Preencha ao menos um material antes de finalizar.');
      return;
    }

    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Não foi possível carregar a biblioteca de PDF. Verifique sua conexão com a internet e tente novamente.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margemEsq = 14;
      const margemDir = pageWidth - 14;
      const centro = pageWidth / 2;

      const CONCRETO = [43, 47, 51];
      const AMARELO = [245, 166, 35];
      const CINZA_CLARO = [244, 244, 244];
      const CINZA_TEXTO = [110, 110, 110];
      const PRETO = [25, 25, 25];

      const headerH = 58;
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, headerH, 'F');
      doc.setFillColor(...AMARELO);
      doc.rect(0, headerH, pageWidth, 1.5, 'F');
      const logoSize = 46;
      doc.addImage(LOGO_BASE64, 'PNG', centro - logoSize/2, (headerH-logoSize)/2, logoSize, logoSize);

      let y = headerH + 14;
      const hoje = new Date();
      const dataEmissao = String(hoje.getDate()).padStart(2, '0') + '/' +
        String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
      doc.setFontSize(9);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text('LISTA DE MATERIAIS', margemEsq, y);
      doc.text('Emitido em: ' + dataEmissao, margemDir, y, { align: 'right' });
      doc.setTextColor(...PRETO);

      y += 12;

      let zebra = false;
      valores.forEach((material, idx) => {
        y = y > 275 ? (doc.addPage(), 20) : y;
        if (zebra) {
          doc.setFillColor(...CINZA_CLARO);
          doc.rect(margemEsq, y - 4.5, margemDir - margemEsq, 7, 'F');
        }
        zebra = !zebra;
        doc.setFontSize(10);
        doc.setTextColor(...PRETO);
        doc.text(`${idx + 1}. ${material}`, margemEsq + 2, y);
        y += 7;
      });

      const totalPaginas = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p);
        doc.setDrawColor(210, 210, 210);
        doc.line(margemEsq, pageHeight - 22, margemDir, pageHeight - 22);
        doc.setFontSize(8);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('Página ' + p + ' de ' + totalPaginas, margemEsq, pageHeight - 15);

        if (p === totalPaginas && (meuNome || meuTelefone || empresaNome || empresaCnpj)) {
          const linhasRodape = [];
          if (empresaNome) linhasRodape.push({ texto: 'Empresa: ' + empresaNome, tamanho: 9, cor: PRETO });
          if (empresaCnpj) linhasRodape.push({ texto: 'CNPJ: ' + empresaCnpj, tamanho: 8, cor: CINZA_TEXTO });
          if (meuNome) linhasRodape.push({ texto: 'Enviado por: ' + meuNome, tamanho: 9, cor: PRETO });
          if (meuTelefone) linhasRodape.push({ texto: meuTelefone, tamanho: 8, cor: CINZA_TEXTO });
          let yRodape = pageHeight - 16 - (linhasRodape.length - 1) * 5;
          linhasRodape.forEach(linha => {
            doc.setFontSize(linha.tamanho);
            doc.setTextColor(...linha.cor);
            doc.text(linha.texto, margemDir, yRodape, { align: 'right' });
            yRodape += 5;
          });
        }
      }

      const nomeArquivo = 'lista-materiais.pdf';
      adicionarMarcaDagua(doc);
      const blob = doc.output('blob');
      const arquivo = new File([blob], nomeArquivo, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        navigator.share({
          files: [arquivo],
          title: 'Lista de materiais',
          text: 'Segue a lista de materiais em anexo.',
        }).catch(() => doc.save(nomeArquivo));
      } else {
        doc.save(nomeArquivo);
        alert('Seu navegador não suporta compartilhamento direto. O PDF foi baixado — envie manualmente pelo WhatsApp.');
      }
    } catch (erro) {
      console.error(erro);
      alert('Ocorreu um erro ao gerar o PDF: ' + erro.message);
    }
  }

  function gerarEEnviarPDF() {
    if (orcamentoAtual.length === 0) {
      alert('Adicione ao menos um item antes de gerar o PDF.');
      return;
    }
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Não foi possível carregar a biblioteca de PDF. Verifique sua conexão com a internet e tente novamente.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margemEsq = 14;
      const margemDir = pageWidth - 14;
      const centro = pageWidth / 2;

      const CONCRETO = [43, 47, 51];
      const AMARELO = [245, 166, 35];
      const AMARELO_ESCURO = [180, 118, 14];
      const CINZA_CLARO = [244, 244, 244];
      const CINZA_TEXTO = [110, 110, 110];
      const PRETO = [25, 25, 25];

      function novaPaginaSeNecessario(yAtual, limite) {
        if (yAtual > limite) {
          doc.addPage();
          return 20;
        }
        return yAtual;
      }

      // ---------- CABEÇALHO (logo) ----------
      const headerH = 58;
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, headerH, 'F');
      doc.setFillColor(...AMARELO);
      doc.rect(0, headerH, pageWidth, 1.5, 'F');
      const logoSize = 46;
      doc.addImage(LOGO_BASE64, 'PNG', centro - logoSize/2, (headerH-logoSize)/2, logoSize, logoSize);

      let y = headerH + 14;

      // Data de emissão + título do documento
      doc.setFontSize(9);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text('ORÇAMENTO DE SERVIÇOS', margemEsq, y);
      const hoje = new Date();
      const dataEmissao = String(hoje.getDate()).padStart(2, '0') + '/' +
        String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
      doc.text('Emitido em: ' + dataEmissao, margemDir, y, { align: 'right' });
      doc.setTextColor(...PRETO);

      // Espaço de 3 linhas antes dos dados do cliente
      y += 18;

      // ---------- CAIXA DE DADOS DO CLIENTE ----------
      if (dadosCliente.nome || dadosCliente.empresa || dadosCliente.telefone || dadosCliente.endereco || dadosCliente.obs) {
        const linhasCliente = [];
        if (dadosCliente.nome) linhasCliente.push(['Cliente', dadosCliente.nome]);
        if (dadosCliente.empresa) linhasCliente.push(['Empresa', dadosCliente.empresa]);
        if (dadosCliente.telefone) linhasCliente.push(['Telefone', dadosCliente.telefone]);
        if (dadosCliente.endereco) linhasCliente.push(['Endereço', dadosCliente.endereco]);
        if (dadosCliente.obs) linhasCliente.push(['Obs.', dadosCliente.obs]);

        const alturaBox = 8 + linhasCliente.length * 6;
        doc.setFillColor(...CINZA_CLARO);
        doc.roundedRect(margemEsq, y, margemDir - margemEsq, alturaBox, 2, 2, 'F');

        let yCliente = y + 7;
        doc.setFontSize(10);
        linhasCliente.forEach(([label, valor]) => {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...PRETO);
          doc.text(label + ':', margemEsq + 5, yCliente);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(String(valor), margemEsq + 32, yCliente);
          yCliente += 6;
        });
        y += alturaBox;
      }

      // Espaço de 2 linhas antes dos dados do orçamento
      y += 12;

      // ---------- ITENS POR CATEGORIA ----------
      let total = 0;
      const categoriasEnvolvidas = [...new Set(orcamentoAtual.map(it => it.categoria))];

      categoriasEnvolvidas.forEach(cat => {
        y = novaPaginaSeNecessario(y, 260);

        doc.setFillColor(...AMARELO);
        doc.rect(margemEsq, y, margemDir - margemEsq, 7, 'F');
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...CONCRETO);
        doc.text(cat.toUpperCase(), margemEsq + 3, y + 5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...PRETO);
        y += 11;

        let zebra = false;
        const itensCategoria = orcamentoAtual.filter(it => it.categoria === cat);

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
            y = novaPaginaSeNecessario(y, 270);
            total += it.total;

            if (zebra) {
              doc.setFillColor(...CINZA_CLARO);
              doc.rect(margemEsq, y - 4.5, margemDir - margemEsq, 7, 'F');
            }
            zebra = !zebra;

            const unidadeTxt = it.unidade === 'm' ? 'metros' : (it.unidade === 'm²' ? 'm²' : 'unidades');
            const detalhe = it.unidade === '' ? '' : `${it.quantidade.toFixed(2)} ${unidadeTxt}`;

            doc.setFontSize(10);
            doc.text(nomeExibicao(it), margemEsq + 2, y, { maxWidth: (centro - margemEsq) - 6 });

            if (detalhe) {
              doc.setFontSize(9);
              doc.setTextColor(...CINZA_TEXTO);
              doc.text(detalhe, centro, y, { align: 'center' });
              doc.setTextColor(...PRETO);
              doc.setFontSize(10);
            }

            doc.setFont(undefined, 'bold');
            doc.text(`R$ ${it.total.toFixed(2)}`, margemDir - 2, y, { align: 'right' });
            doc.setFont(undefined, 'normal');
            y += 7;
          });

          // Subtotal automático logo após o grupo, quando o mesmo item aparece mais de uma vez
          if (grupo.itens.length >= 2) {
            y = novaPaginaSeNecessario(y, 270);
            const somaQtd = grupo.itens.reduce((s, i) => s + i.quantidade, 0);
            const somaTotal = grupo.itens.reduce((s, i) => s + i.total, 0);
            const unidadeTxt = grupo.itens[0].unidade === 'm' ? 'metros' : (grupo.itens[0].unidade === 'm²' ? 'm²' : (grupo.itens[0].unidade === '' ? '' : 'unidades'));

            doc.setDrawColor(200, 200, 200);
            doc.line(margemEsq, y - 4, margemDir, y - 4);

            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text(`Total ${grupo.nome}`, margemEsq + 2, y);
            if (unidadeTxt) {
              doc.setFontSize(9);
              doc.setTextColor(...CINZA_TEXTO);
              doc.text(`${somaQtd.toFixed(2)} ${unidadeTxt}`, centro, y, { align: 'center' });
              doc.setTextColor(...PRETO);
            }
            doc.setFontSize(10);
            doc.text(`R$ ${somaTotal.toFixed(2)}`, margemDir - 2, y, { align: 'right' });
            doc.setFont(undefined, 'normal');
            y += 7;
          }
        });

        y += 3;
      });

      // ---------- TOTAL ----------
      y = novaPaginaSeNecessario(y, 255);
      y += 3;
      doc.setFillColor(...CONCRETO);
      doc.roundedRect(margemEsq, y, margemDir - margemEsq, 12, 2, 2, 'F');
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...AMARELO);
      doc.text('TOTAL', margemEsq + 5, y + 8);
      doc.setTextColor(255, 255, 255);
      doc.text(`R$ ${total.toFixed(2)}`, margemDir - 5, y + 8, { align: 'right' });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...PRETO);

      // ---------- RODAPÉ (todas as páginas) ----------
      const totalPaginas = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p);
        doc.setDrawColor(210, 210, 210);
        doc.line(margemEsq, pageHeight - 22, margemDir, pageHeight - 22);

        doc.setFontSize(8);
        doc.setTextColor(...CINZA_TEXTO);
        doc.text('Página ' + p + ' de ' + totalPaginas, margemEsq, pageHeight - 15);

        if (p === totalPaginas && (meuNome || meuTelefone || empresaNome || empresaCnpj)) {
          const linhasRodape = [];
          if (empresaNome) linhasRodape.push({ texto: 'Empresa: ' + empresaNome, tamanho: 9, cor: PRETO });
          if (empresaCnpj) linhasRodape.push({ texto: 'CNPJ: ' + empresaCnpj, tamanho: 8, cor: CINZA_TEXTO });
          if (meuNome) linhasRodape.push({ texto: 'Enviado por: ' + meuNome, tamanho: 9, cor: PRETO });
          if (meuTelefone) linhasRodape.push({ texto: meuTelefone, tamanho: 8, cor: CINZA_TEXTO });
          let yRodape = pageHeight - 16 - (linhasRodape.length - 1) * 5;
          linhasRodape.forEach(linha => {
            doc.setFontSize(linha.tamanho);
            doc.setTextColor(...linha.cor);
            doc.text(linha.texto, margemDir, yRodape, { align: 'right' });
            yRodape += 5;
          });
        }
      }

      const nomeArquivo = `orcamento-${(dadosCliente.nome || 'cliente').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      adicionarMarcaDagua(doc);
      const blob = doc.output('blob');
      const arquivo = new File([blob], nomeArquivo, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        navigator.share({
          files: [arquivo],
          title: 'Orçamento - Help Orçamentos',
          text: 'Segue o orçamento em anexo.',
        }).catch(() => doc.save(nomeArquivo));
      } else {
        doc.save(nomeArquivo);
        alert('Seu navegador não suporta compartilhamento direto. O PDF foi baixado — envie manualmente pelo WhatsApp.');
      }
    } catch (erro) {
      console.error(erro);
      alert('Ocorreu um erro ao gerar o PDF: ' + erro.message);
    }
  }

