import React from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-dialog-overlay"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="confirm-dialog-content"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 space-y-4 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            type="button"
            id="btn-close-confirm-dialog"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900 leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            id="btn-cancel-confirm-dialog"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-execute-confirm-dialog"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
