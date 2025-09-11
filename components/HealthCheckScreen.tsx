

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pet, HealthCheckResult, AIFeedback, HealthCategoryAnalysis, CareRecommendation, ActionItem, LocalService } from '../types';
import { supabase } from '../services/supabaseClient';
import Tooltip from './Tooltip';
import Confetti from './Confetti';


interface HealthCheckScreenProps {
  pet: Pet | null;
  onAnalyze: (imageFile: File, notes: string) => void;
  isChecking: boolean;
  result: HealthCheckResult | null;
  error: string | null;
  onClearAnalysis: () => void;
}

// --- Visual Report Sub-components ---

const getStatusColor = (status: 'Excellent' | 'Good' | 'Concern' | string): { main: string, bg: string } => {
    switch (status) {
        case 'Excellent': return { main: '#22c55e', bg: '#f0fdf4' }; // green-500, green-50
        case 'Good': return { main: '#f59e0b', bg: '#fffbeb' }; // amber-500, amber-50
        case 'Concern': return { main: '#ef4444', bg: '#fef2f2' }; // red-500, red-50
        default: return { main: '#6b7280', bg: '#f3f4f6' }; // gray-500, gray-100
    }
};

const CARE_ICONS: { [key: string]: React.ReactNode } = {
    grooming_brush: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L8.447 6.106A1 1 0 008 7v1.447A2 2 0 009.447 10h1.106A2 2 0 0012 8.553V7a1 1 0 00.894-.553l4-8zM4.707 12.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414-1.414l-3-3zM4 10a1 1 0 011-1h.5a1 1 0 010 2H5a1 1 0 01-1-1zm3 3a1 1 0 011-1h.5a1 1 0 010 2H8a1 1 0 01-1-1zm3 3a1 1 0 011-1h.5a1 1 0 010 2h-.5a1 1 0 01-1-1z" /></svg>,
    dental_care: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>,
    diet_food: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm5.5 3a.5.5 0 01.5.5v1.456l-1.057 1.057a.5.5 0 01-.707-.707L8.544 6H7.5a.5.5 0 010-1h2zM5 11.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zm0 2a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg>,
    exercise_walk: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
    vet_visit: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>,
    medication: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 3a1 1 0 000 2v10a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 000-2H5zm4 3a1 1 0 00-2 0v2a1 1 0 102 0V6zm-1 5a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" /></svg>,
    eye_drops: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" /></svg>,
    ear_cleaner: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1H7zM4 6a1 1 0 011-1h8a1 1 0 110 2H5a1 1 0 01-1-1zm1 3a1 1 0 100 2h.01a1 1 0 100-2H5zm3.293 2.293a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414zM15 9a1 1 0 100 2h.01a1 1 0 100-2H15z" clipRule="evenodd" /></svg>,
    skin_care: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
    mental_stimulation: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6c0 1.887.674 3.633 1.79 5.043A2.25 2.25 0 017 15.25V17a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-1.75a2.25 2.25 0 011.21-2.207A6.002 6.002 0 0010 2zm0 11a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" /></svg>,
    default: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
};


