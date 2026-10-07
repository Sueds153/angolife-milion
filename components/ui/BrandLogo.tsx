import React from 'react';

interface BrandLogoProps {
  /** Lado do logo em px (número) ou valor CSS (ex.: '2.5rem'). */
  size?: number | string;
  /** Classe Tailwind adicional. */
  className?: string;
  /** Texto alternativo. Usar "" quando o nome Resolve.AO já está em texto ao lado. */
  alt?: string;
  /** Força o ficheiro grande (512px) mesmo em tamanhos pequenos. */
  full?: boolean;
}

/**
 * Marca gráfica do Resolve.AO (fonte única: public/logo*.png).
 * Escolhe automaticamente a versão 128px para tamanhos <= 64px.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  className = '',
  alt = 'Resolve.AO',
  full = false,
}) => {
  const px = typeof size === 'number' ? size : undefined;
  const src = full || (px !== undefined && px > 64) ? '/logo.png' : '/logo-small.png';

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      draggable={false}
      decoding="async"
      className={`select-none shrink-0 ${className}`}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
};

export default BrandLogo;
