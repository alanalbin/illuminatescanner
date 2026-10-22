import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  ThumbsUp, 
  MessageSquareHeart, 
  Edit3, 
  GraduationCap, 
  Award, 
  Heart, 
  Building,
  User,
  Phone,
  Mail,
  BookOpen,
  Briefcase
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

  // Trainer: Mr. Naveen Paul Evaluation
  const [trainerRating, setTrainerRating] = useState(5);
  const [hoveredTrainerRating, setHoveredTrainerRating] = useState(0);
  const [trainerReview, setTrainerReview] = useState('');

  // Workshop & Program Evaluation
  const [programRating, setProgramRating] = useState(5);
  const [hoveredProgramRating, setHoveredProgramRating] = useState(0);
  const [programReview, setProgramReview] = useState('');

  // Recommendation
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
      case 5: return 'Exceptional! 🌟 Highly Engaging, Clear & Inspiring';
      case 4: return 'Very Good! 🚀 Great Practical Case Studies';
      case 3: return 'Good 👍 Clear Presentation';
      case 2: return 'Average 😐 Could be More Interactive';
      case 1: return 'Needs Improvement ⚠️';
      default: return 'Select Rating';
    }
  };

  const getProgramSentiment = (val) => {
    switch (val) {
      case 5: return 'Outstanding Workshop! 🎯 High Value Curriculum';
      case 4: return 'Very Good Program! 💡 Learned Essential Frameworks';
      case 3: return 'Good Workshop 👍 Worthwhile Offline Learning';
      case 2: return 'Fair 😐 Expected More Venture Exercises';
      case 1: return 'Needs Revision ⚠️';
      default: return 'Select Rating';
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#6366f1']
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
        programRating,
        programReview: programReview.trim(),
        overallRating: Math.round(((trainerRating + programRating) / 2) * 10) / 10,
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
    <div className={`w-full max-w-[920px] mx-auto ${standalone ? 'my-3' : 'mt-8'} transition-all duration-300 font-heading`}>
      {/* Main Glassmorphic Card Container matching illuminate-wheat.vercel.app */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#130926]/95 via-[#0a0418]/95 to-[#04010a]/95 border border-purple-500/40 p-6 sm:p-10 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/60 shrink-0 border border-purple-400/30">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-heading">
                  Student Workshop Review
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Official Form
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Please provide your feedback for trainer <strong className="text-amber-300 font-semibold">Mr. Naveen Paul</strong> and the <strong className="text-white">ILLUMINATE 2026</strong> workshop program
              </p>
            </div>
          </div>
        </div>

        {/* If feedback already submitted and not editing: show glowing summary card */}
        {existingFeedback && !isEditing && (
          <div className="relative z-10 py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-bounce-gentle">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Review Submitted Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-2 leading-relaxed">
                Thank you, <span className="text-white font-bold">{existingFeedback.participantName}</span> ({existingFeedback.batch || 'Participant'})! Your rating for trainer <strong className="text-amber-300">Mr. Naveen Paul</strong> and the <strong className="text-purple-300">ILLUMINATE 2026</strong> workshop has been saved.
              </p>
            </div>

            {/* Submitted Overview Pill Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2 text-left">
              {/* Trainer Review Card */}
              <div className="p-5 rounded-2xl bg-[#0e091d] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5 font-mono">
                    <User className="w-4 h-4 text-amber-400" />
                    Trainer: Mr. Naveen Paul
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-black text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30 font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{existingFeedback.trainerRating || existingFeedback.mentorRating || 5}.0 / 5</span>
                  </div>
                </div>
                {existingFeedback.trainerReview && (
                  <p className="text-xs text-zinc-300 italic bg-black/40 p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                    "{existingFeedback.trainerReview}"
                  </p>
                )}
              </div>

              {/* Program Review Card */}
              <div className="p-5 rounded-2xl bg-[#0e091d] border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-300 flex items-center gap-1.5 font-mono">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Workshop: ILLUMINATE 2026
                  </span>
                  <div className="flex items-center gap-1 text-purple-300 font-black text-sm bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/30 font-mono">
                    <Star className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                    <span>{existingFeedback.programRating || existingFeedback.overallRating || 5}.0 / 5</span>
                  </div>
                </div>
                {existingFeedback.programReview && (
                  <p className="text-xs text-zinc-300 italic bg-black/40 p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                    "{existingFeedback.programReview}"
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Edit / Update Response</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Submission Form */}
        {(!existingFeedback || isEditing) && (
          <form onSubmit={handleSubmit} className="relative z-10 pt-6 space-y-6">

            {/* ======================================================== */}
            {/* PART 1: STUDENT INFORMATION (NO DROPDOWN - DIRECT INPUTS) */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#07050f] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Student Details</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500">All fields required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-zinc-400">
                    Full Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Aryananda M"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#0c0817] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-white/[0.1] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-zinc-400">
                    Mobile Number <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="e.g. 9847123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => checkExistingUserFeedback(phone, email)}
                      className="w-full bg-[#0c0817] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-white/[0.1] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all placeholder:text-zinc-600 font-sans font-mono"
                      required
                    />
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-zinc-400">
                    Email Address <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. student@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => checkExistingUserFeedback(phone, email)}
                      className="w-full bg-[#0c0817] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-white/[0.1] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Batch / Department */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-zinc-400">
                    Batch / Department <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. BTech ECE 2026 / 1st Year"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full bg-[#0c0817] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-white/[0.1] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                    <GraduationCap className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PART 2: RATING & DESCRIPTION FOR TRAINER: MR. NAVEEN PAUL */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#130926] to-[#0a0418] border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-dark-950 font-black shadow-md border border-amber-400/40">
                    <User className="w-5 h-5 text-dark-950" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <span>Trainer Rating: Mr. Naveen Paul</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        Resource Person
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Rate teaching delivery, startup insights, clarity & interactive engagement
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-300 self-start sm:self-auto font-mono bg-black/50 px-3 py-1 rounded-lg border border-amber-500/30">
                  {hoveredTrainerRating || trainerRating}.0 / 5.0
                </div>
              </div>

              {/* Star Rating Buttons for Mr. Naveen Paul */}
              <div className="text-center py-2 space-y-2">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoveredTrainerRating || trainerRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTrainerRating(star)}
                        onMouseEnter={() => setHoveredTrainerRating(star)}
                        onMouseLeave={() => setHoveredTrainerRating(0)}
                        className="p-1 sm:p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-9 h-9 sm:w-11 sm:h-11 transition-all duration-200 ${
                            isActive 
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]' 
                              : 'text-zinc-700 hover:text-zinc-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-amber-300 animate-fade-in">
                  {getTrainerSentiment(hoveredTrainerRating || trainerRating)}
                </div>
              </div>

              {/* Description / Review for Mr. Naveen Paul */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trainer Review & Feedback (Mr. Naveen Paul) *</span>
                </label>
                <textarea
                  rows="3"
                  value={trainerReview}
                  onChange={(e) => setTrainerReview(e.target.value)}
                  placeholder="How was Mr. Naveen Paul's session? (e.g. Teaching style, real startup examples, answering doubts, energy...)"
                  className="w-full bg-[#07050f] text-zinc-100 text-xs sm:text-sm p-4 rounded-xl border border-white/[0.1] focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 placeholder:text-zinc-600 transition-all resize-none leading-relaxed outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* PART 3: RATING & DESCRIPTION FOR WORKSHOP & PROGRAM */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#130926] to-[#0a0418] border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md border border-purple-400/40">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <span>Workshop & Program: ILLUMINATE 2026</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Rate the 6-hour masterclass curriculum, startup frameworks & event arrangements
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-purple-300 self-start sm:self-auto font-mono bg-black/50 px-3 py-1 rounded-lg border border-purple-500/30">
                  {hoveredProgramRating || programRating}.0 / 5.0
                </div>
              </div>

              {/* Star Rating Buttons for Program */}
              <div className="text-center py-2 space-y-2">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoveredProgramRating || programRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setProgramRating(star)}
                        onMouseEnter={() => setHoveredProgramRating(star)}
                        onMouseLeave={() => setHoveredProgramRating(0)}
                        className="p-1 sm:p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-9 h-9 sm:w-11 sm:h-11 transition-all duration-200 ${
                            isActive 
                              ? 'text-purple-400 fill-purple-400 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]' 
                              : 'text-zinc-700 hover:text-zinc-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-purple-300 animate-fade-in">
                  {getProgramSentiment(hoveredProgramRating || programRating)}
                </div>
              </div>

              {/* Description / Review for Workshop Program */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Workshop Program Review & Key Takeaway *</span>
                </label>
                <textarea
                  rows="3"
                  value={programReview}
                  onChange={(e) => setProgramReview(e.target.value)}
                  placeholder="How was the overall workshop program? (e.g. Topics covered, ideation activities, arrangements, what you liked most...)"
                  className="w-full bg-[#07050f] text-zinc-100 text-xs sm:text-sm p-4 rounded-xl border border-white/[0.1] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 placeholder:text-zinc-600 transition-all resize-none leading-relaxed outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* Recommendation Prompt */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#07050f] border border-white/[0.08] space-y-3">
              <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Would you recommend this workshop & Mr. Naveen Paul to junior students or friends?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'yes', label: 'Definitely! 🚀', activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60' },
                  { value: 'maybe', label: 'Maybe 👍', activeClass: 'bg-amber-600 text-white shadow-lg shadow-amber-950/60' },
                  { value: 'no', label: 'Not Really 👎', activeClass: 'bg-rose-700 text-white shadow-lg shadow-rose-950/60' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecommend(option.value)}
                    className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white bg-white/[0.03] border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3.5 px-9 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/60 hover:shadow-purple-700/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Your Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{existingFeedback ? 'Update Review' : 'Submit Review'}</span>
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
