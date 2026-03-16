import { MapPin, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

export function LiveMap() {
    const { socket } = useSocket();
    const [driverPos, setDriverPos] = useState({ top: '50%', left: '50%' });

    useEffect(() => {
        if (!socket) return;

        const handleLocation = (data: any) => {
            // In a real app, we would map lat/lng to container pixels/percentages
            // Since this is a simulated map, we'll just move it randomly within a range to show it's alive
            // Or if data contains a percentage/simulated position
            const top = `${30 + Math.random() * 40}%`;
            const left = `${30 + Math.random() * 40}%`;
            setDriverPos({ top, left });
        };

        socket.on('LOCATION_UPDATE', handleLocation);
        return () => {
            socket.off('LOCATION_UPDATE', handleLocation);
        };
    }, [socket]);

    return (
        <div className="relative w-full h-[300px] md:h-full bg-slate-100 rounded-xl overflow-hidden border border-border">
            {/* Background Map Placeholder Pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Roads (Simulated) */}
            <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-300 transform -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-2 h-full bg-slate-300 transform -translate-x-1/2" />

            {/* Restaurant Location */}
            <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                    <MapPin className="h-4 w-4" />
                </div>
                <div className="mt-1 px-2 py-1 bg-white rounded shadow text-xs font-semibold whitespace-nowrap">Restaurant</div>
            </div>

            {/* User Location */}
            <div className="absolute bottom-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                    <MapPin className="h-4 w-4" />
                </div>
                <div className="mt-1 px-2 py-1 bg-white rounded shadow text-xs font-semibold whitespace-nowrap">You</div>
            </div>

            {/* Driver Position (Reactive) */}
            <div
                className="absolute transition-all duration-1000 ease-in-out z-20"
                style={{ top: driverPos.top, left: driverPos.left, transform: 'translate(-50%, -50%)' }}
            >
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-xl">
                        <Navigation className="h-4 w-4 transform rotate-45" />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border text-xs text-muted-foreground text-center">
                Real-time tracking enabled via Socket.io
            </div>
        </div>
    );
}
