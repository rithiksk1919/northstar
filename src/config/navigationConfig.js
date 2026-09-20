import {
  LayoutDashboard as DashboardIcon,
  TrendingUp as ProgressIcon,
  Briefcase as JobsIcon,
  Briefcase as BriefcaseIcon,
  MapPin as MapIcon,
  FileText as ResumeIcon,
  Utensils as UtensilsIcon,
  Settings as SettingsIcon,
} from 'lucide-react';

/**
 * Role-Based Navigation Config for Northstar Mobile Web App
 *
 * - Seeker Role (6 Tabs):
 *   ['Dashboard', 'Progress', 'Jobs', 'Map', 'Resume', 'Settings']
 * - Volunteer Role (Exact 4-Tab Bar):
 *   ['Dashboard', 'Jobs', 'Donate Food', 'Settings']
 */
export const NAV_CONFIG = {
  seeker: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: DashboardIcon,
      materialIcon: 'dashboard',
      href: 'seeker-dashboard.html',
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: ProgressIcon,
      materialIcon: 'trending_up',
      href: 'progress.html',
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: JobsIcon,
      materialIcon: 'work',
      href: 'opportunities.html',
    },
    {
      id: 'map',
      label: 'Map',
      icon: MapIcon,
      materialIcon: 'map',
      href: 'resource-map.html',
    },
    {
      id: 'resume',
      label: 'Resume',
      icon: ResumeIcon,
      materialIcon: 'description',
      href: 'resume-builder.html',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      materialIcon: 'settings',
      href: '#settings',
    },
  ],
  // Exact 4-tab Volunteer Navigation Bar matching Image 1
  volunteer: [
    {
      id: 'v_dashboard',
      label: 'Dashboard',
      icon: DashboardIcon,
      materialIcon: 'dashboard',
      href: 'helper-dashboard.html',
    },
    {
      id: 'v_jobs',
      label: 'Jobs',
      icon: BriefcaseIcon,
      materialIcon: 'work',
      href: 'opportunities.html',
    },
    {
      id: 'v_donate',
      label: 'Donate Food',
      icon: UtensilsIcon,
      materialIcon: 'restaurant',
      href: 'donate.html',
    },
    {
      id: 'v_settings',
      label: 'Settings',
      icon: SettingsIcon,
      materialIcon: 'settings',
      href: '#settings',
    },
  ],
};

export const NAV_ITEMS = NAV_CONFIG;
export default NAV_CONFIG;
