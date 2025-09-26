
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import * as geminiService from '../../services/geminiService';
import type { User } from '@supabase/supabase-js';
import type { DBChatMessage, GeminiChatMessage } from '../../types';

const AI_CHAT_SESSION_ID = 'ai-chat-session';

export const useChat = (chatPartnerId: string, currentUser: User | null) => {
    const [messages, setMessages] = useState<DBChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isAIChat = chatPartnerId === 'ai';

    useEffect(() => {
        if (!currentUser || !isAIChat) {
            setIsLoading(false);
            // In a real app, you would fetch user-to-user chat history here.
            // For now, we only implement the AI chat.
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('auth_user_id', currentUser.id)
                .eq('session_id', AI_CHAT_SESSION_ID)
                .order('sent_at', { ascending: true });

            if (fetchError) {
                console.error("Error fetching chat history:", fetchError);
                setError("Failed to load previous messages.");
            } else {
                setMessages(data || []);
            }
            setIsLoading(false);
        };

        fetchHistory();

    }, [chatPartnerId, currentUser, isAIChat]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !currentUser || !isAIChat) return;

        const userMessage: DBChatMessage = {
            id: crypto.randomUUID(), // Temp ID for UI
            auth_user_id: currentUser.id,
            sender: 'user',
            message: text,
            sent_at: new Date().toISOString(),
            session_id: AI_CHAT_SESSION_ID,
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Persist user message
        supabase.from('chat_messages').insert({ ...userMessage, id: undefined }).then(({ error }) => {
            if (error) console.error("Failed to save user message:", error);
        });

        try {
            const historyForGemini: GeminiChatMessage[] = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.message }],
            }));

            const stream = geminiService.getChatStream(historyForGemini, text);
            
            let fullResponse = '';
            const modelMessageId = crypto.randomUUID(); // Temp ID for streaming

            // Add a placeholder for the model's response
            setMessages(prev => [...prev, {
                id: modelMessageId,
                auth_user_id: currentUser.id,
                sender: 'model',
                message: '',
                sent_at: new Date().toISOString(),
                session_id: AI_CHAT_SESSION_ID,
            }]);

            for await (const chunk of stream) {
                fullResponse += chunk;
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, message: fullResponse } : msg
                ));
            }

            // Persist the final model message
            supabase.from('chat_messages').insert({
                auth_user_id: currentUser.id,
                sender: 'model',
                message: fullResponse,
                session_id: AI_CHAT_SESSION_ID
            }).then(({ error }) => {
                if (error) console.error("Failed to save model message:", error);
            });

        } catch (err: any) {
            console.error("Error with AI response stream:", err);
            setError("Dumble is having trouble responding right now. Please try again later.");
             setMessages(prev => prev.filter(msg => msg.id !== userMessage.id)); // remove optimistic message on error
        } finally {
            setIsLoading(false);
        }

    }, [currentUser, isAIChat, messages]);

    return { messages, sendMessage, isLoading, error };
};
