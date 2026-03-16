type JwtPayload = {
    role?: "USER" | "RESTAURANT" | "ADMIN";
};

export function getUserRole(): JwtPayload["role"] {
    const token = localStorage.getItem("auth_token");
    if (!token) return undefined;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role;
    } catch {
        return undefined;
    }
}
