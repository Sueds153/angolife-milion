import type { CVTemplateType } from './CVTemplateSelector';

export const TEMPLATE_OPTIONS: {
  id: CVTemplateType;
  name: string;
  description: string;
}[] = [
  { id: 'classic', name: 'Clássico', description: 'Top bar com foto circular' },
  { id: 'modern', name: 'Moderno', description: 'Design executivo azul marinho' },
  { id: 'minimalist', name: 'Minimalista', description: 'Barra lateral azul profunda' },
  { id: 'technical', name: 'Criativo', description: 'Gradientes e visual dinâmico' },
];