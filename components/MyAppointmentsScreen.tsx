
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Appointment, Json } from '../types';
import { marked } from 'marked';

interface MyAppointmentsScreenProps {}

const generateIcsLink = (appointment: Appointment): string => {
    const startTime = new Date(appointment.appointment_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(new Date(appointment.appointment_time).getTime() + appointment.duration_minutes * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${appointment.id}@dumblesdoor.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`, `DTSTART:${startTime}`, `DTEND:${endTime}`, `SUMMARY:Vet Appointment for ${appointment.pet?.name}`, `DESCRIPTION:Appointment with ${appointment.vet?.name} for ${appointment.service?.name}. Notes: ${appointment.notes || 'N/A'}`, `LOCATION:${appointment.vet?.address}`, 'END:VEVENT', 'END:CALENDAR'].join('\n');
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};

const AppointmentDetailModal: React.FC<{ appointment: Appointment; onClose: () => void; onUpdate: (updatedApp: Appointment) => Promise<void>; user: any; }> = ({ appointment, onClose, onUpdate, user }) => {
    const isUpcoming = useMemo(() => new Date(appointment.appointment_time) > new Date(), [appointment.appointment_time]);
    const [isExiting, setIsExiting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- State for Pre-Visit Form ---
    const [preVisitData, setPreVisitData] = useState(appointment.pre_visit_data || { reason_for_visit: '', symptoms: '', changes_in_behavior: '' });
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Safely parse existing documents from Supabase
    const existingDocuments = useMemo(() => {
        if (Array.isArray(appointment.documents)) {
            return appointment.documents as { name: string; url: string }[];
        }
        return [];
    }, [appointment.documents]);

    const handleClose = () => { setIsExiting(true); setTimeout(onClose, 300); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };
    
    const handleRemoveFile = (index: number) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let uploadedDocuments: { name: string, url: string }[] = [...existingDocuments];

            if (filesToUpload.length > 0) {
                const uploadPromises = filesToUpload.map(async file => {
                    const filePath = `${user.id}/${appointment.id}/${file.name}`;
                    const { error } = await supabase.storage.from('pet_documents').upload(filePath, file, { upsert: true });
                    if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);
                    const { data } = supabase.storage.from('pet_documents').getPublicUrl(filePath);
                    return { name: file.name, url: data.publicUrl };
                });
                const newDocs = await Promise.all(uploadPromises);
                uploadedDocuments = [...uploadedDocuments, ...newDocs];
            }
            
            // FIX: Remove 'as Json' casts. The object and array types are compatible with
            // the 'Json' type expected by Supabase, and removing the cast resolves the
            // type conflict with the 'onUpdate' function's 'Appointment' parameter type.
            await onUpdate({ 
                ...appointment, 
                pre_visit_data: preVisitData, 
                documents: uploadedDocuments
            });
            alert("Your information has been saved and sent to the vet!");
            handleClose();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const vetNotesHtml = useMemo(() => ({ __html: !isUpcoming && appointment.vet_notes ? marked(appointment.vet_notes) as string : '' }), [isUpcoming, appointment.vet_notes]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={handleClose}>
            <div className={`w-full max-h-[90vh] bg-gray-50 rounded-t-2xl p-4 pt-2 flex flex-col ${isExiting ? 'exiting' : ''} bottom-sheet-content`} onClick={(e) => e.stopPropagation()}>
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto my-2 flex-shrink-0"></div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                    <div className="flex items-start space-x-4">
                        <img src={appointment.vet?.photo_url} alt={appointment.vet?.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{appointment.vet?.name}</h3>
                            <p className="text-sm text-gray-600">For: <strong>{appointment.pet?.name}</strong></p>
                            <p className="text-sm text-gray-500 font-semibold">{new Date(appointment.appointment_time).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto space-y-4 pb-16">
                    {isUpcoming ? (
                        <>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-bold mb-3">Pre-visit Information</h4>
                                <div className="space-y-3">
                                    <div><label className="text-sm font-medium text-gray-700">Reason for visit?</label><input type="text" value={preVisitData.reason_for_visit} onChange={e => setPreVisitData(d => ({...d, reason_for_visit: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" /></div>
                                    <div><label className="text-sm font-medium text-gray-700">Any symptoms?</label><textarea value={preVisitData.symptoms} onChange={e => setPreVisitData(d => ({...d, symptoms: e.target.value}))} rows={2} className="w-full mt-1 p-2 border rounded-md"></textarea></div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-bold mb-2">Upload Medical Records</h4>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 border-2 border-dashed rounded-lg text-center text-gray-500 hover:border-teal-500 hover:text-teal-600">Click to upload files</button>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {existingDocuments.map((doc, i) => <li key={`existing-${i}`} className="bg-gray-100 p-2 rounded-md flex items-center gap-2">📄<span>{doc.name}</span></li>)}
                                    {filesToUpload.map((file, i) => <li key={`new-${i}`} className="bg-blue-50 p-2 rounded-md flex justify-between items-center"><span>{file.name}</span><button onClick={() => handleRemoveFile(i)} className="text-red-500">✖</button></li>)}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white p-4 rounded-lg shadow-sm"><h4 className="font-bold mb-2">Vet's Notes & Care Plan</h4>{appointment.vet_notes ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={vetNotesHtml} /> : <p className="text-sm text-gray-500">The vet's notes for this visit will appear here once they are added.</p>}</div>
                            {existingDocuments.length > 0 && <div className="bg-white p-4 rounded-lg shadow-sm"><h4 className="font-bold mb-2">Documents from Vet</h4><ul className="space-y-2">{existingDocuments.map((doc, i) => <li key={i}><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 font-semibold underline flex items-center gap-2">📄 {doc.name}</a></li>)}</ul></div>}
                        </>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t">
                    {isUpcoming ? (
                        <div className="space-y-2">
                             <button onClick={handleSave} disabled={isSaving} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{isSaving ? 'Saving...' : 'Save & Send to Vet'}</button>
                             <div className="grid grid-cols-2 gap-2 text-sm font-semibold"><a href={generateIcsLink(appointment)} download={`appointment.ics`} className="w-full text-center bg-gray-200 py-2 rounded-md">Add to Calendar</a><button onClick={() => alert("Reschedule functionality is in development.")} className="w-full bg-gray-200 py-2 rounded-md">Reschedule</button></div>
                        </div>
                    ) : (
                        <button className="w-full bg-yellow-400 font-bold py-3 rounded-lg">Rate Your Visit</button>
                    )}
                </div>
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
    const [user, setUser] = useState<any>(null);

    const fetchAppointments = async (currentUser: any) => {
        setLoading(true); setError(null);
        try {
            const { data, error: fetchError } = await supabase.from('appointments').select(`*, vet:professional_profiles(name, address, photo_url), pet:pets(name, photo_url), service:vet_services(name, price)`).eq('auth_user_id', currentUser.id).order('appointment_time', { ascending: false });
            if (fetchError) throw fetchError;
            
            const augmentedData = (data as any[] || []).map((app) => {
                const isUpcoming = new Date(app.appointment_time) > new Date();
                // Mock vet notes for completed appointments to demonstrate the feature
                if (!isUpcoming && !app.vet_notes) {
                    app.status = 'completed';
                    app.vet_notes = `### Post-Visit Summary for ${app.pet?.name}\n\n**Diagnosis:** Mild seasonal allergies.\n\n**Treatment Plan:**\n- Prescribed an antihistamine, 1 tablet daily for 10 days.\n- Medicated bath once a week.\n\n**Follow-up:**\n- Re-check in 2 weeks if symptoms persist.`;
                }
                return app;
            });

            setAppointments(augmentedData);
        } catch (err: any) { setError("Failed to load your appointments."); }
        finally { setLoading(false); }
    };
    
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                fetchAppointments(user);
            } else {
                setLoading(false);
                setError("You must be logged in to see appointments.");
            }
        };
        checkUser();
    }, []);

    const handleUpdateAppointment = async (updatedApp: Appointment) => {
        const { error } = await supabase
            .from('appointments')
            .update({
                pre_visit_data: updatedApp.pre_visit_data,
                documents: updatedApp.documents,
            })
            .eq('id', updatedApp.id);
        
        if (error) {
            alert(`Failed to update appointment: ${error.message}`);
        } else {
            setAppointments(apps => apps.map(app => app.id === updatedApp.id ? updatedApp : app));
        }
    };

    const { upcoming, past } = useMemo(() => appointments.reduce((acc, app) => { if (new Date(app.appointment_time) >= new Date() && app.status !== 'cancelled_by_user' && app.status !== 'cancelled_by_vet') acc.upcoming.push(app); else acc.past.push(app); return acc; }, { upcoming: [] as Appointment[], past: [] as Appointment[] }), [appointments]);
    const displayList = activeTab === 'upcoming' ? upcoming.sort((a,b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()) : past;

    const AppointmentCard: React.FC<{ app: Appointment }> = ({ app }) => {
        const needsPreVisitInfo = useMemo(() => {
            const isUpcoming = new Date(app.appointment_time) > new Date();
            if (!isUpcoming) return false;
            // A simple check if the form is empty
            return !app.pre_visit_data || !(app.pre_visit_data as any).reason_for_visit;
        }, [app]);
        
        return (
            <button onClick={() => setSelectedAppointment(app)} className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                    <img src={app.vet?.photo_url} alt={app.vet?.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-grow">
                        <h3 className="font-bold text-gray-800">{app.vet?.name}</h3>
                        <p className="text-sm text-gray-600">For: {app.pet?.name}</p>
                        <p className="text-sm text-gray-500">{new Date(app.appointment_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <img src={app.pet?.photo_url} alt={app.pet?.name} className="w-10 h-10 rounded-full object-cover border-2 border-white -ml-8" />
                </div>
                {needsPreVisitInfo && <div className="mt-3 text-xs font-semibold text-orange-700 bg-orange-100 p-2 rounded-md text-center">Action Required: Complete Pre-visit Form</div>}
                {app.status === 'completed' && app.vet_notes && <div className="mt-3 text-xs font-semibold text-blue-700 bg-blue-100 p-2 rounded-md text-center">Vet's Notes are available for review</div>}
            </button>
        );
    };
    
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
            {selectedAppointment && user && <AppointmentDetailModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdate={handleUpdateAppointment} user={user} />}
        </div>
    );
};

export default MyAppointmentsScreen;
