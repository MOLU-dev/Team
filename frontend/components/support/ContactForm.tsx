'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send an email or ticket
    console.log({ subject, message, email });
    alert('Support ticket submitted successfully!');
    setMessage('');
    setEmail('');
    setSubject('General Inquiry');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-deep-navy/80 to-slate/60 border border-cyan/20 rounded-2xl p-6 md:p-8 animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-xl font-bold text-text-primary mb-6">Contact Support</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary focus:outline-none focus:border-cyan transition-all"
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Account Issue">Account Issue</option>
            <option value="Feature Request">Feature Request</option>
          </select>
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Email Address (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For us to follow up..."
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan transition-all"
          />
        </div>
        
        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue..."
            rows={4}
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan transition-all resize-none"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 transition-all"
        >
          Send Message
        </button>
      </div>
    </form>
  );
}
