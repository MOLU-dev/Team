'use client';

import { useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    category: 'transactions',
    question: 'How long do transactions take?',
    answer: 'Transaction times depend on the network congestion and gas fee paid. Typically, Ethereum transactions take 15 seconds to 5 minutes, while BSC and Polygon are usually faster (under 1 minute).',
  },
  {
    id: '2',
    category: 'account',
    question: 'How do I recover my account?',
    answer: 'You can restore your wallet using your 12-word recovery phrase. If you lose your recovery phrase, we cannot help you recover your funds as we do not store your private keys.',
  },
  {
    id: '3',
    category: 'security',
    question: 'Is BitSilo secure?',
    answer: 'Yes, BitSilo uses industry-standard encryption and non-custodial architecture. Your private keys never leave your device.',
  },
  {
    id: '4',
    category: 'transactions',
    question: 'What happens if I send crypto to the wrong address?',
    answer: 'Unfortunately, blockchain transactions are irreversible. Once confirmed, funds sent to an incorrect address cannot be recovered. Always double-check addresses before sending.',
  },
  {
    id: '5',
    category: 'fees',
    question: 'Why are gas fees so high?',
    answer: 'Gas fees are determined by network demand. During times of high congestion, fees increase. You can choose slower transaction speeds to pay lower fees.',
  },
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
      {faqs.map((faq) => (
        <div key={faq.id} className="border border-cyan/20 rounded-xl overflow-hidden bg-midnight/60 hover:bg-midnight/80 transition-colors">
          <button
            onClick={() => toggleItem(faq.id)}
            className="w-full flex justify-between items-center p-4 text-left font-semibold text-text-primary focus:outline-none"
          >
            <span>{faq.question}</span>
            <svg
              className={`w-5 h-5 text-cyan transition-transform ${openItems[faq.id] ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openItems[faq.id] ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-4 pt-0 text-text-secondary text-sm border-t border-cyan/10 mt-2">
              {faq.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
