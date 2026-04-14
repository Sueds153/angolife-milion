
import React from 'react';
import { CVData } from '../../types';
import { ClassicTemplate } from './ClassicTemplate';
import { ModernTemplate } from './ModernTemplate';
import { MinimalistTemplate } from './MinimalistTemplate';
import { TechnicalTemplate } from './TechnicalTemplate';

export type CVTemplateType = 'classic' | 'modern' | 'minimalist' | 'technical';

export interface TemplateSharedProps {
    cv: CVData;
    educationFirst?: boolean;
}

interface CVTemplateSelectorProps extends TemplateSharedProps {
    type: CVTemplateType;
}

export const CVTemplateSelector: React.FC<CVTemplateSelectorProps> = ({ type, cv, educationFirst }) => {
    const props: TemplateSharedProps = { cv, educationFirst };

    // Objeto de Temas para fácil escalabilidade
    const templates: Record<CVTemplateType, React.ReactNode> = {
        classic: <ClassicTemplate {...props} />,
        modern: <ModernTemplate {...props} />,
        minimalist: <MinimalistTemplate {...props} />,
        technical: <TechnicalTemplate {...props} />,
    };

    return <>{templates[type] || templates.classic}</>;
};

export const TEMPLATE_OPTIONS = [
    { id: 'classic', name: 'Clássico', description: 'Top bar com foto circular' },
    { id: 'modern', name: 'Moderno', description: 'Design executivo azul marinho' },
    { id: 'minimalist', name: 'Minimalista', description: 'Barra lateral azul profunda' },
    { id: 'technical', name: 'Criativo', description: 'Gradientes e visual dinâmico' },
] as const;
