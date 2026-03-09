"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'structural' or 'guest'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                        setRole(data.user.role || 'structural');
                    } else {
                        setUser(null);
                        setRole(null);
                    }
                }
            } catch (error) {
                console.error("Error fetching user session:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const loginWithEmail = async (email, password) => {
        if (!email.toLowerCase().endsWith("@deped.gov.ph")) {
            throw new Error("Unauthorized: Only @deped.gov.ph emails are allowed.");
        }

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await res.json();
        } else {
            const text = await res.text();
            console.error("Non-JSON response received:", text);
            throw new Error("Server returned an invalid response (HTML). Check database credentials or server logs.");
        }

        if (!res.ok) {
            throw new Error(data.error || "Login failed.");
        }

        setUser(data.user);
        setRole(data.user.role || 'structural');
        return data.user;
    };

    const registerWithEmail = async (email, password, otpCode, userData) => {
        if (!email.toLowerCase().endsWith("@deped.gov.ph")) {
            throw new Error("Unauthorized: Only @deped.gov.ph emails are allowed.");
        }

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, otpCode, ...userData })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Registration failed.");
        }

        setUser(data.user);
        setRole(data.user.role || 'structural');
        return data.user;
    };

    const loginAsGuest = async (guestData) => {
        // guestData: { name, email, organization, purpose }
        if (!guestData.name || !guestData.email) {
            throw new Error("Name and Email are required for Guest Login.");
        }

        console.log("Starting Guest Login for:", guestData.email);

        try {
            // Save to Azure SQL via API
            const azureResponse = await fetch('/api/auth/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(guestData)
            });

            if (!azureResponse.ok) {
                const contentType = azureResponse.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await azureResponse.json();
                    console.warn("Azure SQL Guest Save failed:", errorData);
                    throw new Error(errorData.error || "Guest login failed at the server.");
                } else {
                    const errorText = await azureResponse.text();
                    console.error("Non-JSON error response:", errorText);
                    throw new Error("Server error (HTML). Check database connection or .env file.");
                }
            } else {
                console.log("Azure SQL Guest Save successful.");
            }

            // Authenticate temporarily in app context
            const userState = { email: guestData.email, displayName: guestData.name, first_name: guestData.name, role: 'guest' };
            setUser(userState);
            setRole("guest");

            return true;
        } catch (error) {
            console.error("Guest login process failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // If they are a standard user, clear the session cookie
            if (role !== "guest") {
                await fetch('/api/auth/logout', { method: 'POST' });
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
            setRole(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, role, loading,
            loginWithEmail, registerWithEmail,
            loginAsGuest, logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
