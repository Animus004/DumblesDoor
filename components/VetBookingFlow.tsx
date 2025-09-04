import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { NearbyVet, Vet, VetService, VetReview, Pet, Appointment } from '../types';

// --- MOCK DATA (Replace with actual Supabase calls) ---
const MOCK_NEARBY_VETS: NearbyVet[] = [
    { id: '1', name: 'Dr. Priya Sharma\'s Pet Clinic', photo_url: 'https://i.ibb.co/hZJc3Bw/vet-1.jpg', specialization: ['General Practice', 'Dermatology'], address: '123, Koramangala, Bangalore', city: 'Bangalore', phone: '9876543210', email: 'priya.sharma@vet.com', bio: 'A compassionate veterinarian with over 10 years of experience dedicated to the health and well-being of small animals in Bangalore.\n\n**Qualifications & Experience**\n- MVSc (Veterinary Medicine), Bangalore Veterinary College\n- Advanced Certification in Dermatology\n- Senior Veterinarian at a leading animal hospital (5 years)\n\n**Affiliations**\n- Member of the Indian Veterinary Association (IVA)\n- Registered with the Karnataka Veterinary Council', rating: 4.8, review_count: 125, verified: true, distance_km: 2.5, is_24_7: false, accepted_insurance: ['PetAssure', 'Bajaj Allianz'], photo_gallery: ['https://i.ibb.co/hZJc3Bw/vet-1.jpg', 'https://i.ibb.co/1M2g1CH/clinic-1.jpg', 'https://i.ibb.co/k1nSg2V/clinic-2.jpg'], services: [{id: 's1', name: 'General Consultation', description: 'A thorough check-up for your pet.', price: 800, duration_minutes: 30}, {id: 's2', name: 'Vaccination', description: 'Includes all essential annual shots.', price: 1500, duration_minutes: 20}], 
// FIX: Added missing 'vet_id' and 'author_user_id' properties to VetReview objects.
reviews: [{id: 'r1', vet_id: '1', author_user_id: 'user_ankit_g', author_name: 'Ankit G.', rating: 5, comment: 'Dr. Priya is amazing with my dog, Leo. Very patient and explains everything clearly.', created_at: '2024-07-10T10:00:00Z', verified_appointment: true}, {id: 'r4', vet_id: '1', author_user_id: 'user_priya_k', author_name: 'Priya K.', rating: 4, comment: 'Good service, but the wait time was a bit long.', created_at: '2024-06-15T12:00:00Z', verified_appointment: false}] },
    { id: '2', name: 'Happy Paws Veterinary Hospital', photo_url: 'https://i.ibb.co/51f0qY0/vet-2.jpg', specialization: ['Surgery', 'Orthopedics', 'Emergency'], address: '456, Indiranagar, Bangalore', city: 'Bangalore', phone: '9876543211', email: 'contact@happypawsvet.com', bio: 'State-of-the-art facility for all your pet\'s surgical and emergency needs. Our team is equipped with the latest technology including digital X-rays and in-house diagnostics.', rating: 4.9, review_count: 210, verified: true, distance_km: 4.1, is_24_7: true, accepted_insurance: ['PetAssure', 'Digit Insurance', 'New India Assurance'], photo_gallery: ['https://i.ibb.co/51f0qY0/vet-2.jpg', 'https://i.ibb.co/yQj7X7D/grooming-glove.jpg'], services: [{id: 's3', name: 'Surgical Consultation', description: 'Pre-op check-up and advice.', price: 1200, duration_minutes: 45}, {id: 's4', name: 'Dental Cleaning', description: 'Full dental scaling and polishing.', price: 2500, duration_minutes: 60}], 
// FIX: Added missing 'vet_id' and 'author_user_id' properties to VetReview objects.
reviews: [{id: 'r2', vet_id: '2', author_user_id: 'user_sneha_p', author_name: 'Sneha P.', rating: 5, comment: 'We had an emergency late at night and the team at Happy Paws was incredible. Lifesavers!', created_at: '2024-06-22T23:30:00Z', verified_appointment: true}] },
    { id: '3', name: 'The Cat Doctor', photo_url: 'https://i.ibb.co/sK6V1yF/vet-3.jpg', specialization: ['Feline Medicine'], address: '789, Jayanagar, Bangalore', city: 'Bangalore', phone: '9876543212', email: 'cat.doctor@vet.com', bio: 'A dedicated feline-only practice for a stress-free experience for your cat. We understand the unique needs of cats and provide a calm environment.', rating: 4.7, review_count: 95, verified: false, distance_km: 6.8, is_24_7: false, accepted_insurance: [], photo_gallery: ['https://i.ibb.co/sK6V1yF/vet-3.jpg'], services: [{id: 's1', name: 'General Consultation', description: 'A thorough check-up for your cat.', price: 900, duration_minutes: 30}], 
// FIX: Added missing 'vet_id' and 'author_user_id' properties to VetReview objects.
reviews: [{id: 'r3', vet_id: '3', author_user_id: 'user_rohan_m', author_name: 'Rohan M.', rating: 4, comment: 'Good, cat-focused clinic. A bit pricey but worth it for a calmer experience.', created_at: '2024-07-01T14:00:00Z', verified_appointment: false}] },
    { id: '4', name: 'Advanced Pet Care', photo_url: 'https://i.ibb.co/B4g9y2P/vet-4.jpg', specialization: ['General Practice', 'Exotic Pets'], address: '101, HSR Layout, Bangalore', city: 'Bangalore', phone: '9876543213', email: 'info@advancedpetcare.com', bio: 'Specializing in the care of exotic pets like birds and reptiles, alongside dogs and cats.', rating: 4.6, review_count: 78, verified: true, distance_km: 12.3, is_24_7: true, accepted_insurance: ['Bajaj Allianz'], photo_gallery: ['https://i.ibb.co/B4g9y2P/vet-4.jpg'], services: [{id: 's5', name: 'Exotic Pet Consultation', description: 'Specialized check-up for non-traditional pets.', price: 2000, duration_minutes: 40}], reviews: [] },
];

