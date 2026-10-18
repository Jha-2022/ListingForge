import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Layers, Sliders, Settings, PlusCircle, Cpu } from 'lucide-react';
import api from '../api/client';

export const Navbar: React.FC = () => {
  const [ollamaStatus, setOllamaStatus] = useState<{
    ollamaRunning: boolean;
    modelAvailable: boolean;
    configuredModel: string;
  } | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        if (res.data.success) {
          setOllamaStatus(res.data.data.ollama);
        }
      } catch {
        setOllamaStatus(null);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-800 text-brand-400 shadow-sm border border-slate-700'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ListingForge
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Local AI
                </span>
              </span>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                Etsy • Amazon India • Meesho
              </p>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              <Layers className="w-4 h-4" />
              Listings
            </NavLink>
            <NavLink to="/batch" className={navLinkClass}>
              <Layers className="w-4 h-4" />
              Batch Jobs
            </NavLink>
            <NavLink to="/voice-profiles" className={navLinkClass}>
              <Sliders className="w-4 h-4" />
              Brand Voices
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Ollama status pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Ollama:</span>
            {ollamaStatus?.ollamaRunning ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {ollamaStatus.modelAvailable ? ollamaStatus.configuredModel : 'Model Missing'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Offline
              </span>
            )}
          </div>

          <NavLink
            to="/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Listing</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
};
