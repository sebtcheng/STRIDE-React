"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Eye,
    EyeOff,
    LogIn,
    UserCircle,
    Mail,
    Lock,
    User,
    Briefcase,
    MapPin,
    Building,
    ArrowRight,
    ShieldCheck,
    Key,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
    const { loginWithEmail, loginAsGuest, registerWithEmail } = useAuth();

    // Forms & UI States
    const [authMode, setAuthMode] = useState('deped'); // 'deped' | 'guest'
    const [isRegistering, setIsRegistering] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // DepEd Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Guest Login State
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestOrg, setGuestOrg] = useState('');
    const [guestPurpose, setGuestPurpose] = useState('');

    // Registration State
    const [regStation, setRegStation] = useState('');
    const [regSchoolId, setRegSchoolId] = useState('');
    const [regOfficeName, setRegOfficeName] = useState('');
    const [regPosition, setRegPosition] = useState('');

    // Registration State - Conditional Details
    const [regFirstName, setRegFirstName] = useState('');
    const [regMiddleName, setRegMiddleName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regAge, setRegAge] = useState('');
    const [regBirthday, setRegBirthday] = useState('');
    const [regAddress, setRegAddress] = useState('');
    const [regRegion, setRegRegion] = useState('');
    const [regDivision, setRegDivision] = useState('');
    const [regDistrict, setRegDistrict] = useState('');
    const [regSchool, setRegSchool] = useState('');

    // Registration State - Credentials
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);

    // Determines if we show the detailed fields (HR/Engineer)
    const showDetailedFields = regPosition && (
        regPosition.includes('Engineer') ||
        regPosition.includes('Human Resources')
    );

    // Transition handler
    const toggleRegistration = () => {
        setIsRegistering(!isRegistering);
        setError(null);
        setSuccess(null);
    };

    const toggleMode = (mode) => {
        setAuthMode(mode);
        setIsRegistering(false);
        setError(null);
        setSuccess(null);
    };

    const handleDepedLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await loginWithEmail(loginEmail, loginPassword);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await loginAsGuest({
                name: guestName,
                email: guestEmail,
                organization: guestOrg,
                purpose: guestPurpose
            });
        } catch (err) {
            setError(err.message || 'Guest login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!regEmail.endsWith("@deped.gov.ph")) {
            setError("Must use a valid @deped.gov.ph email.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: regEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');

            setOtpSent(true);
            setSuccess("OTP sent to your email! Please check your inbox or spam folder.");
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: regEmail, otp_code: otpInput })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid OTP code.');

            setOtpVerified(true);
            setSuccess("Email successfully verified!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (!otpVerified) {
            setError("You must verify your email with OTP first.");
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // Construct the user data payload matching requirements
            const userData = {
                stationLevel: regStation,
                position: regPosition,
            };

            if (regStation === 'school') {
                userData.schoolId = regSchoolId;
            } else {
                userData.officeName = regOfficeName;
            }

            if (showDetailedFields) {
                userData.firstName = regFirstName;
                userData.middleName = regMiddleName;
                userData.lastName = regLastName;
                userData.age = regAge;
                userData.birthday = regBirthday;
                userData.address = regAddress;
                userData.region = regRegion;
                userData.division = regDivision;
                userData.district = regDistrict;
                userData.school = regSchool;
            }

            await registerWithEmail(regEmail, regPassword, otpInput, userData);
        } catch (err) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-r from-[#e4e6e9] to-[#cfd4da] font-sans selection:bg-[#003366] selection:text-white pb-10 lg:pb-0">

            {/* Left Panel - Brand Identity */}
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-center items-center p-12 relative z-10">
                <div className="flex flex-col items-center text-center max-w-lg">
                    {/* Integrated Branding Block */}
                    <div className="flex flex-col items-center">
                        {/* Logos Container */}
                        <div className="flex flex-col items-start -ml-12 sm:-ml-16 mb-0 relative">
                            {/* DepEd Header Logo */}
                            <img src="/img/logo1.png" alt="DepEd Logo" className="h-12 sm:h-14 w-auto absolute -top-1 sm:-top-2 left-10 sm:left-14 drop-shadow-sm z-10" />

                            {/* Main STRIDE Logo */}
                            <img src="/img/Stridelogo1.png" alt="STRIDE" className="h-40 sm:h-48 w-auto drop-shadow-lg hover:scale-105 transition-transform duration-500 relative z-0 mt-8 sm:mt-10" />
                        </div>

                        {/* Taglines */}
                        <h2 className="text-3xl md:text-4xl font-bold italic mb-1 text-[#d19c11] tracking-tight drop-shadow-sm mt-0 sm:-mt-2">
                            Education in Motion!
                        </h2>

                        <p className="text-xl md:text-2xl font-bold tracking-tight">
                            <span className="text-[#003366]">Data Precision. </span>
                            <span className="text-[#CE1126]">Smart Decision.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Forms */}
            <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-12 lg:px-16 relative">
                <div className={`w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-10 relative overflow-hidden z-10 transition-all duration-300 ${isRegistering ? 'max-w-3xl' : 'max-w-md'}`}>

                    {/* Alert Notifications */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                            <span className="text-sm font-medium">{success}</span>
                        </div>
                    )}

                    {!isRegistering ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight mb-2">Welcome to STRIDE!</h1>
                                <p className="text-gray-500 text-sm">Select your login type:</p>
                            </div>

                            {/* Toggle Switch */}
                            <div className="flex p-1 bg-gray-100 rounded-lg mb-8 shadow-inner">
                                <button
                                    onClick={() => toggleMode('deped')}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${authMode === 'deped'
                                        ? 'bg-white text-[#003366] shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    DEPED User
                                </button>
                                <button
                                    onClick={() => toggleMode('guest')}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${authMode === 'guest'
                                        ? 'bg-white text-[#b8860b] shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    GUEST User
                                </button>
                            </div>

                            {/* Forms */}
                            {authMode === 'deped' ? (
                                <form onSubmit={handleDepedLogin} className="space-y-6">
                                    <div className="space-y-1 group">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={loginEmail}
                                                onChange={e => setLoginEmail(e.target.value)}
                                                placeholder="name@deped.gov.ph"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 group">
                                        <label className="text-sm font-medium text-gray-700">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={loginPassword}
                                                onChange={e => setLoginPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pb-4">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" className="rounded border-gray-300 text-[#003366] focus:ring-[#003366] transition duration-200" />
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium">Remember me</span>
                                        </label>
                                        <a href="#" className="text-sm font-semibold text-[#003366] hover:text-[#004f9e] transition-colors">Forgot password?</a>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white py-3.5 px-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                                    >
                                        {loading ? "Signing in..." : "Sign In"} <ArrowRight size={18} />
                                    </button>


                                    <div className="text-center pt-4">
                                        <p className="text-sm text-gray-600">
                                            Don't have an account?{' '}
                                            <button onClick={toggleRegistration} type="button" className="font-semibold text-[#003366] hover:underline transition-all">
                                                Create an account
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleGuestLogin} className="space-y-6">
                                    <div className="space-y-1 group">
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#e0a800]">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={guestName}
                                                onChange={e => setGuestName(e.target.value)}
                                                placeholder="Juan Dela Cruz"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e0a800] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 group">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#e0a800]">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={guestEmail}
                                                onChange={e => setGuestEmail(e.target.value)}
                                                placeholder="juan@example.com"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e0a800] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 group">
                                        <label className="text-sm font-medium text-gray-700">Organization / Affiliation</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#e0a800]">
                                                <Building size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={guestOrg}
                                                onChange={e => setGuestOrg(e.target.value)}
                                                placeholder="University or Company"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e0a800] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Purpose of Access</label>
                                        <textarea
                                            rows="3"
                                            value={guestPurpose}
                                            onChange={e => setGuestPurpose(e.target.value)}
                                            placeholder="Briefly state your purpose..."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e0a800] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#e0a800] text-[#003366] py-3.5 px-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg mt-6 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                                    >
                                        {loading ? "Entering..." : "Enter Dashboard"} <ArrowRight size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-extrabold text-[#003366] tracking-tight mb-1">Create Account</h2>
                                <p className="text-gray-500 text-sm">Join the DepEd STRIDE ecosystem. STRICTLY DepEd Accounts.</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleRegister}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Column 1: Core Details */}
                                    <div className="space-y-4">
                                        {/* Station */}
                                        <div className="space-y-1 group">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Station / Gov Level *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                    <MapPin size={16} />
                                                </div>
                                                <select
                                                    value={regStation}
                                                    onChange={e => setRegStation(e.target.value)}
                                                    required
                                                    className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50 focus:bg-white text-sm cursor-pointer"
                                                >
                                                    <option value="" disabled>Select Level</option>
                                                    <option value="co">Central Office</option>
                                                    <option value="ro">Regional Office</option>
                                                    <option value="sdo">Schools Division Office</option>
                                                    <option value="school">School</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Conditional Station Field */}
                                        {regStation === 'school' && (
                                            <div className="space-y-1 group">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">School ID (6 Digits) *</label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    required
                                                    value={regSchoolId}
                                                    onChange={e => setRegSchoolId(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="e.g. 101010"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all text-sm"
                                                />
                                            </div>
                                        )}
                                        {['co', 'ro', 'sdo'].includes(regStation) && (
                                            <div className="space-y-1 group">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Office Name (Full) *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={regOfficeName}
                                                    onChange={e => setRegOfficeName(e.target.value)}
                                                    placeholder="e.g. BHROD-SED"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50 focus:bg-white text-sm font-medium"
                                                />
                                            </div>
                                        )}

                                        {/* Position */}
                                        <div className="space-y-1 group">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Position *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                    <Briefcase size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={regPosition}
                                                    onChange={e => setRegPosition(e.target.value)}
                                                    required
                                                    placeholder="e.g. School Principal I"
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50 focus:bg-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <hr className="my-2 border-gray-200" />

                                        {/* OTP Integration Area */}
                                        <div className="space-y-1 group">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DepEd Email *</label>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                        <Mail size={16} />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        required
                                                        disabled={otpVerified}
                                                        value={regEmail}
                                                        onChange={e => setRegEmail(e.target.value)}
                                                        placeholder="name@deped.gov.ph"
                                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSendOTP}
                                                    disabled={!regEmail || otpVerified}
                                                    className="px-4 py-2.5 sm:py-0 bg-[#f4f6f9] text-[#003366] border border-[#003366]/20 font-semibold rounded-lg text-sm hover:bg-[#003366] hover:text-white transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {otpSent ? "Resend OTP" : "Send OTP"}
                                                </button>
                                            </div>
                                        </div>

                                        {otpSent && !otpVerified && (
                                            <div className="flex gap-2 animate-in zoom-in duration-300">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#CE1126]">
                                                        <ShieldCheck size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={otpInput}
                                                        onChange={e => setOtpInput(e.target.value)}
                                                        placeholder="6-digit code"
                                                        className="w-full pl-9 pr-4 py-2.5 border border-[#CE1126]/30 rounded-lg focus:ring-2 focus:ring-[#CE1126] focus:border-transparent outline-none transition-all text-gray-900 bg-red-50 focus:bg-white text-sm tracking-widest font-mono"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyOTP}
                                                    disabled={otpInput.length !== 6}
                                                    className="px-4 bg-[#CE1126] hover:bg-red-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                                                >
                                                    Verify
                                                </button>
                                            </div>
                                        )}
                                        {otpVerified && (
                                            <div className="text-sm text-green-600 flex items-center gap-1 font-medium bg-green-50 p-2 rounded border border-green-200">
                                                <CheckCircle2 size={16} /> Email verified!
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                            <div className="flex-1 space-y-1">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                        <Lock size={16} />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        value={regPassword}
                                                        onChange={e => setRegPassword(e.target.value)}
                                                        placeholder="Password"
                                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] text-sm outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366]">
                                                        <Key size={16} />
                                                    </div>
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        required
                                                        value={regConfirmPassword}
                                                        onChange={e => setRegConfirmPassword(e.target.value)}
                                                        placeholder="Confirm Pass"
                                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] text-sm outline-none transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Detailed HR/Engineer Fields (Conditional render) */}
                                    {showDetailedFields ? (
                                        <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-5 animate-in slide-in-from-right-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Personal Details *</label>
                                                <input required type="text" placeholder="First Name" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                <input type="text" placeholder="Middle Name (Optional)" value={regMiddleName} onChange={e => setRegMiddleName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                <input required type="text" placeholder="Last Name" value={regLastName} onChange={e => setRegLastName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />

                                                <div className="grid grid-cols-2 gap-2">
                                                    <input required type="number" min="18" max="100" placeholder="Age" value={regAge} onChange={e => setRegAge(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                    <input required type="date" value={regBirthday} onChange={e => setRegBirthday(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-600" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Location Details *</label>
                                                <textarea required rows="2" placeholder="Full Address" value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm resize-none"></textarea>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input required type="text" placeholder="Region" value={regRegion} onChange={e => setRegRegion(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                    <input required type="text" placeholder="Division" value={regDivision} onChange={e => setRegDivision(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                    <input required type="text" placeholder="Legislative District" value={regDistrict} onChange={e => setRegDistrict(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                    <input required type="text" placeholder="School" value={regSchool} onChange={e => setRegSchool(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="hidden md:flex flex-col items-center justify-center text-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                <ShieldCheck size={32} className="text-[#003366]" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-[#003366] mb-1">Verify Your Identity</h3>
                                            <p className="text-xs text-gray-500">Provide the basic details on the left, verify your DepEd email to proceed securely.</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !otpVerified}
                                    className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg mt-6 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Registering..." : "Register Account"}
                                </button>

                                <div className="text-center pt-2">
                                    <button onClick={toggleRegistration} type="button" className="text-sm font-medium text-gray-500 hover:text-[#003366] transition-colors">
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Institutional Logos inside the card */}
                    <div className="flex justify-center items-center gap-4 mt-8 pt-6">
                        <img src="/img/logo2.png" alt="Bagong Pilipinas" className="h-10 w-auto object-contain" />
                        <img src="/img/HROD LOGO1.png" alt="HROD" className="h-10 w-auto object-contain" />
                        <img src="/img/logo3.png" alt="DepEd Seal" className="h-10 w-auto object-contain" />
                    </div>
                </div>
            </div>
        </div>
    );
}
