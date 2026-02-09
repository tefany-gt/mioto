
import React from 'react';

interface BrandLogoProps {
  className?: string;
  textClass?: string;
  variant?: 'default' | 'auth' | 'white' | 'header'; 
  // default: primary text
  // auth: white text
  // white: white text
  // header: white text (on orange)
  showText?: boolean;
}

export const downloadLogoSvg = () => {
  const svgContent = `
<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');
  </style>
  <text x="5" y="48" fill="#FF8B00" font-family="'Russo One', sans-serif" font-size="48" letter-spacing="2">MIOTO</text>
</svg>`.trim();

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'MIOTO-Brand-Logo.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", textClass="text-2xl", variant = 'default', showText = true }) => {
  
  const textColor = variant === 'auth' || variant === 'white' || variant === 'header' ? 'text-white' : 'text-primary';

  return (
    <div className={`flex items-center ${className}`}>
      {/* Aplicando a fonte Russo One (font-brand) e um tracking (espaçamento) levemente maior para elegância */}
      <span className={`font-brand tracking-wide leading-none ${textClass} ${textColor} drop-shadow-sm`}>MIOTO</span>
    </div>
  );
};
