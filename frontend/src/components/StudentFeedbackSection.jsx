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
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
import { soundEffects } from '../services/sound';

export default function StudentFeedbackSection({ ticket, onSubmitted, standalone = false }) {
  const [attendees, setAttendees] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(ticket?.ticketId || '');
  const [selectedAttendee, setSelectedAttendee] = useState(ticket || null);
  
  // Feedback form fields
  const [overallRating, setOverallRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [contentRating, setContentRating] = useState(5);
  const [mentorRating, setMentorRating] = useState(5);
  const [organizationRating, setOrganizationRating] = useState(5);
  const [recommend, setRecommend] = useState('yes');
  const [likedMost, setLikedMost] = useState('');
  const [suggestions, setSuggestions] = useState('');
  
  const [customName, setCustomName] = useState('');
  const [customCollege, setCustomCollege] = useState('');
  const [customCourse, setCustomCourse] = useState('');

  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
        setOverallRating(fb.overallRating || 5);
        setContentRating(fb.contentRating || 5);
        setMentorRating(fb.mentorRating || 5);
        setOrganizationRating(fb.organizationRating || 5);
        setRecommend(fb.recommend || 'yes');
        setLikedMost(fb.likedMost || '');
        setSuggestions(fb.suggestions || '');
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

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return 'Exceptional! 🌟 Super Inspiring';
      case 4: return 'Very Good! 🚀 Great Learning';
      case 3: return 'Good 👍 Worthwhile Event';
      case 2: return 'Average 😐 Could be Better';
      case 1: return 'Needs Improvement ⚠️';
      default: return 'Select Rating';
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
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
      const tId = selectedTicketId || ticket?.ticketId || 'WALK-IN';

      const payload = {
        id: existingFeedback?.id,
        ticketId: tId,
        participantName: pName,
        college: pCollege,
        course: pCourse,
        yearOfStudy: pYear,
        email: selectedAttendee?.email || '',
        phone: selectedAttendee?.phone || '',
        overallRating,
        contentRating,
        mentorRating,
        organizationRating,
        recommend,
        likedMost: likedMost.trim(),
        suggestions: suggestions.trim(),
      };

      const saved = await api.submitFeedback(payload);
      setExistingFeedback(saved);
      setSubmitSuccess(true);
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
    <div className={`w-full max-w-[920px] mx-auto ${standalone ? 'my-6' : 'mt-8'} transition-all duration-300`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-dark-900/90 via-dark-950/90 to-purple-950/40 border border-purple-500/30 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-500/20 blur-[80px] pointer-events-none rounded-full" />
        
        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/40 shrink-0">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Student Feedback & Review
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  Illuminate 2026
                </span>
              </div>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Share your experience to help E-Cell IIT Bombay & KMCT make future editions even better
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
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs sm:text-sm text-purple-300/80 max-w-lg mx-auto mt-1.5">
                Your review has been successfully recorded for <span className="text-white font-bold">{existingFeedback.participantName}</span>. E-Cell IIT Bombay and the KMCT organizing committee appreciate your participation!
              </p>
            </div>

            {/* Submitted Overview Pill Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-purple-500/20 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Overall Rating</span>
                <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-lg">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{existingFeedback.overallRating}.0 / 5</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-purple-500/20 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Workshop Content</span>
                <div className="flex items-center justify-center gap-1 text-purple-300 font-black text-lg">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>{existingFeedback.contentRating}.0 / 5</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-purple-500/20 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">IITB Mentors</span>
                <div className="flex items-center justify-center gap-1 text-fuchsia-300 font-black text-lg">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>{existingFeedback.mentorRating}.0 / 5</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-purple-500/20 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Would Recommend</span>
                <div className="flex items-center justify-center gap-1 text-emerald-300 font-black text-lg">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span className="capitalize">{existingFeedback.recommend === 'yes' ? 'Yes!' : existingFeedback.recommend}</span>
                </div>
              </div>
            </div>

            {existingFeedback.likedMost && (
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-left">
                <span className="text-[11px] font-bold uppercase text-purple-400 flex items-center gap-1.5 mb-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                  What you liked most:
                </span>
                <p className="text-xs sm:text-sm text-purple-200/90 italic">
                  "{existingFeedback.likedMost}"
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-dark-950/90 hover:bg-purple-950 text-purple-300 hover:text-white border border-purple-600/40 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Update / Modify Feedback</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Submission Form */}
        {(!existingFeedback || isEditing) && (
          <form onSubmit={handleSubmit} className="relative z-10 pt-6 space-y-6">

            {/* Standalone Student Selector if ticket is not pre-bound */}
            {standalone && !ticket && (
              <div className="p-4 rounded-2xl bg-dark-950/60 border border-purple-500/30 space-y-3">
                <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Select Registered Attendee or Enter Your Name
                </label>
                
                {attendees.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedTicketId}
                      onChange={handleSelectAttendee}
                      className="w-full bg-dark-900 text-purple-200 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose your name from attendee list --</option>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-dark-900 text-purple-200 text-xs sm:text-sm py-2 px-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400"
                        required={!selectedTicketId}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="College Name"
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full bg-dark-900 text-purple-200 text-xs sm:text-sm py-2 px-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Overall Experience Interactive Star Rating */}
            <div className="text-center p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                How was your overall workshop experience?
              </label>

              {/* Star Rating Buttons */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoveredRating || overallRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 sm:p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 sm:w-11 sm:h-11 transition-all duration-200 ${
                          isActive 
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' 
                            : 'text-slate-600 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Reactive Dynamic Rating Label */}
              <div className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide animate-fade-in">
                {getRatingLabel(hoveredRating || overallRating)}
              </div>
            </div>

            {/* Detailed Category Breakdown Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Category 1: Workshop Content */}
              <div className="p-4 rounded-2xl bg-dark-950/60 border border-purple-500/20 space-y-2">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  Workshop Content
                </span>
                <p className="text-[11px] text-purple-300/60">Quality of startup & business curriculum</p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setContentRating(num)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        contentRating === num
                          ? 'bg-purple-600 text-white shadow-glow-purple scale-105'
                          : 'bg-dark-900/90 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40'
                      }`}
                    >
                      {num}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 2: Mentors & Speaker Delivery */}
              <div className="p-4 rounded-2xl bg-dark-950/60 border border-purple-500/20 space-y-2">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  IIT Bombay Mentors
                </span>
                <p className="text-[11px] text-purple-300/60">Speaker delivery & real-world clarity</p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMentorRating(num)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        mentorRating === num
                          ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] scale-105'
                          : 'bg-dark-900/90 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40'
                      }`}
                    >
                      {num}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 3: Event Organization */}
              <div className="p-4 rounded-2xl bg-dark-950/60 border border-purple-500/20 space-y-2">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  Organization & Venue
                </span>
                <p className="text-[11px] text-purple-300/60">Arrangements, schedule, & check-in flow</p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setOrganizationRating(num)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        organizationRating === num
                          ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105'
                          : 'bg-dark-900/90 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40'
                      }`}
                    >
                      {num}★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Net Promoter / Recommendation Question */}
            <div className="p-4 rounded-2xl bg-dark-950/60 border border-purple-500/20 space-y-2.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Would you recommend ILLUMINATE to friends or junior students?
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

            {/* Qualitative Feedback Prompts */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-1.5">
                  What did you like the most about the workshop?
                </label>
                <textarea
                  rows="2"
                  value={likedMost}
                  onChange={(e) => setLikedMost(e.target.value)}
                  placeholder="e.g. The case studies, startup ideation frameworks, hands-on pitching practice..."
                  className="w-full bg-dark-950 text-slate-100 text-xs sm:text-sm p-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400 placeholder:text-purple-300/40 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-1.5">
                  Suggestions for improvement or future workshop topics:
                </label>
                <textarea
                  rows="2"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="e.g. Would love a 2-day hackathon, investor pitching session, tech startup incubation..."
                  className="w-full bg-dark-950 text-slate-100 text-xs sm:text-sm p-3 rounded-xl border border-purple-500/30 focus:outline-none focus:border-purple-400 placeholder:text-purple-300/40 transition-colors resize-none"
                />
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
                className="w-full sm:w-auto py-3 px-8 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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
