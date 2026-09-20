import React from 'react';
import { ShieldCheck, UserCheck, HeartHandshake } from 'lucide-react';

/**
 * SettingsView — Synchronous Role & Active Tab State Switcher
 */
export function SettingsView({
  userRole = 'seeker',
  setUserRole,
  setActiveTab,
}) {
  const handleSelectVolunteer = () => {
    setUserRole?.('volunteer');
    setActiveTab?.('v_dashboard');
    try {
      localStorage.setItem('northstar_user_role', 'volunteer');
    } catch (_) {}
  };

  const handleSelectSeeker = () => {
    setUserRole?.('seeker');
    setActiveTab?.('dashboard');
    try {
      localStorage.setItem('northstar_user_role', 'seeker');
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pt-6 pb-28">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Settings & Profile Mode
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Switch between your Job Seeker workspace and Volunteer Helper tools.
          </p>
        </div>

        <section className="rounded-2xl bg-[#12141C] border border-white/10 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#FFB800]" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Active Profile Mode
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30">
              {userRole === 'volunteer' ? 'Volunteer' : 'Job Seeker'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSelectSeeker}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${
                userRole === 'seeker'
                  ? 'bg-[#FFB800] text-[#0B0F19] border-[#FFB800] font-extrabold shadow-[0_4px_16px_rgba(255,184,0,0.3)]'
                  : 'bg-slate-900/60 text-slate-300 border-white/10 hover:border-white/25 font-medium'
              }`}
            >
              <UserCheck className="w-6 h-6 mb-1.5" />
              <span className="text-xs tracking-tight">Job Seeker</span>
            </button>

            <button
              type="button"
              onClick={handleSelectVolunteer}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${
                userRole === 'volunteer'
                  ? 'bg-[#FFB800] text-[#0B0F19] border-[#FFB800] font-extrabold shadow-[0_4px_16px_rgba(255,184,0,0.3)]'
                  : 'bg-slate-900/60 text-slate-300 border-white/10 hover:border-white/25 font-medium'
              }`}
            >
              <HeartHandshake className="w-6 h-6 mb-1.5" />
              <span className="text-xs tracking-tight">Volunteer</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsView;
