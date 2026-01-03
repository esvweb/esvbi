import React, { useState } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    LogOut,
    Settings,
    Moon,
    Sun,
    Check
} from 'lucide-react';

type UserType = 'TEAM_LEADER' | 'MANAGER';

interface HeaderProps {
    userType: UserType;
    onUserTypeChange: (type: UserType) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
    userType,
    onUserTypeChange,
    theme,
    toggleTheme,
    children
}) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Mock Notifications
    const notifications = [
        { id: 1, text: "New lead assigned to EMEA Team", time: "2 min ago", unread: true },
        { id: 2, text: "Daily target achieved by John Doe", time: "1 hour ago", unread: false },
        { id: 3, text: "System maintenance scheduled", time: "5 hours ago", unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="flex flex-col gap-6 mb-8">
            {/* Top Row: Logo/Title and Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Logo & Title */}
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9d8WRwR3s4KsSaOypzpJEpX2wvmQKaCSsPw&s"
                        alt="Esvita Logo"
                        className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/30 object-cover"
                    />
                    Esvita <span className="text-slate-400 dark:text-slate-600 font-light">Business Intelligence</span>
                </h1>

                {/* Right: Actions (Theme, Bell, Profile) */}
                <div className="flex items-center gap-3 self-end md:self-auto">

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="bg-white dark:bg-slate-900 p-2.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#28BA9A] dark:hover:text-[#28BA9A] transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative bg-white dark:bg-slate-900 p-2.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {isNotifOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${n.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-1">{n.text}</p>
                                                <p className="text-xs text-slate-400">{n.time}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800">
                                        <button className="text-xs font-bold text-blue-500 hover:text-blue-600">Mark all as read</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-3 bg-white dark:bg-slate-900 pl-2 pr-4 py-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {userType === 'MANAGER' ? 'M' : 'TL'}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Alper K.</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{userType.replace('_', ' ')}</p>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {/* User Menu Dropdown */}
                        {isUserMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Role</div>
                                        <button
                                            onClick={() => { onUserTypeChange('TEAM_LEADER'); setIsUserMenuOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-sm font-medium transition-colors ${userType === 'TEAM_LEADER' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            Team Leader View
                                            {userType === 'TEAM_LEADER' && <Check size={14} />}
                                        </button>
                                        <button
                                            onClick={() => { onUserTypeChange('MANAGER'); setIsUserMenuOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-sm font-medium transition-colors ${userType === 'MANAGER' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            Manager View
                                            {userType === 'MANAGER' && <Check size={14} />}
                                        </button>
                                    </div>
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                                    <div className="p-2">
                                        <button className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <Settings size={16} /> Settings
                                        </button>
                                        <button className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Navigation */}
            <div className="w-full overflow-x-auto">
                {children}
            </div>
        </header>
    );
};

export default Header;
