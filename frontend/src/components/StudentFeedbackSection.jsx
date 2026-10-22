import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Edit3, 
  GraduationCap, 
  Award, 
  User, 
  Phone, 
  Mail, 
  BookOpen, 
  Users2,
  Building2,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
import { soundEffects } from '../services/sound';

export default function StudentFeedbackSection({ ticket, onSubmitted, standalone = false }) {
  // Student Personal Details
  const [fullName, setFullName] = useState(ticket?.participantName || '');
  const [phone, setPhone] = useState(ticket?.phone || '');
  const [email, setEmail] = useState(ticket?.email || '');
  const [batch, setBatch] = useState(ticket?.course || ticket?.yearOfStudy || '');
  const [college, setCollege] = useState(ticket?.college || 'KMCT College of Engineering, Kasaragod');

  // 1. Trainer: Mr. Naveen Paul Evaluation
  const [trainerRating, setTrainerRating] = useState(5);
  const [hoveredTrainerRating, setHoveredTrainerRating] = useState(0);
  const [trainerReview, setTrainerReview] = useState('');

  // 2. Organisation Team Evaluation
  const [orgTeamRating, setOrgTeamRating] = useState(5);
  const [hoveredOrgTeamRating, setHoveredOrgTeamRating] = useState(0);
  const [orgTeamReview, setOrgTeamReview] = useState('');

  // 3. Workshop Program Evaluation
  const [programRating, setProgramRating] = useState(5);
  const [hoveredProgramRating, setHoveredProgramRating] = useState(0);
  const [programReview, setProgramReview] = useState('');

  // 4. Recommendation
  const [recommend, setRecommend] = useState('yes');

  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync ticket prop if passed
  useEffect(() => {
    if (ticket) {
      if (ticket.participantName) setFullName(ticket.participantName);
      if (ticket.phone) setPhone(ticket.phone);
      if (ticket.email) setEmail(ticket.email);
      if (ticket.course || ticket.yearOfStudy) setBatch(ticket.course || ticket.yearOfStudy);
      if (ticket.college) setCollege(ticket.college);

      const fb = localAttendanceStore.getFeedbackByTicketId(ticket.ticketId);
      if (fb) {
        setExistingFeedback(fb);
        setTrainerRating(Number(fb.trainerRating || fb.mentorRating) || 5);
        setTrainerReview(fb.trainerReview || fb.likedMost || '');
        setOrgTeamRating(Number(fb.orgTeamRating || fb.organizationRating) || 5);
        setOrgTeamReview(fb.orgTeamReview || '');
        setProgramRating(Number(fb.programRating || fb.overallRating) || 5);
        setProgramReview(fb.programReview || fb.suggestions || '');
        setRecommend(fb.recommend || 'yes');
        if (fb.participantName) setFullName(fb.participantName);
        if (fb.phone) setPhone(fb.phone);
        if (fb.email) setEmail(fb.email);
        if (fb.batch || fb.course) setBatch(fb.batch || fb.course);
        if (fb.college) setCollege(fb.college);
      }
    }
  }, [ticket]);

  // Check if existing review exists by phone or email
  const checkExistingUserFeedback = (phoneNumber, emailAddress) => {
    const list = localAttendanceStore.getFeedbacks();
    const cleanPh = String(phoneNumber || '').replace(/\D/g, '');
    const cleanEm = String(emailAddress || '').trim().toLowerCase();

    const found = list.find(f => 
      (cleanPh && cleanPh.length >= 7 && f.phone && String(f.phone).replace(/\D/g, '') === cleanPh) ||
      (cleanEm && f.email && String(f.email).trim().toLowerCase() === cleanEm)
    );

    if (found && !isEditing) {
      setExistingFeedback(found);
      setTrainerRating(Number(found.trainerRating || found.mentorRating) || 5);
      setTrainerReview(found.trainerReview || found.likedMost || '');
      setOrgTeamRating(Number(found.orgTeamRating || found.organizationRating) || 5);
      setOrgTeamReview(found.orgTeamReview || '');
      setProgramRating(Number(found.programRating || found.overallRating) || 5);
      setProgramReview(found.programReview || found.suggestions || '');
      setRecommend(found.recommend || 'yes');
      if (found.participantName) setFullName(found.participantName);
      if (found.batch || found.course) setBatch(found.batch || found.course);
      if (found.college) setCollege(found.college);
    }
  };

  const getTrainerSentiment = (val) => {
    switch (val) {
      case 5: return 'Exceptional — Highly Engaging, Clear & Inspiring';
      case 4: return 'Very Good — Practical Case Studies & Practical Guidance';
      case 3: return 'Good — Clear Presentation & Concepts';
      case 2: return 'Fair — Could Be More Interactive';
      case 1: return 'Needs Improvement';
      default: return 'Select Rating';
    }
  };

  const getOrgTeamSentiment = (val) => {
    switch (val) {
      case 5: return 'Outstanding — Seamless Coordination & Dedicated Support';
      case 4: return 'Very Good — Helpful Team & Smooth Arrangements';
      case 3: return 'Good — Proper Coordination Throughout Event';
      case 2: return 'Average — Coordination Could Be More Prompt';
      case 1: return 'Needs Better Management';
      default: return 'Select Rating';
    }
  };

  const getProgramSentiment = (val) => {
    switch (val) {
      case 5: return 'Outstanding Program — High Value Venture Curriculum';
      case 4: return 'Very Good Workshop — Learned Essential Frameworks';
      case 3: return 'Good Workshop — Worthwhile Offline Learning Experience';
      case 2: return 'Fair — Expected More Practical Exercises';
      case 1: return 'Needs Revision';
      default: return 'Select Rating';
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter your mobile number.');
      return;
    }
    if (!batch.trim()) {
      alert('Please enter your batch / department.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: existingFeedback?.id,
        ticketId: ticket?.ticketId || 'STUDENT-WALKIN',
        participantName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        batch: batch.trim(),
        course: batch.trim(),
        college: college.trim() || 'KMCT College of Engineering, Kasaragod',
        trainerName: 'Mr. Naveen Paul',
        trainerRating,
        trainerReview: trainerReview.trim(),
        orgTeamRating,
        orgTeamReview: orgTeamReview.trim(),
        organizationRating: orgTeamRating,
        programRating,
        programReview: programReview.trim(),
        overallRating: Math.round(((trainerRating + orgTeamRating + programRating) / 3) * 10) / 10,
        recommend,
        likedMost: trainerReview.trim(),
        suggestions: programReview.trim(),
      };

      const saved = await api.submitFeedback(payload);
      setExistingFeedback(saved);
      setIsEditing(false);

      soundEffects.playSuccess();
      triggerConfetti();

      if (onSubmitted) {
        onSubmitted(saved);
      }
    } catch (err) {
      alert('Error saving feedback: ' + (err.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-[880px] mx-auto ${standalone ? 'my-3' : 'mt-8'} font-sans`}>
      {/* Clean, Neat, Professional Glass Container */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0b0816]/95 border border-white/[0.12] p-5 sm:p-9 shadow-2xl backdrop-blur-xl">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 pb-6 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Student Workshop Feedback
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Official Form
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                ILLUMINATE 2026 &bull; KMCT Kasaragod &amp; E-Cell IIT Bombay
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-mono text-zinc-400">
                Resource Person: <strong className="text-amber-300">Mr. Naveen Paul</strong>
              </span>
            </div>
          </div>
        </div>

        {/* If feedback already submitted and not editing: show clean confirmation card */}
        {existingFeedback && !isEditing && (
          <div className="relative z-10 py-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Feedback Recorded Successfully
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-2 leading-relaxed">
                Thank you, <strong className="text-white">{existingFeedback.participantName}</strong> ({existingFeedback.batch || 'Participant'})! Your evaluations have been securely recorded and synced.
              </p>
            </div>

            {/* Submitted Summary Cards (Trainer, Org Team, Workshop) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto pt-2 text-left">
              {/* Trainer Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trainer</span>
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{existingFeedback.trainerRating || 5}.0</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-white truncate">Mr. Naveen Paul</p>
                {existingFeedback.trainerReview && (
                  <p className="text-xs text-zinc-300 italic bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] line-clamp-3">
                    "{existingFeedback.trainerReview}"
                  </p>
                )}
              </div>

              {/* Org Team Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Organising Team</span>
                  </span>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    <Star className="w-3 h-3 fill-emerald-400" />
                    <span>{existingFeedback.orgTeamRating || existingFeedback.organizationRating || 5}.0</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-white truncate">Coordination &amp; Support</p>
                {existingFeedback.orgTeamReview && (
                  <p className="text-xs text-zinc-300 italic bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] line-clamp-3">
                    "{existingFeedback.orgTeamReview}"
                  </p>
                )}
              </div>

              {/* Workshop Program Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-purple-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>Workshop</span>
                  </span>
                  <div className="flex items-center gap-1 text-purple-300 font-bold text-xs bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    <Star className="w-3 h-3 fill-purple-400" />
                    <span>{existingFeedback.programRating || existingFeedback.overallRating || 5}.0</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-white truncate">ILLUMINATE 2026</p>
                {existingFeedback.programReview && (
                  <p className="text-xs text-zinc-300 italic bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] line-clamp-3">
                    "{existingFeedback.programReview}"
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Edit Response</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Submission Form */}
        {(!existingFeedback || isEditing) && (
          <form onSubmit={handleSubmit} className="relative z-10 pt-6 space-y-6">

            {/* ======================================================== */}
            {/* PART 1: STUDENT DETAILS (CLEAN DIRECT INPUTS, NO EXAMPLES) */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Student Information</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">All fields required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Full Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#07050e] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Mobile Number <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => checkExistingUserFeedback(phone, email)}
                      className="w-full bg-[#07050e] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600 font-sans font-mono"
                      required
                    />
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Email Address <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => checkExistingUserFeedback(phone, email)}
                      className="w-full bg-[#07050e] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Batch / Department */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Batch / Department <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter batch or department"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full bg-[#07050e] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                    <GraduationCap className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PART 2: TRAINER EVALUATION (MR. NAVEEN PAUL)             */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#090713] border border-amber-500/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Trainer Rating: Mr. Naveen Paul</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                        Resource Person
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rate teaching delivery, startup insights &amp; interactive engagement
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-300 font-mono bg-black/40 px-3 py-1 rounded-md border border-amber-500/20 self-start sm:self-auto">
                  {hoveredTrainerRating || trainerRating}.0 / 5.0
                </div>
              </div>

              {/* Star Rating Buttons */}
              <div className="text-center py-2 space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoveredTrainerRating || trainerRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTrainerRating(star)}
                        onMouseEnter={() => setHoveredTrainerRating(star)}
                        onMouseLeave={() => setHoveredTrainerRating(0)}
                        className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                            isActive 
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                              : 'text-zinc-700 hover:text-zinc-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-amber-300 font-mono">
                  {getTrainerSentiment(hoveredTrainerRating || trainerRating)}
                </div>
              </div>

              {/* Brief Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Brief Feedback on Mr. Naveen Paul's Session *
                </label>
                <textarea
                  rows="2"
                  value={trainerReview}
                  onChange={(e) => setTrainerReview(e.target.value)}
                  placeholder="Share your thoughts and feedback on the trainer's session..."
                  className="w-full bg-[#05030a] text-zinc-100 text-xs sm:text-sm p-3.5 rounded-lg border border-white/[0.1] focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 placeholder:text-zinc-600 transition-all resize-none outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* PART 3: ORGANISATION TEAM EVALUATION                    */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#090713] border border-emerald-500/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Organisation Team Rating</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        Nxt Byte &amp; KMCT
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rate event coordination, registration desk, venue arrangements &amp; support
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-emerald-300 font-mono bg-black/40 px-3 py-1 rounded-md border border-emerald-500/20 self-start sm:self-auto">
                  {hoveredOrgTeamRating || orgTeamRating}.0 / 5.0
                </div>
              </div>

              {/* Star Rating Buttons */}
              <div className="text-center py-2 space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoveredOrgTeamRating || orgTeamRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOrgTeamRating(star)}
                        onMouseEnter={() => setHoveredOrgTeamRating(star)}
                        onMouseLeave={() => setHoveredOrgTeamRating(0)}
                        className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                            isActive 
                              ? 'text-emerald-400 fill-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                              : 'text-zinc-700 hover:text-zinc-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-emerald-300 font-mono">
                  {getOrgTeamSentiment(hoveredOrgTeamRating || orgTeamRating)}
                </div>
              </div>

              {/* Brief Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Brief Feedback on Event Coordination &amp; Organisation Team *
                </label>
                <textarea
                  rows="2"
                  value={orgTeamReview}
                  onChange={(e) => setOrgTeamReview(e.target.value)}
                  placeholder="Share your thoughts on the event management, support, and arrangements..."
                  className="w-full bg-[#05030a] text-zinc-100 text-xs sm:text-sm p-3.5 rounded-lg border border-white/[0.1] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 placeholder:text-zinc-600 transition-all resize-none outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* PART 4: WORKSHOP PROGRAM EVALUATION (ILLUMINATE 2026)    */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#090713] border border-purple-500/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Workshop Program Rating: ILLUMINATE 2026</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rate the 6-hour masterclass curriculum, startup frameworks &amp; hands-on ideation
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-purple-300 font-mono bg-black/40 px-3 py-1 rounded-md border border-purple-500/20 self-start sm:self-auto">
                  {hoveredProgramRating || programRating}.0 / 5.0
                </div>
              </div>

              {/* Star Rating Buttons */}
              <div className="text-center py-2 space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoveredProgramRating || programRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setProgramRating(star)}
                        onMouseEnter={() => setHoveredProgramRating(star)}
                        onMouseLeave={() => setHoveredProgramRating(0)}
                        className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                            isActive 
                              ? 'text-purple-400 fill-purple-400 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' 
                              : 'text-zinc-700 hover:text-zinc-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-purple-300 font-mono">
                  {getProgramSentiment(hoveredProgramRating || programRating)}
                </div>
              </div>

              {/* Brief Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Brief Feedback &amp; Key Takeaways from the Workshop Program *
                </label>
                <textarea
                  rows="2"
                  value={programReview}
                  onChange={(e) => setProgramReview(e.target.value)}
                  placeholder="Share your thoughts and key takeaways from the ILLUMINATE workshop..."
                  className="w-full bg-[#05030a] text-zinc-100 text-xs sm:text-sm p-3.5 rounded-lg border border-white/[0.1] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 placeholder:text-zinc-600 transition-all resize-none outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* Recommendation Prompt */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                Would you recommend this workshop &amp; mentor to peers?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'yes', label: 'Definitely! 🚀', activeClass: 'bg-emerald-600 text-white shadow-md' },
                  { value: 'maybe', label: 'Maybe 👍', activeClass: 'bg-amber-600 text-white shadow-md' },
                  { value: 'no', label: 'Not Really 👎', activeClass: 'bg-rose-700 text-white shadow-md' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecommend(option.value)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      recommend === option.value
                        ? option.activeClass
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08]'
                    }`}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-8 rounded-full font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/60 transition-all disabled:opacity-50 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{existingFeedback ? 'Update Feedback' : 'Submit Feedback'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
