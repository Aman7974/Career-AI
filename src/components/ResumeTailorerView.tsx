import React, { useState } from 'react';
import { ResumeData, JobMatch } from '../types';
import { calculateJobMatchesForResume } from '../utils/jobMatching';

interface ResumeTailorerViewProps {
  resume: ResumeData;
  initialJob?: JobMatch;
  onApplyTailored: (updated: Partial<ResumeData>) => void;
  onNavigateToAnalyzer: () => void;
}

export const ResumeTailorerView: React.FC<ResumeTailorerViewProps> = ({
  resume,
  initialJob,
  onApplyTailored,
  onNavigateToAnalyzer,
}) => {
  const dynamicJobs = calculateJobMatchesForResume(resume);

  const [jobDescription, setJobDescription] = useState(
    initialJob
      ? `Role at ${initialJob.company} (${initialJob.title}): Seeking an executive to lead multi-region cloud architecture, distributed systems, and team scaling. Required keywords: ${initialJob.missingKeywords.join(
          ', '
        )}, ${initialJob.matchedKeywords.slice(0, 3).join(', ')}.`
      : `Software Engineer / Full Stack Developer: Seeking experienced developer to build scalable applications, REST APIs, and responsive frontends. Requirements: TypeScript, React, Node.js, SQL database optimization, and CI/CD pipelines.`
  );

  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorDone, setTailorDone] = useState(false);

  // Extract first bullet or first experience from active candidate
  const firstExp = resume.workExperience[0] || {
    title: 'Executive Leader',
    company: 'Enterprise Organization',
    bullets: [],
  };
  const firstBullet = firstExp.bullets[0]?.text || 'Directed engineering programs across business units.';

  const handleTailor = () => {
    setIsTailoring(true);
    setTimeout(() => {
      setIsTailoring(false);
      setTailorDone(true);
    }, 900);
  };

  const handleSaveToActive = () => {
    const suggestedNewSkills = Array.from(
      new Set([...resume.skills, 'Kubernetes Orchestration', 'Multi-region AWS Architecture', 'FedRAMP Compliance'])
    );

    onApplyTailored({
      overallScore: Math.min(99, resume.overallScore + 5),
      strongVerbsCount: resume.strongVerbsCount + 2,
      skills: suggestedNewSkills,
      metrics: {
        impact: Math.min(99, resume.metrics.impact + 3),
        keywordDensity: 98,
        readability: resume.metrics.readability,
        executiveTone: Math.min(98, resume.metrics.executiveTone + 4),
      },
    });
    onNavigateToAnalyzer();
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-margin-lg py-4 lg:py-space-lg flex flex-col gap-space-lg animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 p-space-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary dark:text-[#818cf8]">auto_fix_high</span>
            <h1 className="text-xl md:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-on-surface dark:text-white">
              AI Resume Tailor & Keyword Injector
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 max-w-xl">
            Customizes <strong>{resume.candidateName}</strong>'s resume vocabulary to match the target employer's specific ATS filters.
          </p>
        </div>

        {initialJob && (
          <div className="flex items-center gap-2 bg-primary-fixed/30 dark:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30">
            <span className="text-xs text-primary dark:text-[#818cf8] font-bold">
              Targeting: {initialJob.company} — {initialJob.title}
            </span>
          </div>
        )}
      </div>

      {/* Dual Pane: Job Description Input vs Tailored Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left: Input Job Description (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-on-surface dark:text-white">
                Target Role Job Description
              </label>
              <div className="flex gap-1.5 text-[11px]">
                {dynamicJobs.slice(0, 3).map((j: JobMatch) => (
                  <button
                    key={j.id}
                    onClick={() =>
                      setJobDescription(
                        `Role at ${j.company}: Looking for ${j.title} with expertise in ${j.matchedKeywords.slice(0, 3).join(', ')} and ${j.missingKeywords.slice(0, 2).join(', ')}.`
                      )
                    }
                    className="text-primary dark:text-[#818cf8] hover:underline cursor-pointer"
                  >
                    Load {j.company}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description here..."
              className="w-full p-3 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant dark:border-white/10 rounded-xl text-xs text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed font-sans"
            />
          </div>

          <button
            onClick={handleTailor}
            disabled={isTailoring}
            className="w-full py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${isTailoring ? 'animate-spin' : ''}`}>
              {isTailoring ? 'sync' : 'auto_awesome'}
            </span>
            <span>{isTailoring ? 'Aligning ATS Keywords...' : 'Generate Tailored Resume Diffs'}</span>
          </button>
        </div>

        {/* Right: Tailored Diffs & Keyword Injections (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 dark:border-white/10 mb-4">
              <h2 className="text-sm font-bold text-on-surface dark:text-white font-['Plus_Jakarta_Sans']">
                Proposed Resume Modifications for {resume.candidateName.split(' ')[0]}
              </h2>
              <span className="text-[11px] bg-secondary-fixed dark:bg-emerald-950 text-on-secondary-container dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                {tailorDone ? 'Estimated Match: 98%' : 'Ready to Parse'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Diff 1 */}
              <div className="p-3.5 rounded-xl bg-surface-bright dark:bg-[#131b2e] border border-outline-variant/50 dark:border-white/10 space-y-2">
                <div className="text-xs font-bold text-primary dark:text-[#818cf8]">
                  Targeted Bullet: {firstExp.title} ({firstExp.company})
                </div>
                <div className="text-xs text-outline dark:text-slate-400 line-through">
                  "{firstBullet}"
                </div>
                <div className="text-xs text-on-surface dark:text-white font-medium p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg">
                  <span className="font-bold text-secondary dark:text-emerald-400">Tailored:</span> "Orchestrated multi-region cloud architecture, accelerating feature velocity by 38% and unlocking $180k/yr annual compute savings."
                </div>
              </div>

              {/* Diff 2 */}
              <div className="p-3.5 rounded-xl bg-surface-bright dark:bg-[#131b2e] border border-outline-variant/50 dark:border-white/10 space-y-2">
                <div className="text-xs font-bold text-primary dark:text-[#818cf8]">
                  Skills Taxonomy Alignment (+3 Missing ATS Filters)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-secondary-fixed/50 dark:bg-emerald-950 text-on-secondary-container dark:text-emerald-300 text-xs font-semibold rounded-lg border border-secondary/30">
                    + Kubernetes Orchestration
                  </span>
                  <span className="px-2.5 py-1 bg-secondary-fixed/50 dark:bg-emerald-950 text-on-secondary-container dark:text-emerald-300 text-xs font-semibold rounded-lg border border-secondary/30">
                    + Multi-region AWS Architecture
                  </span>
                  <span className="px-2.5 py-1 bg-secondary-fixed/50 dark:bg-emerald-950 text-on-secondary-container dark:text-emerald-300 text-xs font-semibold rounded-lg border border-secondary/30">
                    + FedRAMP Compliance
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/40 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant dark:text-slate-400">
              Applying changes updates your primary scorecard immediately.
            </span>
            <button
              onClick={handleSaveToActive}
              className="px-4 py-2 bg-secondary hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Apply to Resume & Re-Score</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
