import React, { useMemo } from 'react';
import { VolunteerBottomNav } from '../components/VolunteerBottomNav';

export function VolunteerDashboard({
  user = {},
  foodDonations = [],
  donationsList = [],
  activeTab = 'v_dashboard',
  onTabChange,
  onPostJob,
  onDonate,
  onClaimPickup,
  onViewAllPickups,
  onOpenChatbot,
  onOpenSettings,
}) {
  // 1. Dynamic User Profile Initial (e.g., "Volunteer" -> "V", "Sarah" -> "S")
  const userInitial = useMemo(() => {
    const name =
      user?.user_metadata?.full_name ||
      user?.full_name ||
      user?.username ||
      user?.email ||
      'Volunteer';
    return name.charAt(0).toUpperCase() || 'V';
  }, [user]);

  // 2. Dynamic Total Donation Calculation (defaults to $0 when no donations exist)
  const totalDonations = useMemo(() => {
    if (!donationsList || donationsList.length === 0) return '$0';
    const total = donationsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return total > 0 ? `$${total.toLocaleString()}` : '$0';
  }, [donationsList]);

  const hasPickups = Array.isArray(foodDonations) && foodDonations.length > 0;

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Navbar Header with Dynamic Initial */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Open menu" className="text-lg">
            ☰
          </button>
          <span className="font-extrabold text-lg tracking-tight">Northstar</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs cursor-pointer"
          >
            ⚙️
          </button>
          {/* Dynamic Profile Circle */}
          <div
            onClick={onOpenSettings}
            title={`Signed in as ${user?.user_metadata?.full_name || user?.email || 'Volunteer'}`}
            className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30 cursor-pointer select-none"
          >
            {userInitial}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="px-4 pt-4 space-y-5 flex-1">
        {/* Header Greeting */}
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hello, <span className="text-amber-500">Volunteer</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thank you for making a difference in our community today.
          </p>
        </header>

        {/* Donations Card with Standardized 40x40px Icon (w-10 h-10 rounded-xl) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DONATIONS
            </p>
            <p className="text-2xl font-extrabold tracking-tight mt-0.5 text-slate-900 dark:text-slate-100">
              {totalDonations}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Directly supporting meals, shelter &amp; transport
            </p>
          </div>
          {/* Standardized icon container (w-10 h-10 rounded-xl) */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
            🤝
          </div>
        </div>

        {/* Action Cards with Matching Container Dimensions (w-10 h-10 rounded-xl) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Post a Job */}
          <button
            type="button"
            onClick={onPostJob}
            className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left h-32 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-base">
              +
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                Post a Job
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Create new listing
              </p>
            </div>
          </button>

          {/* Donate Card with Dark Mode Icon Contrast Fix */}
          <button
            type="button"
            onClick={onDonate}
            className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left h-32 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base">
              💳
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                Donate
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Support local causes
              </p>
            </div>
          </button>
        </div>

        {/* Food Pickups & Drop-offs Section */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label="Truck">
                🚚
              </span>
              <h2 className="text-base font-bold tracking-tight">Food Pickups &amp; Drop-offs</h2>
            </div>
            {hasPickups && (
              <button
                type="button"
                onClick={onViewAllPickups}
                className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
              >
                View All
              </button>
            )}
          </div>

          {hasPickups ? (
            <div className="space-y-3">
              {foodDonations.map((item) => {
                const itemTitle = Array.isArray(item.items)
                  ? item.items.join(', ')
                  : item.title || item.items || 'Food Donation';
                const donorLocation = item.donorLocation || item.donorArea || 'Local Donor';
                const destination = item.destination || 'Community Shelter';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 pr-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        🚚
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                          {itemTitle}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                          {donorLocation} → {destination}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onClaimPickup?.(item)}
                      className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#FFB800] text-slate-950 text-xs font-bold shadow-sm hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Claim
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Proportional Empty State */
            <div className="py-5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xs">
                📦
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No active pickup requests
              </p>
              <p className="text-[11px] text-slate-400">
                New food donation requests will appear here when posted.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={onOpenChatbot}
        aria-label="Support Assistant"
        className="fixed bottom-16 right-4 w-12 h-12 rounded-full bg-[#FFB800] hover:bg-amber-400 text-slate-950 flex items-center justify-center border border-slate-900/20 transition-colors z-30 cursor-pointer"
      >
        <span className="material-symbols-outlined text-xl">chat_bubble</span>
      </button>

      {/* 4-Tab Volunteer Bottom Navigation Bar */}
      <VolunteerBottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}

export default VolunteerDashboard;
