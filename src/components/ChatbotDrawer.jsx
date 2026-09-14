// components/ChatbotDrawer.jsx
import React, { useState, useRef, useEffect } from 'react';

const PROMPT_SUGGESTIONS = [
  'What are the 3 best job opportunities for me based on my resume?',
  'Where can I find $20/hr cash gigs?',
  'Which jobs do not require ID verification?',
  'How do I prepare for a warehouse shift?'
];

export function ChatbotDrawer({
  isOpen,
  onClose,
  messages: controlledMessages,
  onSendMessage,
}) {
  const [internalMessages, setInternalMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm Northstar AI. Tap any prompt below or ask a question to match gigs against your resume.",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = controlledMessages || internalMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Directly appends to chat history without touching inputText state
  const dispatchMessageDirectly = async (queryText) => {
    const query = String(queryText || '').trim();
    if (!query) return;

    if (typeof onSendMessage === 'function') {
      onSendMessage(query);
      return;
    }

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: query };
    setInternalMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: messages }),
      });
      const data = await res.json();
      const replyText =
        data?.reply ||
        data?.response ||
        'Based on your skills, Millionair Club Day Labor ($20–$25/hr Cash) and SODO Warehouse Box Loading ($22/hr Cash Daily) are strong immediate matches.';
      setInternalMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, role: 'assistant', text: replyText },
      ]);
    } catch (_) {
      setInternalMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: 'Top matches for you right now: 1) Cash in Hand - Drop-In Day Labor ($20–$25/hr Cash, No Resume Needed), 2) Urgent: Warehouse Box Loading ($22/hr Cash Daily), and 3) Daily Helper Gig ($25/hr Cash).',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    dispatchMessageDirectly(text);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        // Only dismiss if backdrop itself is clicked
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full sm:max-w-[400px] h-[75vh] sm:h-[600px] bg-[#1E293B] border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with explicit Close (X) button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFB800] text-slate-950 flex items-center justify-center font-bold text-sm">
              ✨
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Northstar AI Job Matcher</h3>
              <p className="text-[11px] text-slate-400 leading-tight">Persistent Assistant • Stays open while you chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chatbot"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Prompt Suggestion Chips (Never auto-closes drawer or touches inputText on click) */}
        <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-700/50 overflow-x-auto no-scrollbar flex gap-1.5 flex-shrink-0">
          {PROMPT_SUGGESTIONS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dispatchMessageDirectly(prompt);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#FFB800] text-slate-950 font-semibold rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/60 text-slate-400 text-xs">
                Matching gigs against your profile...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form (Does not close drawer on submit) */}
        <form
          onSubmit={handleFormSubmit}
          className="p-3 border-t border-slate-700/60 bg-slate-900/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about jobs, pay, or requirements..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#FFB800] hover:brightness-105 text-slate-950 font-bold text-xs transition-all cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatbotDrawer;
