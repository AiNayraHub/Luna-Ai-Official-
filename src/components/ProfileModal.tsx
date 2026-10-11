import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Check,
  User,
  ShieldCheck,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Cloud,
} from 'lucide-react';
import { UserProfile } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  firebaseUser?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
}

// Curated avatar presets
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  firebaseUser,
  onGoogleLogin,
  onGoogleLogout,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [aboutUser, setAboutUser] = useState(userProfile.aboutUser || '');
  const [isDragging, setIsDragging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(userProfile.name);
      setEmail(userProfile.email);
      setAvatar(userProfile.avatar);
      setAboutUser(userProfile.aboutUser || '');
      setSaveSuccess(false);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name: name.trim() || 'User',
      email: email.trim() || userProfile.email,
      avatar,
      aboutUser: aboutUser.trim(),
    });

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="profile-modal-card"
        className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#10a37f]" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Profile & Account
            </h2>
          </div>
          <button
            id="btn-close-profile-modal"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1"
        >
          {/* Avatar Section */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 bg-white shadow-sm flex items-center justify-center text-gray-700 font-bold text-xl">
                  {avatar && avatar.trim() ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{name?.charAt(0) || 'U'}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Change</span>
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900">
                  Profile Photo
                </h3>
                <p className="text-xs text-gray-500">
                  Upload an image (PNG, JPG) or choose a preset below.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold border border-gray-300 transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#10a37f]" />
                    <span>Upload Image</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs font-bold border border-gray-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Or choose preset
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 shrink-0 ${
                      avatar === presetUrl
                        ? 'border-[#10a37f] ring-2 ring-[#10a37f]/30'
                        : 'border-gray-200'
                    }`}
                  >
                    {presetUrl && presetUrl.trim() ? (
                      <img
                        src={presetUrl}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Google Account Authentication Section */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#10a37f]">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Google Cloud Synchronization
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {firebaseUser
                      ? `Connected as ${firebaseUser.email}`
                      : 'Sync conversations across devices'}
                  </p>
                </div>
              </div>

              {firebaseUser ? (
                <button
                  type="button"
                  id="btn-profile-google-logout"
                  onClick={onGoogleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs font-bold border border-gray-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-profile-google-login"
                  onClick={onGoogleLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#10a37f]" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {firebaseUser && (
              <div className="text-[11px] text-[#10a37f] bg-emerald-50 p-2 rounded-xl flex items-center gap-1.5 font-semibold border border-emerald-200">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Chat threads and settings are backed up to Firestore.</span>
              </div>
            )}
          </div>

          {/* Name & Email Fields */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="input-display-name"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Display Name
              </label>
              <input
                id="input-display-name"
                type="text"
                required
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-white border border-gray-300 focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] px-3.5 py-2 text-sm text-gray-900 rounded-xl outline-none font-semibold transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="input-profile-email"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Email Address
              </label>
              <input
                id="input-profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-white border border-gray-300 focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] px-3.5 py-2 text-sm text-gray-900 rounded-xl outline-none font-medium transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="input-profile-bio"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Role / Bio (Optional)
              </label>
              <textarea
                id="input-profile-bio"
                rows={2}
                value={aboutUser}
                onChange={(e) => setAboutUser(e.target.value)}
                placeholder="e.g., Software Engineer, Researcher, Designer..."
                className="w-full bg-white border border-gray-300 focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] px-3.5 py-2 text-xs text-gray-900 rounded-xl outline-none leading-relaxed transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-profile-edit"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="btn-save-profile-changes"
              disabled={saveSuccess}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0d8265] text-white text-xs font-bold shadow-sm transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
