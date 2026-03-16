import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const { toast } = useToast();

    // Monitor token changes in localStorage
    useEffect(() => {
        const checkToken = () => {
            const currentToken = localStorage.getItem('auth_token');
            if (currentToken !== token) {
                setToken(currentToken);
            }
        };

        const interval = setInterval(checkToken, 1000);
        window.addEventListener('storage', checkToken);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkToken);
        };
    }, [token]);

    useEffect(() => {
        if (!token) {
            if (socket) {
                console.log('Token removed, disconnecting socket');
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        console.log('Token found, connecting socket...');
        const newSocket = io('http://localhost:4000', {
            auth: { token },
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('✅ Connected to socket server:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from socket server:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Global Listeners
        newSocket.on('PAYMENT_SUCCEEDED', (data) => {
            console.log('🔔 PAYMENT_SUCCEEDED event received:', data);
            toast({
                title: 'Payment Successful!',
                description: data.message || 'Restaurant is being notified.',
            });
        });

        newSocket.on('NEW_ORDER', (data) => {
            console.log('🔔 NEW_ORDER event received:', data);
            toast({
                title: '🚨 New Order Received!',
                description: data.message || 'Check your dashboard for details.',
                variant: 'default',
            });
            // Play a sound if possible
            try {
                const audio = new Audio('/notification-sound.mp3');
                audio.play();
            } catch (e) { }
        });

        newSocket.on('ORDER_STATUS_UPDATE', (data) => {
            toast({
                title: 'Order Status Update',
                description: data.message,
            });
        });

        newSocket.on('ORDER_CANCELLED', (data) => {
            toast({
                title: 'Order Cancelled',
                description: data.message,
                variant: 'destructive',
            });
        });

        newSocket.on('NEW_AVAILABLE_ORDER', (data) => {
            toast({
                title: '🛵 Order available!',
                description: `New order from ${data.restaurantName || 'a restaurant'} is ready for pickup.`,
            });
        });

        setSocket(newSocket);

        return () => {
            console.log('Cleaning up socket connection');
            newSocket.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
