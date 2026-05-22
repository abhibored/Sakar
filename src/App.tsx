import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  RotateCcw, 
  Compass, 
  Sparkles, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Vendor, ChatMessage } from './types';
import VendorList from './components/VendorList';
import VendorDetail from './components/VendorDetail';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [serverStatus, setServerStatus] = useState<'ok' | 'initializing' | 'missing_api_key' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resetLoading, setResetLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. Initial configuration check & database fetch
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        throw new Error('Could not connect to the API server.');
      }
      const data = await response.json();
      if (data.success) {
        setVendors(data.vendors);
        setServerStatus('ok');
        // Set first vendor as default selected
        if (data.vendors.length > 0 && !selectedVendorId) {
          setSelectedVendorId(data.vendors[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      // Double check if it's key configuration matter or general server error
      setServerStatus('missing_api_key');
      setErrorMessage(err.message || 'Please check if your dev server has compiled completely.');
    }
  };

  // 2. Chat communication handler
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `m_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoadingChat(true);

    try {
      // Map existing messages to history payload, omitting IDs and timestamps
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
          selectedVendorId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error && data.error.includes('GEMINI_API_KEY')) {
          setServerStatus('missing_api_key');
          throw new Error(data.error);
        }
        throw new Error(data.error || 'Server failed to process AI response.');
      }

      const botMsg: ChatMessage = {
        id: `m_bot_${Date.now()}`,
        sender: 'bot',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: data.groundingSources,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat sub-error:', err);
      // Post fallback systemic message to user
      const errBotMsg: ChatMessage = {
        id: `m_bot_err_${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Analyst System Alert**: ${err.message || 'We could not connect to our remote reasoning host. Please make sure your Gemini Key configuration in the Settings panel is valid.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errBotMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  // 3. Command prompts triggering
  const handleQuickChatPrompt = (promptText: string) => {
    setIsChatOpen(true);
    handleSendMessage(promptText);
  };

  // 4. Custom Supplier Addition Handler
  const handleAddVendor = (newVendor: Vendor) => {
    setVendors((prev) => [...prev, newVendor]);
    setSelectedVendorId(newVendor.id);

    // Append AI alert to dialogue
    const alertMsg: ChatMessage = {
      id: `m_bot_add_${Date.now()}`,
      sender: 'bot',
      text: `📊 **System Insight**: Loaded new supplier record **${newVendor.name}** and completed operational synthesis.\n- **Overall Rating**: \`${newVendor.riskStatus} Risk\` (${newVendor.riskScore}/100)\n- **Buffer Stock Threshold**: ${newVendor.inventoryBufferDays} days\n- **Mitigation Directive**: ${newVendor.actionableInsights[0]}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, alertMsg]);
  };

  // 5. Database Reset handler
  const handleResetDatabase = async () => {
    if (window.confirm('This will wipe any custom evaluated vendors and restore baseline configurations. Proceed?')) {
      setResetLoading(true);
      try {
        const response = await fetch('/api/vendors/reset', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
          setVendors(data.vendors);
          setSelectedVendorId(data.vendors[0]?.id || null);
          setMessages([]);
          alert('Database reset successful.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setResetLoading(false);
      }
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-800" id="main-sentinel-layout">
      
      {/* Dynamic Top bar header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 shrink-0 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Compass className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              CPG Supplier Risk Command Center
            </h1>
            <p className="text-xs text-slate-400">Authentic database of 200 CPG suppliers evaluated on Financial Instability, Delivery Delay, & Compliance Issues.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Key status indicator showcasing secure local state */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-mono">DATABASE ACCESS:</span>
              <span className="text-emerald-400 font-mono font-semibold tracking-wider text-[11px]">
                SECURED
              </span>
            </div>
            <div className="text-[9px] text-indigo-300 font-medium px-1.5 py-0.5 bg-indigo-950 rounded border border-indigo-800/40">
              200 CPG SUPPLIERS LOADED
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
              isChatOpen 
                ? 'bg-indigo-600 hover:bg-indigo-750 text-white shadow-md border border-indigo-500' 
                : 'bg-indigo-950 border border-indigo-800 text-indigo-200 hover:text-white hover:bg-indigo-900'
            }`}
            title="Toggle AI Risk Assessor panel"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Risk Assessor</span>
            {messages.length > 0 && (
              <span className="bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>

          <button
            id="reset-db-btn"
            onClick={handleResetDatabase}
            disabled={resetLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition disabled:opacity-40"
            title="Reset database to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Baseline</span>
          </button>
        </div>
      </header>

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Leftmost Sidebar - Vendor Index */}
        <VendorList
          vendors={vendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={setSelectedVendorId}
          onOpenAddModal={() => {}}
        />

        {/* Center Section - Technical Workspace Telemetry */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {selectedVendor ? (
            <VendorDetail
              vendor={selectedVendor}
              onQuickChatPrompt={handleQuickChatPrompt}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8 space-y-3">
              <Building2 className="w-16 h-16 text-slate-200" />
              <div>
                <h3 className="font-semibold text-slate-700 text-sm">No Monitored Supplier Selected</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Select a CPG supplier from the database on the left to inspect detailed risk assessments and predictive trend diagnostics.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Conversations Interface (Elegant Hover Overlay side drawer) */}
        {isChatOpen && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 shadow-2xl flex transition-all duration-300 transform translate-x-0">
            {/* Soft dark tinted backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs -z-10 cursor-alias"
              onClick={() => setIsChatOpen(false)}
            />
            <div className="flex-grow flex flex-col h-full bg-slate-900 shadow-2xl relative border-l border-slate-800">
              <ChatPanel
                messages={messages}
                loading={loadingChat}
                onSendMessage={handleSendMessage}
                onClearHistory={handleClearHistory}
                selectedVendor={selectedVendor}
                serverStatus={serverStatus}
                errorMessage={errorMessage}
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Floating Action Button for AI Risk Assessor when closed */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-3 rounded-full shadow-lg border border-indigo-500 hover:border-indigo-400 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 z-50 animate-bounce"
            title="Open AI Risk Assessor chat panel"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 fill-indigo-200" />
            <span>AI Risk Assessor</span>
            {messages.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center ml-0.5 shadow-sm animate-pulse">
                {messages.length}
              </span>
            )}
          </button>
        )}

      </div>
    </div>
  );
}
