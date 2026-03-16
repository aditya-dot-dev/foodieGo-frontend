import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
    allowedRoles: ('USER' | 'RESTAURANT' | 'DELIVERY_PARTNER' | 'ADMIN' | 'GUEST')[];
    children: React.ReactNode;
}

// export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
//     const role = localStorage.getItem('user_role') as 'USER' | 'RESTAURANT' | null;
//     const isAuthenticated = !!localStorage.getItem('auth_token');

//     // If GUEST is allowed and user is not authenticated, allow access
//     if (allowedRoles.includes('GUEST') && !isAuthenticated) {
//         return <>{children}</>;
//     }

//     // If user is authenticated
//     if (isAuthenticated && role) {
//         // Check if role is allowed
//         if (allowedRoles.includes(role)) {
//             return <>{children}</>;
//         }
//         // RESTAURANT trying to access USER-only routes → redirect to /owner
//         if (role === 'RESTAURANT') {
//             return <Navigate to="/owner" replace />;
//         }
//         // USER trying to access RESTAURANT-only routes → redirect to home
//         return <Navigate to="/" replace />;
//     }

//     // Not authenticated and GUEST not allowed → redirect to login
//     return <Navigate to="/login" replace />;
// }


export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const role = localStorage.getItem('user_role') as 'USER' | 'RESTAURANT' | 'DELIVERY_PARTNER' | 'ADMIN' | null;
    const isAuthenticated = !!localStorage.getItem('auth_token');

    // PUBLIC ROUTE (GUEST allowed)
    if (allowedRoles.includes('GUEST')) {
        // Logged-in RESTAURANT, DELIVERY_PARTNER or ADMIN must be blocked if not allowed
        if (isAuthenticated && !allowedRoles.includes(role as any)) {
            if (role === 'RESTAURANT') return <Navigate to="/owner" replace />;
            if (role === 'DELIVERY_PARTNER') return <Navigate to="/delivery-partner" replace />;
            if (role === 'ADMIN') return <Navigate to="/admin" replace />;
        }
        return <>{children}</>;
    }

    // PROTECTED ROUTES
    if (!isAuthenticated || !role) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        if (role === 'RESTAURANT') return <Navigate to="/owner" replace />;
        if (role === 'DELIVERY_PARTNER') return <Navigate to="/delivery-partner" replace />;
        if (role === 'ADMIN') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
