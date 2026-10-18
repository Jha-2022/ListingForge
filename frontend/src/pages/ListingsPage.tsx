import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, RefreshCw, AlertCircle, ShoppingBag, Trash2 } from 'lucide-react';
import api from '../api/client';
import { Listing, Marketplace } from '../types';

export const ListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedMarketplace !== 'all') params.marketplace = selectedMarketplace;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/listings', { params });
      if (res.data.success) {
        setListings(res.data.data.listings || []);
      }
    } catch (err) {
      console.error('Failed to fetch listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedMarketplace, statusFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert('Failed to delete listing');
    }
  };

  const getMarketplaceBadge = (mp: Marketplace) => {
    switch (mp) {
      case 'etsy':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Etsy</span>;
      case 'amazon':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Amazon IN</span>;
      case 'meesho':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">Meesho</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Product Listings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Local AI-generated listings optimized for SEO, character limits, and buyer conversion.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`/api/export/listings/csv${selectedMarketplace !== 'all' ? `?marketplace=${selectedMarketplace}` : ''}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export CSV
          </a>
          <Link
            to="/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-slate-400">Marketplace:</span>
          {['all', 'etsy', 'amazon', 'meesho'].map((mp) => (
            <button
              key={mp}
              onClick={() => setSelectedMarketplace(mp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                selectedMarketplace === mp
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {mp === 'amazon' ? 'Amazon IN' : mp}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchListings}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Refresh listings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No listings found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Upload 1 to 5 product photos to generate your first marketplace-ready listing in seconds.
            </p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => (
            <Link
              key={item.id}
              to={`/listings/${item.id}`}
              className="group block rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getMarketplaceBadge(item.marketplace)}
                    <span className="text-xs uppercase font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                      {item.language}
                    </span>
                  </div>
                  <div>
                    {item.status === 'generating' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        Generating...
                      </span>
                    )}
                    {item.status === 'done' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Ready
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-2 text-base leading-snug">
                  {item.title || item.product_name_hint || 'Untitled Product Listing'}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.description || (item.status === 'generating' ? 'Vision-language model is analyzing photo features...' : 'No description generated.')}
                </p>
              </div>

              <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1 rounded hover:text-red-400 hover:bg-slate-800 transition"
                  title="Delete listing"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
