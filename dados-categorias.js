  const categorias = [
    { id: 'eletrica',  nome: 'Elétrica',   desc: 'Tomadas, fiação, plafons',      icone: '⚡' },
    { id: 'hidraulica',nome: 'Hidráulica', desc: 'Tubulações, registros, vazamentos', icone: '🔧' },
    { id: 'gesso',     nome: 'Gesso',  desc: 'Paredes, forros, sancas, molduras', icone: '▦' },
    { id: 'pintura',   nome: 'Pintura',    desc: 'Interna, externa, textura',      icone: '🖌' },
    { id: 'alvenaria', nome: 'Alvenaria',  desc: 'Muros, paredes, reboco',         icone: '🧱' },
    { id: 'ar-condicionado', nome: 'Ar Condicionado', desc: 'Instalação, limpeza e manutenção', icone: '❄️' },
  ];

  // unidade: 'un' = unidades, 'm' = metros
  const itensPorCategoria = {};
