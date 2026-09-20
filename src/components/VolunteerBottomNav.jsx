import React from 'react';
import {
  LayoutDashboard as DashboardIcon,
  Briefcase as JobsIcon,
  Utensils as UtensilsIcon,
  Settings as SettingsIcon,
} from 'lucide-react';

/**
 * VolunteerBottomNav — Equal-width 4-column bottom navigation bar for Volunteer mode.
 *
 * - Equal Column Widths: grid grid-cols-4 w-full h-full items-center (25% width per tab)
 * - Active Tab Yellow Pill: px-4 py-1.5 rounded-xl bg-[#FFB800]
 * - Centered Vertical Alignment: flex flex-col items-center justify-center
 * - Non-wrapping Labels: text-[10px] font-medium tracking-tight whitespace-nowrap
 */
export function VolunteerBottomNav({ activeTab = 'v_dashboard', onTabChange, navItems }) {
  // Default 4-tab configuration if not passed explicitly
  const tabs = navItems || [
    { id: 'v_dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'v_jobs', label: 'Jobs', icon: JobsIcon },
    { id: 'v_donate', label: 'Donate Food', icon: UtensilsIcon },
    { id: 'v_settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 z-40 px-2">
      <div className="grid grid-cols-4 w-full h-full max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id, tab)}
              className="flex flex-col items-center justify-center h-full w-full group py-1 cursor-pointer"
            >
              {/* Icon Indicator — Filled/colored icon on active tab (no background block) */}
              <div
                className={`flex items-center justify-center p-1 transition-colors duration-150 ${
                  isActive
                    ? 'text-amber-500 dark:text-[#FFB800]'
                    : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'fill-current stroke-[2.25]' : 'stroke-[1.75]'}`}
                />
              </div>

              {/* Label Text */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 text-center whitespace-nowrap ${
                  isActive
                    ? 'text-amber-500 dark:text-[#FFB800] font-bold'
                    : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 font-medium'
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

export default VolunteerBottomNav;
