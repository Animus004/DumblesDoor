
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { NearbyVet, Vet, VetService, Pet, Appointment } from '../types';
import VetProfileScreen from './VetProfileScreen';
import SkeletonLoader from './SkeletonLoader';

const QUICK_BOOK_SERVICES = [
    { name: 'Checkup', icon: '🩺', keyword: 'Consultation' },
    { name: 'Vaccination', icon: '💉', keyword: 'Vaccination' },
    { name: 'Tele-consult', icon: '💻', keyword: 'Tele' },
    { name: 'Dental', icon: '🦷', keyword: 'Dental' },
];

const EMERGENCY_SYMPTOMS = ["Difficulty Breathing", "Severe Bleeding", "Seizures", "Collapse / Fainting", "Ingested Toxin", "Major Trauma"];

const generateIcsLink = (appointment: Appointment): string => {
    const startTime = new Date(appointment.appointment_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(new Date(appointment.appointment_time).getTime() + appointment.duration_minutes * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${appointment.id}@dumblesdoor.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`, `DTSTART:${startTime}`, `DTEND:${endTime}`, `SUMMARY:Vet Appointment for ${appointment.pet?.name}`, `DESCRIPTION:Appointment with ${appointment.vet?.name} for ${appointment.service?.name}. Notes: ${appointment.notes || 'N/A'}`, `LOCATION:${appointment.vet?.address}`, 'END:VEVENT', 'END:CALENDAR'].join('\n');
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};

const VetCard: React.FC<{ vet: NearbyVet; onSelect: () => void; isEmergency?: boolean; }> = ({ vet, onSelect, isEmergency = false }) => (
    <div className="w-full text-left bg-white rounded-xl shadow-md overflow-hidden flex items-start p-4 gap-4">
        <img src={vet.photo_url || 'https://i.ibb.co/hZJc3Bw/vet-1.jpg'} alt={vet.name} className="w-24 h-24 rounded-lg object-cover" />
        <div className="flex-grow">
            {vet.verified && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
            <h3 className="font-bold text-lg mt-1">{vet.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{vet.specialization?.join(', ')}</p>
            <div className="flex items-center text-sm mt-1"><span className="text-yellow-500">★</span><span className="font-semibold ml-1">{vet.rating || 'N/A'}</span><span className="text-gray-400 ml-1">({vet.review_count || 0} reviews)</span></div>
            <div className="flex gap-2 mt-3">
                {isEmergency ? <a href={`tel:${vet.phone}`} className="w-full text-center bg-red-600 text-white font-bold py-2 rounded-lg text-sm">Call Now</a> : <button onClick={onSelect} className="w-full bg-teal-500 text-white font-bold py-2 rounded-lg text-sm">View & Book</button>}
                 <a href={`https://maps.google.com/?q=${encodeURIComponent(vet.address)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></a>
            </div>
        </div>
    </div>
);

const TriageScreen = ({ onSelectPath }: { onSelectPath: (path: 'emergency' | 'routine') => void }) => {
    const [showSymptoms, setShowSymptoms] = useState(false);
    return (
        <div className="p-4 space-y-4 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-gray-800 mt-4">What's the situation?</h2><p className="text-gray-600">Help us find the right care for your pet.</p>
            <div className="w-full max-w-sm space-y-3 pt-4">
                 <button onClick={() => setShowSymptoms(true)} className="w-full bg-red-100 text-red-700 border-2 border-red-200 font-bold py-4 rounded-xl shadow-sm hover:bg-red-200 transition-colors">Emergency / Urgent Care</button>
                 <button onClick={() => onSelectPath('routine')} className="w-full bg-teal-50 text-teal-700 border-2 border-teal-100 font-bold py-4 rounded-xl shadow-sm hover:bg-teal-100 transition-colors">Routine Visit / Checkup</button>
            </div>
            {showSymptoms && <div className="w-full max-w-sm pt-6"><h3 className="font-bold text-gray-700 mb-2">Select the primary symptom:</h3><div className="flex flex-wrap gap-2 justify-center">{EMERGENCY_SYMPTOMS.map(symptom => <button key={symptom} onClick={() => onSelectPath('emergency')} className="bg-white text-gray-700 border rounded-full px-3 py-1.5 text-sm font-semibold">{symptom}</button>)}<button onClick={() => onSelectPath('emergency')} className="bg-gray-200 text-gray-800 border rounded-full px-3 py-1.5 text-sm font-semibold">Other Urgent Issue</button></div></div>}
        </div>
    );
};

const VetSearchScreen = ({ onSelectVet, emergencyMode, onExitEmergencyMode }: { onSelectVet: (vet: Vet) => void, emergencyMode: boolean, onExitEmergencyMode: () => void }) => {
    const [allVets, setAllVets] = useState<Vet[]>([]);
    const [filteredVets, setFilteredVets] = useState<Vet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quickFilter, setQuickFilter] = useState<string | null>(null);

    useEffect(() => {
        const getApprovedVets = async () => {
            if (!supabase) { setLoading(false); setError("Database connection is not available."); return; }
            setLoading(true); setError('');
            try {
                const { data, error: queryError } = await supabase.from('professional_profiles').select('*, services:vet_services(*)').eq('profile_type', 'veterinarian').eq('status', 'approved');
                if (queryError) throw queryError;
                setAllVets((data as Vet[]) || []);
            } catch (err: any) { setError('Could not fetch vets. Please try again later.'); console.error("Error fetching vets:", err); }
            finally { setLoading(false); }
        };
        getApprovedVets();
    }, []);

    useEffect(() => {
        if (!loading) {
            const vets = allVets.filter(v => {
                const services = Array.isArray(v.services) ? v.services : (v.services ? [v.services] : []);
                return emergencyMode 
                    ? v.is_24_7 
                    : !quickFilter || services.some(s => s.name.toLowerCase().includes(quickFilter.toLowerCase()));
            });
            setFilteredVets(vets);
        }
    }, [allVets, loading, quickFilter, emergencyMode]);
    
    return (
        <div className="p-4 space-y-4">
            {emergencyMode ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg"><p className="text-red-800 font-bold">Showing 24/7 emergency vets.</p><button onClick={onExitEmergencyMode} className="text-sm font-semibold text-red-600 mt-1">Exit Emergency Mode</button></div>
            ) : (
                <div><h3 className="font-bold text-gray-700 mb-2">Quick Book</h3><div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">{QUICK_BOOK_SERVICES.map(s => <button key={s.name} onClick={() => setQuickFilter(s.keyword)} className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-xl p-2 border-2 transition-colors ${quickFilter === s.keyword ? 'bg-teal-50 border-teal-500' : 'bg-white'}`}><span className="text-3xl">{s.icon}</span><span className="text-xs font-semibold">{s.name}</span></button>)}</div></div>
            )}
            {error && <p className="text-red-500 bg-red-50 text-center p-3 rounded-md">{error}</p>}
            
            {loading ? (
                <div className="space-y-4 pt-4">
                    {[...Array(3)].map((_, i) => <SkeletonLoader key={i} className="h-32" />)}
                </div>
            ) : filteredVets.length === 0 ? (
                <div className="text-center text-gray-500 pt-8"><p className="font-semibold">No Approved Vets Found</p><p>We are currently onboarding professionals in your area. Please check back soon!</p></div>
            ) : (
                <div className="space-y-4">{filteredVets.map(vet => <VetCard key={vet.id} vet={vet} onSelect={() => onSelectVet(vet)} isEmergency={emergencyMode} />)}</div>
            )}
        </div>
    );
};

