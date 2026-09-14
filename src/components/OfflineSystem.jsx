import React, { useState, useCallback } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Allowed offline routes/screens.
 * Dashboard and Settings remain 100% accessible while offline.
 */
export const ALLOWED_OFFLINE_ROUTES = [
  'dashboard',
  'seeker-dashboard',
  'helper-dashboard',
  'settings',
  '/',
];

/**
 * Helper to verify if a target route/feature is allowed while offline.
 * @param {string} routeOrFeature - Route path or feature identifier
 * @returns {boolean}
 */
export function isRouteAllowedOffline(routeOrFeature = '') {
  const normalized = routeOrFeature.toLowerCase().trim();
  return ALLOWED_OFFLINE_ROUTES.some(
    (allowed) =>
      normalized === allowed ||
      normalized.includes('seeker-dashboard') ||
      normalized.includes('helper-dashboard') ||
      normalized.includes('settings')
  );
}

/**
 * Centered Offline Modal Overlay
 * Styled in Northstar's dark theme aesthetic (#1A202C surface, #FFB800 gold accents).
 * Displays: "You are offline. Please connect to the internet to use this feature."
 */
export function OfflineModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="ns-offline-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ns-offline-modal-title"
      onClick={onClose}
    >
      <div
        className="ns-offline-modal-card relative w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl border"
        style={{
          backgroundColor: '#1A202C',
          borderColor: 'rgba(255, 184, 0, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 24px rgba(255, 184, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clear 'X' Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close offline notification"
          className="ns-offline-modal-close absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
          }}
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>

        {/* Gold Accent Offline Icon Badge */}
        <div
          className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
          style={{
            backgroundColor: 'rgba(255, 184, 0, 0.15)',
            border: '1px solid rgba(255, 184, 0, 0.4)',
            color: '#FFB800',
          }}
        >
          <span className="material-symbols-outlined text-3xl leading-none">wifi_off</span>
        </div>

        {/* Modal Title & Required Message Copy */}
        <h3
          id="ns-offline-modal-title"
          className="text-lg font-extrabold text-white tracking-tight mb-2 font-heading"
        >
          Connection Required
        </h3>

        <p className="text-sm font-medium text-slate-200 leading-relaxed mb-6">
          You are offline. Please connect to the internet to use this feature.
        </p>

        {/* Secondary Dismiss CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl font-extrabold text-sm text-slate-950 transition-all active:scale-95 cursor-pointer shadow-md"
          style={{
            backgroundColor: '#FFB800',
            boxShadow: '0 4px 16px rgba(255, 184, 0, 0.3)',
          }}
        >
          Stay on Current Screen
        </button>
      </div>
    </div>
  );
}

/**
 * Inline Offline Map Placeholder Component
 * Renders inside embedded map containers (e.g., Dashboard Hero Card) when offline
 * so the UI frame never breaks or displays broken tiles.
 */
export function OfflineMapPlaceholder({ className = '' }) {
  return (
    <div
      className={`ns-offline-map-placeholder absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 text-center select-none rounded-[20px] z-10 ${className}`}
      style={{
        backgroundColor: '#1A202C',
        backgroundImage:
          'radial-gradient(circle at center, rgba(255, 184, 0, 0.10) 0%, rgba(26, 32, 44, 0.98) 75%)',
        border: '1px solid rgba(255, 184, 0, 0.25)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm"
        style={{
          backgroundColor: 'rgba(255, 184, 0, 0.15)',
          border: '1px solid rgba(255, 184, 0, 0.35)',
          color: '#FFB800',
        }}
      >
        <span className="material-symbols-outlined text-xl leading-none">wifi_off</span>
      </div>
      <span
        className="text-xs font-extrabold tracking-wide uppercase"
        style={{ color: '#FFB800' }}
      >
        Map is unavailable offline
      </span>
      <span className="text-[11px] text-slate-400 font-medium mt-0.5">
        Reconnect to view live verified essentials
      </span>
    </div>
  );
}

/**
 * OfflineGuard Route & Feature Access Control Wrapper
 * - Allows full access to Dashboard and Settings while offline.
 * - Intercepts restricted features (AI Assistant, Map views, Jobs, Resume Builder)
 *   when offline, opens OfflineModal, and keeps the user on their allowed screen.
 */
export function OfflineGuard({
  currentRoute = 'dashboard',
  onNavigate,
  children,
}) {
  const { isOnline, isOffline } = useNetworkStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGuardedAction = useCallback(
    (targetRouteOrFeature, callback) => {
      if (isOffline && !isRouteAllowedOffline(targetRouteOrFeature)) {
        setIsModalOpen(true);
        return false;
      }
      if (typeof callback === 'function') {
        callback();
      } else if (typeof onNavigate === 'function') {
        onNavigate(targetRouteOrFeature);
      }
      return true;
    },
    [isOffline, onNavigate]
  );

  return (
    <>
      {typeof children === 'function'
        ? children({
            isOnline,
            isOffline,
            guardAction: handleGuardedAction,
            openOfflineModal: () => setIsModalOpen(true),
          })
        : children}

      <OfflineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default OfflineGuard;
