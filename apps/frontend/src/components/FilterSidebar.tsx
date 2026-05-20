import React from 'react';

type FilterSidebarProps = {
  filters: { fakultas: string; jurusan: string; angkatan: string };
  setFilters: (f: any) => void;
};

export default function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const handleChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value === 'Semua' ? '' : value }));
  };

  return (
    <aside className="p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl h-fit">
      <h2 className="text-lg font-semibold text-[#1D1D1F] tracking-tight mb-5">Filters</h2>
      
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Fakultas</h3>
          <select 
            value={filters.fakultas || 'Semua'}
            onChange={(e) => handleChange('fakultas', e.target.value)}
            className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all"
          >
            <option>Semua</option>
            <option>Fasilkom</option>
            <option>Teknik</option>
            <option>Ekonomi</option>
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Jurusan</h3>
          <select 
            value={filters.jurusan || 'Semua'}
            onChange={(e) => handleChange('jurusan', e.target.value)}
            className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all"
          >
            <option>Semua</option>
            <option>Ilmu Komputer</option>
            <option>Sistem Informasi</option>
            <option>Teknik Elektro</option>
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Angkatan</h3>
          <select 
            value={filters.angkatan || 'Semua'}
            onChange={(e) => handleChange('angkatan', e.target.value)}
            className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all"
          >
            <option>Semua</option>
            <option>2022</option>
            <option>2023</option>
            <option>2024</option>
          </select>
        </div>
      </div>
    </aside>
  );
}