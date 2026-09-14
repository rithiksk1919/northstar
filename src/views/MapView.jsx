// views/MapView.jsx
import React from 'react';
import { AppHeader } from '../components/AppHeader';
import ResourceMap from '../components/ResourceMap';

export function MapView({ isDarkMode, onToggleTheme, userInitial = 'S' }) {
  return (
    <div className="flex flex-col min-h-full h-full">
      <AppHeader
        title="Resource Map"
        subtitle="Verified nearby essentials & safe shelters"
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        userInitial={userInitial}
      />
      <div className="flex-1 relative min-h-0">
        <ResourceMap />
      </div>
    </div>
  );
}

export default MapView;
