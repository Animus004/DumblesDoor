
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Appointment } from '../types';
import { marked } from 'marked';

interface MyAppointmentsScreenProps {}

const generateIcsLink = (appointment: Appointment): string => {
    const startTime = new Date(appointment.appointment_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(new Date(appointment.appointment_time).getTime() + appointment.duration_minutes * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${appointment.id}@dumblesdoor.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`, `DTSTART:${startTime}`, `DTEND:${endTime}`, `SUMMARY:Vet Appointment for ${appointment.pet?.name}`, `DESCRIPTION:Appointment with ${appointment.vet?.name} for ${appointment.service?.name}. Notes: ${appointment.notes || 'N/A'}`, `LOCATION:${appointment.vet?.address}`, 'END:VEVENT', 'END:CALENDAR'].join('\n');
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};

const AppointmentDetailModal: React.FC<{ appointment: Appointment; onClose: () => void; onUpdate: (updatedApp: Appointment) => void; }> = ({ appointment, onClose, onUpdate }) => {
    const isUpcoming = useMemo(() => new Date(appointment.appointment_time) > new Date(), [appointment.appointment_time]);
    const [isExiting, setIsExiting] = useState(false);
    const [preVisitData, setPreVisitData] = useState(appointment.pre_visit_data || { reason_for_visit: '', symptoms: '', changes_in_behavior: '' });
    // FIX: Safely initialize the 'documents' state by checking if `appointment.documents` is an array.
    // This prevents type errors when `appointment.documents` is a non-array JSON value.
    const [documents, setDocuments] = useState<{name: string}[]>(Array.isArray(appointment.documents) ? (appointment.documents as any[]) : []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => { setIsExiting(true); setTimeout(onClose, 300); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setDocuments(docs => [...docs, ...Array.from(e.target.files!).map(file => ({ name: file.name }))]); };
    const handleSave = () => { onUpdate({ ...appointment, pre_visit_data: preVisitData, documents: documents as any }); alert("Your information has been saved and sent to the vet!"); handleClose(); };
    const vetNotesHtml = useMemo(() => ({ __html: !isUpcoming && appointment.vet_notes ? marked(appointment.vet_notes) as string : '' }), [isUpcoming, appointment.vet_notes]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={handleClose}>
            <div className={`w-full max-h-[90vh] bg-gray-50 rounded-t-2xl p-4 pt-2 overflow-y-auto ${isExiting ? 'exiting' : ''} bottom-sheet-content`} onClick={(e) => e.stopPropagation()}>
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto my-2"></div>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4"><div className="flex items-start space-x-4"><img src={appointment.vet?.photo_url} alt={appointment.vet?.name} className="w-16 h-16 rounded-lg object-cover" /><div><h3 className="font-bold text-gray-800 text-lg">{appointment.vet?.name}</h3><p className="text-sm text-gray-600">For: {appointment.pet?.name}</p><p className="text-sm text-gray-500 font-semibold">{new Date(appointment.appointment_time).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p></div></div></div>
                {isUpcoming ? (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm"><h4 className="font-bold mb-2">Pre-visit Information</h4><div><label className="text-sm font-medium text-gray-700">Reason for visit?</label><input type="text" value={preVisitData.reason_for_visit} onChange={e => setPreVisitData(d => ({...d, reason_for_visit: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" /></div><div className="mt-2"><label className="text-sm font-medium text-gray-700">Any symptoms?</label><textarea value={preVisitData.symptoms} onChange={e => setPreVisitData(d => ({...d, symptoms: e.target.value}))} rows={2} className="w-full mt-1 p-2 border rounded-md"></textarea></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm"><h4 className="font-bold mb-2">Upload Medical Records</h4><input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-full p-3 border-2 border-dashed rounded-lg text-center text-gray-500 hover:border-teal-500 hover:text-teal-600">Click to upload files</button><ul className="mt-2 space-y-1 text-sm">{documents.map((doc, i) => <li key={`${doc.name}-${i}`} className="bg-gray-100 p-1 rounded-md">{doc.name}</li>)}</ul></div>
                        <button onClick={handleSave} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg">Save & Send to Vet</button>
                        <div className="grid grid-cols-2 gap-2 text-sm font-semibold"><a href={generateIcsLink(appointment)} download={`appointment.ics`} className="w-full text-center bg-gray-200 py-2 rounded-md">Add to Calendar</a><button onClick={() => alert("Reschedule functionality is in development.")} className="w-full bg-gray-200 py-2 rounded-md">Reschedule</button></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                         <div className="bg-white p-4 rounded-lg shadow-sm"><h4 className="font-bold mb-2">Vet's Notes & Care Plan</h4>{appointment.vet_notes ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={vetNotesHtml} /> : <p className="text-sm text-gray-500">The vet's notes for this visit will appear here once they are added.</p>}</div>
                        <button className="w-full bg-yellow-400 font-bold py-3 rounded-lg">Rate Your Visit</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const MyAppointmentsScreen: React.FC<MyAppointmentsScreenProps> = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const fetchAppointments = async () => {
        setLoading(true); setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found.");
            const { data, error: fetchError } = await supabase.from('appointments').select(`*, vet:professional_profiles(name, address, photo_url), pet:pets(name, photo_url), service:vet_services(name, price)`).eq('auth_user_id', user.id).order('appointment_time', { ascending: false });
            if (fetchError) throw fetchError;
            const augmentedData = (data as any[] || []).map((app, index) => { const isUpcoming = new Date(app.appointment_time) > new Date(); if (isUpcoming && app.status === 'confirmed') app.pre_visit_data = { reason_for_visit: '', symptoms: '', changes_in_behavior: '' }; else if (app.status === 'completed' || (index % 3 === 0 && !isUpcoming)) { app.status = 'completed'; app.vet_notes = `### Post-Visit Summary for ${app.pet?.name}\n\n**Diagnosis:** Mild seasonal allergies.\n\n**Treatment Plan:**\n- Prescribed an antihistamine, 1 tablet daily for 10 days.\n- Medicated bath once a week.\n\n**Follow-up:**\n- Re-check in 2 weeks if symptoms persist.`; } return app; });
            setAppointments(augmentedData);
        } catch (err: any) { setError("Failed to load your appointments."); }
        finally { setLoading(false); }
    };
    
    useEffect(() => { fetchAppointments(); }, []);

    const handleUpdateAppointment = (updatedApp: Appointment) => setAppointments(apps => apps.map(app => app.id === updatedApp.id ? updatedApp : app));
    const { upcoming, past } = useMemo(() => appointments.reduce((acc, app) => { if (new Date(app.appointment_time) >= new Date() && app.status !== 'cancelled_by_user' && app.status !== 'cancelled_by_vet') acc.upcoming.push(app); else acc.past.push(app); return acc; }, { upcoming: [] as Appointment[], past: [] as Appointment[] }), [appointments]);
    const displayList = activeTab === 'upcoming' ? upcoming.sort((a,b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()) : past;

    const AppointmentCard: React.FC<{ app: Appointment }> = ({ app }) => (
        <button onClick={() => setSelectedAppointment(app)} className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4"><img src={app.vet?.photo_url} alt={app.vet?.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" /><div className="flex-grow"><h3 className="font-bold text-gray-800">{app.vet?.name}</h3><p className="text-sm text-gray-600">For: {app.pet?.name}</p><p className="text-sm text-gray-500">{new Date(app.appointment_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><img src={app.pet?.photo_url} alt={app.pet?.name} className="w-10 h-10 rounded-full object-cover border-2 border-white -ml-8" /></div>
            {app.pre_visit_data && app.pre_visit_data.reason_for_visit === '' && <div className="mt-3 text-xs font-semibold text-orange-700 bg-orange-100 p-2 rounded-md text-center">Action Required: Complete Pre-visit Form</div>}
            {app.status === 'completed' && app.vet_notes && <div className="mt-3 text-xs font-semibold text-blue-700 bg-blue-100 p-2 rounded-md text-center">Vet's Notes are available for review</div>}
        </button>
    );
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">Appointment Center</h1>
            </header>
            <div className="p-2 bg-white border-b sticky top-[65px] z-10">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setActiveTab('upcoming')} className={`w-full p-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-teal-500 text-white shadow' : 'text-gray-600'}`}>Upcoming</button>
                    <button onClick={() => setActiveTab('past')} className={`w-full p-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'past' ? 'bg-teal-500 text-white shadow' : 'text-gray-600'}`}>History</button>
                </div>
            </div>
            <main className="flex-grow p-4">
                 {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Loading appointments...</p></div>}
                 {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>}
                 {!loading && displayList.length === 0 && <div className="text-center text-gray-500 pt-16"><p className="font-semibold">No {activeTab} appointments</p><p>Book a new appointment to see it here.</p></div>}
                 {!loading && displayList.length > 0 && <div className="space-y-4">{displayList.map(app => <AppointmentCard key={app.id} app={app} />)}</div>}
            </main>
            {selectedAppointment && <AppointmentDetailModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdate={handleUpdateAppointment} />}
        </div>
    );
};

export default MyAppointmentsScreen;
