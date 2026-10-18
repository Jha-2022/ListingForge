import React, { useState, useEffect } from 'react';
import { Layers, Upload, Download, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';
import { BatchJob, Marketplace, Language } from '../types';

export const BatchPage: React.FC = () => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState<Marketplace>('etsy');
  const [language, setLanguage] = useState<Language>('english');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/batch');
      if (res.data.success) {
        setJobs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load batch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      setError('Please select a ZIP file containing product folders.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('zip', zipFile);
      if (csvFile) formData.append('csv', csvFile);
      formData.append('marketplace', marketplace);
      formData.append('language', language);

      const res = await api.post('/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setZipFile(null);
        setCsvFile(null);
        fetchJobs();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit batch job.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-brand-400" />
          Batch Catalog Processing
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload a ZIP folder containing multiple products (one folder per product, each with 1-5 photos and optional CSV metadata) to generate bulk listings.
        </p>
      </div>

      {/* Upload Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Start New Batch Job
        </h2>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Products ZIP File <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ZIP structured as subfolders: ProductA/img1.jpg, ProductB/img1.jpg
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Metadata CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                CSV matching folder names with product hints, prices, or materials
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Marketplace</label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as Marketplace)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="etsy">Etsy</option>
                <option value="amazon">Amazon India</option>
                <option value="meesho">Meesho</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="english">English</option>
                <option value="hinglish">Hinglish</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={uploading || !zipFile}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition"
              >
                {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Processing ZIP...' : 'Launch Batch Pipeline'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Batch Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Previous Batch Jobs</h2>
          <button
            onClick={fetchJobs}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
            No batch jobs run yet.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase text-white">
                      Job #{job.id.slice(0, 8)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono capitalize">
                      {job.marketplace}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Total: {job.total_items} items</span>
                    <span className="text-emerald-400">Done: {job.processed_items}</span>
                    {job.failed_items > 0 && <span className="text-red-400">Failed: {job.failed_items}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/export/batch/${job.id}/csv`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </a>
                  <a
                    href={`/api/export/batch/${job.id}/json`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSON
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
