import React, { useState } from 'react';

interface DataPrivacyScreenProps {
    onBack: () => void;
    onExportData: () => void;
    onDeleteAccount: () => void;
}

const DataPrivacyScreen: React.FC<DataPrivacyScreenProps> = ({ onBack, onExportData, onDeleteAccount }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleting(true);
        // Add a small delay to give a feeling of processing
        setTimeout(() => {
            onDeleteAccount();
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }, 1000);
    };

    const isDeleteButtonDisabled = deleteConfirmText.toLowerCase() !== 'delete my account';

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Data & Privacy</h1>
            </header>

            <main className="p-4 space-y-6">
                {/* Data Export Section */}
                <section className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Export Your Data</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        You can download a copy of your information at any time. This includes your profile, pet details, and post history in a machine-readable JSON format.
                    </p>
                    <button
                        onClick={onExportData}
                        className="w-full bg-teal-500 text-white font-bold py-2.5 rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        Download My Data
                    </button>
                </section>

                {/* Danger Zone Section */}
                <section className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h2 className="text-lg font-bold text-red-800 mb-2">Danger Zone</h2>
                    <p className="text-sm text-red-700 mb-4">
                        Deleting your account is a permanent action. All your data will be scheduled for deletion and will be completely removed after a 30-day grace period.
                    </p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete My Account
                    </button>
                </section>
            </main>
            
            {/* Account Deletion Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-center text-red-700">Are you absolutely sure?</h2>
                        <p className="text-gray-600 mt-2 text-sm text-center">This action cannot be undone. This will permanently delete your account and all associated data.</p>
                        
                        <div className="my-4">
                             <button
                                onClick={onExportData}
                                className="w-full flex items-center justify-center gap-2 text-sm bg-gray-100 text-gray-700 font-semibold py-2 rounded-md hover:bg-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export my data first
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700">To confirm, type "delete my account" below:</label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md border-red-300 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-200 font-bold py-2.5 rounded-lg">Cancel</button>
                            <button onClick={handleDeleteClick} disabled={isDeleteButtonDisabled || isDeleting} className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                {isDeleting ? 'Deleting...' : 'I understand, delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataPrivacyScreen;