import React, { useState } from 'react';
import { Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
    onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate a small delay for better UX
        setTimeout(() => {
            if (password === 'dash') {
                onLogin();
                localStorage.setItem('isAuthenticated', 'true');
            } else {
                setError(true);
                setIsLoading(false);
            }
        }, 600);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo / Brand Header */}
                <div className="text-center mb-8 animate-fade-in-down">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#28BA9A] to-[#1a8a72] shadow-xl shadow-green-500/20 mb-4 transform hover:rotate-6 transition-transform">
                        <Lock className="text-white" size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Esvitabi <span className="text-[#28BA9A]">Dash</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Enter password to access analytics</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel p-8 rounded-[2.5rem] bg-white/70 dark:bg-slate-900/70 border-white/50 dark:border-white/5 shadow-2xl animate-fade-in-up">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                Secure Access
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${error ? 'text-red-500' : 'text-slate-400 group-focus-within:text-[#28BA9A]'}`}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(false);
                                    }}
                                    className={`w-full bg-slate-100/50 dark:bg-slate-800/50 border-2 ${error ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : 'border-transparent focus:border-[#28BA9A] focus:bg-white dark:focus:bg-slate-800'} rounded-2xl py-4 pl-12 pr-12 transition-all outline-none text-slate-800 dark:text-white font-medium`}
                                    placeholder="Enter your key..."
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-shake mt-2 ml-1">
                                    <AlertCircle size={14} />
                                    Access denied. Check your key.
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className={`w-full group relative overflow-hidden bg-gradient-to-r from-[#28BA9A] to-[#1a8a72] text-white font-black py-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2`}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        UNLOCK DASHBOARD
                                        <LogIn size={18} className="transform group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                            {/* Shiny effect */}
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine"></div>
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <p className="text-center mt-8 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
                    &copy; 2026 Esvita Clinic • Intelligence System
                </p>
            </div>

            <style>{`
                @keyframes shine {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                .animate-shine {
                    animation: shine 1.5s infinite;
                }
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.8s ease-out;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out 0.2s both;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
};
