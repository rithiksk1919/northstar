import React from 'react';
import { NAV_CONFIG } from '../config/navigationConfig';
import { VolunteerBottomNav } from './VolunteerBottomNav';

/**
 * Dynamic Bottom Navigation Component for Northstar Mobile Web App
 * Delegates Volunteer mode to VolunteerBottomNav (equal 4-column grid, px-4 py-1.5 rounded-xl pill)
 * while preserving the locked 6-column Seeker layout.
 */
export function BottomNav({
  userRole,
  activeRole,
  activeTab,
  onTabChange,
}) {
  const resolvedRole =
    (userRole || activeRole || 'seeker') === 'volunteer' ? 'volunteer' : 'seeker';

  if (resolvedRole === 'volunteer') {
    return (
      <VolunteerBottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        navItems={NAV_CONFIG.volunteer}
      />
    );
  }

  const tabs = NAV_CONFIG.seeker;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40">
      <div className="grid grid-cols-6 w-full h-full max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id, tab)}
              className="flex flex-col items-center justify-center h-full w-full py-1 group cursor-pointer"
            >
              <div
                className={`flex items-center justify-center px-2.5 py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#FFB800] text-slate-900 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[9px] tracking-tighter mt-0.5 text-center whitespace-nowrap ${
                  isActive
                    ? 'text-slate-900 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
