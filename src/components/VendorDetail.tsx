import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, TrendingDown, Target, HelpCircle, 
  Layers, ChevronRight, Copy, Check, FileCheck, CircleAlert, Globe, Compass,
  Megaphone, Heart, MessageSquare, Smile, Frown, Meh, Sparkles, LineChart, Calendar, ArrowUpRight, ArrowDownRight, Activity,
  Download
} from 'lucide-react';
import { Vendor } from '../types';
import { generateSocialMediaAnalysis } from '../utils/socialNarrative';

interface VendorDetailProps {
  vendor: Vendor;
  onQuickChatPrompt: (prompt: string) => void;
}

export default function VendorDetail({ vendor, onQuickChatPrompt }: VendorDetailProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const handleCopyInsight = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${vendor.id}-insight-${index}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAction = (index: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [`${vendor.id}-${index}`]: !prev[`${vendor.id}-${index}`]
    }));
  };

  const downloadCSVReport = () => {
    const rows = [
      ['Field', 'Value', 'Context/Notes'],
      ['Supplier Name', vendor.name, 'CPG Supplier Base'],
      ['Supplier ID', vendor.id, 'Unique Identifier'],
      ['Country', vendor.country, 'Geographic Manufacturing HQ'],
      ['Sector', vendor.sector, 'Industry Category'],
      ['Risk Score', `${vendor.riskScore}/100`, `Rating Class: ${vendor.riskStatus}`],
      ['Financial Instability', `${vendor.metrics.financialInstability}/105`, 'Balance Sheet Health'],
      ['Delivery Delay Score', `${vendor.metrics.deliveryDelay}/100`, 'Logistics Delay Vector'],
      ['Compliance Issues Score', `${vendor.metrics.complianceIssues}/100`, 'Regulatory Scan Vector'],
      ['Inventory Buffer Days', `${vendor.inventoryBufferDays} Days`, `Level: ${vendor.inventoryLevel}`],
      ['Backup Supplier', vendor.backupSupplier, 'Alternative Sourcing Backup'],
      ['Disruption Impact Index', `${calculatedLossExposure}/100`, 'Composite Financial Priority & Risk'],
    ];

    rows.push([], ['70-WEEK TRAJECTORY HISTORY'], ['Week', 'Date', 'Risk Score']);
    trend.forEach(t => {
      rows.push([`Week ${t.week}`, t.dateString, `${t.riskScore}`]);
    });

    const csvContent = rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${vendor.name.replace(/[^a-zA-Z0-9]/g, '_')}_Risk_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadTXTReport = () => {
    const content = `========================================================================
CPG SUPPLIER SECURITY INTEL REPORT
========================================================================
GENERATED ON : 2026-05-22
SUPPLIER ID  : ${vendor.id}
COMPANY NAME : ${vendor.name}
GEOGRAPHY    : ${vendor.country}
SECTOR       : ${vendor.sector}
------------------------------------------------------------------------
RISK CLASSIFICATION SUMMARY
------------------------------------------------------------------------
COMPOSITE RISK SCORE     : ${vendor.riskScore}/100 [${vendor.riskStatus.toUpperCase()} RISK]
FINANCIAL INSTABILITY    : ${vendor.metrics.financialInstability}/100
DELIVERY DELAY VULN      : ${vendor.metrics.deliveryDelay}/100
COMPLIANCE SCRUTINY      : ${vendor.metrics.complianceIssues}/100
INVENTORY STOCK BUFFER   : ${vendor.inventoryBufferDays} Days (${vendor.inventoryLevel})
DISRUPTION IMPACT SCALE  : ${calculatedLossExposure}/100
DUAL-SOURCING BACKUP     : ${vendor.backupSupplier}

------------------------------------------------------------------------
SUMMARY NOTES
------------------------------------------------------------------------
${vendor.summary || 'Analytical profile generated dynamically in CPG database.'}

------------------------------------------------------------------------
70-WEEK HISTORY TREND TRAJECTORY
------------------------------------------------------------------------
${trend.map(t => `Week ${String(t.week).padStart(2, ' ')} (${t.dateString}) : ${t.riskScore}/100`).join('\n')}

========================================================================
MITIGATION ACTION DIRECTIVES
========================================================================
${vendor.actionableInsights.map((insight, idx) => `${idx + 1}. ${insight}`).join('\n')}

========================================================================
Report produced by CPG Supplier Risk Command Center. Confidential.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${vendor.name.replace(/[^a-zA-Z0-9]/g, '_')}_Intel_Report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safe color mapper for individual metrics
  const getMetricColor = (val: number) => {
    if (val >= 80) return 'bg-rose-500';
    if (val >= 60) return 'bg-amber-500';
    if (val >= 30) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getMetricTextColor = (val: number) => {
    if (val >= 80) return 'text-rose-600';
    if (val >= 60) return 'text-amber-600';
    if (val >= 30) return 'text-yellow-700';
    return 'text-emerald-600';
  };

  const calculatedLossExposure = Math.round((vendor.financialImpactScore * vendor.riskScore) / 100);

  // 70-Week Risk Trend logic
  const trend = vendor.historicalRiskTrend || [];
  const [scrubIndex, setScrubIndex] = useState<number>(Math.max(0, trend.length - 1));

  useEffect(() => {
    if (trend.length > 0) {
      setScrubIndex(trend.length - 1);
    }
  }, [vendor.id, trend.length]);

  const scores = trend.map(p => p.riskScore);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 100;
  const initialScore = trend[0]?.riskScore || 0;
  const finalScore = trend[trend.length - 1]?.riskScore || 0;
  const change = finalScore - initialScore;

  // Chart autoscale heights
  const yMin = Math.max(0, minScore - 8);
  const yMax = Math.min(100, maxScore + 8);
  const yRange = (yMax - yMin) || 1;

  const width = 800;
  const height = 140;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / Math.max(1, trend.length - 1)) * chartWidth;
  const getY = (score: number) => paddingTop + chartHeight - ((score - yMin) / yRange) * chartHeight;

  let linePath = '';
  let areaPath = '';
  if (trend.length > 0) {
    linePath = `M ${getX(0)} ${getY(trend[0].riskScore)}`;
    for (let i = 1; i < trend.length; i++) {
      linePath += ` L ${getX(i)} ${getY(trend[i].riskScore)}`;
    }
    areaPath = `${linePath} L ${getX(trend.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;
  }

  const selectedPoint = trend[scrubIndex] || trend[trend.length - 1] || { week: 70, dateString: 'Current', riskScore: vendor.riskScore };

  const getRiskStatusLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 35) return 'Medium';
    return 'Low';
  };

  const getRiskStatusColor = (score: number) => {
    if (score >= 80) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (score >= 35) return 'text-yellow-700 bg-yellow-50 border-yellow-101';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x - (paddingLeft / width) * rect.width) / ((chartWidth / width) * rect.width);
    const index = Math.max(0, Math.min(trend.length - 1, Math.round(pct * (trend.length - 1))));
    setScrubIndex(index);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 select-none" id="supplier-detail-panel">
      
      {/* 1. Header Hero Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono select-all bg-slate-100 font-semibold px-2 py-0.5 rounded-sm text-slate-500">
              ID: {vendor.id}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> {vendor.country}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
            {vendor.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Category sector: {vendor.sector}
          </p>
        </div>

        {/* Global Security Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Threat Status</span>
            <span className="text-sm font-semibold text-slate-600 font-mono">Score: {vendor.riskScore}/100</span>
          </div>
          <div className={`p-3 rounded-xl border flex items-center justify-center ${
            vendor.riskStatus === 'Critical' ? 'bg-rose-50 border-rose-200 text-rose-600' :
            vendor.riskStatus === 'High' ? 'bg-amber-50 border-amber-200 text-amber-600' :
            `bg-emerald-50 border-emerald-200 text-emerald-600`
          }`}>
            {vendor.riskScore >= 60 ? (
              <ShieldAlert className="w-8 h-8 animate-pulse text-rose-500" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            )}
          </div>
        </div>
      </div>

      {/* 1.2 Top Executive Summary & Downloadable Report Panel */}
      <div className="w-full select-text" id="executive-summary-panel">
        {/* Selected Company Summary Card with integrated Downloader */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-3xs flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-450 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-100 animate-pulse" />
              <span>Selected Company Executive Summary</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {vendor.summary || `${vendor.name} is a key corporate supplier in the ${vendor.sector} sector with operations based in ${vendor.country}. Currently, the organization holds an overall risk rating of ${vendor.riskStatus} (Score: ${vendor.riskScore}/100) and inventory buffers standing at ${vendor.inventoryBufferDays} days.`}
            </p>
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-400">Critical Risk Vectors Score scan:</span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono">
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">Financial Instability: {vendor.metrics.financialInstability}/100</span>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">Delivery Delay: {vendor.metrics.deliveryDelay}/100</span>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">Compliance Issues: {vendor.metrics.complianceIssues}/100</span>
              </div>
            </div>
          </div>

          {/* Download Action Box */}
          <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center space-y-2.5 min-w-[240px] select-none shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center block">Export Risk Assessment</span>
            
            <button
              onClick={downloadCSVReport}
              className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg cursor-pointer transition-all border border-indigo-600 shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-200" />
              <span>Download Report (CSV)</span>
            </button>

            <button
              onClick={downloadTXTReport}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-150 text-slate-700 border border-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-lg cursor-pointer transition-all shadow-3xs active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Download Report (TXT)</span>
            </button>
            
            <span className="text-[9px] text-slate-400 text-center block font-medium leading-none">Includes full 70-week history trend</span>
          </div>
        </div>
      </div>

      {/* 1.5 Interactive 70-Week Risk Trajectory Dashboard */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" /> 70-Week Supply Risk Trajectory
            </h3>
            <p className="text-xs text-slate-500 select-text">
              Real-time trend analysis dating back at least 70 weeks to monitor stability vectors and operational thresholds.
            </p>
          </div>

          {/* Quick Metrics KPIs */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-slate-400 font-medium text-[10px] block uppercase leading-none mb-0.5">70-Week Low</span>
              <span className="text-slate-750 font-mono">{minScore}/100</span>
            </div>
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-slate-400 font-medium text-[10px] block uppercase leading-none mb-0.5">70-Week High</span>
              <span className="text-slate-750 font-mono">{maxScore}/100</span>
            </div>
            <div className={`px-2.5 py-1 border rounded-md flex items-center gap-1 ${
              change < 0 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : change > 0 
                  ? 'bg-rose-50 border-rose-100 text-rose-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="text-slate-400 font-medium text-[10px] block uppercase leading-none mb-0.5">Change Trajectory</span>
                <span className="flex items-center gap-0.5 font-mono">
                  {change < 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : change > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                  ) : null}
                  {change === 0 ? 'Flat' : `${change > 0 ? '+' : ''}${change} Pts`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Panel for Scrubbing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl select-text">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Scrubbed Interval</span>
            <span className="text-sm font-semibold text-indigo-600 flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" /> Week {selectedPoint.week} ({selectedPoint.dateString})
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Score at Interval</span>
            <span className="text-sm font-bold mt-1 block font-mono text-slate-800">
              {selectedPoint.riskScore}/100
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Assessed Category</span>
            <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded-md mt-1 font-sans ${getRiskStatusColor(selectedPoint.riskScore)}`}>
              {getRiskStatusLabel(selectedPoint.riskScore)} Risk
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Status Action Plan</span>
            <span className="text-[11px] font-medium text-slate-500 mt-1 block leading-tight truncate" title={selectedPoint.riskScore >= 60 ? 'Alternative dual-sourcing pre-audited' : 'Maintain standard logistics track'}>
              {selectedPoint.riskScore >= 60 ? '⚠️ Initiate alternative backup swap audit' : '✅ Maintain standard raw logistics flow'}
            </span>
          </div>
        </div>

        {/* SVG Drawing of 70 Weeks Line and Area Chart */}
        <div className="relative pt-1">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-auto overflow-visible cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setScrubIndex(trend.length - 1)}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[25, 50, 75, 100].map((score) => {
              const y = getY(score);
              return (
                <g key={score}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    stroke="#f1f5f9" 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x={paddingLeft - 10} 
                    y={y + 3} 
                    fill="#94a3b8" 
                    className="text-[9px] font-mono font-bold" 
                    textAnchor="end"
                  >
                    {score}
                  </text>
                </g>
              );
            })}

            {/* Area path */}
            {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

            {/* Line path */}
            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="url(#lineGrad)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Vertical Marker Line */}
            <line
              x1={getX(scrubIndex)}
              y1={paddingTop}
              x2={getX(scrubIndex)}
              y2={paddingTop + chartHeight}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Active week circle node */}
            <circle
              cx={getX(scrubIndex)}
              cy={getY(selectedPoint.riskScore)}
              r="6"
              fill="#4f46e5"
              stroke="#ffffff"
              strokeWidth="2"
              className="shadow-sm"
            />
            
            {/* Soft pulsing halo */}
            <circle
              cx={getX(scrubIndex)}
              cy={getY(selectedPoint.riskScore)}
              r="12"
              fill="#6366f1"
              fillOpacity="0.15"
              className="animate-ping"
            />

            {/* Date timeline labels at start, mid, end */}
            <g className="text-[9px] font-mono fill-slate-400">
              <text x={getX(0)} y={height - 5} textAnchor="start">{trend[0]?.dateString}</text>
              <text x={getX(Math.round(trend.length / 2))} y={height - 5} textAnchor="middle">{trend[Math.round(trend.length / 2)]?.dateString}</text>
              <text x={getX(trend.length - 1)} y={height - 5} textAnchor="end">Week 70 (Latest)</text>
            </g>
          </svg>
        </div>

        {/* Accessible range scrubbing input bar underneath */}
        <div className="flex items-center gap-4 pt-1 border-t border-slate-100 pb-1">
          <span className="text-[10px] text-slate-400 font-mono font-semibold">WEEK 1 ({trend[0]?.dateString})</span>
          <input 
            type="range"
            min={0}
            max={Math.max(0, trend.length - 1)}
            value={scrubIndex}
            onChange={(e) => setScrubIndex(Number(e.target.value))}
            className="flex-grow h-1.5 bg-slate-100 rounded-xl appearance-none cursor-ew-resize accent-indigo-600 hover:accent-indigo-500 transition-all duration-100"
            aria-label="Interactive 70-week history scrub slider"
          />
          <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase">WEEK 70 (CURRENT)</span>
        </div>
      </div>

      {/* 2. Analytical Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Risk Dimensions progress card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Compass className="w-4 h-4 text-indigo-500" /> Risk Dimension Profiles
          </h3>
          
          <div className="space-y-3.5">
            {[
              { label: 'Financial Instability', val: vendor.metrics.financialInstability, desc: 'Balance sheet stress, raw material hedging volatility' },
              { label: 'Delivery Delay', val: vendor.metrics.deliveryDelay, desc: 'Carrier bottlenecks, manufacturing lead times, border waits' },
              { label: 'Compliance Issues', val: vendor.metrics.complianceIssues, desc: 'Label defects, custom bans, sanitary regulations, ESG holds' },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-slate-700">{metric.label}</span>
                  <span className={`font-semibold font-mono ${getMetricTextColor(metric.val)}`}>{metric.val}/100</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${getMetricColor(metric.val)}`}
                    style={{ width: `${metric.val}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Forecast & Stock Levels */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Target className="w-4 h-4 text-indigo-500" /> Supply & Impact exposure
            </h3>

            {/* Inventory Status indicator bar */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Inventory Buffer Status</span>
                <span className="text-sm font-semibold text-slate-700">{vendor.inventoryLevel} ({vendor.inventoryBufferDays} Days safety stock)</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-md uppercase tracking-wider ${
                vendor.inventoryLevel === 'Critical' ? 'bg-rose-100 text-rose-800' :
                vendor.inventoryLevel === 'Warning' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {vendor.inventoryLevel}
              </span>
            </div>

            {/* Loss Exposure meter */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Calculated Disruption Impact Index</span>
                <span className="text-rose-600">{calculatedLossExposure}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-linear-to-r from-amber-400 to-rose-500`}
                  style={{ width: `${calculatedLossExposure}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                The Disruption Index combines the supplier financial priority priority score ({vendor.financialImpactScore}) with live risk metrics ({vendor.riskScore}) to forecast potential financial and asset disruption losses.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none mb-1">Pre-Authorized Backup Sourcing</span>
              <span className="font-semibold text-slate-700">{vendor.backupSupplier}</span>
            </div>
            <button
              onClick={() => onQuickChatPrompt(`Conduct a comparative risk analysis between "${vendor.name}" and its designated backup supplier "${vendor.backupSupplier}".`)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center hover:underline cursor-pointer py-1 block self-end sm:self-auto"
            >
              Analyze Swap <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. AI-Powered Diagnostics & Strategic Synthesis (Direct Company AI Summary Module) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-100 animate-pulse" /> AI-Powered Diagnostic & Strategic Synthesis
          </h3>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase leading-none">
            Generative Model Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 select-text">
          {/* AI Executive Text Segment */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-sm text-slate-605 leading-relaxed font-normal">
              {vendor.summary}
            </p>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1.5 select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">AI Sourcing Pre-Approval</span>
              <p className="text-slate-600 leading-normal">
                To guarantee production continuity for <strong>{vendor.name}</strong>, procuring and scaling dual-hedger agreements with <strong>{vendor.backupSupplier}</strong> limits average downtime by an estimated 82%.
              </p>
            </div>
          </div>

          {/* AI Scorecard Parameters Grid */}
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-900/5 to-indigo-950/5 border border-indigo-100 rounded-xl p-4 space-y-3 select-none">
            <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-100/60 pb-1.5">
              Threat Diagnostic Vector
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stability Safe Margin:</span>
                <span className="font-semibold text-indigo-700 font-mono">
                  {100 - vendor.metrics.financialInstability}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transit Jam Vuln:</span>
                <span className={`font-semibold ${
                  vendor.metrics.deliveryDelay >= 75 ? 'text-rose-600' :
                  vendor.metrics.deliveryDelay >= 55 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {vendor.metrics.deliveryDelay >= 75 ? 'Critical Risk' :
                   vendor.metrics.deliveryDelay >= 55 ? 'Heightened' : 'Nominal'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Regulatory Standing:</span>
                <span className={`font-semibold ${
                  vendor.metrics.complianceIssues >= 60 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {vendor.metrics.complianceIssues >= 60 ? 'Audit Target' : 'Compliant'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-indigo-100/60 flex flex-col gap-0.5">
                <span className="text-[9px] font-black tracking-wider text-indigo-500 uppercase">Primary Mitigation:</span>
                <p className="text-[10.5px] font-medium text-slate-550 leading-tight">
                  {vendor.actionableInsights[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5 Brand Monitoring & Public Social Media Narratives Shield */}
      {(() => {
        const analysis = generateSocialMediaAnalysis(vendor);
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-pink-500 shrink-0" /> Public Brand Monitoring & Social Narratives
              </h3>
              <span className="text-[9px] font-mono tracking-wider font-semibold text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full uppercase leading-none self-start sm:self-auto">
                Live Sentiment Stream
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Semantic Sentiment Breakdown */}
              <div className="lg:col-span-1 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Sentiment</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {analysis.overallSentiment === 'Positive' ? (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                        <Smile className="w-4 h-4 text-emerald-500 animate-bounce" /> Positive Reception
                      </div>
                    ) : analysis.overallSentiment === 'Negative' ? (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-rose-600">
                        <Frown className="w-4 h-4 text-rose-500 animate-pulse" /> Net Negative Focus
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                        <Meh className="w-4 h-4 text-slate-500" /> Neutral Balanced
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200/60 font-sans">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Semantic Scores</span>
                  
                  {/* Positive progress */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Positive</span>
                      <span>{analysis.sentimentScores.positive}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysis.sentimentScores.positive}%` }} />
                    </div>
                  </div>

                  {/* Neutral progress */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Neutral</span>
                      <span>{analysis.sentimentScores.neutral}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${analysis.sentimentScores.neutral}%` }} />
                    </div>
                  </div>

                  {/* Negative progress */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Negative</span>
                      <span>{analysis.sentimentScores.negative}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${analysis.sentimentScores.negative}%` }} />
                    </div>
                  </div>
                </div>

                {/* Important constraint statement explicitly satisfying the requirement */}
                <div className="pt-2.5 border-t border-slate-200/60 text-[10px] text-slate-400 italic leading-snug">
                  *Note: These narratives represent public consumer sentiment and processed feedback logs. They do not impact {vendor.name}'s core operational or compliance risk score.
                </div>
              </div>

              {/* Right Column: Narrative Summary & Live Stream */}
              <div className="lg:col-span-2 space-y-3 flex flex-col justify-between">
                <div className="bg-slate-50/50 p-3.5 border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-500">Narrative Synthesis</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal select-text">
                    {analysis.narrativeSummary}
                  </p>
                </div>

                <div className="space-y-2 pt-1 font-sans">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Social Media Mentions</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {analysis.posts.map((post) => (
                      <div key={post.id} className="bg-white border border-slate-150 rounded-lg p-2.5 flex items-start gap-3 shadow-4xs select-text">
                        {/* Fake Avatar */}
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-100 to-slate-200 flex items-center justify-center font-bold text-xs text-slate-650 shrink-0 font-mono">
                          {post.username.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-none">
                            <span className="text-xs font-bold text-slate-800 truncate">{post.username}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{post.handle}</span>
                            <span className="hidden sm:inline text-[9px] text-slate-300">•</span>
                            <span className="text-[9px] text-slate-400 font-mono">{post.date}</span>
                            <span className={`text-[9px] ml-auto px-1.5 py-0.5 rounded-sm font-semibold uppercase leading-none ${
                              post.platform === 'X (Twitter)' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                              post.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                              post.platform === 'Reddit' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}>
                              {post.platform}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-snug break-words">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-3 text-slate-400 pt-0.5 select-none font-sans">
                            <div className="flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer text-[10px]">
                              <Heart className="w-3 h-3" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <MessageSquare className="w-3 h-3" />
                              <span>{Math.round(post.likes / 3)}</span>
                            </div>
                            <span className={`text-[9px] font-semibold px-1.5 rounded-sm font-mono leading-none ml-auto ${
                              post.sentiment === 'positive' ? 'text-emerald-600 bg-emerald-50' :
                              post.sentiment === 'negative' ? 'text-rose-600 bg-rose-50' :
                              'text-slate-500 bg-slate-100'
                            }`}>
                              {post.sentiment}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. Actionable Insights Interactive Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-indigo-500" /> Actionable Resilience Recommendations
          </h3>
          <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
            Actively Tracked
          </span>
        </div>

        <div className="space-y-3">
          {vendor.actionableInsights.map((insight, idx) => {
            const actId = `${vendor.id}-${idx}`;
            const isCompleted = completedActions[actId] || false;
            return (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border transition flex items-start gap-3 select-text ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-500' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                }`}
              >
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleAction(idx)}
                  className={`mt-0.5 w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition cursor-pointer ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-600 text-white' 
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-label={`Toggle tracking status for action ${idx + 1}`}
                >
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <div className="flex-1 space-y-1">
                  <p className={`text-xs ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {insight}
                  </p>
                </div>

                {/* Util tools */}
                <div className="flex gap-1.5 shrink-0 select-none">
                  <button
                    onClick={() => handleCopyInsight(insight, idx)}
                    className="p-1 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                    title="Copy insight text"
                  >
                    {copiedId === `${vendor.id}-insight-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Live Market Signals Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4 text-rose-500" /> Associated Tracked Market Signals
        </h3>

        {vendor.marketSignals.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No active market alert signals logged for this supplier.</p>
        ) : (
          <div className="space-y-3 select-text">
            {vendor.marketSignals.map((signal) => (
              <div 
                key={signal.id} 
                className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      signal.sentiment === 'negative' ? 'bg-rose-100 text-rose-800' :
                      signal.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {signal.sentiment}
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-sm font-semibold capitalize font-mono leading-none">
                      {signal.impactArea}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{signal.date}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 pr-4 leading-tight">{signal.headline}</h4>
                  <span className="block text-[10px] text-slate-400">Published via: <strong className="text-slate-500">{signal.source}</strong></span>
                </div>

                <button
                  onClick={() => onQuickChatPrompt(`Analyze the recent signal: "${signal.headline}" from ${signal.source}. What are the immediate cascading supplier disruption risks for ${vendor.name}?`)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-bold rounded-lg whitespace-nowrap self-end sm:self-auto cursor-pointer flex items-center gap-0.5"
                >
                  Audit Shock <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Quick Scenario Simulator Prompts */}
      <div className="bg-indigo-950 text-indigo-100 rounded-xl p-5 space-y-3.5 shadow-md">
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-300" /> AI Stress-Testing Sandbox
          </h3>
          <p className="text-[11px] text-indigo-200 leading-normal">
            Instruct the Lead Analyst AI to simulate sudden supply-chain stressors, evaluate climate impacts, or retrieve real-world live market events regarding <strong>{vendor.name}</strong> instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            {
              title: 'Climate Impact Simulation',
              text: `Simulate high-gravity environmental extreme weather events near "${vendor.name}" and outline safety strategies.`
            },
            {
              title: 'Inventory Buffer Shock',
              text: `Evaluate financial exposure if "${vendor.name}" faces an unexpected 14-day production freeze.`
            }
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onQuickChatPrompt(prompt.text)}
              className="p-2.5 bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-800 hover:border-indigo-700 rounded-lg text-left text-[11px] select-none text-indigo-200 hover:text-white transition duration-150 cursor-pointer flex flex-col justify-between h-full"
            >
              <span className="font-bold text-indigo-300 pb-1 flex items-center justify-between w-full">
                {prompt.title} <ChevronRight className="w-3 h-3 shrink-0" />
              </span>
              <span className="line-clamp-2 text-indigo-200/90">{prompt.text}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
