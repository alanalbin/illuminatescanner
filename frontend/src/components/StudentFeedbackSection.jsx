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
  ChevronDown,
  Building,
  User,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
import { soundEffects } from '../services/sound';

export default function StudentFeedbackSection({ ticket, onSubmitted, standalone = false }) {
  const [attendees, setAttendees] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(ticket?.ticketId || '');
  const [selectedAttendee, setSelectedAttendee] = useState(ticket || null);
  
  // Trainer: Mr. Naveen Paul ratings
  const [trainerRating, setTrainerRating] = useState(5);
  const [hoveredTrainerRating, setHoveredTrainerRating] = useState(0);
  const [trainerReview, setTrainerReview] = useState('');

  // Workshop & Program ratings
  const [programRating, setProgramRating] = useState(5);
  const [hoveredProgramRating, setHoveredProgramRating] = useState(0);
  const [programReview, setProgramReview] = useState('');

  // Additional dimensions
  const [recommend, setRecommend] = useState('yes');
  const [contentRating, setContentRating] = useState(5);
  const [organizationRating, setOrganizationRating] = useState(5);
  
  // Custom attendee details
  const [customName, setCustomName] = useState('');
  const [customCollege, setCustomCollege] = useState('');
  const [customCourse, setCustomCourse] = useState('');

  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const list = localAttendanceStore.getTickets();
      setAttendees(list);
    } catch (e) {
      console.warn('Could not load attendees for feedback:', e);
    }
  }, []);

  useEffect(() => {
    if (ticket) {
      setSelectedAttendee(ticket);
      setSelectedTicketId(ticket.ticketId);
    }
  }, [ticket]);

  useEffect(() => {
    const checkId = selectedTicketId || ticket?.ticketId;
    if (checkId) {
      const fb = localAttendanceStore.getFeedbackByTicketId(checkId);
      if (fb) {
        setExistingFeedback(fb);
        setTrainerRating(Number(fb.trainerRating || fb.mentorRating) || 5);
        setTrainerReview(fb.trainerReview || fb.likedMost || '');
        setProgramRating(Number(fb.programRating || fb.overallRating) || 5);
        setProgramReview(fb.programReview || fb.suggestions || '');
        setContentRating(Number(fb.contentRating) || 5);
        setOrganizationRating(Number(fb.organizationRating) || 5);
        setRecommend(fb.recommend || 'yes');
        if (fb.participantName) setCustomName(fb.participantName);
        if (fb.college) setCustomCollege(fb.college);
        if (fb.course) setCustomCourse(fb.course);
      } else {
        setExistingFeedback(null);
      }
    }
  }, [selectedTicketId, ticket]);

  const handleSelectAttendee = (e) => {
    const id = e.target.value;
    setSelectedTicketId(id);
    const found = attendees.find(a => a.ticketId === id);
    if (found) {
      setSelectedAttendee(found);
      setCustomName(found.participantName);
      setCustomCollege(found.college);
      setCustomCourse(found.course);
    } else {
      setSelectedAttendee(null);
    }
  };

  const getTrainerSentiment = (val) => {
    switch (val) {
      case 5: return 'Exceptional! 🌟 Engaging, Practical & Inspiring';
      case 4: return 'Very Good! 🚀 Great Practical Examples';
      case 3: return 'Good 👍 Clear Delivery';
      case 2: return 'Average 😐 Could be More Interactive';
      case 1: return 'Needs Improvement ⚠️';
      default: return 'Select Rating';
    }
  };

  const getProgramSentiment = (val) => {
    switch (val) {
      case 5: return 'Outstanding Workshop! 🎯 High Value Curriculum';
      case 4: return 'Very Good Program! 💡 Learned a Lot';
      case 3: return 'Good Workshop 👍 Worthwhile Experience';
      case 2: return 'Fair 😐 Expected More Hands-On';
      case 1: return 'Needs Revision ⚠️';
      default: return 'Select Rating';
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 85,
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
    setIsSubmitting(true);

    try {
      const pName = selectedAttendee?.participantName || customName.trim() || 'Student Attendee';
      const pCollege = selectedAttendee?.college || customCollege.trim() || 'KMCT College of Engineering, Kasaragod';
      const pCourse = selectedAttendee?.course || customCourse.trim() || '';
      const pYear = selectedAttendee?.yearOfStudy || '';
      const tId = selectedTicketId || ticket?.ticketId || 'STUDENT-WALKIN';

      const payload = {
        id: existingFeedback?.id,
        ticketId: tId,
        participantName: pName,
        college: pCollege,
        course: pCourse,
        yearOfStudy: pYear,
        email: selectedAttendee?.email || '',
        phone: selectedAttendee?.phone || '',
        trainerName: 'Mr. Naveen Paul',
        trainerRating,
        trainerReview: trainerReview.trim(),
        programRating,
        programReview: programReview.trim(),
        overallRating: Math.round(((trainerRating + programRating) / 2) * 10) / 10,
        contentRating,
        mentorRating: trainerRating,
        organizationRating,
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
      {/* Illuminate-Wheat Glass Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#130926]/95 via-[#0a0418]/95 to-[#04010a]/95 border border-purple-500/40 p-5 sm:p-8 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl">
        
        {/* Subtle Ambient Top Radial Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Strip — Strictly NO LOGOS */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/60 shrink-0 border border-purple-400/30">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase font-heading">
                  Student Review & Rating
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Illuminate 2026
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rate trainer <strong className="text-amber-300 font-semibold">Mr. Naveen Paul</strong> & the <strong className="text-white">ILLUMINATE</strong> workshop experience
              </p>
            </div>
          </div>

          {/* Student Identification Pill */}
          {(selectedAttendee || ticket) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-zinc-200 self-start sm:self-auto font-mono">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">{selectedAttendee?.participantName || ticket?.participantName}</span>
              <span className="text-[10px] text-zinc-400">({selectedAttendee?.ticketId || ticket?.ticketId})</span>
            </div>
          )}
        </div>

        {/* If feedback already submitted and not editing: show glowing summary card */}
        {existingFeedback && !isEditing && (
          <div className="relative z-10 py-6 sm:py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-bounce-gentle">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Review Recorded!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
                Thank you, <span className="text-white font-bold">{existingFeedback.participantName}</span>! Your rating for trainer <strong className="text-amber-300">Mr. Naveen Paul</strong> and the <strong className="text-purple-300">ILLUMINATE 2026</strong> workshop has been saved.
              </p>
            </div>

            {/* Submitted Overview Pill Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
              {/* Trainer Review Card */}
              <div className="p-4 rounded-2xl bg-[#0e091d] border border-amber-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5 font-mono">
                    <User className="w-4 h-4 text-amber-400" />
                    Trainer: Mr. Naveen Paul
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-black text-sm bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 font-mono">
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
              <div className="p-4 rounded-2xl bg-[#0e091d] border border-purple-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-300 flex items-center gap-1.5 font-mono">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Workshop: ILLUMINATE
                  </span>
                  <div className="flex items-center gap-1 text-purple-300 font-black text-sm bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30 font-mono">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border border-white/10 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Edit / Update Review</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Submission Form */}
        {(!existingFeedback || isEditing) && (
          <form onSubmit={handleSubmit} className="relative z-10 pt-6 space-y-6">

            {/* Standalone Student Selector if ticket is not pre-bound */}
            {standalone && !ticket && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#07050f] border border-white/[0.08] space-y-3">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Student Identification (Select Your Name or Enter Details)</span>
                </label>
                
                {attendees.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedTicketId}
                      onChange={handleSelectAttendee}
                      className="w-full bg-[#0c0717] text-zinc-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-white/[0.1] focus:outline-none focus:border-purple-400 appearance-none cursor-pointer font-mono"
                    >
                      <option value="">-- Choose your name from registered attendees --</option>
                      {attendees.map(a => (
                        <option key={a.ticketId} value={a.ticketId}>
                          {a.participantName} • {a.ticketId} • {a.course || a.college}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                )}

                {(!selectedTicketId || !selectedAttendee) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Full Name *"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-[#0c0717] text-zinc-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-white/[0.1] focus:outline-none focus:border-purple-400 font-mono"
                        required={!selectedTicketId}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="College Name (e.g. KMCT College of Engineering)"
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full bg-[#0c0717] text-zinc-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-white/[0.1] focus:outline-none focus:border-purple-400 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* PART 1: RATING & DESCRIPTION FOR TRAINER: MR. NAVEEN PAUL */}
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
                        E-Cell IIT Bombay
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Rate teaching style, real startup insights, mentorship & energy
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
                        className="p-1 sm:p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
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
                  placeholder="How was Mr. Naveen Paul's training? (e.g. Teaching style, real-world examples, engagement, interaction...)"
                  className="w-full bg-[#07050f] text-zinc-100 text-xs sm:text-sm p-3.5 rounded-xl border border-white/[0.1] focus:outline-none focus:border-amber-400 placeholder:text-zinc-600 transition-colors resize-none leading-relaxed"
                  required
                />
              </div>

            </div>

            {/* ======================================================== */}
            {/* PART 2: RATING & DESCRIPTION FOR WORKSHOP & PROGRAM */}
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
                      Rate curriculum, startup frameworks, activities & arrangements
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
                        className="p-1 sm:p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
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
                  <span>Workshop Program Description & Highlights *</span>
                </label>
                <textarea
                  rows="3"
                  value={programReview}
                  onChange={(e) => setProgramReview(e.target.value)}
                  placeholder="How was the overall workshop program? (Topics covered, practical value, hands-on activities, venue & arrangements...)"
                  className="w-full bg-[#07050f] text-zinc-100 text-xs sm:text-sm p-3.5 rounded-xl border border-white/[0.1] focus:outline-none focus:border-purple-400 placeholder:text-zinc-600 transition-colors resize-none leading-relaxed"
                  required
                />
              </div>

            </div>

            {/* Recommendation Prompt */}
            <div className="p-4 rounded-2xl bg-[#07050f] border border-white/[0.08] space-y-2.5">
              <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Would you recommend this workshop & Mr. Naveen Paul to fellow students or juniors?
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
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
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

            {/* Submit & Cancel Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white bg-white/[0.03] border border-white/10 transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-8 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-950/60 hover:shadow-purple-700/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
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