const MOCK_APPOINTMENTS = [{ time: '10:00', duration: 30 }, { time: '11:30', duration: 60 }, { time: '15:00', duration: 20 }];
const VET_SCHEDULE = { start: '09:00', end: '17:00', lunchStart: '13:00', lunchEnd: '14:00' };
const timeToMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minutesToTime = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
const generateTimeSlots = (duration: number, existing: typeof MOCK_APPOINTMENTS) => { const slots = []; const s = timeToMinutes(VET_SCHEDULE.start), e = timeToMinutes(VET_SCHEDULE.end), ls = timeToMinutes(VET_SCHEDULE.lunchStart), le = timeToMinutes(VET_SCHEDULE.lunchEnd); for (let i = s; i < e; i += 15) { const sS = i, sE = sS + duration; if (sE > e || (sS < le && sE > ls)) continue; if (!existing.some(a => { const aS = timeToMinutes(a.time), aE = aS + a.duration; return sS < aE && sE > aS; })) slots.push(minutesToTime(sS)); } return slots; };
const BookingProgress: React.FC<{ step: number }> = ({ step }) => (<div className="flex items-center justify-center gap-4 text-sm font-semibold"><span className={step >= 1 ? 'text-teal-600' : 'text-gray-400'}>Service</span><div className={`flex-shrink-0 h-1 w-8 rounded-full ${step >= 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div><span className={step >= 2 ? 'text-teal-600' : 'text-gray-400'}>Time</span><div className={`flex-shrink-0 h-1 w-8 rounded-full ${step >= 3 ? 'bg-teal-500' : 'bg-gray-300'}`}></div><span className={step >= 3 ? 'text-teal-600' : 'text-gray-400'}>Confirm</span></div>);
const WeekCalendar: React.FC<{ selectedDate: Date; onDateSelect: (date: Date) => void; }> = ({ selectedDate, onDateSelect }) => { const [offset, setOffset] = useState(0); const startX = useRef(0); const getWeek = (o: number) => { const t = new Date(); t.setDate(t.getDate() + o * 7); const d = t.getDay(), s = new Date(t); s.setDate(t.getDate() - d); return Array.from({ length: 7 }, (_, i) => { const date = new Date(s); date.setDate(s.getDate() + i); return date; }); }; const week = useMemo(() => getWeek(offset), [offset]); const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; }; const handleTouchEnd = (e: React.TouchEvent) => { const endX = e.changedTouches[0].clientX; if (startX.current - endX > 50) setOffset(w => w + 1); else if (endX - startX.current > 50) setOffset(w => Math.max(0, w - 1)); }; return (<div className="bg-white p-3 rounded-xl shadow-sm" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}><div className="flex justify-between items-center mb-2 px-2"><button onClick={() => setOffset(w => Math.max(0, w - 1))} disabled={offset === 0} className="disabled:opacity-30">◀</button><p className="font-bold text-gray-700">{week[0].toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p><button onClick={() => setOffset(w => w + 1)}>▶</button></div><div className="flex justify-between">{week.map(day => { const isSelected = day.toDateString() === selectedDate.toDateString(), isPast = day < new Date(new Date().toDateString()); return (<button key={day.toISOString()} onClick={() => !isPast && onDateSelect(day)} disabled={isPast} className={`flex flex-col items-center p-2 rounded-lg w-12 h-16 justify-center transition-colors ${isSelected ? 'bg-teal-500 text-white' : 'hover:bg-gray-100'} ${isPast ? 'opacity-40' : ''}`}><span className="text-xs">{day.toLocaleString('en-IN', { weekday: 'short' })}</span><span className="font-bold text-lg">{day.getDate()}</span></button>)})}</div></div>); }

const BookingScreen: React.FC<{ vet: Vet; pets: Pet[]; user: User; onBookingConfirmed: (appointment: Appointment) => void; }> = ({ vet, pets, user, onBookingConfirmed }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(pets.length === 1 ? pets[0] : null);
    const [selectedService, setSelectedService] = useState<VetService | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Safely handle the 'services' property by normalizing it into an array.
    const safeServices: VetService[] = vet.services ? (Array.isArray(vet.services) ? vet.services : [vet.services]) : [];

    const timeSlots = useMemo(() => { if (!selectedService) return { morning: [], afternoon: [], evening: [] }; const slots = generateTimeSlots(selectedService.duration_minutes, MOCK_APPOINTMENTS); return slots.reduce((acc, time) => { const hour = parseInt(time.split(':')[0]); if (hour < 12) acc.morning.push(time); else if (hour < 16) acc.afternoon.push(time); else acc.evening.push(time); return acc; }, { morning: [] as string[], afternoon: [] as string[], evening: [] as string[] }); }, [selectedService, selectedDate]);
    
    const handleConfirm = async () => {
        if (!selectedPet || !selectedService || !selectedDate || !selectedTime || !supabase) { setError("Missing required information or database connection."); return; }
        setIsProcessing(true); setError(''); const appointmentTime = new Date(selectedDate); const [hours, minutes] = selectedTime.split(':').map(Number); appointmentTime.setHours(hours, minutes, 0, 0);
        try { const { data, error: insertError } = await supabase.from('appointments').insert({ pet_id: selectedPet.id, vet_id: vet.id, auth_user_id: user.id, service_id: selectedService.id, appointment_time: appointmentTime.toISOString(), duration_minutes: selectedService.duration_minutes, status: 'confirmed', notes: notes }).select().single(); if (insertError) throw insertError; onBookingConfirmed({ ...(data as Appointment), vet: { name: vet.name, address: vet.address, photo_url: vet.photo_url }, pet: { name: selectedPet.name, photo_url: selectedPet.photo_url }, service: { name: selectedService.name, price: selectedService.price } }); }
        catch (err: any) { setError(`Failed to book appointment: ${err.message}`); setIsProcessing(false); }
    };

    if (isProcessing) return <div className="p-8 text-center"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-4 font-semibold text-gray-700">Securing your spot...</p></div>;

    return (
        <div className="p-4 space-y-4">
            <BookingProgress step={step} />
            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-center text-sm">{error}</p>}
            {step === 1 && (<><div className="mt-4"><h3 className="font-bold text-lg mb-2">1. Select your pet</h3><div className="flex gap-4 overflow-x-auto pb-2">{pets.map(pet => <button key={pet.id} onClick={() => setSelectedPet(pet)} className={`flex-shrink-0 text-center p-2 border-2 rounded-lg ${selectedPet?.id === pet.id ? 'border-teal-500 bg-teal-50' : 'border-transparent'}`}><img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-full object-cover"/><p className="text-sm font-semibold mt-1">{pet.name}</p></button>)}</div></div><div><h3 className="font-bold text-lg mb-2">2. Choose a service</h3><div className="space-y-2">
{/* FIX: Use the 'safeServices' array which correctly handles cases where 'vet.services' is a single object or null. */}
{/* This resolves the error where '.length' and '.map' were being called on a non-array type. */}
{safeServices.length > 0
    ? safeServices.map(s => <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full text-left p-3 rounded-lg border-2 ${selectedService?.id === s.id ? 'border-teal-500 bg-teal-50' : 'bg-white'}`}><div className="flex justify-between items-center"><div><p className="font-semibold">{s.name}</p><p className="text-sm text-gray-500">{s.duration_minutes} min</p></div><p className="font-bold text-teal-600">₹{s.price}</p></div></button>)
    : <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-md">This veterinarian has not listed any specific services yet. You can book a 'General Consultation'.</p>}</div></div><button onClick={() => setStep(2)} disabled={!selectedPet || !selectedService} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 mt-4">Next: Choose Date & Time</button></>)}
            {step === 2 && (<><WeekCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} /> {Object.entries(timeSlots).map(([period, slots]) => slots.length > 0 && <div key={period}><h4 className="font-bold capitalize mt-4 mb-2">{period}</h4><div className="grid grid-cols-3 gap-2">{slots.map(time => <button key={time} onClick={() => { setSelectedTime(time); setStep(3);}} className="p-3 bg-teal-100 text-teal-700 font-semibold rounded-lg text-center hover:bg-teal-200">{time}</button>)}</div></div>)}{(timeSlots.morning.length + timeSlots.afternoon.length + timeSlots.evening.length) === 0 && <p className="text-center text-gray-500 mt-4">No available slots. Try another day.</p>}<button onClick={() => setStep(1)} className="w-full bg-gray-200 font-bold py-3 rounded-lg mt-4">Back</button></>)}
            {step === 3 && (<div className="space-y-4"><div className="bg-white p-4 rounded-lg shadow-sm space-y-3"><p><strong>Pet:</strong> {selectedPet?.name}</p><p><strong>Vet:</strong> {vet.name}</p><p><strong>Service:</strong> {selectedService?.name}</p><p><strong>When:</strong> {selectedDate?.toLocaleDateString('en-IN', { dateStyle: 'full' })} at {selectedTime}</p><p><strong>Total:</strong> <span className="font-bold">₹{selectedService?.price}</span></p></div><button onClick={handleConfirm} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg">Confirm & Pay</button><button onClick={() => setStep(2)} className="w-full bg-gray-200 font-bold py-3 rounded-lg">Change Time</button></div>)}
        </div>
    );
};

