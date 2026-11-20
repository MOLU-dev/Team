'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Camera, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { verificationApi, VerificationStatus } from '@/lib/api/verification';
import { useAuth } from '@/components/providers/AuthProvider';

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await verificationApi.getStatus();
        if (res.success) {
          setStatus(res.status);
        }
      } catch (err) {
        console.error('Failed to fetch verification status', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 mb-6">
        <div className="h-4 w-32 bg-surface-muted rounded-md" />
        <div className="h-24 bg-card-bg border border-border rounded-2xl shadow-sm" />
      </div>
    );
  }

  const steps = [
    { 
      key: 'email', 
      label: 'Email Verification', 
      tier: 1,
      status: status?.email_status || 'not_started', 
      href: '/settings?tab=verification',
      icon: <CheckCircle2 size={16} />
    },
    { 
      key: 'phone', 
      label: 'Phone Verification', 
      tier: 2,
      status: status?.phone_status || 'not_started', 
      href: '/settings?tab=verification',
      icon: <ShieldCheck size={16} />
    },
    { 
      key: 'kyc', 
      label: 'Identity & Biometrics', 
      tier: 2,
      status: status?.kyc_status || 'not_started', 
      href: '/kyc',
      icon: <Camera size={16} />
    },
    { 
      key: 'address', 
      label: 'Proof of Address', 
      tier: 3,
      status: status?.address_status || 'not_started', 
      href: '/kyc?level=3',
      icon: <FileText size={16} />
    },
  ].sort((a, b) => a.tier - b.tier);

  const nextStepIndex = steps.findIndex(s => s.status !== 'approved');
  const nextStep = steps[nextStepIndex];
  const approvedCount = steps.filter(s => s.status === 'approved').length;

  if (!nextStep) return null;

  return (
    <div className="mb-8 animate-fade-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
          <UserCheck size={16} className="text-cyan" /> 
          {nextStep.status === 'pending' ? 'Verification Status' : 
           nextStep.status === 'rejected' ? 'Verification Failed' : 
           `Tier ${nextStep.tier} Verification`}
        </h2>
        <span className="text-[10px] font-black bg-cyan/10 text-cyan px-2 py-0.5 rounded-full uppercase tracking-widest">
          Step {nextStepIndex + 1} of {steps.length}
        </span>
      </div>

      <Link
        href={nextStep.href}
        className="flex items-center justify-between p-5 bg-card-bg border border-border rounded-2xl hover:border-cyan/30 hover:bg-surface-hover transition-all group shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            nextStep.status === 'rejected' 
              ? 'bg-danger/20 text-danger border border-danger/30 shadow-[0_0_15px_rgba(255,51,102,0.1)]' 
              : nextStep.status === 'pending'
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]'
                : 'bg-surface-muted text-text-secondary border border-surface-border'
          }`}>
            {nextStep.status === 'rejected' ? <XCircle size={22} className="animate-pulse" /> : 
             nextStep.status === 'pending' ? <AlertCircle size={22} className="animate-pulse" /> : 
             nextStep.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-text-primary group-hover:text-cyan transition-colors">{nextStep.label}</p>
              <span className="text-[9px] font-black bg-surface-muted text-text-secondary px-1.5 py-0.5 rounded border border-surface-border uppercase">Tier {nextStep.tier}</span>
            </div>
            <p className={`text-xs uppercase font-black tracking-widest mt-0.5 ${
              nextStep.status === 'rejected' ? 'text-danger' :
              nextStep.status === 'pending' ? 'text-yellow-400' :
              'text-text-secondary opacity-60'
            }`}>
              {nextStep.status === 'rejected' ? 'Action Required: Verification Failed' : 
               nextStep.status === 'pending' ? 'Processing: Under Review' : 
               'Pending: Setup Required'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-text-secondary group-hover:text-cyan transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            {nextStep.status === 'rejected' ? 'Retry' : 'Continue'}
          </span>
          <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </div>
  );
}
