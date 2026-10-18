import React, { useState, useEffect } from 'react';
import { Settings, Cpu, Key, Check, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../api/client';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<string | null>(null);

  // Quick license generator for testing
  const [devEmail, setDevEmail] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await api.get('/health');
      if (res.data.success) {
        setHealthData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load health status', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const existing = localStorage.getItem('listingforge_license_key') || '';
    setLicenseKey(existing);
    setSavedKey(existing);
    if (existing) {
      verifyKey(existing);
    }
  }, []);

  const verifyKey = async (key: string) => {
    try {
      const res = await api.post('/license/verify', { license_key: key });
      if (res.data.data.valid) {
        setLicenseStatus(`Active (Licensed to: ${res.data.data.email})`);
      } else {
        setLicenseStatus(`Invalid: ${res.data.data.reason}`);
      }
    } catch {
      setLicenseStatus('Verification failed');
    }
  };

  const handleSaveKey = () => {
    if (licenseKey.trim()) {
      localStorage.setItem('listingforge_license_key', licenseKey.trim());
      setSavedKey(licenseKey.trim());
      verifyKey(licenseKey.trim());
    } else {
      localStorage.removeItem('listingforge_license_key');
      setSavedKey('');
      setLicenseStatus(null);
    }
    alert('License settings updated!');
  };

  const handleGenerateDevLicense = async () => {
    if (!devEmail || !devEmail.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    try {
      const res = await api.post('/license/generate', { email: devEmail });
      if (res.data.success) {
        setGeneratedKey(res.data.data.license_key);
        setLicenseKey(res.data.data.license_key);
      }
    } catch (err) {
      alert('Failed to generate license key');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-400" />
          Settings & Local Environment
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your local Ollama connection, Vision-Language Model readiness, and license status.
        </p>
      </div>

      {/* Ollama Status Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Local Ollama Status</h2>
          </div>
          <button
            onClick={fetchHealth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {healthData ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Ollama Server</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    healthData.ollama?.ollamaRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                ></span>
                <span className="text-sm font-bold text-white">
                  {healthData.ollama?.ollamaRunning ? 'Running' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Active VLM Model</span>
              <div className="text-sm font-bold text-white font-mono truncate">
                {healthData.model}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Model Pulled & Ready</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    healthData.ollama?.modelAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
                <span className="text-sm font-bold text-white">
                  {healthData.ollama?.modelAvailable ? 'Available' : 'Needs ollama pull'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Loading Ollama diagnostics...</p>
        )}
      </div>

      {/* License Key Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5">
          <Key className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-bold text-white">Seller License Key</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          ListingForge is 100% free for single listings and batch jobs up to 10 products. For bulk batch jobs exceeding 10 items, provide your HMAC-signed license key below.
        </p>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">License Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. c2VsbGVy...:YmFzZTY0aG1hYw=="
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleSaveKey}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition"
            >
              Save Key
            </button>
          </div>

          {licenseStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                licenseStatus.startsWith('Active')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {licenseStatus}
            </div>
          )}
        </div>

        {/* Dev / Local License Key Generator */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Local License Key Generator (Dev/Self-Hosted)
          </h3>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter seller email (e.g. artisan@shop.in)"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
            />
            <button
              onClick={handleGenerateDevLicense}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              Generate Dev Key
            </button>
          </div>
          {generatedKey && (
            <p className="text-[11px] text-brand-400 font-mono break-all bg-slate-950 p-2 rounded">
              Generated: {generatedKey}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
