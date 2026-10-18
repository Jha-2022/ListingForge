import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { VoiceProfile } from '../types';

export const VoiceProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [sampleListing, setSampleListing] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/voice-profiles');
      if (res.data.success) {
        setProfiles(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load voice profiles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const samples = sampleListing.trim() ? [sampleListing.trim()] : [];
      const res = await api.post('/voice-profiles', {
        name,
        style_description: styleDescription,
        sample_listings: samples,
      });

      if (res.data.success) {
        setName('');
        setStyleDescription('');
        setSampleListing('');
        setShowModal(false);
        fetchProfiles();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create voice profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand voice profile?')) return;
    try {
      await api.delete(`/voice-profiles/${id}`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Failed to delete profile');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-400" />
            Brand Voice Profiles
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Customize the writing personality, vocabulary, and tone of your listings to match your shop's authentic voice.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Brand Voice
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">Loading voice profiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 space-y-3">
          <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No custom voices defined</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            By default, ListingForge uses standard high-converting e-commerce formulas. Add a custom voice if you want a playful, rustic, or royal Indian heritage vibe.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {p.style_description || 'No specific style notes.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                Created {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                New Brand Voice Profile
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profile Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Heritage Rajasthani, Bohemian Earthy..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Style Description & Tone Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Warm, rustic, celebrate generations of hand-loomed traditions. Avoid cheap sounding buzzwords."
                  value={styleDescription}
                  onChange={(e) => setStyleDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sample Listing (Few-shot example)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste a listing you've written in the past that captures your tone perfectly."
                  value={sampleListing}
                  onChange={(e) => setSampleListing(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition"
                >
                  {submitting ? 'Saving...' : 'Create Voice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
