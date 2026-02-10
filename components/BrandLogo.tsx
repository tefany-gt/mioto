
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

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", textClass = "text-2xl", variant = 'default', showText = true }) => {
  const textColor = variant === 'auth' || variant === 'white' || variant === 'header' ? 'text-white' : 'text-primary';
  const barBg = variant === 'auth' || variant === 'white' || variant === 'header' ? 'bg-white' : 'bg-primary';

  return (
    <div className={`flex items-center ${className}`}>
      {/* 3 Barras da Identidade Visual (Apenas Desktop) */}
      <div className="hidden md:flex items-end gap-1 h-8 mr-2.5">
        <div className={`w-1 h-3 ${barBg} rounded-full opacity-60`}></div>
        <div className={`w-1 h-6 ${barBg} rounded-full`}></div>
        <div className={`w-1 h-4 ${barBg} rounded-full opacity-80`}></div>
      </div>

      <span className={`font-brand tracking-wide leading-none ${textClass} ${textColor} drop-shadow-sm`}>MIOTO</span>
    </div>
  );
};
