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
  Zap,
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

  // Load registered attendees if standalone or selecting
  useEffect(() => {
    try {
      const list = localAttendanceStore.getTickets();
      setAttendees(list);
    } catch (e) {
      console.warn('Could not load attendees for feedback:', e);
    }
  }, []);

  // Update selected attendee when prop ticket changes or dropdown changes
  useEffect(() => {
    if (ticket) {
      setSelectedAttendee(ticket);
      setSelectedTicketId(ticket.ticketId);
    }
  }, [ticket]);

  // Check if existing feedback already exists for this ticket
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
      case 5: return 'Exceptional! 🌟 Engaging & Highly Insightful';
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
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
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
    <div className={`w-full max-w-[920px] mx-auto ${standalone ? 'my-4' : 'mt-8'} transition-all duration-300`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-dark-900/95 via-dark-950/95 to-purple-950/50 border border-purple-500/30 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-500/25 blur-[90px] pointer-events-none rounded-full" />
        
        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 shrink-0">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  Student Feedback & Review
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Official Survey
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
                Rate trainer <strong>Mr. Naveen Paul</strong> and the <strong>ILLUMINATE 2026</strong> workshop program
              </p>
            </div>
          </div>

          {/* Student Identification Pill */}
          {(selectedAttendee || ticket) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/30 text-xs text-purple-200 self-start sm:self-auto">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">{selectedAttendee?.participantName || ticket?.participantName}</span>
              <span className="font-mono text-[10px] text-purple-400">({selectedAttendee?.ticketId || ticket?.ticketId})</span>
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
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Feedback Recorded Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-purple-300/80 max-w-lg mx-auto mt-1.5">
                Thank you, <span className="text-white font-bold">{existingFeedback.participantName}</span>! Your rating for trainer <strong className="text-amber-300">Mr. Naveen Paul</strong> and the <strong className="text-purple-300">ILLUMINATE 2026</strong> workshop has been saved.
              </p>
            </div>

            {/* Submitted Overview Pill Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
              {/* Trainer Review Card */}
              <div className="p-4 rounded-2xl bg-dark-950/70 border border-amber-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    Trainer: Mr. Naveen Paul
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-black text-sm bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{existingFeedback.trainerRating || existingFeedback.mentorRating || 5}.0 / 5</span>
                  </div>
                </div>
                {existingFeedback.trainerReview && (
                  <p className="text-xs text-purple-200/90 italic bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20">
                    "{existingFeedback.trainerReview}"
                  </p>
                )}
              </div>

              {/* Program Review Card */}
              <div className="p-4 rounded-2xl bg-dark-950/70 border border-purple-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Workshop Program: ILLUMINATE
                  </span>
                  <div className="flex items-center gap-1 text-purple-300 font-black text-sm bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                    <Star className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                    <span>{existingFeedback.programRating || existingFeedback.overallRating || 5}.0 / 5</span>
                  </div>
                </div>
                {existingFeedback.programReview && (
                  <p className="text-xs text-purple-200/90 italic bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20">
                    "{existingFeedback.programReview}"
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-dark-950/90 hover:bg-purple-950 text-purple-300 hover:text-white border border-purple-600/40 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Edit / Update Feedback</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Submission Form */}
        {(!existingFeedback || isEditing) && (
          <form onSubmit={handleSubmit} className="relative z-10 pt-6 space-y-6">

            {/* Standalone Student Selector if ticket is not pre-bound */}
            {standalone && !ticket && (
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-950/70 border border-purple-500/30 space-y-3 shadow-inner">
                <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Student Identification (Select Your Name or Enter Details)</span>
                </label>
                
                {attendees.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedTicketId}
                      onChange={handleSelectAttendee}
                      className="w-full bg-dark-900 text-purple-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose your name from registered attendees --</option>
                      {attendees.map(a => (
                        <option key={a.ticketId} value={a.ticketId}>
                          {a.participantName} &bull; {a.ticketId} &bull; {a.course || a.college}
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
                        className="w-full bg-dark-900 text-purple-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400"
                        required={!selectedTicketId}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="College Name (e.g. KMCT College of Engineering)"
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full bg-dark-900 text-purple-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* PART 1: RATING & DESCRIPTION FOR TRAINER: MR. NAVEEN PAUL */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 via-dark-950/80 to-purple-950/40 border border-amber-500/40 space-y-4 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-dark-950 font-black shadow-md">
                    <User className="w-5 h-5 text-dark-950" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>Trainer Rating: Mr. Naveen Paul</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                        E-Cell IIT Bombay
                      </span>
                    </h3>
                    <p className="text-xs text-purple-300/70">
                      Rate his teaching style, real-world startup insights, clarity, and mentorship
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-400 self-start sm:self-auto font-mono bg-dark-900/90 px-3 py-1 rounded-xl border border-amber-500/30">
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
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]' 
                              : 'text-slate-700 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-300 animate-fade-in">
                  {getTrainerSentiment(hoveredTrainerRating || trainerRating)}
                </div>
              </div>

              {/* Description / Review for Mr. Naveen Paul */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trainer Review & Feedback (Mr. Naveen Paul) *</span>
                </label>
                <textarea
                  rows="3"
                  value={trainerReview}
                  onChange={(e) => setTrainerReview(e.target.value)}
                  placeholder="Describe your experience with Mr. Naveen Paul (e.g. How well did he explain concepts? What did you like most about his presentation style, case studies, or energy?)"
                  className="w-full bg-dark-950 text-slate-100 text-xs sm:text-sm p-3.5 rounded-xl border border-amber-500/30 focus:outline-none focus:border-amber-400 placeholder:text-purple-300/40 transition-colors resize-none"
                  required
                />
              </div>

            </div>

            {/* ======================================================== */}
            {/* PART 2: RATING & DESCRIPTION FOR WORKSHOP & PROGRAM */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-950/30 via-dark-950/80 to-indigo-950/40 border border-purple-500/40 space-y-4 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>Workshop & Program Rating: ILLUMINATE 2026</span>
                    </h3>
                    <p className="text-xs text-purple-300/70">
                      Rate overall curriculum, ideation framework, arrangements, and key takeaways
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-purple-300 self-start sm:self-auto font-mono bg-dark-900/90 px-3 py-1 rounded-xl border border-purple-500/30">
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
                              ? 'text-purple-400 fill-purple-400 filter drop-shadow-[0_0_14px_rgba(168,85,247,0.7)]' 
                              : 'text-slate-700 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs sm:text-sm font-bold text-purple-300 animate-fade-in">
                  {getProgramSentiment(hoveredProgramRating || programRating)}
                </div>
              </div>

              {/* Description / Review for Workshop Program */}
              <div>
                <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Workshop Program Description & Highlights *</span>
                </label>
                <textarea
                  rows="3"
                  value={programReview}
                  onChange={(e) => setProgramReview(e.target.value)}
                  placeholder="Describe your overall experience of the Illuminate workshop (e.g. What startup ideas did you explore? How useful was the content? What improvements or topics would you suggest for next time?)"
                  className="w-full bg-dark-950 text-slate-100 text-xs sm:text-sm p-3.5 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400 placeholder:text-purple-300/40 transition-colors resize-none"
                  required
                />
              </div>

            </div>

            {/* Recommendation Prompt */}
            <div className="p-4 rounded-2xl bg-dark-950/60 border border-purple-500/20 space-y-2.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Would you recommend this workshop & Mr. Naveen Paul to junior students or friends?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'yes', label: 'Definitely! 🚀', activeClass: 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' },
                  { value: 'maybe', label: 'Maybe 👍', activeClass: 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' },
                  { value: 'no', label: 'Not Really 👎', activeClass: 'bg-rose-700 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecommend(option.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      recommend === option.value
                        ? option.activeClass
                        : 'bg-dark-900/80 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40'
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
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-purple-300 hover:text-white bg-dark-950 border border-purple-700/40 transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-8 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
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
