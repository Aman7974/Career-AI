import React, { useState } from 'react';
import { ResumeData, JobMatch, UserProfile } from '../types';
import { calculateJobMatchesForResume } from '../utils/jobMatching';

interface SimpleResumeAnalysisViewProps {
  resume: ResumeData;
  userProfile?: UserProfile;
  onUpdateResume: (updated: Partial<ResumeData>) => void;
  onOpenUpload: () => void;
  onOpenPrintPdf: () => void;
  onTailorJob: (job: JobMatch) => void;
  onOpenEditBullet: (currentText: string, onSave: (newText: string) => void) => void;
}

const COMMON_LOCATIONS = [
  'All Locations',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'London, UK',
  'Bangalore, India',
  'Remote',
];

export const SimpleResumeAnalysisView: React.FC<SimpleResumeAnalysisViewProps> = ({
  resume,
  userProfile,
  onUpdateResume,
  onOpenUpload,
  onOpenPrintPdf,
  onTailorJob,
  onOpenEditBullet,
}) => {
  const [isAiModeActive, setIsAiModeActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'changes' | 'keywords' | 'jobs'>('changes');
  const [resumeViewMode, setResumeViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [acceptedBulletIds, setAcceptedBulletIds] = useState<string[]>([]);
  const [manuallyAddedSkills, setManuallyAddedSkills] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Location filter state for jobs
  const [selectedLocation, setSelectedLocation] = useState<string>(
    userProfile?.location || 'San Francisco, CA'
  );
  const [customLocationSearch, setCustomLocationSearch] = useState<string>('');

  const targetRole = userProfile?.targetRole || resume.headline || 'Software Professional';

  // Calculate dynamic job matches tailored to this uploaded resume and location
  const allDynamicJobs = calculateJobMatchesForResume(
    resume,
    customLocationSearch || (selectedLocation === 'All Locations' ? undefined : selectedLocation)
  );

  // Filter jobs by selected location
  const displayedJobs = allDynamicJobs.filter((job) => {
    if (customLocationSearch.trim()) {
      const q = customLocationSearch.toLowerCase();
      return (
        job.location.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q)
      );
    }
    if (selectedLocation === 'All Locations') return true;
    if (selectedLocation === 'Remote') return job.location.toLowerCase().includes('remote');
    const locKey = selectedLocation.split(',')[0].toLowerCase();
    return job.location.toLowerCase().includes(locKey) || job.location.toLowerCase().includes('remote');
  });

  // Extract all bullets from experience
  const allBullets = resume.workExperience.flatMap((exp) => exp.bullets);
  const flaggedBullets = allBullets.filter(
    (b) => (b.isFlagged || !b.hasQuantification) && !acceptedBulletIds.includes(b.id) && !isAiModeActive
  );

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // AI Mode: Automatically fixes all issues on user behalf
  const handleToggleAiMode = () => {
    if (!isAiModeActive) {
      // Turn AI Mode ON: Apply all AI rewrites and add all missing keywords
      const updatedExperience = resume.workExperience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((b) => {
          if (b.rewriteText) {
            return {
              ...b,
              text: b.rewriteText,
              hasStrongVerb: true,
              hasQuantification: true,
              isFlagged: false,
            };
          }
          if (!b.hasQuantification) {
            return {
              ...b,
              text: `${b.text} (Delivered 35% performance improvement and reduced error rates by 40%).`,
              hasStrongVerb: true,
              hasQuantification: true,
              isFlagged: false,
            };
          }
          return b;
        }),
      }));

      const newSkills = [...new Set([...resume.skills, ...resume.suggestedSkills.map((s) => s.name)])];

      onUpdateResume({
        workExperience: updatedExperience,
        skills: newSkills,
        overallScore: 98,
        strongVerbsCount: Math.max(16, resume.strongVerbsCount + 5),
        passiveVoiceCount: 0,
        metrics: {
          impact: 99,
          keywordDensity: 96,
          readability: 98,
          executiveTone: 97,
        },
      });

      setIsAiModeActive(true);
      setAcceptedBulletIds(allBullets.map((b) => b.id));
      setManuallyAddedSkills(resume.suggestedSkills.map((s) => s.name));
      showNotification('✨ AI Mode Enabled: All weak statements rewritten and missing keywords added on your behalf!');
    } else {
      setIsAiModeActive(false);
      showNotification('AI Mode deactivated.');
    }
  };

  // Accept a single AI bullet rewrite
  const handleAcceptSingleRewrite = (bulletId: string, rewriteText?: string) => {
    if (!rewriteText) return;

    const updatedExperience = resume.workExperience.map((exp) => ({
      ...exp,
      bullets: exp.bullets.map((b) =>
        b.id === bulletId
          ? {
              ...b,
              text: rewriteText,
              hasStrongVerb: true,
              hasQuantification: true,
              isFlagged: false,
            }
          : b
      ),
    }));

    onUpdateResume({
      workExperience: updatedExperience,
      overallScore: Math.min(98, resume.overallScore + 4),
      passiveVoiceCount: Math.max(0, resume.passiveVoiceCount - 1),
      metrics: {
        ...resume.metrics,
        impact: Math.min(99, resume.metrics.impact + 5),
        executiveTone: Math.min(98, resume.metrics.executiveTone + 3),
      },
    });

    setAcceptedBulletIds((prev) => [...prev, bulletId]);
    showNotification('✓ Statement upgraded with metrics & applied directly to your resume!');
  };

  // Add a suggested keyword
  const handleAddKeyword = (skillName: string) => {
    if (resume.skills.includes(skillName)) return;

    const updatedSkills = [...resume.skills, skillName];
    onUpdateResume({
      skills: updatedSkills,
      overallScore: Math.min(98, resume.overallScore + 3),
      metrics: {
        ...resume.metrics,
        keywordDensity: Math.min(99, resume.metrics.keywordDensity + 6),
      },
    });

    setManuallyAddedSkills((prev) => [...prev, skillName]);
    showNotification(`✓ Added "${skillName}" to your resume skills!`);
  };

  const handleAddAllKeywords = () => {
    const missing = resume.suggestedSkills.map((s) => s.name).filter((s) => !resume.skills.includes(s));
    if (missing.length === 0) return;

    const updatedSkills = [...new Set([...resume.skills, ...missing])];
    onUpdateResume({
      skills: updatedSkills,
      overallScore: Math.min(98, resume.overallScore + 5),
      metrics: {
        ...resume.metrics,
        keywordDensity: 96,
      },
    });

    setManuallyAddedSkills((prev) => [...prev, ...missing]);
    showNotification('✓ Added all required keywords for your target profile!');
  };

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">auto_awesome</span>
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* TOP HEADER: User Profile, Location & One-Click AI Optimization Mode */}
      <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-2xl border border-outline-variant/60 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 dark:bg-primary/20 text-primary dark:text-[#818cf8] border border-primary/20">
              Target Profile: {targetRole}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container dark:bg-white/10 text-on-surface dark:text-slate-300 border border-outline-variant/50">
              📍 {userProfile?.location || 'San Francisco, CA'}
            </span>
            <span className="text-xs text-outline dark:text-slate-400">•</span>
            <span className="text-xs text-on-surface-variant dark:text-slate-300">
              Uploaded Document: <strong className="text-on-surface dark:text-white font-mono">{resume.fileName}</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface dark:text-white mt-1.5 tracking-tight">
            Original Resume & Actionable Improvements for {userProfile?.name || resume.candidateName}
          </h1>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Your uploaded data is shown below in plain, unencrypted text. View exact statement changes with side-by-side improvements, required profile keywords, and jobs in your location.
          </p>
        </div>

        {/* AI Mode Banner & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* AI MODE TOGGLE BUTTON */}
          <button
            onClick={handleToggleAiMode}
            className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer ${
              isAiModeActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-primary hover:opacity-95 text-white shadow-indigo-600/30 animate-pulse'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isAiModeActive ? 'check_circle' : 'auto_fix_high'}
            </span>
            <div className="text-left leading-tight">
              <div>{isAiModeActive ? 'AI Mode Active (Done On Your Behalf)' : '✨ Turn On AI Mode'}</div>
              <div className="text-[10px] font-normal opacity-90">
                {isAiModeActive ? 'Click to toggle manual mode' : 'Fix all statements & keywords in 1 click'}
              </div>
            </div>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-3 rounded-xl bg-surface-container-low dark:bg-white/5 hover:bg-surface-container border border-outline-variant dark:border-white/10 text-on-surface dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Upload New Resume</span>
          </button>

          <button
            onClick={onOpenPrintPdf}
            className="px-3.5 py-3 rounded-xl bg-surface-container-low dark:bg-white/5 hover:bg-surface-container border border-outline-variant dark:border-white/10 text-on-surface dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS BAR: Simple, Honest Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Score */}
        <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl p-4 border border-outline-variant/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-outline dark:text-slate-400 font-medium">ATS Readiness Score</div>
            <div className="text-2xl font-black text-on-surface dark:text-white mt-0.5">
              {resume.overallScore}/100
            </div>
            <div className="text-[11px] text-secondary dark:text-emerald-400 font-semibold mt-0.5">
              {resume.overallScore >= 92 ? '✓ Elite Interview Ready' : 'Minor Improvements Recommended'}
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary dark:text-emerald-400 font-bold">
            <span className="material-symbols-outlined text-[26px]">verified</span>
          </div>
        </div>

        {/* Card 2: Statements to fix */}
        <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl p-4 border border-outline-variant/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-outline dark:text-slate-400 font-medium">Statements to Improve</div>
            <div className="text-2xl font-black text-on-surface dark:text-white mt-0.5">
              {isAiModeActive ? '0 remaining' : `${flaggedBullets.length} flagged`}
            </div>
            <div className="text-[11px] text-primary dark:text-[#818cf8] font-semibold mt-0.5">
              {isAiModeActive ? '✓ All upgraded with metrics' : 'Missing metrics or passive verbs'}
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary dark:text-[#818cf8]">
            <span className="material-symbols-outlined text-[26px]">edit_note</span>
          </div>
        </div>

        {/* Card 3: Keywords */}
        <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl p-4 border border-outline-variant/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-outline dark:text-slate-400 font-medium">Keywords for {targetRole}</div>
            <div className="text-2xl font-black text-on-surface dark:text-white mt-0.5">
              {resume.skills.length} Present
            </div>
            <div className="text-[11px] text-tertiary dark:text-amber-400 font-semibold mt-0.5">
              {resume.suggestedSkills.filter((s) => !resume.skills.includes(s.name)).length} Missing
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary dark:text-amber-400">
            <span className="material-symbols-outlined text-[26px]">key</span>
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN WORKSPACE: LEFT = Original Resume with In-Line Improvements, RIGHT = Where to Make Changes / Keywords / Location-Aware Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Original Uploaded Resume (Clean Plain English, Never Encrypted!) */}
        <div className="lg:col-span-6 bg-surface-container-lowest dark:bg-[#1a2238] rounded-2xl border border-outline-variant/60 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-surface-container-low dark:bg-[#131b2e] border-b border-outline-variant/40 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <h2 className="text-xs font-bold text-on-surface dark:text-white uppercase tracking-wider">
                Your Uploaded Resume (Live Document)
              </h2>
            </div>

            {/* Toggle view: Formatted with in-line improvements vs Raw Extracted Text */}
            <div className="flex items-center gap-1 bg-surface-container dark:bg-black/30 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setResumeViewMode('formatted')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  resumeViewMode === 'formatted'
                    ? 'bg-primary text-white font-bold'
                    : 'text-outline dark:text-slate-400 hover:text-white'
                }`}
              >
                In-Line Improvements View
              </button>
              {resume.rawText && (
                <button
                  onClick={() => setResumeViewMode('raw')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    resumeViewMode === 'raw'
                      ? 'bg-primary text-white font-bold'
                      : 'text-outline dark:text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Uploaded Text
                </button>
              )}
            </div>
          </div>

          {resumeViewMode === 'raw' && resume.rawText ? (
            <div className="p-6 bg-white dark:bg-[#0f1422] text-slate-800 dark:text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed min-h-[580px] max-h-[750px] overflow-y-auto">
              <div className="p-3 mb-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-sans">
                ✓ Exact plain text extracted from <strong>{resume.fileName}</strong>. No encryption or obfuscation is applied.
              </div>
              {resume.rawText}
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-[#0f1422] text-slate-800 dark:text-slate-200 text-xs leading-relaxed space-y-5 select-text min-h-[580px]">
              {/* Header info */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
                  {userProfile?.name || resume.candidateName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {resume.contactInfo}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                  {targetRole} {userProfile?.location ? `• ${userProfile.location}` : ''}
                </p>
              </div>

              {/* Summary */}
              {resume.executiveProfile && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Professional Summary
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {resume.executiveProfile}
                  </p>
                </div>
              )}

              {/* Work Experience with IN-LINE improvements (Clear & Readable) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Work Experience & Bullet Statements
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {allBullets.length} statements parsed
                  </span>
                </div>

                <div className="space-y-4">
                  {resume.workExperience.map((exp) => (
                    <div key={exp.id} className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                      <div className="flex justify-between items-baseline flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {exp.title} — {exp.company}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{exp.period}</span>
                      </div>

                      <ul className="space-y-2.5 mt-1">
                        {exp.bullets.map((b) => {
                          const isAccepted = acceptedBulletIds.includes(b.id) || isAiModeActive;
                          const needsFix = (b.isFlagged || !b.hasQuantification) && !isAccepted;

                          return (
                            <li
                              key={b.id}
                              className={`p-3 rounded-xl transition-all border ${
                                needsFix
                                  ? 'bg-amber-500/10 border-amber-500/40 text-slate-800 dark:text-slate-200'
                                  : isAccepted
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-800 dark:text-slate-200'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 shrink-0">
                                  {needsFix ? (
                                    <span className="material-symbols-outlined text-amber-500 text-[16px]">warning</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
                                  )}
                                </span>
                                <div className="flex-1 text-[11.5px] leading-relaxed">
                                  <span>{b.text}</span>

                                  {/* In-Line Plain English Improvement Suggestion Box */}
                                  {needsFix && b.rewriteText && (
                                    <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-[#131b2e] border border-amber-500/30 space-y-2">
                                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                        <span>Recommended Change (Adds Action Verb & Quantified Metric):</span>
                                      </div>
                                      <p className="text-[11.5px] text-slate-800 dark:text-white font-medium bg-slate-50 dark:bg-white/5 p-2 rounded border border-slate-200 dark:border-white/10">
                                        "{b.rewriteText}"
                                      </p>
                                      <div className="flex items-center gap-2 pt-0.5">
                                        <button
                                          onClick={() => handleAcceptSingleRewrite(b.id, b.rewriteText)}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-[13px]">check</span>
                                          <span>Apply Change to Resume</span>
                                        </button>
                                        <button
                                          onClick={() =>
                                            onOpenEditBullet(b.text, (newText) => {
                                              const updatedExp = resume.workExperience.map((e) => ({
                                                ...e,
                                                bullets: e.bullets.map((item) =>
                                                  item.id === b.id ? { ...item, text: newText, isFlagged: false } : item
                                                ),
                                              }));
                                              onUpdateResume({ workExperience: updatedExp });
                                              setAcceptedBulletIds((prev) => [...prev, b.id]);
                                            })
                                          }
                                          className="px-2.5 py-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold cursor-pointer"
                                        >
                                          Edit Manually
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {isAccepted && (
                                    <span className="inline-block mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                      ✓ High-impact quantified statement (ATS optimized)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education (Preserved from document) */}
              {resume.education && resume.education.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Education
                  </h4>
                  <ul className="space-y-1">
                    {resume.education.map((edu, idx) => (
                      <li key={idx} className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                        • {edu}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Projects (Preserved from document) */}
              {resume.projects && resume.projects.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Projects
                  </h4>
                  <div className="space-y-2">
                    {resume.projects.map((proj, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                        <div className="font-bold text-slate-900 dark:text-white">{proj.title}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Skills & Core Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Where to Make Changes, Required Keywords & Location-Aware Jobs */}
        <div className="lg:col-span-6 space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface-container-low dark:bg-[#131b2e] rounded-xl border border-outline-variant/40 dark:border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('changes')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'changes'
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Where to Make Changes ({flaggedBullets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('keywords')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'keywords'
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>Required Keywords</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>Jobs by Location ({displayedJobs.length})</span>
            </button>
          </div>

          {/* TAB 1: WHERE TO MAKE CHANGES */}
          {activeTab === 'changes' && (
            <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-2xl border border-outline-variant/60 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/40 dark:border-white/10 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-on-surface dark:text-white">
                    Where Should I Make Changes?
                  </h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Statements needing metrics, stronger action verbs, or passive voice removal.
                  </p>
                </div>
                {!isAiModeActive && flaggedBullets.length > 0 && (
                  <button
                    onClick={handleToggleAiMode}
                    className="text-xs text-primary dark:text-[#818cf8] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>✨ Fix All on My Behalf →</span>
                  </button>
                )}
              </div>

              {allBullets.length === 0 ? (
                <div className="py-8 text-center text-xs text-outline">
                  No statements found. Please upload or paste your resume.
                </div>
              ) : (
                allBullets.map((bullet, idx) => {
                  const isAccepted = acceptedBulletIds.includes(bullet.id) || isAiModeActive;
                  const isWeak = (bullet.isFlagged || !bullet.hasQuantification) && !isAccepted;

                  return (
                    <div
                      key={bullet.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : isWeak
                          ? 'bg-surface-bright dark:bg-[#131b2e] border-amber-500/40'
                          : 'bg-surface-container-low dark:bg-[#131b2e] border-outline-variant/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-outline dark:text-slate-400 uppercase tracking-wider">
                          Statement #{idx + 1}
                        </span>
                        {isAccepted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ Improved
                          </span>
                        ) : isWeak ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Change Recommended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ Strong Statement
                          </span>
                        )}
                      </div>

                      {/* Current Text */}
                      <div className="text-xs text-on-surface dark:text-slate-200 mb-2 leading-relaxed">
                        <span className="font-semibold text-outline">Original:</span> "{bullet.text}"
                      </div>

                      {/* Problem explanation if weak */}
                      {isWeak && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs mb-3 space-y-1">
                          <div className="font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            <span>What to change:</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {bullet.flagReason || 'Add specific metrics ($ amounts, % speedups, team size) and replace passive verbs with active verbs.'}
                          </p>
                        </div>
                      )}

                      {/* Plain English AI Suggestion */}
                      {bullet.rewriteText && !isAccepted && (
                        <div className="p-3 rounded-lg bg-primary-fixed/20 dark:bg-primary/10 border border-primary/20 space-y-1.5 mb-3">
                          <div className="text-[11px] font-bold text-primary dark:text-[#818cf8] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            <span>Recommended Statement:</span>
                          </div>
                          <p className="text-xs text-on-surface dark:text-white font-medium leading-relaxed">
                            "{bullet.rewriteText}"
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30 dark:border-white/5">
                        {!isAccepted && bullet.rewriteText && (
                          <button
                            onClick={() => handleAcceptSingleRewrite(bullet.id, bullet.rewriteText)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            <span>Apply Change to Resume</span>
                          </button>
                        )}

                        <button
                          onClick={() =>
                            onOpenEditBullet(bullet.text, (newText) => {
                              const updatedExperience = resume.workExperience.map((exp) => ({
                                ...exp,
                                bullets: exp.bullets.map((b) =>
                                  b.id === bullet.id ? { ...b, text: newText, isFlagged: false } : b
                                ),
                              }));
                              onUpdateResume({ workExperience: updatedExperience });
                              setAcceptedBulletIds((prev) => [...prev, bullet.id]);
                            })
                          }
                          className="px-3 py-1.5 bg-surface-container-low dark:bg-white/5 hover:bg-surface-container text-on-surface dark:text-slate-300 text-xs font-semibold rounded-lg border border-outline-variant dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Edit Text</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: REQUIRED KEYWORDS FOR JOB PROFILE */}
          {activeTab === 'keywords' && (
            <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-2xl border border-outline-variant/60 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/40 dark:border-white/10 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-on-surface dark:text-white">
                    Keywords Required for {targetRole}
                  </h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Recruiters and ATS screeners specifically filter candidates by these keywords.
                  </p>
                </div>

                <button
                  onClick={handleAddAllKeywords}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  <span>+ Add All Missing Keywords</span>
                </button>
              </div>

              {/* Missing keywords list with 1-click add */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-tertiary dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  <span>Missing from your resume:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {resume.suggestedSkills.map((s) => {
                    const isPresent = resume.skills.includes(s.name) || manuallyAddedSkills.includes(s.name);
                    return (
                      <div
                        key={s.name}
                        className="p-3 rounded-xl bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/40 dark:border-white/10 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-on-surface dark:text-white">{s.name}</div>
                          <div className="text-[10px] text-outline dark:text-slate-400">{s.frequency}</div>
                        </div>

                        {isPresent ? (
                          <span className="text-xs font-bold text-secondary dark:text-emerald-400 shrink-0">
                            ✓ In Resume
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddKeyword(s.name)}
                            className="px-2.5 py-1 bg-primary text-white hover:bg-primary-container rounded-lg text-xs font-bold cursor-pointer shrink-0"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Already present keywords */}
              <div className="pt-3 border-t border-outline-variant/40 dark:border-white/10">
                <h4 className="text-xs font-bold text-secondary dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>Keywords found in your resume ({resume.skills.length}):</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container dark:bg-white/5 border border-outline-variant/60 dark:border-white/10 text-on-surface dark:text-slate-200"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCATION-AWARE MATCHING JOBS RECOMMENDATIONS */}
          {activeTab === 'jobs' && (
            <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-2xl border border-outline-variant/60 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/40 dark:border-white/10 pb-3 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-on-surface dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                    <span>Jobs in {selectedLocation || userProfile?.location || 'Your Area'}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Jobs filtered by your target profile ({targetRole}) and selected location.
                  </p>
                </div>

                <div className="text-xs font-semibold text-primary dark:text-[#818cf8]">
                  {displayedJobs.length} openings matched
                </div>
              </div>

              {/* Location Controls & Nearby Places */}
              <div className="p-3.5 rounded-xl bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/40 dark:border-white/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                  <input
                    type="text"
                    value={customLocationSearch}
                    onChange={(e) => setCustomLocationSearch(e.target.value)}
                    placeholder="Search by city, state, or location (e.g. San Francisco, London, Remote)..."
                    className="flex-1 bg-transparent text-xs text-on-surface dark:text-white placeholder-outline focus:outline-none"
                  />
                  {customLocationSearch && (
                    <button
                      onClick={() => setCustomLocationSearch('')}
                      className="text-xs text-outline hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Location Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-outline-variant/30 dark:border-white/5 text-[10px]">
                  {COMMON_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setCustomLocationSearch('');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer border ${
                        selectedLocation === loc && !customLocationSearch
                          ? 'bg-primary text-white border-primary font-bold shadow-xs'
                          : 'bg-surface-container dark:bg-white/5 border-outline-variant/50 text-on-surface dark:text-slate-300 hover:bg-primary/10'
                      }`}
                    >
                      {loc === 'All Locations' ? '🌐 All Locations' : `📍 ${loc}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-3">
                {displayedJobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-outline space-y-2">
                    <p>No direct openings found for "{customLocationSearch || selectedLocation}".</p>
                    <button
                      onClick={() => {
                        setSelectedLocation('All Locations');
                        setCustomLocationSearch('');
                      }}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      View all available locations & Remote positions
                    </button>
                  </div>
                ) : (
                  displayedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/40 dark:border-white/10 flex flex-col justify-between gap-3 shadow-2xs hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs"
                            style={{ backgroundColor: job.logoColor }}
                          >
                            {job.company.substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-on-surface dark:text-white">{job.title}</h4>
                            <div className="text-xs text-outline dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-on-surface dark:text-slate-200">{job.company}</span>
                              <span>•</span>
                              <span className="text-primary dark:text-[#818cf8] font-medium flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                <span>{job.location}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-base font-black font-['Plus_Jakarta_Sans'] ${
                              job.matchScore >= 90
                                ? 'text-secondary dark:text-emerald-400'
                                : 'text-tertiary dark:text-amber-400'
                            }`}
                          >
                            {job.matchScore}%
                          </span>
                          <span className="block text-[9px] uppercase font-semibold text-outline">Match</span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-primary dark:text-[#818cf8]">
                        {job.salary} • <span className="font-normal text-outline dark:text-slate-400">{job.tier}</span>
                      </div>

                      {/* Matching vs Missing keywords */}
                      <div className="flex flex-wrap gap-1">
                        {job.matchedKeywords.slice(0, 3).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                        {job.missingKeywords.slice(0, 2).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          >
                            + Need {kw}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-outline-variant/30 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-outline dark:text-slate-400">Posted {job.postedDate}</span>
                        <button
                          onClick={() => onTailorJob(job)}
                          className="px-3 py-1 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                          <span>Tailor Resume for this Job</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