const VisualHealthReport: React.FC<{ pet: Pet; result: HealthCheckResult; previousResult?: HealthCheckResult | null; onBack: () => void; }> = ({ pet, result, previousResult, onBack }) => {
    const navigate = useNavigate();
    const [showCelebration, setShowCelebration] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);
    
    useEffect(() => {
        if (result.overallHealthScore >= 90) setShowCelebration(true);
    }, [result.overallHealthScore]);
    
    const handleShare = () => {
        navigator.clipboard.writeText(`🐾 Great news! ${pet.name} just had a wellness check and scored ${result.overallHealthScore}/100! We're staying on top of their health journey. #PetHealth #HappyPet #${pet.breed.replace(/\s+/g, '')}`);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2800);
    };

    const HealthScoreGauge: React.FC<{ score: number }> = ({ score }) => {
        const radius = 55, circumference = 2 * Math.PI * radius, offset = circumference - (score / 100) * circumference;
        const scoreColor = getStatusColor(score > 89 ? 'Excellent' : score > 69 ? 'Good' : 'Concern').main;
        return (
             <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle className="health-score-gauge-bg" strokeWidth="10" cx="60" cy="60" r={radius} />
                    <circle className="health-score-gauge-progress" strokeWidth="10" cx="60" cy="60" r={radius} style={{ strokeDasharray: circumference, '--circumference': circumference, '--progress-offset': offset, stroke: scoreColor } as React.CSSProperties} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-5xl font-bold" style={{ color: scoreColor }}>{score}</span><span className="text-sm text-gray-500 -mt-1">/ 100</span></div>
            </div>
        );
    };

    const HealthAreaCard: React.FC<{ item: HealthCategoryAnalysis, previousItem?: HealthCategoryAnalysis }> = ({ item, previousItem }) => {
        const radius = 22, circumference = 2 * Math.PI * radius, offset = circumference - (item.score / 100) * circumference;
        const color = getStatusColor(item.status).main, bgColor = getStatusColor(item.status).bg;
        const ScoreTrend: React.FC<{ current: number; previous?: number }> = ({ current, previous }) => {
            if (previous === undefined || previous === null) return null;
            const diff = current - previous;
            if (diff === 0) return <span className="text-xs font-bold score-trend-same">(+/-0)</span>;
            const trendClass = diff > 0 ? 'score-trend-up' : 'score-trend-down', symbol = diff > 0 ? '▲' : '▼';
            return <span className={`text-xs font-bold ${trendClass}`}>({symbol}{Math.abs(diff)})</span>
        };
        return (
             <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 report-card-enter">
                <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 50 50"><circle className="progress-ring-bg" strokeWidth="5" cx="25" cy="25" r={radius} /><circle className="progress-ring-progress" strokeWidth="5" cx="25" cy="25" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset: offset, stroke: color }} /></svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: color }}>{item.score}</span>
                </div>
                <div className="flex-grow"><p className="font-bold text-gray-800">{item.category}</p><div className="flex items-center gap-2"><span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full`} style={{ color, backgroundColor: bgColor }}>{item.status}</span><ScoreTrend current={item.score} previous={previousItem?.score} /></div></div>
            </div>
        );
    };
    
    const getDifficultyStyle = (difficulty: string) => (difficulty === 'Easy DIY' ? 'difficulty-badge-easy' : difficulty === 'Moderate' ? 'difficulty-badge-moderate' : 'difficulty-badge-professional');
    const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getDifficultyStyle(difficulty)}`}>{difficulty}</span>;

    const CareTimeline: React.FC<{ recommendations: (CareRecommendation | ActionItem)[] }> = ({ recommendations }) => (
        <div className="care-timeline">
            {recommendations.map((item, index) => (
                <div key={index} className="timeline-item">
                    <div className="timeline-icon-container" style={{borderColor: getStatusColor(item.priority === 'High' || item.priority === 'Immediate' ? 'Concern' : 'Good').main}}><div className="h-5 w-5 text-gray-600">{CARE_ICONS[item.icon_name || 'default']}</div></div>
                    <div className="pl-4">
                        <p className="font-bold text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-600">{'guidance' in item ? item.guidance : item.details}</p>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                            {'difficulty' in item && item.difficulty && <DifficultyBadge difficulty={item.difficulty} />}
                            {item.estimatedCost && <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Est: {item.estimatedCost}</span>}
                             <button onClick={() => alert(`Reminder set for: ${item.title}`)} className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>Set Reminder</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-full flex flex-col font-sans" style={{animation: 'fade-in 0.5s ease-out'}}>
             {showCelebration && <Confetti />}
            <header className="p-4 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">Wellness Story</h1>
            </header>
            <main className="flex-grow p-4 space-y-4 overflow-y-auto pb-24">
                <section className="bg-white p-4 rounded-xl shadow-sm report-card-enter flex flex-col items-center">
                     <img src={pet.photo_url} alt={pet.name} className="w-24 h-24 rounded-full object-cover border-4 border-white -mt-16 shadow-lg" />
                     <h2 className="text-2xl font-bold text-gray-800 mt-2">{pet.name}'s Health Score</h2>
                     <HealthScoreGauge score={result.overallHealthScore} />
                     <p className="text-sm text-gray-600 text-center max-w-xs">{result.executiveSummary}</p>
                </section>
                <section className="report-card-enter" style={{animationDelay: '100ms'}}>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 px-1">Key Health Areas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{result.healthAssessment.map(item => <HealthAreaCard key={item.category} item={item} previousItem={previousResult?.healthAssessment.find(p => p.category === item.category)} />)}</div>
                </section>
                 <section className="bg-white p-4 rounded-xl shadow-sm report-card-enter" style={{animationDelay: '200ms'}}>
                     <h3 className="text-lg font-bold text-gray-800 mb-3">Breed Spotlight</h3>
                     <div className="flex items-start gap-4">
                        <div className="bg-gray-100 p-2 rounded-full text-gray-600">{pet.species === 'Dog' ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L8.447 6.106A1 1 0 008 7v1.447A2 2 0 009.447 10h1.106A2 2 0 0012 8.553V7a1 1 0 00.894-.553l4-8zM4.707 12.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414-1.414l-3-3zM4 10a1 1 0 011-1h.5a1 1 0 010 2H5a1 1 0 01-1-1zm3 3a1 1 0 011-1h.5a1 1 0 010 2H8a1 1 0 01-1-1zm3 3a1 1 0 011-1h.5a1 1 0 010 2h-.5a1 1 0 01-1-1z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>}</div>
                        <div className="flex-grow">
                            <p className="font-bold text-gray-800">{result.breedAnalysis.breedName} <span className="text-sm font-normal text-gray-500">(~{result.breedAnalysis.confidence}% confidence)</span></p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {result.breedAnalysis.characteristics.map(char => <span key={char} className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{char}</span>)}
                            </div>
                        </div>
                     </div>
                 </section>
                <section className="report-card-enter" style={{animationDelay: '300ms'}}>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 px-1">Action Plan</h3>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <CareTimeline recommendations={[...result.actionItems, ...result.careRecommendations]} />
                    </div>
                </section>
            </main>
             <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-20 flex gap-4">
                <button onClick={onBack} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">New Scan</button>
                <button onClick={handleShare} className="w-full bg-teal-500 text-white font-bold py-3 rounded-xl">Share Report</button>
            </footer>
            {showShareToast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold toast-enter-exit">Report link copied to clipboard!</div>}
        </div>
    );
};

// FIX: Implement the main HealthCheckScreen component and add a default export.
const HealthCheckScreen: React.FC<HealthCheckScreenProps> = ({
  pet,
  onAnalyze,
  isChecking,
  result,
  error,
  onClearAnalysis,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFile && pet) {
      onAnalyze(imageFile, notes);
    }
  };

  if (result && pet) {
    return <VisualHealthReport pet={pet} result={result} onBack={onClearAnalysis} />;
  }

  if (isChecking) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500"></div>
            <h2 className="mt-6 text-xl font-bold text-gray-800">Analyzing {pet?.name}'s photo...</h2>
            <p className="text-gray-600 mt-2 max-w-sm">This may take a moment. Our AI is checking for key health indicators like coat condition, eye clarity, and body posture.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-4 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
        <h1 className="text-xl font-bold">AI Health Check</h1>
      </header>

      {!pet ? (
         <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
             <div className="text-4xl mb-4">🐾</div>
             <h2 className="text-xl font-bold text-gray-800">No Pet Selected</h2>
             <p className="text-gray-600 mt-2">Please add or select a pet from your profile to perform a health check.</p>
             <button onClick={() => navigate('/profile')} className="mt-4 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg">Go to Profile</button>
         </div>
      ) : (
        <main className="flex-grow p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm max-w-lg mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Wellness Scan for {pet.name}</h2>
                <p className="text-gray-600 mt-1">Upload a clear, well-lit photo of your pet for analysis.</p>
            </div>
            
            <div className="flex flex-col items-center">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" id="pet-photo-upload" />
              <label htmlFor="pet-photo-upload" className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-teal-500 hover:text-teal-600 cursor-pointer bg-gray-50 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Pet preview" className="w-full h-full object-contain rounded-lg p-1" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Click to upload a photo</span>
                    <span className="text-xs mt-1">(e.g., side view, face, or specific area of concern)</span>
                  </>
                )}
              </label>
            </div>
            
            <div>
              <label htmlFor="notes" className="font-semibold text-gray-700">Additional Notes (Optional)</label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g., My dog has been scratching his left ear a lot." className="w-full mt-2 p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"></textarea>
            </div>
            
            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-center text-sm font-semibold">{error}</p>}
            
            <button type="submit" disabled={!imageFile || isChecking} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors hover:bg-teal-600">
              {isChecking ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </form>
        </main>
      )}
    </div>
  );
};

export default HealthCheckScreen;
