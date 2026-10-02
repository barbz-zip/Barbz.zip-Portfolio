// barbz-zip: import schemaTypes into the future Sanity Studio configuration.
export function validateGalleryRow(value) {
  if (!value || !['single', 'pair'].includes(value.layout)) return 'Selecione uma ou duas imagens.';
  if (!['landscape', 'portrait', 'original'].includes(value.orientation)) return 'Selecione a orientação das imagens.';
  const count = value.layout === 'single' ? 1 : 2;
  return Array.isArray(value.images) && value.images.length === count
    ? true
    : `Este bloco precisa de ${count} ${count === 1 ? 'imagem' : 'imagens'}.`;
}

const imageFields = [{ name: 'alt', title: 'Texto alternativo', type: 'string', validation: rule => rule.required() }];

export const galleryRow = {
  name: 'galleryRow', title: 'Bloco de imagens', type: 'object',
  initialValue: { layout: 'single', orientation: 'landscape' },
  validation: rule => rule.custom(validateGalleryRow),
  fields: [
    { name: 'layout', title: 'Montagem', type: 'string', options: { layout: 'radio', list: [{ title: 'Uma imagem', value: 'single' }, { title: 'Duas imagens lado a lado', value: 'pair' }] }, validation: rule => rule.required() },
    { name: 'orientation', title: 'Orientação / enquadramento', type: 'string', options: { list: [{ title: 'Horizontal', value: 'landscape' }, { title: 'Vertical', value: 'portrait' }, { title: 'Proporção original', value: 'original' }] }, validation: rule => rule.required() },
    { name: 'images', title: 'Imagens (na ordem de exibição)', type: 'array', of: [{ type: 'image', options: { hotspot: true }, fields: imageFields, validation: rule => rule.required() }], validation: rule => rule.required().min(1).max(2) },
  ],
  preview: {
    select: { layout: 'layout', orientation: 'orientation', media: 'images.0' },
    prepare({ layout, orientation, media }) { return { title: layout === 'pair' ? 'Duas imagens' : 'Uma imagem', subtitle: orientation, media }; },
  },
};

export const project = {
  name: 'project', title: 'Projeto', type: 'document',
  fields: [
    { name: 'title', title: 'Nome', type: 'string', validation: rule => rule.required() },
    { name: 'slug', title: 'URL', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: rule => rule.required() },
    { name: 'year', title: 'Ano', type: 'string', validation: rule => rule.required() },
    { name: 'description', title: 'Descrição curta do pop-up', type: 'string', validation: rule => rule.required() },
    { name: 'cover', title: 'Capa', type: 'image', options: { hotspot: true }, fields: imageFields, validation: rule => rule.required() },
    { name: 'order', title: 'Ordem na home e no index', type: 'number', initialValue: 0 },
    { name: 'caseStudy', title: 'Página do projeto', type: 'object', fields: [
      { name: 'services', title: 'Serviços', type: 'string' },
      { name: 'paragraphs', title: 'Descrição (parágrafos)', type: 'array', of: [{ type: 'text' }] },
      { name: 'credits', title: 'Créditos', type: 'array', of: [{ type: 'object', fields: [{ name: 'role', title: 'Função', type: 'string' }, { name: 'name', title: 'Nome', type: 'string' }] }] },
      { name: 'gallery', title: 'Galeria do projeto', description: 'Reordene livremente. Cada bloco pode ter uma ou duas imagens, horizontais ou verticais.', type: 'array', of: [{ type: 'galleryRow' }], validation: rule => rule.required().min(1) },
    ] },
  ],
  orderings: [{ title: 'Ordem na home e no index', name: 'homeOrder', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', media: 'cover', subtitle: 'description' } },
};

export const schemaTypes = [galleryRow, project];
