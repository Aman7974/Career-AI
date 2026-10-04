import React, { useState } from 'react';
import { ResumeData, JobMatch } from '../types';
import { calculateJobMatchesForResume } from '../utils/jobMatching';

interface JobMatchesViewProps {
  resume: ResumeData;
  onTailorJob: (job: JobMatch) => void;
}

export const JobMatchesView: React.FC<JobMatchesViewProps> = ({ resume, onTailorJob }) => {
  const dynamicJobs = calculateJobMatchesForResume(resume);

  const [filterMinScore, setFilterMinScore] = useState<number>(75);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = dynamicJobs.filter(
    (j) =>
      j.matchScore >= filterMinScore &&
      (j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-margin-lg py-4 lg:py-space-lg flex flex-col gap-space-lg animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 p-space-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary dark:text-[#818cf8]">work</span>
            <h1 className="text-xl md:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-on-surface dark:text-white">
              Curated Executive Matches for {resume.candidateName}
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 max-w-xl">
            Live executive roles where your parsed resume (<strong>{resume.headline}</strong>) achieves an optimal ATS match threshold.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Filter by title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant dark:border-white/10 rounded-lg text-xs text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(Number(e.target.value))}
            className="px-3 py-1.5 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant dark:border-white/10 rounded-lg text-xs text-on-surface dark:text-white focus:outline-none"
          >
            <option value={75}>Min Match: 75%+</option>
            <option value={80}>Min Match: 80%+</option>
            <option value={85}>Min Match: 85%+</option>
            <option value={90}>Min Match: 90%+</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-surface-container-lowest dark:bg-[#1a2238] rounded-xl border border-outline-variant/60 dark:border-white/10 p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-xs shrink-0"
                    style={{ backgroundColor: job.logoColor }}
                  >
                    {job.company.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface dark:text-white leading-snug">
                      {job.title}
                    </h3>
                    <div className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                      {job.company} • {job.location}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`text-xl font-extrabold font-['Plus_Jakarta_Sans'] ${
                      job.matchScore >= 90
                        ? 'text-secondary dark:text-emerald-400'
                        : 'text-tertiary dark:text-amber-400'
                    }`}
                  >
                    {job.matchScore}%
                  </span>
                  <span className="text-[10px] text-outline dark:text-slate-400 font-semibold uppercase">
                    ATS Pass Score
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary dark:text-[#818cf8]">
                <span>{job.salary}</span>
                <span>•</span>
                <span className="text-outline dark:text-slate-400 font-normal">{job.tier}</span>
              </div>

              {/* Matched keywords preview */}
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-outline dark:text-slate-400 mb-1.5">
                  Overlapping Qualifications from your resume:
                </div>
                <div className="flex flex-wrap gap-1">
                  {job.matchedKeywords.length > 0 ? (
                    job.matchedKeywords.slice(0, 4).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-surface-container dark:bg-white/5 text-on-surface dark:text-slate-300 rounded text-[11px]"
                      >
                        ✓ {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-outline italic">No direct keyword overlap found</span>
                  )}
                  {job.matchedKeywords.length > 4 && (
                    <span className="px-1.5 py-0.5 text-outline dark:text-slate-400 text-[11px]">
                      +{job.matchedKeywords.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40 dark:border-white/10">
              <span className="text-[11px] text-outline dark:text-slate-400">Posted {job.postedDate}</span>
              <button
                onClick={() => onTailorJob(job)}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                <span>Tailor for this Role</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
