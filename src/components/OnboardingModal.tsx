import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../locales';
import {
  Split,
  QrCode,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  onFinish: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  language,
  onFinish,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const t = translations[language];

  const screens = [
    {
      title: t.onboarding.step1Title,
      desc: t.onboarding.step1Desc,
      icon: Split,
      accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
      title: t.onboarding.step2Title,
      desc: t.onboarding.step2Desc,
      icon: QrCode,
      accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      title: t.onboarding.step3Title,
      desc: t.onboarding.step3Desc,
      icon: CheckCircle2,
      accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      title: t.onboarding.step4Title,
      desc: t.onboarding.step4Desc,
      icon: FileSpreadsheet,
      accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
    },
  ];

  const current = screens[step];
  const IconComponent = current.icon;

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden flex flex-col items-center text-center">
        {/* Skip button */}
        <button
          type="button"
          onClick={onFinish}
          className="absolute top-5 right-5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg"
        >
          {t.actions.skip}
        </button>

        {/* Step Indicator Dots */}
        <div className="flex items-center gap-1.5 mb-8">
          {screens.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-blue-600'
                  : 'w-1.5 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Big Step Icon */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all ${current.accent}`}
        >
          <IconComponent className="w-10 h-10" />
        </div>

        {/* Step Title & Description */}
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
          {current.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-8">
          {current.desc}
        </p>

        {/* Controls */}
        <div className="w-full flex items-center justify-between gap-3 mt-auto">
          {step > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="h-11 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.actions.back}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 ml-auto"
          >
            <span>{step === screens.length - 1 ? t.actions.finish : t.actions.next}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
