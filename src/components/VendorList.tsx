import React, { useState, useMemo } from 'react';
import { Search, ShieldAlert, BadgeInfo, Layers, Plus } from 'lucide-react';
import { Vendor } from '../types';

interface VendorListProps {
  vendors: Vendor[];
  selectedVendorId: string | null;
  onSelectVendor: (id: string) => void;
  onOpenAddModal: () => void;
}

export default function VendorList({ vendors, selectedVendorId, onSelectVendor, onOpenAddModal }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');

  // Compute aggregate statistics
  const stats = useMemo(() => {
    if (vendors.length === 0) return { total: 0, critical: 0, avgScore: 0 };
    const total = vendors.length;
    const critical = vendors.filter(v => v.riskStatus === 'Critical' || v.riskStatus === 'High').length;
    const avgScore = Math.round(vendors.reduce((sum, v) => sum + v.riskScore, 0) / total);
    return { total, critical, avgScore };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = riskFilter === 'All' || v.riskStatus === riskFilter;
      return matchesSearch && matchesFilter;
    });
  }, [vendors, searchTerm, riskFilter]);

  const getStatusBg = (status: Vendor['riskStatus']) => {
    switch (status) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getInventoryTag = (level: Vendor['inventoryLevel']) => {
    switch (level) {
      case 'Critical': return 'text-rose-600 font-medium';
      case 'Warning': return 'text-amber-600 font-medium';
      case 'Optimal': return 'text-emerald-600 font-medium';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-full lg:w-96 select-none shrink-0" id="supplier-sidebar">
      
      {/* Search & Action Panel */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-sans">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800 text-base">Supplier Database</h2>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Monitored</span>
            <span className="text-sm font-semibold text-slate-700">{stats.total}</span>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-rose-500 flex items-center justify-center gap-0.5">
              <ShieldAlert className="w-2.5 h-2.5" /> Threat
            </span>
            <span className="text-sm font-semibold text-rose-700">{stats.critical}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Avg Risk</span>
            <span className="text-sm font-semibold text-slate-700">{stats.avgScore}</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, sector, country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5" id="risk-filter-row">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer whitespace-nowrap transition ${
                  riskFilter === level
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-transparent'
                }`}
              >
                {level === 'All' ? 'All Risks' : `${level}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors List Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5" id="vendors-scrollable-list">
        {filteredVendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center space-y-2">
            <BadgeInfo className="w-8 h-8 text-slate-300" />
            <p className="text-xs">No suppliers found matching current selection parameters.</p>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const isSelected = selectedVendorId === vendor.id;
            return (
              <div
                key={vendor.id}
                id={`vendor-card-${vendor.id}`}
                onClick={() => onSelectVendor(vendor.id)}
                className={`p-3.5 rounded-xl border transition duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs shadow-3xs'
                }`}
              >
                {/* ID & Region */}
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider font-semibold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md">
                    {vendor.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{vendor.country}</span>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1 mb-1">
                  {vendor.name}
                </h3>

                {/* Sector */}
                <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                  {vendor.sector}
                </p>

                {/* Metrics Footer Row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                  <div>
                    <span className="text-slate-400">Inventory: </span>
                    <span className={getInventoryTag(vendor.inventoryLevel)}>{vendor.inventoryLevel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBg(vendor.riskStatus)}`}>
                      {vendor.riskStatus} ({vendor.riskScore})
                    </span>
                  </div>
                </div>

                {/* Micro sparkline bar */}
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      vendor.riskScore > 80 ? 'bg-rose-500' :
                      vendor.riskScore > 60 ? 'bg-amber-500' :
                      vendor.riskScore > 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${vendor.riskScore}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
