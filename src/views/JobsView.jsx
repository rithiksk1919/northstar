// views/JobsView.jsx
import React, { useState, useCallback } from 'react';
import { JobsHeader } from '../components/JobsHeader';
import { ChatbotDrawer } from '../components/ChatbotDrawer';

const DEFAULT_JOBS = [
  {
    id: 'job-1',
    category: 'Drop-In Daily Labor',
    title: 'Cash in Hand - Drop-In Day Labor (Millionair Club)',
    meta: '📍 2515 Western Ave, Belltown • 🏢 Millionair Club Charity',
    pay: '$20–$25/hr Cash',
    tags: ['Drop-In 7AM', 'Free Hot Breakfast', 'Work Boots Provided', 'Daily Pay'],
    contact: '📞 (206) 728-5627 | Walk-ins Welcome',
  },
  {
    id: 'job-2',
    category: 'Same-Day Labor',
    title: 'Urgent: Warehouse Box Loading & Pallet Wrapping',
    meta: '📍 SODO District, Seattle • 🏢 Craigslist Live / Verified Gig',
    pay: '$22/hr Cash Daily',
    tags: ['No Resume Needed', 'Lift 40lbs', 'Same-Day Cash Payout'],
    contact: '📞 (206) 555-0192 | Ask for Shift Lead',
  },
];

export function JobsView({
  isDarkMode,
  onToggleTheme,
  userInitial = 'S',
  jobs = DEFAULT_JOBS,
  appendChatMessage: externalAppendChatMessage,
  children,
}) {
  // Persistent chatbot drawer state (does not auto-close on prompt dispatch)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm Northstar AI. Tap any prompt below or ask a question to match gigs against your resume.",
    },
  ]);

  // Directly append action/message to chat history without touching input box state
  const internalAppendChatMessage = useCallback((messageObj) => {
    if (!messageObj || !messageObj.text) return;
    const userEntry = {
      id: `user-${Date.now()}`,
      role: messageObj.role || 'user',
      text: messageObj.text,
    };
    setChatMessages((prev) => [...prev, userEntry]);

    // Trigger AI response without touching text input state
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageObj.text }),
    })
      .then((res) => res.json())
      .then((data) => {
        const replyText =
          data?.reply ||
          data?.response ||
          'Top matches based on your resume: 1) Cash in Hand - Drop-In Day Labor ($20–$25/hr Cash), 2) Urgent: Warehouse Box Loading ($22/hr Cash Daily).';
        setChatMessages((prev) => [
          ...prev,
          { id: `bot-${Date.now()}`, role: 'assistant', text: replyText },
        ]);
      })
      .catch(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            text: 'Top matches based on your resume: 1) Cash in Hand - Drop-In Day Labor ($20–$25/hr Cash), 2) Urgent: Warehouse Box Loading ($22/hr Cash Daily).',
          },
        ]);
      });
  }, []);

  const appendChatMessage =
    typeof externalAppendChatMessage === 'function'
      ? externalAppendChatMessage
      : typeof window !== 'undefined' && typeof window.appendChatMessage === 'function'
      ? window.appendChatMessage
      : internalAppendChatMessage;

  const handleMatchClick = () => {
    setIsChatOpen(true);

    // Directly append action/message to chat history without touching input box state
    if (typeof appendChatMessage === 'function') {
      appendChatMessage({
        role: 'user',
        text: 'Find my perfect job match against my resume',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 relative">
      <JobsHeader
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        userInitial={userInitial}
      />

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* Direct Match Action Banner */}
        <button
          onClick={handleMatchClick}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 hover:border-amber-400/60 transition-all text-left"
        >
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
              <span>✨</span>
              <span>Find your perfect job match</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tap to match gigs against your resume</p>
          </div>
          <span className="text-amber-400 font-bold">→</span>
        </button>

        {/* Job Listings with Hover-Only Amber Border */}
        <div className="space-y-3">
          {jobs.map((job) => (
            /* Replace static yellow border with hover-only state */
            <div
              key={job.id}
              className="bg-slate-800/40 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-amber-400 dark:hover:border-amber-400 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-[10px] text-[10px] font-bold mb-1 bg-slate-700/60 text-amber-400">
                    {job.category}
                  </span>
                  <h4 className="font-extrabold text-sm leading-snug text-white">
                    {job.title}
                  </h4>
                  <p className="text-[11px] font-medium mt-0.5 text-slate-400">
                    {job.meta}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
                <span className="px-2.5 py-1 rounded-full font-extrabold text-xs bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  {job.pay}
                </span>
                {job.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-slate-700/50 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-700/40">
                <span className="text-[11px] font-semibold truncate max-w-[180px] text-slate-300">
                  {job.contact}
                </span>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-[12px] text-xs font-extrabold bg-[#FFB800] text-slate-950 transition-all active:scale-95"
                >
                  Apply / Call
                </button>
              </div>
            </div>
          ))}
        </div>

        {children}
      </div>

      {/* Persistent Chatbot Drawer (Explicit close ONLY via X button or backdrop) */}
      {isChatOpen && (
        <ChatbotDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={(text) =>
            internalAppendChatMessage({ role: 'user', text })
          }
        />
      )}
    </div>
  );
}

export default JobsView;

