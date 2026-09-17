import React, { useState, useEffect } from 'react';
import { promoCodesApi } from '../../services/api';
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Percent, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export const PromoCodesManager: React.FC = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [maxDiscount, setMaxDiscount] = useState<number>(500);
  const [validUntil, setValidUntil] = useState<string>('2026-12-31');
  const [maxUsage, setMaxUsage] = useState<number>(100);

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await promoCodesApi.getAll();
      setPromos(Array.isArray(data?.promoCodes) ? data.promoCodes : Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Promo code is required');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await promoCodesApi.create({
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        maxDiscount: Number(maxDiscount),
        validUntil,
        maxUsage: Number(maxUsage)
      });
      setSuccess(`Promo code "${code.toUpperCase()}" created successfully!`);
      setCode('');
      setShowCreateForm(false);
      fetchPromos();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to create promo code');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await promoCodesApi.toggle(id);
      fetchPromos();
    } catch (err: any) {
      alert('Failed to toggle promo code status');
    }
  };

  const handleDelete = async (id: string, promoCode: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${promoCode}"?`)) return;
    try {
      await promoCodesApi.delete(id);
      fetchPromos();
    } catch (err: any) {
      alert('Failed to delete promo code');
    }
  };

  const activeCount = promos.filter(p => p.isActive).length;
  const totalUses = promos.reduce((sum, p) => sum + (p.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Promo Codes & Discounts</h2>
              <p className="text-xs text-slate-500">Create promotional vouchers and percentage discounts for passengers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPromos()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh promo codes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showCreateForm ? 'Close Form' : 'New Promo Code'}</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Active Campaigns</span>
            <p className="text-lg font-black text-slate-900">{activeCount} / {promos.length} Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Redemptions</span>
            <p className="text-lg font-black text-slate-900">{totalUses} Bookings</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Discount Type</span>
            <p className="text-lg font-black text-slate-900">Instant % Checkout</p>
          </div>
        </div>
      </div>

      {/* Success / Error Messages */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create New Promo Code Accordion/Card */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-md animate-fade-in-up">
          <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" /> Create New Discount Promo Code
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-bold">
            <div>
              <label className="block text-slate-600 mb-1.5 uppercase tracking-wider text-[10px]">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. AVURUDU20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase font-black text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1.5 uppercase tracking-wider text-[10px]">Discount (%)</label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1.5 uppercase tracking-wider text-[10px]">Max Discount (LKR)</label>
              <input
                type="number"
                min="50"
                step="50"
                required
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1.5 uppercase tracking-wider text-[10px]">Valid Until</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1.5 uppercase tracking-wider text-[10px]">Max Total Uses</label>
              <input
                type="number"
                min="1"
                required
                value={maxUsage}
                onChange={(e) => setMaxUsage(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold shadow-sm transition-all cursor-pointer"
              >
                {creating ? 'Saving...' : 'Deploy Promo Code'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promos Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
            <p className="text-sm font-bold">Loading promo codes...</p>
          </div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Ticket className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold">No promo codes created yet.</p>
            <p className="text-xs text-slate-400">Click &quot;New Promo Code&quot; to launch your first marketing voucher campaign.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Max Cap</th>
                  <th className="p-4">Redemptions</th>
                  <th className="p-4">Valid Until</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {promos.map((p) => {
                  const isExpired = p.validUntil && new Date(p.validUntil) < new Date();
                  const isLimitReached = p.usageCount >= p.maxUsage;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                            {p.code}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">
                        {p.discountPercent}% OFF
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        LKR {p.maxDiscount ? p.maxDiscount.toLocaleString() : 'No Limit'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{p.usageCount || 0}</span>
                          <span className="text-slate-400 font-mono">/ {p.maxUsage}</span>
                          {isLimitReached && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px]">FULL</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-mono ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {p.validUntil ? p.validUntil.split('T')[0] : 'Indefinite'}
                        </span>
                        {isExpired && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px]">EXPIRED</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggle(p.id)}
                          className="inline-flex items-center gap-1 cursor-pointer"
                          title={p.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {p.isActive ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-extrabold text-[10px]">
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Toggle status"
                          >
                            {p.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete promo code"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
