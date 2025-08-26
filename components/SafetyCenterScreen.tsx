import React from 'react';

const SafetyCenterScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {

    const SafetyTip: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{children}</p>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Safety Center</h1>
            </header>
            <main className="p-4 space-y-6">
                <section>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Local Emergency Services</h2>
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">Animal Control (Local)</p>
                                <p className="text-sm text-gray-500">For stray or distressed animals</p>
                            </div>
                            <a href="tel:1800112525" className="bg-red-500 text-white font-bold text-sm py-1.5 px-3 rounded-md">Call Now</a>
                        </div>
                         <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">24/7 Emergency Vet</p>
                                <p className="text-sm text-gray-500">Find nearest emergency clinic</p>
                            </div>
                            <a href="#" onClick={(e) => { e.preventDefault(); alert("Feature to find nearby vets coming soon!"); }} className="bg-blue-500 text-white font-bold text-sm py-1.5 px-3 rounded-md">Find Vets</a>
                        </div>
                    </div>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Meetup Safety Tips</h2>
                     <div className="space-y-3">
                        <SafetyTip title="Meet in Public">
                            Always arrange first meetings in a well-lit, public place, like a popular dog park or a pet-friendly café.
                        </SafetyTip>
                        <SafetyTip title="Inform Someone">
                            Let a friend or family member know where you're going, who you're meeting, and when you expect to be back.
                        </SafetyTip>
                        <SafetyTip title="Observe Pet Interactions">
                            Keep initial interactions between pets brief and on-leash. Watch for signs of stress or aggression and be ready to separate them calmly.
                        </SafetyTip>
                         <SafetyTip title="Trust Your Instincts">
                            If a situation or person feels off, it's okay to end the meetup early. Your safety and your pet's safety are the top priority.
                        </SafetyTip>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SafetyCenterScreen;