const ConfirmationScreen: React.FC<{ appointment: Appointment; onBookAnother: () => void; onViewAppointments: () => void; }> = ({ appointment, onBookAnother, onViewAppointments }) => (
    <div className="p-4 text-center flex flex-col items-center justify-center h-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">Appointment Confirmed!</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm text-left w-full max-w-sm mt-6 space-y-2"><p><strong>For:</strong> {appointment.pet?.name}</p><p><strong>When:</strong> {new Date(appointment.appointment_time).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p></div>
        <div className="bg-white p-3 rounded-lg shadow-sm text-left w-full max-w-sm mt-4"><p className="font-semibold text-sm">Payment Details</p><div className="flex justify-between text-sm text-gray-600 mt-1"><span>{appointment.service?.name}</span><span>₹{appointment.service?.price}</span></div><div className="border-t my-2"></div><div className="flex justify-between items-center text-sm"><span className="font-bold">Paid with</span><span>•••• 1234</span></div></div>
        <div className="mt-8 w-full max-w-sm grid grid-cols-2 gap-2"><a href={`https://maps.google.com/?q=${encodeURIComponent(appointment.vet?.address || '')}`} target="_blank" rel="noopener noreferrer" className="bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">Directions</a><a href={generateIcsLink(appointment)} download="appointment.ics" className="bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">Add to Calendar</a></div>
         <button onClick={onViewAppointments} className="w-full max-w-sm mt-2 bg-teal-500 text-white font-bold py-3 rounded-lg">View My Appointments</button>
    </div>
);

