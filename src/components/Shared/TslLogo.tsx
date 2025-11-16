import React from 'react';

const colorLogoPath = '/src/assets/logo/tsl-logo-color.svg';
const whiteLogoPath = '/src/assets/logo/tsl-logo-white.svg';

type TslLogoVariant = 'header' | 'inline';

interface TslLogoProps {
  variant?: TslLogoVariant;
  className?: string;
}

export const TslLogo: React.FC<TslLogoProps> = ({ variant = 'inline', className }) => {
  const src = variant === 'header' ? whiteLogoPath : colorLogoPath;
  return <img src={src} className={className} alt="TS Logistik logo" />;
};
