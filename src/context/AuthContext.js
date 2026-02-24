"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'structural' or 'guest'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Enforce deped.gov.ph domain
                if (!currentUser.email.endsWith("@deped.gov.ph")) {
                    await signOut(auth);
                    setUser(null);
                    setRole(null);
                    setLoading(false);
                    alert("Unauthorized: Only @deped.gov.ph emails are allowed.");
                    return;
                }

                try {
                    // Fetch or create user document
                    const userRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userRef);

                    let userRole = "structural"; // default role for authenticated deped users
                    if (!userDoc.exists()) {
                        await setDoc(userRef, {
                            email: currentUser.email,
                            displayName: currentUser.displayName,
                            role: "structural",
                            createdAt: new Date().toISOString()
                        });
                    } else {
                        userRole = userDoc.data().role || "structural";
                    }

                    setUser(currentUser);
                    setRole(userRole);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (!result.user.email.endsWith("@deped.gov.ph")) {
                await signOut(auth);
                alert("Unauthorized: Only @deped.gov.ph emails are allowed.");
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const loginAsGuest = () => {
        setUser({ email: "guest@guest.com", displayName: "Guest User" });
        setRole("guest");
    };

    const logout = () => {
        signOut(auth);
        setUser(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, loginAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