interface VetBookingFlowProps { user: User; pets: Pet[]; }

const VetBookingFlow: React.FC<VetBookingFlowProps> = ({ user, pets }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'triage' | 'search' | 'profile' | 'booking' | 'confirmation'>('triage');
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
    const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

    const handleSelectVet = (vet: Vet) => { setSelectedVet(vet); setStep('profile'); };
    const handleBookNow = (vet: Vet) => { setSelectedVet(vet); setStep('booking'); };
    const handleBookingConfirmed = (appointment: Appointment) => { setConfirmedAppointment(appointment); setStep('confirmation'); };
    const handleTriageSelect = (path: 'emergency' | 'routine') => { setEmergencyMode(path === 'emergency'); setStep('search'); };

    const handleBackNavigation = () => {
        switch(step) {
            case 'confirmation': setStep('triage'); setEmergencyMode(false); break;
            case 'booking': setStep('profile'); break;
            case 'profile': setStep('search'); setSelectedVet(null); break;
            case 'search': setStep('triage'); setEmergencyMode(false); break;
            default: navigate(-1);
        }
    }

    const getTitle = () => {
        switch (step) {
            case 'triage': return "Book an Appointment";
            case 'search': return emergencyMode ? "Emergency Vets" : "Find a Vet";
            case 'profile': return selectedVet?.name || "Vet Profile";
            case 'booking': return "Schedule Appointment";
            case 'confirmation': return "Booking Confirmed!";
            default: return "Book a Vet";
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-30">
                <button onClick={handleBackNavigation} className="mr-4 text-gray-600 hover:text-gray-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold truncate">{getTitle()}</h1>
            </header>
            <main className="flex-grow overflow-y-auto">
                {step === 'triage' && <TriageScreen onSelectPath={handleTriageSelect} />}
                {step === 'search' && <VetSearchScreen onSelectVet={handleSelectVet} emergencyMode={emergencyMode} onExitEmergencyMode={() => setEmergencyMode(false)} />}
                {step === 'profile' && selectedVet && <VetProfileScreen vet={selectedVet} onBookNow={handleBookNow} />}
                {step === 'booking' && selectedVet && (pets.length > 0 ? <BookingScreen vet={selectedVet} pets={pets} user={user} onBookingConfirmed={handleBookingConfirmed} /> : <div className="p-4 text-center">Please add a pet to your profile before booking.</div>)}
                {step === 'confirmation' && confirmedAppointment && <ConfirmationScreen appointment={confirmedAppointment} onBookAnother={() => setStep('search')} onViewAppointments={() => navigate('/my-vet-appointments')} />}
            </main>
        </div>
    );
};

export default VetBookingFlow;
