import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquareCode, Trash2, SearchCode, Globe, Loader2, X } from 'lucide-react';
import { ChatMessage, Vendor } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  selectedVendor: Vendor | null;
  serverStatus: 'ok' | 'initializing' | 'missing_api_key' | 'error';
  errorMessage?: string;
  onClose?: () => void;
}

export default function ChatPanel({
  messages,
  loading,
  onSendMessage,
  onClearHistory,
  selectedVendor,
  serverStatus,
  errorMessage,
  onClose,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleTemplateClick = (text: string) => {
    if (loading) return;
    onSendMessage(text);
  };

  const getSystemBanner = () => {
    if (serverStatus === 'missing_api_key') {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs space-y-1.5 shadow-2xs select-text">
          <p className="font-bold flex items-center gap-1.5 text-amber-800">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            Gemini Key Configuration Needed
          </p>
          <p className="text-slate-600 leading-normal">
            To query the active chatbot and run real-time market searches, please navigate to the **Settings &gt; Secrets** panel in the AI Studio editor to set up your <strong>GEMINI_API_KEY</strong> environment variable.
          </p>
        </div>
      );
    }
    if (serverStatus === 'error') {
      return (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-xs space-y-1 select-text">
          <p className="font-bold flex items-center gap-1 text-red-800">
            Connection Error
          </p>
          <p className="text-slate-600 leading-normal">
            {errorMessage || 'The server returned an error during connection. Please re-run the development server.'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 w-full lg:w-[450px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800" id="chatbot-workspace-panel">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <div>
            <h2 className="font-semibold text-sm text-slate-100">AI Risk Assessor</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-emerald-400 font-medium">Google Search Grounding Live</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onClearHistory}
            type="button"
            disabled={messages.length === 0 || loading}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-350 disabled:opacity-30 hover:bg-slate-850 transition"
            title="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-850 transition flex items-center justify-center"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scrollbox */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 select-text" id="chat-messages-container">
        {getSystemBanner()}

        {messages.length === 0 ? (
          <div className="space-y-6 pt-4">
            <div className="space-y-2 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-2">
                <MessageSquareCode className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Supplier Intelligence Analyst</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask the intelligence agent to run a comparative assessment, check current material trends, or audit regulatory backlogs.
              </p>
            </div>

            {/* Quick Prompts Templates */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1 font-mono">Suggested Scenarios</p>
              <div className="space-y-2 text-left" id="chatbot-prompts-list">
                {[
                  {
                    title: "Which suppliers have low inventory buffers?",
                    prompt: "Provide an overview of all listed suppliers with Warning or Critical inventory levels. Which products are most vulnerable?"
                  },
                  {
                    title: "Search 2026 lithium supply conditions",
                    prompt: "Search the web for any major industrial lithium mining developments or environmental protests in Chile and South America during 2026. What is the outlook?"
                  },
                  {
                    title: "Geopolitical chip tension audit",
                    prompt: "Assess how sub-7nm extreme ultraviolet trade curbs specifically impact Taiwan semiconductor delivery timelines."
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTemplateClick(item.prompt)}
                    className="w-full text-left p-3 rounded-xl bg-slate-850/60 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition duration-150 cursor-pointer"
                  >
                    <span className="font-semibold block text-indigo-400 mb-0.5">{item.title}</span>
                    <span className="opacity-80 line-clamp-2">{item.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Name */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-1 font-mono">
                {msg.sender === 'user' ? 'User' : 'Lead Risk Analyst'}
              </span>

              {/* Message Bubble */}
              <div 
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                    : 'bg-slate-850 text-slate-100 rounded-bl-none border border-slate-800'
                }`}
              >
                {/* Parse simple markdown like list elements or formatting */}
                <div className="space-y-2 whitespace-pre-wrap select-text">
                  {msg.text}
                </div>

                {/* CITATIONS DISPLAY (If google search returns links) */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-800 select-none">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-2">
                      <SearchCode className="w-3 h-3 text-indigo-400" /> Search Grounded Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.slice(0, 4).map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950 rounded-md text-[10px] text-slate-300 hover:text-indigo-300 transition duration-150 flex items-center gap-1 pr-2 max-w-[170px] truncate"
                          title={source.title}
                        >
                          <Globe className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{source.title || 'Source link'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-1 font-mono">
              Lead Risk Analyst
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-bl-none px-4 py-3 bg-slate-850 border border-slate-800 text-slate-300 flex items-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">Synthesizing risk vector...</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                  <SearchCode className="w-3 h-3 text-slate-500 shrink-0 inline" /> Running real-time Google Search grounding
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Inputs Form Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        {selectedVendor && (
          <div className="px-3 py-1.5 bg-slate-900 text-[10pt] border border-slate-800 rounded-lg text-slate-400 flex items-center justify-between mb-2">
            <div className="truncate">
              Focusing dialogue: <strong className="text-slate-200 font-semibold">{selectedVendor.name}</strong>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-sm font-semibold uppercase shrink-0 ml-1">
              Active Focus
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query supplier risk, material hedges, industry disruptions..."
            disabled={loading || serverStatus === 'missing_api_key'}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 disabled:opacity-40 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || serverStatus === 'missing_api_key'}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-slate-800 disabled:text-slate-500 transition shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
