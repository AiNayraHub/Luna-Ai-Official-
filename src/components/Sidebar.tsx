import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Sparkles,
  Sliders,
  ShieldCheck,
  X,
  MoreVertical,
  LogIn,
} from 'lucide-react';
import { ChatThread, UserProfile } from '../types';
import { groupThreadsByDate } from '../utils/storage';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  onTogglePinThread: (id: string) => void;
  onClearAllChats?: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  firebaseUser?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
  onTogglePinThread,
  onClearAllChats,
  onOpenSettings,
  onOpenProfile,
  userProfile,
  firebaseUser,
  onGoogleLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [activeMenuThreadId, setActiveMenuThreadId] = useState<string | null>(null);

  // Filter threads by search query
  const filteredThreads = searchQuery.trim()
    ? threads.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.messages.some((m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : threads;

  const grouped = groupThreadsByDate(filteredThreads);

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditTitleInput(thread.title);
    setActiveMenuThreadId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitleInput.trim()) {
      onRenameThread(id, editTitleInput.trim());
    }
    setEditingThreadId(null);
  };

  return (
    <>
      {/* Mobile Backdrop for phone screens */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        id="luna-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-[82vw] max-w-[280px] md:w-64 bg-[#f8fafc] border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out select-none shadow-sm md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10a37f] to-[#0b6e55] flex items-center justify-center text-white shadow-md shadow-[#10a37f]/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                  Luna AI
                </span>
              </div>
              <span className="text-[10px] text-[#10a37f] font-extrabold tracking-wider uppercase">
                {firebaseUser ? 'Cloud Synced' : userProfile.plan}
              </span>
            </div>
          </div>

          <button
            id="btn-sidebar-close-mobile"
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 space-y-2 bg-[#f8fafc]">
          <button
            id="btn-new-chat"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50/50 text-gray-900 border border-gray-200 hover:border-[#10a37f]/60 transition-all shadow-xs group"
          >
            <span className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <Plus className="w-4 h-4 text-[#10a37f] group-hover:rotate-90 transition-transform duration-200" />
              <span>New Chat</span>
            </span>
            <kbd className="text-[10px] text-gray-400 font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
              ⌘K
            </kbd>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="input-search-chats"
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] rounded-lg text-gray-800 placeholder-gray-400 outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Chat History Header & Clear Option */}
        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            History {threads.length > 0 && `(${threads.length})`}
          </span>
          {threads.length > 0 && onClearAllChats && (
            <button
              id="btn-sidebar-clear-all-history"
              onClick={onClearAllChats}
              className="text-[11px] font-bold text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
              title="Delete all chat history"
            >
              <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {/* Chat History List */}
        <div
          id="chat-history-container"
          className="flex-1 overflow-y-auto px-2 py-1 space-y-3 text-xs"
        >
          {Object.entries(grouped).map(([category, threadList]) => {
            if (threadList.length === 0) return null;
            return (
              <div key={category} className="space-y-1">
                <div className="px-2.5 py-0.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {threadList.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  const isEditing = thread.id === editingThreadId;
                  const isMenuOpen = activeMenuThreadId === thread.id;

                  return (
                    <div
                      key={thread.id}
                      id={`thread-item-${thread.id}`}
                      onClick={() => {
                        onSelectThread(thread.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? 'bg-white text-[#0f172a] font-bold shadow-xs border border-gray-200'
                          : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {thread.isPinned ? (
                          <Pin className="w-3.5 h-3.5 text-[#10a37f] shrink-0 fill-[#10a37f]/20" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-gray-600" />
                        )}

                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitleInput}
                            autoFocus
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onBlur={() => handleSaveRename(thread.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(thread.id);
                              if (e.key === 'Escape') setEditingThreadId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-[#10a37f] px-1.5 py-0.5 text-xs text-gray-900 rounded outline-none w-full font-semibold"
                          />
                        ) : (
                          <span className="truncate text-xs">{thread.title}</span>
                        )}
                      </div>

                      {/* Thread Actions Menu & Delete Buttons */}
                      {!isEditing && (
                        <div
                          className={`flex items-center gap-0.5 transition-opacity ${
                            isMenuOpen || isActive
                              ? 'opacity-100'
                              : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                          }`}
                        >
                          {/* Direct Delete Button */}
                          <button
                            id={`btn-delete-thread-${thread.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteThread(thread.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 3-dots Menu Button */}
                          <button
                            id={`btn-thread-menu-${thread.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuThreadId(isMenuOpen ? null : thread.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Dropdown Menu for Thread Actions */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-8 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePinThread(thread.id);
                              setActiveMenuThreadId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                          >
                            <Pin className="w-3 h-3 text-[#10a37f]" />
                            <span>{thread.isPinned ? 'Unpin' : 'Pin chat'}</span>
                          </button>

                          <button
                            onClick={(e) => handleStartRename(thread, e)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                          >
                            <Edit2 className="w-3 h-3 text-sky-600" />
                            <span>Rename</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteThread(thread.id);
                              setActiveMenuThreadId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 font-medium"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filteredThreads.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-xs">
              No conversations found.
            </div>
          )}
        </div>

        {/* Bottom Profile & Settings Section */}
        <div className="p-3 border-t border-gray-200 bg-white space-y-2">
          {!firebaseUser && onGoogleLogin && (
            <button
              id="btn-sidebar-google-login"
              onClick={onGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl border border-gray-200 transition-all shadow-2xs group"
            >
              <LogIn className="w-3.5 h-3.5 text-[#10a37f] group-hover:scale-110 transition-transform" />
              <span>Sign In with Google</span>
            </button>
          )}

          <div
            id="sidebar-profile-card"
            onClick={onOpenProfile}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
            title="Manage Profile & Settings"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#10a37f] to-[#0b6e55] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
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
              <div className="min-w-0 text-left">
                <div className="font-bold text-xs text-gray-900 truncate">
                  {userProfile.name}
                </div>
                <div className="text-[10px] text-gray-500 font-semibold truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#10a37f]" />
                  <span>{firebaseUser ? 'Google Synced' : userProfile.plan}</span>
                </div>
              </div>
            </div>

            <button
              id="btn-sidebar-open-settings"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="p-1.5 text-gray-400 group-hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
