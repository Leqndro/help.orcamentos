  itensPorCategoria.alvenaria = [
      { id: 'revestimento-piso', nome: 'Reparo revestimento (piso/azulejo)', unidade: 'un' },
      { id: 'reparo-parede', nome: 'Reparo em parede', tipo: 'direto',
        campos: [{ id: 'largura', label: 'Largura (m)', inputType: 'number' }, { id: 'comprimento', label: 'Comprimento (m)', inputType: 'number' }] },
      { id: 'reparo-telhado', nome: 'Reparo em telhado', tipo: 'direto',
        campos: [{ id: 'descricao', label: 'Descrição', inputType: 'text' }] },
      { id: 'outros-alvenaria', nome: 'Outros', tipo: 'direto',
        campos: [{ id: 'descricao', label: 'Descrição', inputType: 'text' }] },
  ];
