import React from "react";

type FilterSidebarProps = {
  filters: { name: string; fakultas: string; jurusan: string; angkatan: string };
  setFilters: (f: any) => void;
};

export default function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const handleChange = (key: string, value: string) => {
    const finalValue = key !== "name" && value === "All" ? "" : value;
    setFilters((prev: any) => ({ ...prev, [key]: finalValue }));
  };

  return (
    <aside className="p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl h-fit">
      <h2 className="text-lg font-semibold text-[#1D1D1F] tracking-tight mb-5">Filters</h2>

      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Name</h3>
          <input type="text" value={filters.name || ""} onChange={(e) => handleChange("name", e.target.value)} placeholder="Search by name..." className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Faculty</h3>
          <select value={filters.fakultas || "All"} onChange={(e) => handleChange("fakultas", e.target.value)} className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all">
            <option>All</option>
            <option>Fasilkom</option>
            <option>Teknik</option>
            <option>Ekonomi</option>
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Major</h3>
          <select value={filters.jurusan || "All"} onChange={(e) => handleChange("jurusan", e.target.value)} className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all">
            <option>All</option>
            <option>Ilmu Komputer</option>
            <option>Sistem Informasi</option>
            <option>Teknik Elektro</option>
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#86868B] mb-2 uppercase tracking-wider">Batch</h3>
          <select value={filters.angkatan || "All"} onChange={(e) => handleChange("angkatan", e.target.value)} className="w-full p-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3]/20 text-sm text-[#1D1D1F] shadow-sm transition-all">
            <option>All</option>
            <option>2022</option>
            <option>2023</option>
            <option>2024</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