const QUICK_BOOK_SERVICES = [
    { name: 'Checkup', icon: '🩺', keyword: 'Consultation' },
    { name: 'Vaccination', icon: '💉', keyword: 'Vaccination' },
    { name: 'Tele-consult', icon: '💻', keyword: 'Tele' },
    { name: 'Dental', icon: '🦷', keyword: 'Dental' },
];

const EMERGENCY_SYMPTOMS = [
    "Difficulty Breathing", "Severe Bleeding", "Seizures",
    "Collapse / Fainting", "Ingested Toxin", "Major Trauma"
];


// --- UTILITY & HELPER COMPONENTS ---
const generateIcsLink = (appointment: Appointment): string => {
    const startTime = new Date(appointment.appointment_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(new Date(appointment.appointment_time).getTime() + appointment.duration_minutes * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        `UID:${appointment.id}@dumblesdoor.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
        `DTSTART:${startTime}`, `DTEND:${endTime}`,
        `SUMMARY:Vet Appointment for ${appointment.pet?.name}`,
        `DESCRIPTION:Appointment with ${appointment.vet?.name} for ${appointment.service?.name}. Notes: ${appointment.notes || 'N/A'}`,
        `LOCATION:${appointment.vet?.address}`,
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};

const VetCard: React.FC<{ vet: NearbyVet; onSelect: () => void; isEmergency?: boolean; }> = ({ vet, onSelect, isEmergency = false }) => (
    <div className="w-full text-left bg-white rounded-xl shadow-md overflow-hidden flex items-start p-4 gap-4">
        <img src={vet.photo_url} alt={vet.name} className="w-24 h-24 rounded-lg object-cover" />
        <div className="flex-grow">
            {vet.verified && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
            <h3 className="font-bold text-lg mt-1">{vet.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{vet.specialization.join(', ')}</p>
            <div className="flex items-center text-sm mt-1">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold ml-1">{vet.rating}</span>
                <span className="text-gray-400 ml-1">({vet.review_count} reviews)</span>
            </div>
            <p className="font-bold text-sm mt-2 text-teal-600">{vet.distance_km.toFixed(1)} km away</p>
            <div className="flex gap-2 mt-3">
                {isEmergency ? (
                    <a href={`tel:${vet.phone}`} className="w-full text-center bg-red-600 text-white font-bold py-2 rounded-lg text-sm">Call Now</a>
                ) : (
                    <button onClick={onSelect} className="w-full bg-teal-500 text-white font-bold py-2 rounded-lg text-sm">View & Book</button>
                )}
                 <a href={`https://maps.google.com/?q=${encodeURIComponent(vet.address)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                 </a>
            </div>
        </div>
    </div>
);

// --- BOOKING STEP COMPONENTS ---
const TriageScreen = ({ onSelectPath }: { onSelectPath: (path: 'emergency' | 'routine') => void }) => {
    const [showSymptoms, setShowSymptoms] = useState(false);
    
    return (
        <div className="p-4 space-y-4 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-gray-800 mt-4">What's the situation?</h2>
            <p className="text-gray-600">Help us find the right care for your pet.</p>

            <div className="w-full max-w-sm space-y-3 pt-4">
                 <button onClick={() => setShowSymptoms(true)} className="w-full bg-red-100 text-red-700 border-2 border-red-200 font-bold py-4 rounded-xl shadow-sm hover:bg-red-200 transition-colors">
                    Emergency / Urgent Care
                </button>
                 <button onClick={() => onSelectPath('routine')} className="w-full bg-teal-50 text-teal-700 border-2 border-teal-100 font-bold py-4 rounded-xl shadow-sm hover:bg-teal-100 transition-colors">
                    Routine Visit / Checkup
                </button>
            </div>
            
            {showSymptoms && (
                <div className="w-full max-w-sm pt-6">
                     <h3 className="font-bold text-gray-700 mb-2">Select the primary symptom:</h3>
                     <div className="flex flex-wrap gap-2 justify-center">
                        {EMERGENCY_SYMPTOMS.map(symptom => (
                            <button key={symptom} onClick={() => onSelectPath('emergency')} className="bg-white text-gray-700 border rounded-full px-3 py-1.5 text-sm font-semibold">
                                {symptom}
                            </button>
                        ))}
                         <button onClick={() => onSelectPath('emergency')} className="bg-gray-200 text-gray-800 border rounded-full px-3 py-1.5 text-sm font-semibold">
                            Other Urgent Issue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const VetSearchScreen = ({ onSelectVet, emergencyMode, onExitEmergencyMode }: { onSelectVet: (vet: NearbyVet) => void, emergencyMode: boolean, onExitEmergencyMode: () => void }) => {
    const [allVets, setAllVets] = useState<NearbyVet[]>([]);
    const [filteredVets, setFilteredVets] = useState<NearbyVet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quickFilter, setQuickFilter] = useState<string | null>(null);

    useEffect(() => {
        const fetchVets = async () => {
            setLoading(true);
            setError('');
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setAllVets(MOCK_NEARBY_VETS);
            } catch (err: any) {
                setError('Could not fetch vets. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchVets();
    }, []);

    useEffect(() => {
        const applyFilters = () => {
            let result = allVets;

            if (emergencyMode) {
                result = allVets.filter(v => v.is_24_7).sort((a, b) => a.distance_km - b.distance_km);
            } else if (quickFilter) {
                result = result.filter(v => v.services?.some(s => s.name.toLowerCase().includes(quickFilter.toLowerCase())));
            }
            
            setFilteredVets(result);
        };
        if (!loading) applyFilters();
    }, [allVets, loading, quickFilter, emergencyMode]);
    
    const handleQuickFilter = (keyword: string) => setQuickFilter(keyword);
    
    if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Finding best vets for you...</p></div>;

    return (
        <div className="p-4 space-y-4">
            {emergencyMode ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                    <p className="text-red-800 font-bold">Showing 24/7 emergency vets nearest to you.</p>
                    <button onClick={onExitEmergencyMode} className="text-sm font-semibold text-red-600 mt-1">Exit Emergency Mode</button>
                </div>
            ) : (
                <>
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Quick Book</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                            {QUICK_BOOK_SERVICES.map(s => (
                                <button key={s.name} onClick={() => handleQuickFilter(s.keyword)} className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-xl p-2 border-2 transition-colors ${quickFilter === s.keyword ? 'bg-teal-50 border-teal-500' : 'bg-white'}`}>
                                    <span className="text-3xl">{s.icon}</span>
                                    <span className="text-xs font-semibold">{s.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {error && <p className="text-red-500">{error}</p>}
            {!loading && filteredVets.length === 0 && <p className="text-center text-gray-500 pt-8">No vets found matching your criteria.</p>}
            <div className="space-y-4">
                {filteredVets.map(vet => (
                     <VetCard key={vet.id} vet={vet} onSelect={() => onSelectVet(vet)} isEmergency={emergencyMode} />
                ))}
            </div>
        </div>
    );
};

const VetProfileScreen = ({ vet, onBookNow }: { vet: Vet, onBookNow: (vet: Vet) => void }) => {
    
    const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-gray-100 text-gray-600 rounded-lg p-2">{icon}</div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
         <div className="bg-gray-50">
            <main className="pb-24">
                <div className="w-full h-48 bg-gray-200 overflow-x-auto flex snap-x snap-mandatory">
                    {Array.isArray(vet.photo_gallery) && vet.photo_gallery.map((url, index) => (
                        <img key={index} src={url} alt={`Clinic photo ${index + 1}`} className="w-full h-full object-cover flex-shrink-0 snap-center" />
                    ))}
                </div>
                <div className="p-4 -mt-12">
                    <div className="bg-white p-4 rounded-xl shadow-lg relative">
                        <div className="flex gap-2 absolute top-3 right-3">
                            {vet.verified && <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Verified</div>}
                            {vet.is_24_7 && <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">24/7</div>}
                        </div>
                        <h2 className="text-2xl font-bold mt-2">{vet.name}</h2>
                        <p className="text-gray-500">{vet.specialization.join(', ')}</p>
                         <div className="mt-3 grid grid-cols-2 gap-2">
                             <a href={`tel:${vet.phone}`} className="w-full text-center bg-teal-500 text-white font-bold py-2 rounded-lg text-sm">Call Clinic</a>
                             <a href={`https://maps.google.com/?q=${encodeURIComponent(vet.address)}`} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-gray-200 text-gray-800 font-bold py-2 rounded-lg text-sm">Get Directions</a>
                         </div>
                    </div>
                    <div className="mt-4 space-y-4">
                         <InfoCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} title="About">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{vet.bio}</p>
                        </InfoCard>
                    </div>
                </div>
            </main>
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-20">
                <button onClick={() => onBookNow(vet)} className="w-full bg-teal-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-teal-600 transition-transform transform active:scale-95">Book Appointment</button>
            </footer>
        </div>
    );
};

const MOCK_APPOINTMENTS = [{ time: '10:00', duration: 30 }, { time: '11:30', duration: 60 }, { time: '15:00', duration: 20 }];
const VET_SCHEDULE = { start: '09:00', end: '17:00', lunchStart: '13:00', lunchEnd: '14:00' };

const timeToMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const minutesToTime = (minutes: number) => `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;

const generateTimeSlots = (serviceDuration: number, existingAppointments: typeof MOCK_APPOINTMENTS) => {
    const slots = [];
    const start = timeToMinutes(VET_SCHEDULE.start), end = timeToMinutes(VET_SCHEDULE.end);
    const lunchStart = timeToMinutes(VET_SCHEDULE.lunchStart), lunchEnd = timeToMinutes(VET_SCHEDULE.lunchEnd);

    for (let i = start; i < end; i += 15) {
        const slotStart = i, slotEnd = slotStart + serviceDuration;
        if (slotEnd > end || (slotStart < lunchEnd && slotEnd > lunchStart)) continue;
        const overlaps = existingAppointments.some(apt => {
            const aptStart = timeToMinutes(apt.time), aptEnd = aptStart + apt.duration;
            return slotStart < aptEnd && slotEnd > aptStart;
        });
        if (!overlaps) slots.push(minutesToTime(slotStart));
    }
    return slots;
};

const BookingProgress: React.FC<{ step: number }> = ({ step }) => (
    <div className="flex items-center justify-center gap-4 text-sm font-semibold">
        <span className={step >= 1 ? 'text-teal-600' : 'text-gray-400'}>Service</span>
        <div className={`flex-shrink-0 h-1 w-8 rounded-full ${step >= 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
        <span className={step >= 2 ? 'text-teal-600' : 'text-gray-400'}>Time</span>
        <div className={`flex-shrink-0 h-1 w-8 rounded-full ${step >= 3 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
        <span className={step >= 3 ? 'text-teal-600' : 'text-gray-400'}>Confirm</span>
    </div>
);

const WeekCalendar: React.FC<{ selectedDate: Date; onDateSelect: (date: Date) => void; }> = ({ selectedDate, onDateSelect }) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const touchStartX = useRef(0);

    const getWeekDays = (offset: number) => {
        const today = new Date();
        today.setDate(today.getDate() + offset * 7);
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            return date;
        });
    };
    
    const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
    
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX.current - touchEndX > 50) setWeekOffset(w => w + 1);
        else if (touchEndX - touchStartX.current > 50) setWeekOffset(w => Math.max(0, w - 1));
    };

    return (
        <div className="bg-white p-3 rounded-xl shadow-sm" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex justify-between items-center mb-2 px-2">
                <button onClick={() => setWeekOffset(w => Math.max(0, w-1))} disabled={weekOffset === 0} className="disabled:opacity-30">◀</button>
                <p className="font-bold text-gray-700">{weekDays[0].toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
                <button onClick={() => setWeekOffset(w => w+1)}>▶</button>
            </div>
            <div className="flex justify-between">
                {weekDays.map(day => {
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const isPast = day < new Date(new Date().toDateString());
                    return (
                        <button key={day.toISOString()} onClick={() => !isPast && onDateSelect(day)} disabled={isPast} className={`flex flex-col items-center p-2 rounded-lg w-12 h-16 justify-center transition-colors ${isSelected ? 'bg-teal-500 text-white' : 'hover:bg-gray-100'} ${isPast ? 'opacity-40' : ''}`}>
                            <span className="text-xs">{day.toLocaleString('en-IN', { weekday: 'short' })}</span>
                            <span className="font-bold text-lg">{day.getDate()}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}

const BookingScreen: React.FC<{ vet: Vet; pets: Pet[]; user: User; onBookingConfirmed: (appointment: Appointment) => void; }> = ({ vet, pets, user, onBookingConfirmed }) => {
    type BookingStep = 1 | 2 | 3;
    const [step, setStep] = useState<BookingStep>(1);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(pets.length === 1 ? pets[0] : null);
    const [selectedService, setSelectedService] = useState<VetService | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const timeSlots = useMemo<{ morning: string[]; afternoon: string[]; evening: string[] }>(() => {
        if (!selectedService) return { morning: [], afternoon: [], evening: [] };
        const slots = generateTimeSlots(selectedService.duration_minutes, MOCK_APPOINTMENTS);
        return slots.reduce((acc, time) => {
            const hour = parseInt(time.split(':')[0]);
            if (hour < 12) acc.morning.push(time);
            else if (hour < 16) acc.afternoon.push(time);
            else acc.evening.push(time);
            return acc;
        }, { morning: [] as string[], afternoon: [] as string[], evening: [] as string[] });
    }, [selectedService, selectedDate]);
    
    const handleConfirm = async () => {
        if (!selectedPet || !selectedService || !selectedDate || !selectedTime) return;
        setIsProcessing(true);
        setError('');
        
        await new Promise(res => setTimeout(res, 1500));
        
        const appointmentTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        appointmentTime.setHours(hours, minutes, 0, 0);

        const newAppointment: Appointment = {
            id: `apt_${Date.now()}`, pet_id: selectedPet.id, vet_id: vet.id, auth_user_id: user.id, service_id: selectedService.id,
            appointment_time: appointmentTime.toISOString(), duration_minutes: selectedService.duration_minutes,
            status: 'confirmed', notes: notes, created_at: new Date().toISOString(),
            vet: { name: vet.name, address: vet.address, photo_url: vet.photo_url },
            pet: { name: selectedPet.name, photo_url: selectedPet.photo_url },
            service: { name: selectedService.name, price: selectedService.price },
        };
        onBookingConfirmed(newAppointment);
    };

    if (isProcessing) return <div className="p-8 text-center"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-4 font-semibold text-gray-700">Securing your spot...</p></div>;

    return (
        <div className="p-4 space-y-4">
            <BookingProgress step={step} />
            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-center text-sm">{error}</p>}
            
            {step === 1 && (
                <>
                    <div className="mt-4">
                        <h3 className="font-bold text-lg mb-2">1. Select your pet</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {pets.map(pet => <button key={pet.id} onClick={() => setSelectedPet(pet)} className={`flex-shrink-0 text-center p-2 border-2 rounded-lg ${selectedPet?.id === pet.id ? 'border-teal-500 bg-teal-50' : 'border-transparent'}`}><img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-full object-cover"/><p className="text-sm font-semibold mt-1">{pet.name}</p></button>)}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">2. Choose a service</h3>
                        <div className="space-y-2">
                            {vet.services?.map(s => <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full text-left p-3 rounded-lg border-2 ${selectedService?.id === s.id ? 'border-teal-500 bg-teal-50' : 'bg-white'}`}><div className="flex justify-between items-center"><div><p className="font-semibold">{s.name}</p><p className="text-sm text-gray-500">{s.duration_minutes} min</p></div><p className="font-bold text-teal-600">₹{s.price}</p></div></button>)}
                        </div>
                    </div>
                    <button onClick={() => setStep(2)} disabled={!selectedPet || !selectedService} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 mt-4">Next: Choose Date & Time</button>
                </>
            )}

            {step === 2 && (
                <>
                    <WeekCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                     {Object.entries(timeSlots).map(([period, slots]) => slots.length > 0 && (
                        <div key={period}>
                            <h4 className="font-bold capitalize mt-4 mb-2">{period}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map(time => <button key={time} onClick={() => { setSelectedTime(time); setStep(3);}} className="p-3 bg-teal-100 text-teal-700 font-semibold rounded-lg text-center hover:bg-teal-200">{time}</button>)}
                            </div>
                        </div>
                    ))}
                    {(timeSlots.morning.length + timeSlots.afternoon.length + timeSlots.evening.length) === 0 && <p className="text-center text-gray-500 mt-4">No available slots. Try another day.</p>}
                    <button onClick={() => setStep(1)} className="w-full bg-gray-200 font-bold py-3 rounded-lg mt-4">Back</button>
                </>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                        <p><strong>Pet:</strong> {selectedPet?.name}</p>
                        <p><strong>Vet:</strong> {vet.name}</p>
                        <p><strong>Service:</strong> {selectedService?.name}</p>
                        <p><strong>When:</strong> {selectedDate?.toLocaleDateString('en-IN', { dateStyle: 'full' })} at {selectedTime}</p>
                        <p><strong>Total:</strong> <span className="font-bold">₹{selectedService?.price}</span></p>
                    </div>
                    <button onClick={handleConfirm} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg">Confirm & Pay</button>
                    <button onClick={() => setStep(2)} className="w-full bg-gray-200 font-bold py-3 rounded-lg">Change Time</button>
                </div>
            )}
        </div>
    );
};

const ConfirmationScreen: React.FC<{ appointment: Appointment; onBookAnother: () => void; onViewAppointments: () => void; }> = ({ appointment, onBookAnother, onViewAppointments }) => (
    <div className="p-4 text-center flex flex-col items-center justify-center h-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">Appointment Confirmed!</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm text-left w-full max-w-sm mt-6 space-y-2">
            <p><strong>For:</strong> {appointment.pet?.name}</p>
            <p><strong>When:</strong> {new Date(appointment.appointment_time).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm text-left w-full max-w-sm mt-4">
            <p className="font-semibold text-sm">Payment Details</p>
            <div className="flex justify-between text-sm text-gray-600 mt-1"><span>{appointment.service?.name}</span><span>₹{appointment.service?.price}</span></div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between items-center text-sm"><span className="font-bold">Paid with</span><span>•••• 1234</span></div>
        </div>
        <div className="mt-8 w-full max-w-sm grid grid-cols-2 gap-2">
            <a href={`https://maps.google.com/?q=${encodeURIComponent(appointment.vet?.address || '')}`} target="_blank" rel="noopener noreferrer" className="bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">Directions</a>
            <a href={generateIcsLink(appointment)} download="appointment.ics" className="bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">Add to Calendar</a>
        </div>
         <button onClick={onViewAppointments} className="w-full max-w-sm mt-2 bg-teal-500 text-white font-bold py-3 rounded-lg">View My Appointments</button>
    </div>
);


// --- MAIN VET BOOKING FLOW COMPONENT ---

interface VetBookingFlowProps { onBack: () => void; user: User; pets: Pet[]; }

const VetBookingFlow: React.FC<VetBookingFlowProps> = ({ onBack, user, pets }) => {
    const [step, setStep] =useState<'triage' | 'search' | 'profile' | 'booking' | 'confirmation'>('triage');
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
    const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

    const handleSelectVet = (vet: Vet) => { setSelectedVet(vet); setStep('profile'); };
    const handleBookNow = (vet: Vet) => { setSelectedVet(vet); setStep('booking'); };
    const handleBookingConfirmed = (appointment: Appointment) => { setConfirmedAppointment(appointment); setStep('confirmation'); };
    
    const handleTriageSelect = (path: 'emergency' | 'routine') => {
        setEmergencyMode(path === 'emergency');
        setStep('search');
    };

    const handleBackNavigation = () => {
        switch(step) {
            case 'confirmation':
                setStep('triage');
                setEmergencyMode(false);
                break;
            case 'booking':
                setStep('profile');
                break;
            case 'profile':
                setStep('search');
                setSelectedVet(null);
                break;
            case 'search':
                setStep('triage');
                setEmergencyMode(false);
                break;
            case 'triage':
            default:
                onBack();
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
                {step === 'confirmation' && confirmedAppointment && <ConfirmationScreen appointment={confirmedAppointment} onBookAnother={() => setStep('search')} onViewAppointments={onBack} />}
            </main>
        </div>
    );
};

export default VetBookingFlow;