'use client';

import { APP_VERSION } from '@/lib/version';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section: string;
}

const navSections = [
  {
    title: 'General',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        section: 'profile',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        ),
      },
      {
        id: 'security',
        label: 'Security',
        section: 'security',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        ),
      },

      {
        id: 'verification',
        label: 'Verification',
        section: 'verification',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        section: 'notifications',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        ),
      },
      {
        id: 'appearance',
        label: 'Appearance',
        section: 'appearance',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        ),
      },
      {
        id: 'language',
        label: 'Language',
        section: 'language',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20M2 12a10 10 0 1 0 20 0M2 12a10 10 0 1 1 20 0M12 2v20"></path>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Advanced',
    items: [
      {
        id: 'sessions',
        label: 'Sessions',
        section: 'sessions',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        ),
      },

      {
        id: 'referral',
        label: 'Referral',
        section: 'referral',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ),
      },
    ],
  },
];

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}



export default function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const router = useRouter();
  const { logout: authLogout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      authLogout();
    }
  };
  return (
    <nav className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-5 h-fit sticky top-24">
      {navSections.map((section, idx) => (
        <div key={idx} className="mb-6 last:mb-0">
          <div className="text-xs uppercase tracking-widest text-text-secondary mb-3 px-2">
            {section.title}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.section)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeSection === item.section
                    ? 'bg-cyan/10 text-cyan border-l-2 border-cyan'
                    : 'text-text-secondary hover:bg-cyan/5 hover:text-text-primary'
                }`}
              >
                <div className={`w-5 h-5 ${activeSection === item.section ? 'text-cyan' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-2 pt-2 border-t border-cyan/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-danger/10 hover:text-danger transition-all group"
        >
          <div className="w-5 h-5 group-hover:text-danger">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </div>

      {/* Version Info */}
      <div className="mt-8 pt-6 border-t border-cyan/10 text-center">
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-50">
          Platform Version
        </div>
        <div className="text-xs font-mono text-cyan/70 mt-1">
          v{APP_VERSION}
        </div>
      </div>
    </nav>
  );
}
