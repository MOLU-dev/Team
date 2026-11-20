'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  Info,
  Lock,
  ArrowUpCircle,
} from 'lucide-react';

import { api } from '@/lib/api';
import { verificationApi, VerificationStatus, Tier as ApiTier } from '@/lib/api/verification';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';

interface DisplayTier {
  level: number;
  name: string;
  method: string;
  status: 'active' | 'available' | 'locked';
  benefits: string[];
  icon: React.ReactNode;
}

export default function VerificationSettings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<number | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [verifying, setVerifying] = useState(false);
  const [apiTiers, setApiTiers] = useState<ApiTier[]>([]);
  const [maskedPhone, setMaskedPhone] = useState('');

  // User cannot have Tier 1 or above without a verified phone number
  const isPhoneVerified = status?.phone_verified ?? user?.phone_verified ?? false;
  const currentTier = !isPhoneVerified ? 0 : (user?.tier || status?.tier || 0);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await verificationApi.getStatus();
      if (res.success) {
        setStatus(res.status);
        if (res.tiers) setApiTiers(res.tiers);
      }
    } catch (err) {
      console.error('Failed to fetch verification status', err);
    }
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    setVerifying(true);
    try {
      const res = await verificationApi.requestPhoneOTP(phoneNumber);
      if (res.success) {
        toast.success(res.message);
        if (res.masked_phone) setMaskedPhone(res.masked_phone);
        if (res.otp_code) {
          console.log('DEV MODE OTP:', res.otp_code);
          toast('Dev Mode OTP', {
            description: `OTP is ${res.otp_code}`,
            duration: 10000,
          });
        }
        setStep('otp');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!otpCode) {
      toast.error('Please enter the OTP code');
      return;
    }
    setVerifying(true);
    try {
      const res = await verificationApi.verifyPhone(phoneNumber, otpCode);
      if (res.success) {
        toast.success('Phone verified successfully!');
        setIsPhoneModalOpen(false);
        await refreshUser();
        await fetchStatus();
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (level: number) => {
    if (level === 1) {
      setIsPhoneModalOpen(true);
      return;
    }
    window.location.href = `/kyc?level=${level}`;
  };

  const tiers: DisplayTier[] = [
    {
      level: 1,
      name: 'Basic Access',
      method: 'Email and Phone verification',
      status: isPhoneVerified && currentTier >= 1 ? 'active' : 'available',
      icon: <CheckCircle2 className="w-6 h-6 text-cyan" />,
      benefits: ['Receive & Send Crypto', 'Daily Send Limit: $1,000', 'No Crypto Swaps']
    },
    {
      level: 2,
      name: 'Advanced Trading',
      method: 'Government ID & Facial Recognition',
      status: !isPhoneVerified ? 'locked' : (currentTier >= 2 ? 'active' : 'available'),
      icon: <Camera className="w-6 h-6 text-purple-400" />,
      benefits: ['Fiat Deposit & Withdrawal', 'Crypto Swaps & P2P', 'Daily Limit: $50,000']
    },
    {
      level: 3,
      name: 'Full Platform Access',
      method: 'Home Address (Utility Bill or Bank Statement)',
      status: 'locked',
      icon: <FileText className="w-6 h-6 text-yellow-400" />,
      benefits: ['Virtual & Physical Cards', 'Daily Send Limit: $1M+', 'Priority Support (Coming Soon)']
    }
  ];

  const verificationSteps = [
    { key: 'email', label: 'Email Address', status: status?.email_status || 'not_started', level: 0 },
    { key: 'phone', label: 'Phone Number', status: isPhoneVerified ? 'approved' : (status?.phone_status || 'not_started'), level: 1 },
    { key: 'kyc', label: 'ID & Biometrics', status: status?.kyc_status || 'not_started', level: 2 },
    { key: 'address', label: 'Proof of Address', status: 'not_started', level: 3 },
  ];

  const pendingSteps = verificationSteps.filter(s => s.status !== 'approved');
  const allApproved = pendingSteps.length === 0;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className={`flex justify-between items-center p-6 rounded-3xl transition-all duration-500 ${
        allApproved 
          ? 'bg-success/10 border border-success/20 shadow-lg shadow-success/5' 
          : 'bg-cyan/10 border border-cyan/20'
      }`}>
        <div className="flex items-center gap-4">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
             allApproved ? 'bg-success/20 text-success' : 'bg-cyan/20 text-cyan'
           }`}>
              <ShieldCheck size={32} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-text-primary">
                {allApproved ? 'Account Fully Verified' : 'Verification Status'}
              </h2>
              <p className="text-sm text-text-secondary">
                {allApproved 
                  ? 'All checks passed. You have full platform access.' 
                  : `Current Level: `}<span className={allApproved ? 'text-success font-bold' : 'text-cyan font-bold'}>
                    {allApproved ? 'Tier 3 (Maximum)' : `Tier ${currentTier}`}
                  </span>
              </p>
           </div>
        </div>
        {allApproved && (
          <div className="hidden sm:flex px-4 py-2 bg-success/20 border border-success/30 rounded-full items-center gap-2">
             <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
             <span className="text-xs font-bold text-success uppercase tracking-widest">Premium Access</span>
          </div>
        )}
      </div>

      {!allApproved && (
        <div className="main-card p-6 border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <ArrowUpCircle size={16} className="text-cyan" /> Pending Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingSteps.map(step => (
              <div key={step.key} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-cyan/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    step.status === 'rejected' ? 'bg-error/20 text-error' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {step.key === 'email' ? <CheckCircle2 size={16} /> : 
                     step.key === 'phone' ? <ShieldCheck size={16} /> : 
                     step.key === 'kyc' ? <Camera size={16} /> : <FileText size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">{step.label}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-tight">
                      {step.status === 'rejected' ? 'Action Required' : 'Not Started'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (step.key === 'phone') setIsPhoneModalOpen(true);
                    else if (step.key === 'kyc') window.location.href = '/kyc?level=2';
                    else window.location.href = step.key === 'email' ? '/settings' : '/kyc';
                  }}
                  className="text-cyan hover:text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {tiers.map((tier: DisplayTier) => (
          <div 
            key={tier.level}
            className={`main-card p-6 border transition-all ${
              tier.status === 'active' 
                ? 'border-cyan/30 !bg-cyan/5' 
                : tier.status === 'available'
                  ? 'border-white/10 hover:border-white/20'
                  : 'opacity-50 grayscale'
            }`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  tier.status === 'active' ? 'bg-cyan text-midnight shadow-lg shadow-cyan/20' : 'bg-white/5 text-text-secondary border border-white/10'
                }`}>
                  {tier.status === 'active' ? <CheckCircle2 size={24} /> : tier.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-text-primary text-lg">{tier.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-text-secondary font-bold uppercase tracking-widest">Lv.{tier.level}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-4 italic">{tier.method}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    {tier.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-text-primary">
                        <CheckCircle2 size={12} className={tier.status === 'active' ? 'text-cyan' : 'text-text-secondary'} />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                {tier.status === 'active' ? (
                  <div className="text-cyan font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan/10">
                    <CheckCircle2 size={14} /> Completed
                  </div>
                ) : tier.level === 3 ? (
                  <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Lock size={14} /> Coming Soon
                  </div>
                ) : tier.status === 'available' ? (
                  <button 
                    onClick={() => handleVerify(tier.level)}
                    disabled={loading !== null}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan to-indigo-400 text-midnight font-bold rounded-xl hover:scale-105 transition-all shadow-xl shadow-cyan/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading === tier.level ? 'Processing...' : 'Verify Now'} <ChevronRight size={18} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-widest">
                    <Lock size={14} /> {tier.level === 2 && !isPhoneVerified ? 'Verify Phone First' : `Complete Tier ${tier.level - 1} first`}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-4">
        <Info className="text-text-secondary flex-shrink-0" size={20} />
        <p className="text-[10px] text-text-secondary leading-relaxed uppercase font-bold tracking-tight">
          Privacy Note: All verification data is encrypted and handled according to our secure KYC policies. 
          Third-party data is never shared without your explicit consent.
        </p>
      </div>



      {currentTier < 3 && (
        <div className="text-center pt-4">
           <button className="text-text-secondary hover:text-cyan transition-colors text-sm flex items-center gap-2 mx-auto font-medium">
              Learn more about limits and tiers <ArrowUpCircle size={16} />
           </button>
        </div>
      )}

      <Modal 
        isOpen={isPhoneModalOpen} 
        onClose={() => setIsPhoneModalOpen(false)}
        title="Phone Verification"
      >
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center text-cyan mb-2">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">
              {step === 'phone' ? 'Verify your phone' : 'Enter verification code'}
            </h3>
            <p className="text-sm text-text-secondary">
              {step === 'phone' 
                ? 'We will send a 6-digit code to your phone number for security verification.' 
                : `We've sent a 6-digit code to `}
              {step === 'otp' && (
                <span className="text-cyan font-semibold">{maskedPhone || phoneNumber}</span>
              )}
              {step === 'otp' && '. Please enter it below.'}
            </p>
          </div>

          {step === 'phone' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Phone Number</label>
                <input 
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="+12345678900"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-cyan transition-colors outline-none font-mono"
                />
              </div>
              <button 
                onClick={handleRequestOTP}
                disabled={verifying}
                className="w-full py-4 bg-cyan text-midnight font-bold rounded-xl hover:shadow-lg hover:shadow-cyan/20 transition-all disabled:opacity-50"
              >
                {verifying ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                <input 
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] bg-white/5 border border-white/10 rounded-xl py-4 text-cyan focus:border-cyan outline-none font-mono"
                />
              </div>
              <div className="space-y-3">
                <button 
                  onClick={handleVerifyPhone}
                  disabled={verifying}
                  className="w-full py-4 bg-cyan text-midnight font-bold rounded-xl hover:shadow-lg hover:shadow-cyan/20 transition-all disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify Phone'}
                </button>
                <button 
                  onClick={() => setStep('phone')}
                  disabled={verifying}
                  className="w-full py-2 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                >
                  Change phone number
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
