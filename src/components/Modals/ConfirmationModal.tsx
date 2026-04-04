import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    return isOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-black dark:ring-slate-800">
                <p className="mb-4 font-bold">{message}</p>
                <div className="flex justify-end">
                    <button onClick={onCancel} className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red hover:bg-red-600 text-white rounded-lg">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default ConfirmationModal;
