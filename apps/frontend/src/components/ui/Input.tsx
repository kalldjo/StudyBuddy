import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-zinc-600 ml-1">{label}</label>}
      <input 
        className={`w-full bg-white/50 backdrop-blur-md border border-white/40 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)] text-black rounded-xl px-4 py-2.5 outline-none transition-all focus:bg-white/80 focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/50 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
}
