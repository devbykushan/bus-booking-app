import React, { useState, useEffect } from 'react';
import { Clock, Plus, Save, RefreshCw, Trash2, CheckCircle2, Calendar, Bus } from 'lucide-react';
import { BASE_URL } from '../../services/api';

const api = {
  get: async (path: string) => {
    const res = await fetch(BASE_URL + path);
    if (!res.ok) throw new Error('Fetch failed');
    return { data: await res.json() };
  },
  post: async (path: string, body?: any) => {
    const res = await fetch(BASE_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error('Fetch failed');
    return { data: await res.json() };
  },
  delete: async (path: string) => {
    const res = await fetch(BASE_URL + path, { method: 'DELETE' });
    if (!res.ok) throw new Error('Fetch failed');
    return { data: await res.json() };
  }
};

interface TimetablePattern {
  out: string | null;
  in: string | null;
}

interface Timetable {
  id: string;
  busNumber: string;
  operatorId: string;
  operatorName: string;
  busType: string;
  price: number;
  anchorDate: string;
  pattern: TimetablePattern[];
}

export const TimetableManager: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Timetable>>({
    busNumber: '',
    busType: 'Normal Service (58 Seats 3*2)',
    price: 1157,
    anchorDate: new Date().toISOString().split('T')[0],
    pattern: Array(21).fill({ out: null, in: null })
  });

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetables');
      setTimetables(res.data);
    } catch (error) {
      console.error('Failed to fetch timetables', error);
      showMessage('Failed to load timetables.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSyncTrips = async () => {
    if (!window.confirm('This will delete all unbooked future trips and regenerate them according to the timetables. Are you sure?')) {
      return;
    }
    
    setSyncing(true);
    try {
      const res = await api.post('/timetables/generate');
      showMessage(res.data.message || 'Trips successfully synchronized!', 'success');
    } catch (error) {
      console.error('Failed to sync trips', error);
      showMessage('Failed to synchronize trips.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this timetable? Note: You must Sync Trips afterwards to remove generated routes.')) {
      return;
    }
    
    try {
      await api.delete(`/timetables/${id}`);
      showMessage('Timetable deleted.', 'success');
      fetchTimetables();
    } catch (error) {
      console.error('Failed to delete timetable', error);
      showMessage('Failed to delete timetable.', 'error');
    }
  };

  const handlePatternChange = (index: number, field: 'out' | 'in', value: string) => {
    const newPattern = [...(formData.pattern as TimetablePattern[])];
    newPattern[index] = {
      ...newPattern[index],
      [field]: value === '' ? null : value
    };
    setFormData({ ...formData, pattern: newPattern });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetables', {
        ...formData,
        operatorId: 'op-default',
        operatorName: 'Default Operator'
      });
      showMessage('Timetable created successfully.', 'success');
      setShowAddForm(false);
      fetchTimetables();
    } catch (error) {
      console.error('Failed to create timetable', error);
      showMessage('Failed to save timetable.', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Master Timetables...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" /> Master Timetables
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage global bus schedules and 21-day rotations.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            {showAddForm ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Timetable'}
          </button>
          <button
            onClick={handleSyncTrips}
            disabled={syncing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync & Generate Trips'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-6 animate-pop-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Bus Number</label>
              <input
                type="text"
                required
                placeholder="e.g. ND-2903"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.busNumber}
                onChange={e => setFormData({ ...formData, busNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Bus Type</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.busType}
                onChange={e => setFormData({ ...formData, busType: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Base Price (LKR)</label>
              <input
                type="number"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Anchor Date (Start of Rotation)</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.anchorDate?.split('T')[0]}
                onChange={e => setFormData({ ...formData, anchorDate: new Date(e.target.value).toISOString() })}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> 21-Day Rotation Pattern (Leave blank for OFF days)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.pattern?.map((day, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Day {idx + 1}</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Out (Monaragala ➔ Colombo)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 10.55 PM"
                        className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                        value={day.out || ''}
                        onChange={e => handlePatternChange(idx, 'out', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">In (Colombo ➔ Monaragala)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 12.40 PM"
                        className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                        value={day.in || ''}
                        onChange={e => handlePatternChange(idx, 'in', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Timetable
            </button>
          </div>
        </form>
      )}

      {/* List Timetables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {timetables.map(tt => {
          let outCount = 0, inCount = 0;
          tt.pattern.forEach(p => {
            if (p.out) outCount++;
            if (p.in) inCount++;
          });

          return (
            <div key={tt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none group-hover:bg-blue-100 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{tt.busNumber}</h3>
                    <p className="text-xs text-slate-500">{tt.busType}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(tt.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Timetable"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Rotation Trips</div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {outCount} Out, {inCount} In
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Anchor Date</div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {tt.anchorDate.split('T')[0]}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center relative z-10">
                <span className="text-xs font-bold text-slate-400 uppercase">21-Day Master Plan</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
