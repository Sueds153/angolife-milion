
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
