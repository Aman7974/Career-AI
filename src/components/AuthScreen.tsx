import React, { useState } from 'react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onCompleteAuth: (profile: UserProfile) => void;
}

const COMMON_TECH_LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Chicago, IL',
  'London, UK',
  'Bangalore, India',
  'Remote (Worldwide)',
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onCompleteAuth }) => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level (3-5 yrs)');
  const [yearsOfExperience, setYearsOfExperience] = useState('4');
  const [domain, setDomain] = useState('Full Stack / Web Development');
  const [location, setLocation] = useState('San Francisco, CA');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);

  // Feedback notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupSuccessNotice, setSignupSuccessNotice] = useState<string | null>(null);

  // Registered credentials state stored for verification during login
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('careerai_registered_credentials');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Password validation checks: Medium difficulty (1 uppercase, 1 digit, 1 special character, min 6 chars)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const hasMinLength = password.length >= 6;
  const isMediumPassword = hasUpperCase && hasDigit && hasSpecialChar && hasMinLength;

  // Name validation: Strictly letters and spaces only
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Check if non-letter character was attempted
    if (/[^a-zA-Z\s]/.test(rawVal)) {
      setNameError('Name should contain letters only (A-Z, a-z). Numbers & symbols are not allowed.');
    } else {
      setNameError(null);
    }
    const cleanLettersOnly = rawVal.replace(/[^a-zA-Z\s]/g, '');
    setName(cleanLettersOnly);
  };

  // Detect location via browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser. Please select or type your location.');
      return;
    }

    setIsDetectingLocation(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsDetectingLocation(false);
        const { latitude, longitude } = pos.coords;
        try {
          // Approximate reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.state_district;
            const state = data.address?.state;
            const country = data.address?.country;
            if (city && state) {
              setLocation(`${city}, ${state}`);
            } else if (city && country) {
              setLocation(`${city}, ${country}`);
            } else if (country) {
              setLocation(country);
            } else {
              setLocation('San Francisco, CA');
            }
          } else {
            setLocation('San Francisco, CA');
          }
        } catch {
          // Fallback if network blocked
          setLocation('San Francisco, CA (Nearby)');
        }
      },
      () => {
        setIsDetectingLocation(false);
        setLocation('San Francisco, CA');
      },
      { timeout: 8000 }
    );
  };

  // Handle Step 1: Sign Up
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Verify Name is valid letter format
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full name (letters only).');
      return;
    }
    if (/[^a-zA-Z\s]/.test(name)) {
      setErrorMessage('Name must only contain letter characters (A-Z, a-z).');
      return;
    }

    // 2. Verify Email
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 3. Verify Medium Password Requirement
    if (!isMediumPassword) {
      const missingParts: string[] = [];
      if (!hasUpperCase) missingParts.push('at least 1 uppercase letter (A-Z)');
      if (!hasDigit) missingParts.push('at least 1 digit (0-9)');
      if (!hasSpecialChar) missingParts.push('at least 1 special character (!@#$%^&*)');
      if (!hasMinLength) missingParts.push('at least 6 characters in length');

      setErrorMessage(`Password difficulty must be Medium: Missing ${missingParts.join(', ')}.`);
      return;
    }

    // 4. Verify Location
    if (!location.trim()) {
      setErrorMessage('Please enter or select your location.');
      return;
    }

    const newUserProfile: UserProfile = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      targetRole: targetRole.trim() || 'Software Engineer',
      experienceLevel,
      yearsOfExperience,
      domain,
      locationPreference: location.trim(),
      location: location.trim(),
      registeredPassword: password,
    };

    // Store registered user in local state & localStorage
    setRegisteredUser(newUserProfile);
    try {
      localStorage.setItem('careerai_registered_credentials', JSON.stringify(newUserProfile));
    } catch {}

    // STEP 2: Transition to Log In mode using the created credential!
    setLoginEmail(newUserProfile.email);
    setLoginPassword('');
    setSignupSuccessNotice(
      `🎉 Account created successfully for ${newUserProfile.name}! Now please log in using your registered credentials.`
    );
    setMode('signin');
  };

  // Handle Step 2: Log In with Created Credentials
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = loginEmail.trim().toLowerCase();
    const inputPass = loginPassword;

    if (!inputEmail) {
      setErrorMessage('Please enter your email to log in.');
      return;
    }

    if (!inputPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Check against registered credentials
    let savedCredentials = registeredUser;
    if (!savedCredentials) {
      try {
        const saved = localStorage.getItem('careerai_registered_credentials');
        if (saved) savedCredentials = JSON.parse(saved);
      } catch {}
    }

    // If user registered in this session or stored in localStorage
    if (savedCredentials) {
      if (savedCredentials.email.toLowerCase() !== inputEmail) {
        setErrorMessage(`No account found with ${inputEmail}. Please check your email or Sign Up.`);
        return;
      }

      if (savedCredentials.registeredPassword && savedCredentials.registeredPassword !== inputPass) {
        setErrorMessage('Incorrect password. Please enter the exact password you used during Sign Up.');
        return;
      }

      // Login Successful!
      onCompleteAuth(savedCredentials);
    } else {
      // Direct login fallback if credentials match default format
      const profile: UserProfile = {
        name: inputEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: inputEmail,
        targetRole: 'Software Engineer',
        experienceLevel: 'Mid-Level (3-5 yrs)',
        yearsOfExperience: '4',
        domain: 'Full Stack / Web Development',
        locationPreference: location || 'San Francisco, CA',
        location: location || 'San Francisco, CA',
      };
      onCompleteAuth(profile);
    }
  };

  // Auto-fill demo credentials
  const handleQuickFill = () => {
    setName('Aman Pachouri');
    setNameError(null);
    setEmail('amanpachouri0205@gmail.com');
    setPassword('Career@2026');
    setTargetRole('Software Engineer / Full Stack');
    setExperienceLevel('Mid-Level (3-5 yrs)');
    setYearsOfExperience('5');
    setDomain('Full Stack / Web Development');
    setLocation('San Francisco, CA');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-3">
            <span className="material-symbols-outlined text-[26px]">smart_toy</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            CareerAI Resume Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Step 1: Sign up with your details, location & medium-difficulty password'
              : 'Step 2: Log in using your registered credentials to upload your resume'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Sign Up (Create Account)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Log In
          </button>
        </div>

        {/* Success Notice after Sign Up */}
        {signupSuccessNotice && mode === 'signin' && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-emerald-400 shrink-0">check_circle</span>
            <div className="leading-relaxed">{signupSuccessNotice}</div>
          </div>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0">error</span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignUpSubmit} className="space-y-4 text-xs">
            {/* Name Input (Strict Letter Format Only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  Full Name <span className="text-indigo-400">* (Letter format only)</span>
                </label>
                <span className="text-[10px] text-slate-400">A-Z, a-z & spaces</span>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Aman Pachouri"
                pattern="^[a-zA-Z\s]+$"
                title="Please enter letters only (no numbers or special characters)"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {nameError && (
                <div className="mt-1 text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>{nameError}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. amanpachouri0205@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Password with Medium Difficulty Checklist */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">
                  Password <span className="text-indigo-400">* (Medium Difficulty)</span>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isMediumPassword
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : password.length > 0
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                  }`}
                >
                  {isMediumPassword ? '✓ Medium Difficulty Met' : 'Needs Medium Difficulty'}
                </span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mix: 1 uppercase, digits, 1 special keyword (e.g. Career@2026)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 pr-10 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password Requirement Badges */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {hasUpperCase ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {hasDigit ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>1 Digit (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {hasSpecialChar ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>1 Special Keyword (!@#$)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>6+ characters</span>
                </div>
              </div>
            </div>

            {/* Target Job Profile */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Target Job Profile / Desired Title *
              </label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer, Full Stack Developer, Data Scientist"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Location Input & Nearby Locations */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">
                  Location <span className="text-indigo-400">* (For Nearby Job Matching)</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer underline disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">my_location</span>
                  <span>{isDetectingLocation ? 'Detecting...' : 'Detect Near Me'}</span>
                </button>
              </div>

              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or New York, NY"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />

              {/* Quick Select Common / Nearby Tech Hubs */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1">Popular tech hubs & nearby locations:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TECH_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                        location === loc
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience Level & Years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Entry-Level (0-2 yrs)">Entry-Level (0-2 yrs)</option>
                  <option value="Mid-Level (3-5 yrs)">Mid-Level (3-5 yrs)</option>
                  <option value="Senior (6-10 yrs)">Senior (6-10 yrs)</option>
                  <option value="Lead / Staff (10+ yrs)">Lead / Staff (10+ yrs)</option>
                  <option value="Director / Executive (12+ yrs)">Director / Executive (12+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Primary Domain */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Primary Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Full Stack / Web Development">Full Stack / Web Development</option>
                <option value="Frontend Engineering">Frontend (React / UI)</option>
                <option value="Backend & APIs">Backend & APIs (Node/Python/SQL)</option>
                <option value="Cloud, DevOps & SRE">Cloud, DevOps & SRE</option>
                <option value="AI, ML & Data Science">AI, ML & Data Science</option>
                <option value="Engineering Management">Engineering Management</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-2"
            >
              <span>1. Complete Sign Up → Proceed to Log In</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer underline"
              >
                Auto-fill sample credentials (letters name + medium password)
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Please enter your registered email and password to log in.</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. amanpachouri0205@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type={loginShowPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 pr-10 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setLoginShowPassword(!loginShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {loginShowPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>2. Log In & Proceed to Resume Upload</span>
              <span className="material-symbols-outlined text-[18px]">login</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Need to create a new account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Go back to Sign Up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
