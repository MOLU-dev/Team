'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Background from '@/components/shared/Background';
import AppHeader from '@/components/shared/AppHeader';
import PageHeader from '@/components/shared/PageHeader';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import dynamic from 'next/dynamic';

const LoadingFallback = () => <div className="animate-pulse bg-white/5 border border-cyan/10 rounded-2xl h-96 w-full" />;

const ProfileSettings = dynamic(() => import('@/components/settings/ProfileSettings'), { loading: LoadingFallback });
const SecuritySettings = dynamic(() => import('@/components/settings/SecuritySettings'), { loading: LoadingFallback });
const NetworkSettings = dynamic(() => import('@/components/settings/NetworkSettings'), { loading: LoadingFallback });
const NotificationSettings = dynamic(() => import('@/components/settings/NotificationSettings'), { loading: LoadingFallback });
const AppearanceSettings = dynamic(() => import('@/components/settings/AppearanceSettings'), { loading: LoadingFallback });
const LanguageSettings = dynamic(() => import('@/components/settings/LanguageSettings'), { loading: LoadingFallback });
const SessionsSettings = dynamic(() => import('@/components/settings/SessionsSettings'), { loading: LoadingFallback });
const ReferralSettings = dynamic(() => import('@/components/settings/ReferralSettings'), { loading: LoadingFallback });
const VerificationSettings = dynamic(() => import('@/components/settings/VerificationSettings'), { loading: LoadingFallback });

const settingsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  profile: ProfileSettings,
  security: SecuritySettings,
  networks: NetworkSettings,
  notifications: NotificationSettings,
  appearance: AppearanceSettings,
  language: LanguageSettings,
  sessions: SessionsSettings,
  referral: ReferralSettings,
  verification: VerificationSettings,
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || searchParams.get('section');
  const initialSection = rawTab && SECTION_COMPONENTS[rawTab] ? rawTab : 'profile';

  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (rawTab && SECTION_COMPONENTS[rawTab]) {
      setActiveSection(rawTab);
    }
  }, [rawTab]);

  const ActiveComponent = SECTION_COMPONENTS[activeSection] || ProfileSettings;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-slide-up">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      {/* Content */}
      <div className="lg:col-span-3 space-y-6">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      
      <div className="relative z-10 min-h-screen">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1400px] pt-32">
          <PageHeader
            title="Settings"
            description="Manage your account preferences and security settings"
            icon={settingsIcon}
          />
          
          <Suspense fallback={<LoadingFallback />}>
            <SettingsContent />
          </Suspense>
        </main>
      </div>
    </ProtectedRoute>
  );
}
