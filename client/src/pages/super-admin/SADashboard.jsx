import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  Building2, Users, Shield, Server, Activity, 
  ArrowUpRight, CheckCircle2, AlertTriangle, Plus 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SADashboard() {
  const { user } = useAuthStore();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/institutions');
      setInstitutions(res.data.institutions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (instId) => {
    try {
      const res = await api.patch(`/institutions/${instId}/toggle-active`);
      toast.success(res.data.message || 'Status updated');
      fetchInstitutions();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Super Administrator Control Plane
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Global multi-tenant management across all universities, colleges, and security audit logs.
          </p>
        </div>

        <button
          onClick={() => toast.success('Open Add Institution Modal')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Institution</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Institutions</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{institutions.length}</h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 block">
            {institutions.filter(i => i.isActive).length} Active Tenants
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Platform Users</p>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">22</h3>
          <span className="text-xs text-gray-400 mt-3 block">Super Admins, Admins, Faculty, Students</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Health</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">99.98%</h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 block">All Services Operational</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Security & Audit</p>
          <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">Enabled</h3>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-3 block">Zero Breaches Detected</span>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-indigo-600" />
            Registered Institutions (Tenants)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3.5">Institution Name</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {institutions.map((inst) => (
                <tr key={inst._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-white">
                    {inst.name}
                  </td>
                  <td className="px-6 py-3.5 text-indigo-600 dark:text-indigo-400 font-bold">
                    {inst.code}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-gray-600 dark:text-gray-300">
                    {inst.type}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400">
                    {inst.address}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      inst.isActive 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {inst.isActive ? 'Active Tenant' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleToggleStatus(inst._id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        inst.isActive 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {inst.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
