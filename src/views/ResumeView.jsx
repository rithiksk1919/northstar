// views/ResumeView.jsx
import React from 'react';
import { AppHeader } from '../components/AppHeader';

export function ResumeView({ isDarkMode, onToggleTheme, userInitial = 'S', children }) {
  return (
    <div className="flex flex-col min-h-full pb-24">
      <AppHeader
        title="AI Resume Builder"
        subtitle="Empowering your career step-by-step"
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        userInitial={userInitial}
      />
      <div className="flex-grow p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

export default ResumeView;
