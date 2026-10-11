import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Zap,
  BrainCircuit,
  Globe,
  Radio,
  Plus,
  Check,
  ShieldCheck,
  LogIn,
  LogOut,
  Sliders,
  User,
  Trash2,
} from 'lucide-react';
import { ModelId, UserProfile, ChatThread } from '../types';
import { MODELS } from '../data/constants';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onOpenLiveVoice: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onNewChat: () => void;
  activeThread?: ChatThread | null;
  onDeleteCurrentChat?: () => void;
  onClearAllChats?: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  firebaseUser?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  selectedModel,
  onSelectModel,
  onOpenLiveVoice,
  onOpenSettings,
  onOpenProfile,
  onNewChat,
  activeThread,
  onDeleteCurrentChat,
  onClearAllChats,
  enableSearch,
  onToggleSearch,
  userProfile,
  firebaseUser,
  onGoogleLogin,
  onGoogleLogout,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = (id: ModelId) => {
    switch (id) {
      case 'gemini-2.5-pro':
        return <BrainCircuit className="w-4 h-4 text-purple-600" />;
      case 'gemini-2.5-flash-lite':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#10a37f]" />;
    }
  };

  return (
    <header
      id="luna-main-header"
      className="sticky top-0 z-30 flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-colors"
    >
      {/* Left side: Hamburger, New Chat (phone), and Model Selector */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          id="btn-header-new-chat"
          onClick={onNewChat}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          title="New Chat"
        >
          <Plus className="w-5 h-5 text-[#10a37f]" />
        </button>

        {/* Model Selector Dropdown - Compact on phones */}
        <div className="relative min-w-0" ref={modelDropdownRef}>
          <button
            id="btn-model-selector"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 text-gray-900 font-semibold text-xs sm:text-sm transition-all border border-gray-200 hover:border-gray-300 shadow-2xs max-w-[150px] sm:max-w-none truncate"
          >
            <span className="flex items-center gap-1.5 shrink-0">
              {getModelIcon(selectedModel)}
              <span className="font-bold text-gray-900 tracking-tight truncate">
                {currentModel.name}
              </span>
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-[#10a37f] border border-emerald-200">
              {currentModel.badge}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-transform shrink-0 ${
                modelDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {modelDropdownOpen && (
            <div
              id="model-selector-menu"
              className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Select AI Model
              </div>
              <div className="space-y-1 mt-1">
                {MODELS.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      id={`model-opt-${model.id}`}
                      onClick={() => {
                        onSelectModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50/60 border border-emerald-200 text-gray-900'
                          : 'hover:bg-gray-50 border border-transparent text-gray-700'
                      }`}
                    >
                      <div className="mt-0.5 p-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
                        {getModelIcon(model.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 tracking-tight">
                            {model.name}
                          </span>
                          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {model.speed}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                          {model.tagline}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#10a37f] mt-1 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Search toggle, Live Voice, and Google Profile Button */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Search grounding toggle button */}
        <button
          id="btn-header-search-toggle"
          onClick={onToggleSearch}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            enableSearch
              ? 'bg-emerald-50 text-[#10a37f] border border-emerald-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title={
            enableSearch
              ? 'Web Search Grounding: Active'
              : 'Enable Web Search Grounding'
          }
        >
          <Globe
            className={`w-3.5 h-3.5 ${enableSearch ? 'animate-pulse text-[#10a37f]' : ''}`}
          />
          <span className="hidden sm:inline">
            {enableSearch ? 'Web Active' : 'Web'}
          </span>
        </button>

        {/* Live Voice Mode Button */}
        <button
          id="btn-header-live-voice"
          onClick={onOpenLiveVoice}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#10a37f] hover:bg-[#0d8265] text-white shadow-xs hover:shadow-sm transition-all text-xs font-bold"
          title="Open Voice Mode"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Voice</span>
        </button>

        {/* Delete current chat button if conversation has messages */}
        {activeThread && activeThread.messages.length > 0 && onDeleteCurrentChat && (
          <button
            id="btn-header-delete-current-chat"
            onClick={onDeleteCurrentChat}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
            title="Delete this conversation"
            aria-label="Delete this conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Delete Chat</span>
          </button>
        )}

        {/* Google Sign In Button (if not signed in) */}
        {!firebaseUser && onGoogleLogin && (
          <button
            id="btn-header-google-login"
            onClick={onGoogleLogin}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Sign in with Google"
          >
            <LogIn className="w-3.5 h-3.5 text-[#10a37f]" />
            <span className="hidden md:inline">Sign In</span>
          </button>
        )}

        {/* Profile Avatar & Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            id="btn-header-profile"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-[#10a37f] transition-all"
            title="Account & Profile"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#10a37f] to-[#0d8265] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {userProfile.avatar && userProfile.avatar.trim() ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                userProfile.name?.charAt(0) || 'U'
              )}
            </div>
          </button>

          {/* Profile Dropdown Menu in White Theme */}
          {profileDropdownOpen && (
            <div
              id="header-profile-menu"
              className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-gray-800"
            >
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#10a37f] flex items-center justify-center text-white font-bold text-sm">
                    {userProfile.avatar && userProfile.avatar.trim() ? (
                      <img
                        src={userProfile.avatar}
                        alt={userProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userProfile.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">
                      {userProfile.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {firebaseUser?.email || userProfile.email}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#10a37f] text-xs font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{userProfile.plan}</span>
                  </div>
                  {firebaseUser ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Google Synced
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                      Guest Mode
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                {!firebaseUser && onGoogleLogin && (
                  <button
                    id="profile-opt-google-login"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onGoogleLogin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-left font-bold"
                  >
                    <LogIn className="w-4 h-4 text-[#10a37f]" />
                    <span>Sign In with Google</span>
                  </button>
                )}

                <button
                  id="profile-opt-settings"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-left font-semibold"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Edit Profile & Avatar</span>
                </button>

                <button
                  id="profile-opt-app-settings"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-left font-semibold"
                >
                  <Sliders className="w-4 h-4 text-gray-500" />
                  <span>Settings & Preferences</span>
                </button>

                {onClearAllChats && (
                  <button
                    id="profile-opt-clear-all-history"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onClearAllChats();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left font-semibold"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Chat History</span>
                  </button>
                )}

                {firebaseUser && onGoogleLogout && (
                  <button
                    id="profile-opt-google-logout"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onGoogleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
