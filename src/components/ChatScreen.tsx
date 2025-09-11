
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { useChat, ChatMessage } from '../hooks/useChat';

interface ChatScreenProps {
    currentUser: User | null;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const { chatPartnerId } = useParams<{ chatPartnerId: string }>();
    
    // In a real app, you'd fetch the partner's profile based on the ID
    const [chatPartner] = useState({ id: chatPartnerId, name: 'Alex & Buddy' }); 
    
    const { messages, sendMessage, isLoading } = useChat(chatPartnerId!, currentUser);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage);
            setNewMessage('');
        }
    };

    const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isSentByCurrentUser = message.senderId === 'currentUser';
        return (
            <div className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${isSentByCurrentUser ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    <p>{message.text}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold truncate">{chatPartner.name}</h1>
            </header>

            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                ) : (
                    messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-white border-t sticky bottom-0">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                        autoComplete="off"
                    />
                    <button type="submit" className="bg-teal-500 text-white p-3 rounded-full flex-shrink-0 hover:bg-teal-600 disabled:opacity-50" disabled={!newMessage.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" transform="rotate(-45 12 12) translate(-1, 5)" /></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatScreen;
