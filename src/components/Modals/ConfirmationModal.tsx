import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    return isOpen ? (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-black p-5 rounded-lg shadow-lg">
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
