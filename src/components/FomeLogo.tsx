import React from 'react';

interface FomeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'cheddar' | 'white' | 'dark';
}

export const FomeLogo: React.FC<FomeLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'cheddar',
}) => {
  const sizeMap = {
    sm: { box: 'w-14 h-9', text: 'text-xs', barH: 'h-1' },
    md: { box: 'w-20 h-12', text: 'text-base', barH: 'h-1.5' },
    lg: { box: 'w-28 h-16', text: 'text-xl', barH: 'h-2' },
    xl: { box: 'w-36 h-22', text: 'text-3xl', barH: 'h-2.5' },
  };

  const colorMap = {
    cheddar: {
      bg: 'bg-[#FFA000]',
      text: 'text-[#FFA000]',
      border: 'border-[#FFA000]',
    },
    white: {
      bg: 'bg-white',
      text: 'text-white',
      border: 'border-white',
    },
    dark: {
      bg: 'bg-black',
      text: 'text-black',
      border: 'border-black',
    },
  };

  const { box, text, barH } = sizeMap[size];
  const { bg, text: textColor } = colorMap[variant];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${box} ${className}`}>
      {/* Top burger bun stamp arch */}
      <div className={`w-full ${barH} ${bg} rounded-t-full mb-0.5`} />
      
      {/* Stamp word: FOME */}
      <div className={`font-brand font-black tracking-tight uppercase leading-none ${text} ${textColor} text-center px-1`}>
        FOME
      </div>

      {/* Bottom burger bun stamp base */}
      <div className={`w-full ${barH} ${bg} rounded-b-md mt-0.5`} />
    </div>
  );
};
