import React from 'react';

const Modal = ({ isOpen, onClose, title, children, type = 'info', confirmText = 'OK', cancelText = 'Batal', onConfirm, showConfirmOnly = false }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            case 'confirm':
                return (
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                        <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    const getHeaderBg = () => {
        switch (type) {
            case 'success': return 'bg-bizkit-green';
            case 'error': return 'bg-red-600';
            case 'confirm': return 'bg-[#0f766e]';
            default: return 'bg-bizkit-green';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-40 transition-opacity" onClick={onClose}></div>
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full z-[110] overflow-hidden transform transition-all animate-fade-in-up">
                <div className={`${getHeaderBg()} px-6 py-4 flex justify-between items-center text-white`}>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-8 text-center">
                    {getIcon()}
                    <div className="text-md text-gray-700 font-medium whitespace-pre-wrap">
                        {children}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-center space-x-3 rounded-b-lg border-t border-gray-100">
                    {!showConfirmOnly && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm || onClose}
                        className={`px-6 py-2 text-sm font-bold text-white shadow-sm focus:outline-none transition-colors ${type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-bizkit-green hover:bg-green-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
