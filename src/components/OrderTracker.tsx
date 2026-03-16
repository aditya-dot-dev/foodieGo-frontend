
import { Check } from "lucide-react";

interface OrderTrackerProps {
    status: string;
}

const STEPS = [
    { id: 'PLACED', label: 'Order Placed' },
    { id: 'ACCEPTED', label: 'Order Accepted' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'READY', label: 'Order Ready' },
    { id: 'PICKED_UP', label: 'Picked Up' },
    { id: 'OUT_FOR_DELIVERY', label: 'On the Way' },
    { id: 'COMPLETED', label: 'Delivered' },
];

export function OrderTracker({ status }: OrderTrackerProps) {
    // Determine current step index
    const currentStepIndex = STEPS.findIndex(s => s.id === status);

    return (
        <div className="w-full py-6">
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full px-2">

                {/* Progress Line (Desktop) */}
                <div className="absolute top-4 left-0 w-full h-1 bg-muted hidden md:block -z-10">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Steps */}
                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isLastStep = index === STEPS.length - 1;

                    return (
                        <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto mb-6 md:mb-0 relative z-0">
                            {/* Step Circle */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'}
                `}
                            >
                                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-medium">{index + 1}</span>}
                            </div>

                            {/* Step Label */}
                            <div className="flex flex-col md:items-center">
                                <span className={`text-sm font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                                {isCurrent && !isLastStep && (
                                    <span className="text-xs text-primary animate-pulse hidden md:block">Processing...</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
