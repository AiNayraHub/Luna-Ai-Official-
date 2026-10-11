import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sun,
  ShieldCheck,
  Trash2,
  Download,
  Volume2,
  VolumeX,
  Check,
  LogIn,
  LogOut,
  Cloud,
} from 'lucide-react';
import { UserProfile, ModelId, ChatThread } from '../types';
import { MODELS } from '../data/constants';
import { User as FirebaseUser } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  threads: ChatThread[];
  onClearAllChats: () => void;
  firebaseUser?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  selectedModel,
  onSelectModel,
  threads,
  onClearAllChats,
  firebaseUser,
  onGoogleLogin,
  onGoogleLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'data'>('general');
  const [soundEnabled, setSoundEnabled] = useState(userProfile.soundEnabled);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSoundEnabled(userProfile.soundEnabled);
    }
  }, [isOpen, userProfile]);

  const handleSaveSettings = () => {
    onUpdateProfile({
      ...userProfile,
      theme: 'light',
      soundEnabled,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleExportAllData = () => {
    const data = {
      userProfile,
      threads,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna_ai_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-gray-200 w-full max-w-xl max-h-[88dvh] rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#10a37f]" />
            <div>
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                Settings
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-4 sm:px-6 gap-2 sm:gap-4 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2.5 sm:py-3 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-[#10a37f] text-[#10a37f]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`py-2.5 sm:py-3 border-b-2 transition-colors ${
              activeTab === 'models'
                ? 'border-[#10a37f] text-[#10a37f]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Models
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2.5 sm:py-3 border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-[#10a37f] text-[#10a37f]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Data & Backup
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Theme Preference - Enforced White Theme */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-gray-900">
                      Color Theme
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Crisp white modern light theme
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#10a37f] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  White Theme
                </span>
              </div>

              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#10a37f]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-gray-900">
                      Audio Responses
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Enable text-to-speech audio playback
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    soundEnabled ? 'bg-[#10a37f]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      soundEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Cloud Account Sync */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-[#10a37f]" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                        Google Account
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {firebaseUser
                          ? `Signed in as ${firebaseUser.email}`
                          : 'Sign in to sync your conversations'}
                      </div>
                    </div>
                  </div>

                  {firebaseUser ? (
                    <button
                      type="button"
                      onClick={onGoogleLogout}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs font-bold border border-gray-200 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onGoogleLogin}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#10a37f]" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-2.5">
              {MODELS.map((model) => {
                const isSelected = model.id === selectedModel;
                return (
                  <div
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                        <span>{model.name}</span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                          {model.speed}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[#10a37f] text-xs font-bold">
                          <Check className="w-4 h-4" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{model.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900">
                    Export Chat History
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Download all {threads.length} threads in JSON format
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportAllData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold border border-gray-300 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-200 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-red-700">
                    Clear All Conversations
                  </div>
                  <div className="text-[11px] text-red-500">
                    Irreversibly delete all chat threads
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-settings-clear-all"
                  onClick={() => {
                    onClearAllChats();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0d8265] text-white text-xs font-bold shadow-sm transition-all"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
