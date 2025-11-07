import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import types
import type { User } from '@supabase/supabase-js';
import type { Pet, UserProfile, LogoutAnalytics, HealthCheckResult } from '../types';

// Import screen components
import HomeScreen from '../components/HomeScreen';
import PetBookScreen from '../components/PetBookScreen';
import ProfileScreen from '../components/ProfileScreen';
import HealthCheckScreen from '../components/HealthCheckScreen';
import ShopScreen from '../components/ShopScreen';
import VetBookingFlow from '../components/VetBookingFlow';
import SafetyCenterScreen from '../components/SafetyCenterScreen';
import DataPrivacyScreen from '../components/DataPrivacyScreen';
import MyAppointmentsScreen from '../components/MyAppointmentsScreen';
import ConnectScreen from '../components/ConnectScreen';
// FIX: The component now has a default export, so this import will work.
import AdminDashboardScreen from '../components/AdminDashboardScreen';
import { AdoptionScreen, PetDetailScreen, AdoptionApplicationScreen, MyApplicationsScreen } from '../components/AdoptionScreens';
import ChatScreen from './components/ChatScreen';
import AdoptionAgreementScreen from '../components/AdoptionAgreementScreen';
import MyListingsScreen from '../components/MyListingsScreen';


interface AppRouterProps {
    user: User | null;
    profile: UserProfile | null;
    pets: Pet[];
    activePet: Pet | null;
    dataLoading: boolean;
    showCelebration: boolean;
    onLogout: (analyticsData: LogoutAnalytics) => void;
    onDataUpdate: () => void;
    sessionStartTime: number;
    draftPostContent: string;
    setDraftPostContent: (content: string) => void;
    isAnalyzing: boolean;
    analysisResult: HealthCheckResult | null;
    analysisError: string | null;
    handleAnalyze: (imageFile: File, notes: string) => void;
    clearAnalysisState: () => void;
}

const AppRouter: React.FC<AppRouterProps> = ({
    user,
    profile,
    pets,
    activePet,
    dataLoading,
    showCelebration,
    onLogout,
    onDataUpdate,
    sessionStartTime,
    draftPostContent,
    setDraftPostContent,
    isAnalyzing,
    analysisResult,
    analysisError,
    handleAnalyze,
    clearAnalysisState
}) => {
    if (!user || !profile) {
        return null; // or a loading/error state
    }
    
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeScreen pet={activePet} profile={profile} isLoading={dataLoading} showCelebration={showCelebration} />} />
            <Route path="/book" element={<PetBookScreen pet={activePet} setDraftPostContent={setDraftPostContent} />} />
            <Route path="/connect" element={<ConnectScreen currentUserProfile={profile} currentUser={user} />} />
            <Route path="/profile" element={
                <ProfileScreen
                    user={user}
                    profile={profile}
                    pets={pets}
                    onLogout={onLogout}
                    onDataUpdate={onDataUpdate}
                    sessionStartTime={sessionStartTime}
                    draftPostContent={draftPostContent}
                />
            } />
            <Route 
                path="/health" 
                element={
                    <HealthCheckScreen 
                        pet={activePet} 
                        onAnalyze={handleAnalyze} 
                        isChecking={isAnalyzing} 
                        result={analysisResult} 
                        error={analysisError}
                        onClearAnalysis={clearAnalysisState}
                    />
                } 
            />
            <Route path="/essentials" element={<ShopScreen />} />
            <Route path="/vet" element={<VetBookingFlow user={user} pets={pets} />} />
            
            {/* Adoption Flow Routes */}
            <Route path="/adoption" element={<AdoptionScreen />} />
            <Route path="/adoption/:petId" element={<PetDetailScreen />} />
            <Route path="/adoption/:petId/apply" element={<AdoptionApplicationScreen userProfile={profile} />} />
            <Route path="/adoption-agreement/:applicationId" element={<AdoptionAgreementScreen />} />


            {/* Profile Sub-Routes */}
            <Route path="/my-applications" element={<MyApplicationsScreen />} />
            <Route path="/my-listings" element={<MyListingsScreen user={user} profile={profile} />} />
            <Route path="/my-vet-appointments" element={<MyAppointmentsScreen />} />
            <Route path="/safety-center" element={<SafetyCenterScreen />} />
            <Route path="/data-privacy" element={<DataPrivacyScreen onExportData={()=>{}} onDeleteAccount={()=>{}} />} />
            
            {/* Chat Route */}
            <Route path="/chat/:chatPartnerId" element={<ChatScreen currentUser={user} />} />

            {/* Admin Route */}
            <Route path="/admin" element={profile.role === 'admin' ? <AdminDashboardScreen /> : <Navigate to="/home" replace />} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
    );
};

export default AppRouter;