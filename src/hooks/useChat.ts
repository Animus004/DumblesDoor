
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient'; // Although not used for mock, good to have for future.
import type { User } from '@supabase/supabase-js';

// Mock message type
export interface ChatMessage {
    id: string;
    text: string;
    senderId: string; // 'currentUser' or the chat partner's ID
    timestamp: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
    { id: '1', text: 'Hey! I saw your profile. Your dog is so cute!', senderId: 'partner', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: '2', text: 'Thanks! Your cat looks super majestic too.', senderId: 'currentUser', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
    { id: '3', text: 'Would you be interested in a playdate at Cubbon Park sometime this weekend?', senderId: 'partner', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
];

export const useChat = (chatPartnerId: string, currentUser: User | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate fetching initial messages
        setIsLoading(true);
        setTimeout(() => {
            setMessages(MOCK_MESSAGES);
            setIsLoading(false);
        }, 500);
    }, [chatPartnerId]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !currentUser) return;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            text,
            senderId: 'currentUser', // Represent current user's messages this way
            timestamp: new Date().toISOString(),
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);

        // Simulate a reply from the chat partner
        setTimeout(() => {
            const replyMessage: ChatMessage = {
                id: crypto.randomUUID(),
                text: 'That sounds great! How about Saturday around 4 PM?',
                senderId: 'partner',
                timestamp: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, replyMessage]);
        }, 1500);

    }, [currentUser]);

    return { messages, sendMessage, isLoading, error };
};
