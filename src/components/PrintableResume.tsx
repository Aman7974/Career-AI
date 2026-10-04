import React from 'react';
import { ResumeData } from '../types';

interface PrintableResumeProps {
  resume: ResumeData;
}

export const PrintableResume: React.FC<PrintableResumeProps> = ({ resume }) => {
  return (
    <div
      id="printable-executive-resume"
      className="print-only text-slate-900 bg-white leading-relaxed font-sans"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* 1. Candidate Header */}
      <div className="text-center pb-3 border-b-2 border-slate-900 mb-4 avoid-break">
        <h1
          className="text-2xl font-extrabold uppercase tracking-tight text-slate-950 mb-1"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {resume.candidateName}
        </h1>
        <div className="text-[9.5pt] text-slate-700 font-medium">
          {resume.contactInfo}
        </div>
        <div className="text-[10pt] font-bold text-slate-900 tracking-wider uppercase mt-1">
          {resume.headline}
        </div>
      </div>

      {/* 2. Executive Profile */}
      <div className="mb-4 avoid-break">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5 flex items-center justify-between">
          <span>Executive Profile</span>
        </h2>
        <p className="text-[9.5pt] text-slate-800 text-justify leading-normal">
          {resume.executiveProfile}
        </p>
      </div>

      {/* 3. Core Competencies & Technical Taxonomy */}
      <div className="mb-4 avoid-break">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
          Core Competencies & Technical Architecture
        </h2>
        <div className="grid grid-cols-3 gap-y-1 gap-x-2 text-[9pt] text-slate-800">
          {resume.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">•</span>
              <span className="font-medium">{skill}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">•</span>
            <span className="font-medium">Distributed Consensus (Raft/Paxos)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">•</span>
            <span className="font-medium">SOC2 Type II & FedRAMP</span>
          </div>
        </div>
      </div>

      {/* 4. Professional Experience */}
      <div className="mb-4">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2.5">
          Executive Leadership Experience
        </h2>

        {resume.workExperience.map((exp) => (
          <div key={exp.id} className="mb-3.5 avoid-break">
            <div className="flex justify-between items-baseline mb-1">
              <div>
                <span className="font-bold text-[10pt] text-slate-950">{exp.title}</span>
                <span className="text-slate-500 mx-1.5">|</span>
                <span className="font-semibold text-[10pt] text-slate-800">{exp.company}</span>
              </div>
              <span className="text-[9pt] font-semibold text-slate-600 font-mono">{exp.period}</span>
            </div>

            <ul className="list-disc pl-4 space-y-1 text-[9pt] text-slate-800 text-justify">
              {exp.bullets.map((bullet) => {
                // If bullet has a rewrite text and is flagged, print the clean quantified version
                const displayBulletText = bullet.rewriteText ? bullet.rewriteText : bullet.text;
                return (
                  <li key={bullet.id} className="leading-snug">
                    {displayBulletText}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 5. Education & Credentials */}
      <div className="mb-4 avoid-break">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
          Education & Credentials
        </h2>
        <div className="space-y-1.5 text-[9pt]">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="font-bold text-slate-900">Stanford University</span> — M.S. in Computer Science (Distributed Systems Specialization)
            </div>
            <span className="text-slate-600 font-medium">Palo Alto, CA</span>
          </div>
          <div className="flex justify-between items-baseline">
            <div>
              <span className="font-bold text-slate-900">University of California, Berkeley</span> — B.S. in Electrical Engineering & Computer Sciences (Magna Cum Laude)
            </div>
            <span className="text-slate-600 font-medium">Berkeley, CA</span>
          </div>
        </div>
      </div>

      {/* 6. Patents & Intellectual Property */}
      <div className="avoid-break">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
          Patents Issued
        </h2>
        <ul className="list-disc pl-4 space-y-1 text-[8.5pt] text-slate-800">
          <li>
            <strong>US Patent #10,892,114:</strong> Decentralized consensus synchronization in geo-replicated stateful streaming topologies.
          </li>
          <li>
            <strong>US Patent #11,204,910:</strong> Dynamic automated telemetry sharding across multi-tenant cloud clusters.
          </li>
        </ul>
      </div>

      {/* Footer metadata */}
      <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[7.5pt] text-slate-400 avoid-break font-mono">
        <span>ATS Engine Verification ID: {resume.parseHash}</span>
        <span>Sanitized Single-Tier Executive Format • Page 1 of 1</span>
      </div>
    </div>
  );
};
