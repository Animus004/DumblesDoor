
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { useChat } from '../hooks/useChat';
import type { DBChatMessage } from '../../types';

interface ChatScreenProps {
    currentUser: User | null;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const { chatPartnerId } = useParams<{ chatPartnerId: string }>();
    const isAIChat = chatPartnerId === 'ai';

    // In a real app, you'd fetch the partner's profile based on the ID
    const [chatPartner] = useState({ 
        id: chatPartnerId, 
        name: isAIChat ? 'Dumble AI' : 'Alex & Buddy',
        avatar: isAIChat ? 'https://placehold.co/128x128/A78BFA/ffffff?text=🐾' : 'https://i.ibb.co/6rC6hJq/indie-dog-1.jpg'
    }); 
    
    const { messages, sendMessage, isLoading, error } = useChat(chatPartnerId!, currentUser);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && !isLoading) {
            sendMessage(newMessage);
            setNewMessage('');
        }
    };

    const MessageBubble: React.FC<{ message: DBChatMessage }> = ({ message }) => {
        const isSentByCurrentUser = message.sender === 'user';
        return (
            <div className={`flex items-end gap-2 ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isSentByCurrentUser && (
                    <img src={chatPartner.avatar} alt={chatPartner.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                )}
                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl whitespace-pre-wrap ${isSentByCurrentUser ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    <p>{message.message}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <img src={chatPartner.avatar} alt={chatPartner.name} className="w-8 h-8 rounded-full mr-3" />
                <h1 className="text-xl font-bold truncate">{chatPartner.name}</h1>
            </header>

            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                {error && <div className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{error}</div>}
                {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <img src={chatPartner.avatar} alt={chatPartner.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                        <div className="max-w-xs px-4 py-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-2 sm:p-4 bg-white/80 backdrop-blur-sm border-t sticky bottom-0">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isAIChat ? "Ask Dumble about pet care..." : "Type a message..."}
                        className="w-full p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
                        autoComplete="off"
                        disabled={isLoading}
                    />
                    <button type="submit" className="bg-teal-500 text-white p-3 rounded-full flex-shrink-0 hover:bg-teal-600 disabled:opacity-50 transition-colors" disabled={!newMessage.trim() || isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatScreen;