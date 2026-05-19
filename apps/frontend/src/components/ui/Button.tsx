import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const baseStyle = "flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#0071E3] text-white hover:bg-[#005bb5] hover:shadow-[0_4px_14px_0_rgba(0,113,227,0.39)]",
    secondary: "bg-white/70 backdrop-blur-md border border-black/10 text-black hover:bg-black/5 hover:shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-sm"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
