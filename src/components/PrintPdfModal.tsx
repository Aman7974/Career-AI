import React, { useState } from 'react';
import { ResumeData } from '../types';

interface PrintPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
  onTriggerPrint: () => void;
}

export const PrintPdfModal: React.FC<PrintPdfModalProps> = ({
  isOpen,
  onClose,
  resume,
  onTriggerPrint,
}) => {
  const [targetEngine, setTargetEngine] = useState<'universal' | 'workday' | 'greenhouse'>('universal');
  const [includePatents, setIncludePatents] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest dark:bg-[#1a2238] border border-outline-variant dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/40 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface dark:text-white font-['Plus_Jakarta_Sans']">
                High-Fidelity PDF Export Preview
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Native print-to-PDF formatting optimized for automated Fortune 500 ATS ingestion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-outline-variant hover:text-on-surface dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body: Split Controls & Live Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface-container-low dark:bg-[#131b2e]">
          {/* Left: Configuration & ATS Optimization Checks (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 space-y-3">
              <span className="text-xs font-bold text-on-surface dark:text-white block uppercase tracking-wider">
                ATS PDF Optimizations
              </span>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="accent-primary rounded text-primary focus:ring-0"
                  />
                  <span className="text-on-surface dark:text-slate-200">Zero-column XML Schema (No tables)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="accent-primary rounded text-primary focus:ring-0"
                  />
                  <span className="text-on-surface dark:text-slate-200">Remove Diagnostic Flags/Highlight Spans</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePatents}
                    onChange={(e) => setIncludePatents(e.target.checked)}
                    className="accent-primary rounded text-primary focus:ring-0"
                  />
                  <span className="text-on-surface dark:text-slate-200">Include Patents & IP Section</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 space-y-2">
              <span className="text-xs font-bold text-on-surface dark:text-white block">
                Target Parser Alignment
              </span>
              <div className="space-y-1.5">
                {[
                  { id: 'universal', label: 'Universal Fortune 500 ATS' },
                  { id: 'workday', label: 'Workday Enterprise Grid' },
                  { id: 'greenhouse', label: 'Greenhouse & Lever Precision' },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setTargetEngine(eng.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      targetEngine === eng.id
                        ? 'border-primary bg-primary-fixed/30 dark:bg-primary/20 text-primary dark:text-[#818cf8] font-bold'
                        : 'border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-slate-300 hover:bg-surface-container'
                    }`}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
              <div className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Print-to-PDF Ready</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When the browser print dialog opens, set Destination to <strong>"Save as PDF"</strong> with Paper size <strong>Letter</strong> and Margins set to <strong>Default</strong>.
              </p>
            </div>
          </div>

          {/* Right: Live Visual Document Preview Sheet (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-[580px] bg-white text-slate-900 shadow-2xl rounded-sm p-8 border border-slate-300 text-[11px] leading-relaxed scale-95 sm:scale-100 transform origin-top">
              {/* Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900 mb-3">
                <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-950 font-['Plus_Jakarta_Sans']">
                  {resume.candidateName}
                </h3>
                <div className="text-[10px] text-slate-600 font-medium">
                  {resume.contactInfo}
                </div>
                <div className="text-[10px] font-bold text-slate-800 tracking-wider uppercase mt-0.5">
                  {resume.headline}
                </div>
              </div>

              {/* Profile */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                  Executive Profile
                </div>
                <p className="text-[9.5px] text-slate-700 text-justify">
                  {resume.executiveProfile}
                </p>
              </div>

              {/* Skills */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                  Technical Core Competencies
                </div>
                <div className="text-[9.5px] text-slate-700">
                  {resume.skills.join(' • ')} • Kubernetes • Multi-region AWS • SOC2
                </div>
              </div>

              {/* Experience */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Professional Experience
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between font-bold text-[10px] text-slate-900">
                      <span>Vice President of Engineering — NexaScale Data</span>
                      <span>2021 — PRESENT</span>
                    </div>
                    <p className="text-[9.5px] text-slate-700">
                      • Orchestrated organizational restructuring of 4 engineering divisions, accelerating feature velocity by 34%.
                    </p>
                    <p className="text-[9.5px] text-slate-700">
                      • Architected multi-tenant telemetry handling 1.8B daily events, saving $1.2M annually in AWS compute.
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-[10px] text-slate-900">
                      <span>Staff Engineer & Tech Lead — CloudGrid Infrastructure</span>
                      <span>2018 — 2021</span>
                    </div>
                    <p className="text-[9.5px] text-slate-700">
                      • Engineered zero-downtime CI/CD reducing deployment time by 42% and saving $180k/yr.
                    </p>
                    <p className="text-[9.5px] text-slate-700">
                      • Spearheaded adoption of zero-trust architecture, achieving SOC2 Type II compliance 4 months ahead of schedule.
                    </p>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                  Education & Credentials
                </div>
                <div className="text-[9.5px] text-slate-700 flex justify-between">
                  <span><strong>Stanford University</strong> — M.S. in Computer Science</span>
                  <span>Stanford, CA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant/40 dark:border-white/10 flex items-center justify-between bg-surface-container-lowest dark:bg-[#1a2238]">
          <span className="text-xs text-on-surface-variant dark:text-slate-400">
            Engine Parse Hash: <strong className="font-mono">{resume.parseHash}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-on-surface-variant dark:text-slate-300 hover:text-on-surface dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onTriggerPrint();
              }}
              className="px-5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Open Print Dialog (Save as PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
