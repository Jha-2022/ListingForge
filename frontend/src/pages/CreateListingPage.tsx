import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Sparkles, AlertCircle, Image as ImageIcon } from 'lucide-react';
import api from '../api/client';
import { VoiceProfile, Marketplace, Language } from '../types';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace>('etsy');
  const [language, setLanguage] = useState<Language>('english');
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // Seller hint fields
  const [productNameHint, setProductNameHint] = useState('');
  const [material, setMaterial] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [targetBuyer, setTargetBuyer] = useState('');
  const [keywords, setKeywords] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get('/voice-profiles');
        if (res.data.success) {
          setVoiceProfiles(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch voice profiles', err);
      }
    };
    fetchProfiles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    addFiles(filesArray);
  };

  const addFiles = (files: File[]) => {
    const combined = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(combined);

    // Generate previews
    const newPreviews = combined.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please upload at least 1 product photo (up to 5 photos).');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('marketplace', marketplace);
      formData.append('language', language);
      if (selectedProfileId) formData.append('voice_profile_id', selectedProfileId);
      if (productNameHint) formData.append('product_name_hint', productNameHint);
      if (material) formData.append('material', material);
      if (size) formData.append('size', size);
      if (price) formData.append('price', price);
      if (targetBuyer) formData.append('target_buyer', targetBuyer);
      if (keywords) formData.append('keywords', keywords);

      const res = await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.data.id) {
        navigate(`/listings/${res.data.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to initiate listing generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-400" />
          Create New Listing
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload 1–5 photos. Our local Vision-Language Model inspects the colors, materials, and artisan details to craft a high-ranking listing.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photos Upload Section */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-200">
            Product Photos (1 to 5 images) <span className="text-red-400">*</span>
          </label>

          <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl p-6 text-center bg-slate-900/60 transition group cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={selectedFiles.length >= 5}
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-400 group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Click or drag & drop product photos here
              </p>
              <p className="text-xs text-slate-500">
                JPEG, PNG, WebP up to 10MB each (Maximum 5 images)
              </p>
            </div>
          </div>

          {/* Photo Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {previews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                  <img src={url} alt={`Upload preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-950/80 hover:bg-red-500 text-slate-200 hover:text-white transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950/70 text-slate-300">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marketplace Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">
            Target Marketplace <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: 'etsy',
                name: 'Etsy',
                desc: 'Story-driven titles (140 char), 13 high-value tags (20 char), craft narrative.',
                border: 'hover:border-orange-500/50',
                active: 'border-orange-500 bg-orange-500/10 text-orange-400',
              },
              {
                id: 'amazon',
                name: 'Amazon India',
                desc: 'SEO-heavy title (200 char), 5 bullet points, search terms, A9 compliance.',
                border: 'hover:border-amber-500/50',
                active: 'border-amber-500 bg-amber-500/10 text-amber-400',
              },
              {
                id: 'meesho',
                name: 'Meesho',
                desc: 'Punchy title (100 char), catalog description, budget-friendly tone.',
                border: 'hover:border-pink-500/50',
                active: 'border-pink-500 bg-pink-500/10 text-pink-400',
              },
            ].map((mp) => (
              <label
                key={mp.id}
                onClick={() => setMarketplace(mp.id as Marketplace)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  marketplace === mp.id
                    ? mp.active
                    : `border-slate-800 bg-slate-900/50 text-slate-300 ${mp.border}`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-base">{mp.name}</span>
                    <input
                      type="radio"
                      name="marketplace"
                      checked={marketplace === mp.id}
                      onChange={() => setMarketplace(mp.id as Marketplace)}
                      className="accent-brand-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{mp.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Language & Voice Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">Listing Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="english">English (Global / Pan-India standard)</option>
              <option value="hinglish">Hinglish (Colloquial Indian e-commerce)</option>
              <option value="hindi">Hindi (Devanagari script)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Brand Voice Profile <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Default Marketplace Tone</option>
              {voiceProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Seller Hint Details */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Seller Notes & Specifics (Optional)
          </h3>
          <p className="text-xs text-slate-400">
            If you know specific details like dimensions, fabric, or price, add them here so the model doesn't guess.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product Name / Title Hint</label>
              <input
                type="text"
                placeholder="e.g. Handcrafted Brass Diya Set"
                value={productNameHint}
                onChange={(e) => setProductNameHint(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Material / Fabric</label>
              <input
                type="text"
                placeholder="e.g. Pure Cotton, Solid Brass, Sheesham Wood"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dimensions / Size</label>
              <input
                type="text"
                placeholder="e.g. 10x10 inches, Medium, Set of 2"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price / MRP</label>
              <input
                type="text"
                placeholder="e.g. ₹899 or $25"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Buyer / Occasion</label>
            <input
              type="text"
              placeholder="e.g. Festive Diwali gift, home decor enthusiasts, college students"
              value={targetBuyer}
              onChange={(e) => setTargetBuyer(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Keywords (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. puja essential, brass handicraft, housewarming gift"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedFiles.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Photos...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Listing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
