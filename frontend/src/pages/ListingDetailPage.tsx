import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Save,
  Download,
  AlertCircle,
  Eye,
  Tag,
  FileText,
  ListPlus,
  Search,
} from 'lucide-react';
import api from '../api/client';
import { Listing, Marketplace } from '../types';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [backendSearchTerms, setBackendSearchTerms] = useState('');
  const [materialsField, setMaterialsField] = useState('');

  // Regenerate Modal state
  const [regenField, setRegenField] = useState<string | null>(null);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${id}`);
      if (res.data.success) {
        const data: Listing = res.data.data;
        setListing(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setBullets(data.bullets ? JSON.parse(data.bullets) : []);
        setTags(data.tags ? JSON.parse(data.tags) : []);
        setBackendSearchTerms(data.backend_search_terms || '');
        setMaterialsField(data.materials_field || '');
      }
    } catch (err) {
      console.error('Failed to fetch listing', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  // Polling for generating status
  useEffect(() => {
    if (!listing || listing.status !== 'generating') return;
    const interval = setInterval(() => {
      fetchListing();
    }, 2500);
    return () => clearInterval(interval);
  }, [listing?.status]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      await api.patch(`/listings/${id}`, {
        title,
        description,
        bullets,
        tags,
        backend_search_terms: backendSearchTerms,
        materials_field: materialsField,
      });
      await fetchListing();
      alert('Changes saved successfully!');
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenField || !regenInstruction) return;

    try {
      setRegenerating(true);
      const res = await api.post(`/listings/${id}/regenerate`, {
        field: regenField,
        instruction: regenInstruction,
      });

      if (res.data.success) {
        const updated = res.data.data;
        setListing(updated);
        if (regenField === 'title') setTitle(updated.title || '');
        if (regenField === 'description') setDescription(updated.description || '');
        if (regenField === 'bullets') setBullets(updated.bullets ? JSON.parse(updated.bullets) : []);
        if (regenField === 'tags') setTags(updated.tags ? JSON.parse(updated.tags) : []);
        if (regenField === 'backend_search_terms') setBackendSearchTerms(updated.backend_search_terms || '');
        if (regenField === 'materials_field') setMaterialsField(updated.materials_field || '');
        setRegenField(null);
        setRegenInstruction('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 text-sm">Loading listing details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Listing not found</h2>
        <Link to="/" className="text-brand-400 hover:underline text-sm inline-block">
          ← Back to all listings
        </Link>
      </div>
    );
  }

  const analysis = listing.product_analysis ? JSON.parse(listing.product_analysis) : null;

  // Character limit rules
  const titleLimit = listing.marketplace === 'etsy' ? 140 : listing.marketplace === 'amazon' ? 200 : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="uppercase text-[11px] font-mono tracking-wider px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold">
                {listing.marketplace === 'amazon' ? 'Amazon India' : listing.marketplace}
              </span>
              <span className="text-xs text-slate-400 capitalize">({listing.language})</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1 line-clamp-1">
              {title || listing.product_name_hint || 'Listing Output'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/api/export/listings/csv?ids=${listing.id}`}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </a>
          <a
            href={`/api/export/listings/json?ids=${listing.id}`}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </a>
          <button
            onClick={handleSaveChanges}
            disabled={saving || listing.status !== 'done'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-600/20 transition"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Generating Banner */}
      {listing.status === 'generating' && (
        <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-4">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
          <div>
            <h3 className="text-sm font-semibold text-blue-300">
              Generating your marketplace listing with local VLM...
            </h3>
            <p className="text-xs text-blue-400/80 mt-0.5">
              Analyzing photo attributes, running vision recognition, and tailoring tone. This page will update automatically when ready.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {listing.status === 'error' && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-300">Generation Encountered an Error</h3>
            <p className="text-xs text-red-400/90 mt-1">{listing.error_message || 'Unknown model error'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos & Vision Analysis (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Photos */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              Product Photos ({listing.images?.length || 0})
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {listing.images?.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
                >
                  <img
                    src={`/uploads/${img.stored_filename}`}
                    alt={img.original_filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vision Extraction Analysis */}
          {analysis && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                VLM Vision Attributes
              </h3>
              <div className="space-y-2 text-xs">
                {analysis.category && (
                  <div>
                    <span className="text-slate-500">Category: </span>
                    <span className="text-slate-200 font-medium">{analysis.category}</span>
                  </div>
                )}
                {analysis.materials && (
                  <div>
                    <span className="text-slate-500">Materials: </span>
                    <span className="text-slate-200">{analysis.materials.join(', ')}</span>
                  </div>
                )}
                {analysis.colors && (
                  <div>
                    <span className="text-slate-500">Colors: </span>
                    <span className="text-slate-200">{analysis.colors.join(', ')}</span>
                  </div>
                )}
                {analysis.features && (
                  <div>
                    <span className="text-slate-500">Features: </span>
                    <span className="text-slate-200">{analysis.features.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Listing Output Fields (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Product Title</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono ${
                    title.length > titleLimit ? 'text-red-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {title.length} / {titleLimit} chars
                </span>
                <button
                  onClick={() => handleCopy(title, 'title')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Copy title"
                >
                  {copiedField === 'title' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setRegenField('title');
                    setRegenInstruction('Make it more catchy and highlight the handcrafted premium nature');
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-brand-400 transition"
                  title="Regenerate title with custom instructions"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-medium focus:border-brand-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Bullet Points (Amazon / Meesho) */}
          {(listing.marketplace === 'amazon' || listing.marketplace === 'meesho') && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">Bullet Points ({bullets.length})</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(bullets.join('\n'), 'bullets')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Copy all bullets"
                  >
                    {copiedField === 'bullets' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setRegenField('bullets');
                      setRegenInstruction('Emphasize durability, authentic craft, and gift readiness');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-brand-400 transition"
                    title="Regenerate bullets"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {bullets.map((b, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono flex-shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={b}
                      onChange={(e) => {
                        const next = [...bullets];
                        next[idx] = e.target.value;
                        setBullets(next);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Product Description</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(description, 'description')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Copy description"
                >
                  {copiedField === 'description' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setRegenField('description');
                    setRegenInstruction('Add care instructions and artisan backstory');
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-brand-400 transition"
                  title="Regenerate description"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs leading-relaxed focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Tags (Etsy / Meesho) */}
          {tags.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">
                    Tags ({tags.length} {listing.marketplace === 'etsy' ? '/ 13 tags' : ''})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(tags.join(', '), 'tags')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Copy all tags"
                  >
                    {copiedField === 'tags' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setRegenField('tags');
                      setRegenInstruction('Provide highly searched long-tail keywords under 20 characters');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-brand-400 transition"
                    title="Regenerate tags"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/80 flex items-center gap-1.5"
                  >
                    {t}
                    <span className="text-[10px] text-slate-500">({t.length})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amazon Backend Search Terms */}
          {listing.marketplace === 'amazon' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Backend Generic Keywords (Search Terms)</h3>
                </div>
                <button
                  onClick={() => handleCopy(backendSearchTerms, 'search_terms')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  {copiedField === 'search_terms' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <input
                type="text"
                value={backendSearchTerms}
                onChange={(e) => setBackendSearchTerms(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Regenerate Field Modal */}
      {regenField && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Regenerate {regenField.toUpperCase()}
              </h3>
              <button
                onClick={() => setRegenField(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Provide specific direction for the model to re-write this field without modifying the rest of your listing.
            </p>
            <textarea
              rows={4}
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
              placeholder="e.g. Focus on organic materials, mention sustainable packaging, shorten length..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRegenField(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={regenerating || !regenInstruction.trim()}
                onClick={handleRegenerateSubmit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition"
              >
                {regenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {regenerating ? 'Regenerating...' : 'Apply Instruction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
