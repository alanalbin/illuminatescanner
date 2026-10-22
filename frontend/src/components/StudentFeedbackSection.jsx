import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Edit3, 
  GraduationCap, 
  User, 
  Phone, 
  BookOpen, 
  Check,
  Calendar,
  Layers,
  Award,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
import { soundEffects } from '../services/sound';

export default function StudentFeedbackSection({ ticket, onSubmitted, standalone = false }) {
  // 1. Personal Information
  const [studentName, setStudentName] = useState(ticket?.participantName || '');
  const [departmentAndCourse, setDepartmentAndCourse] = useState(ticket?.course || ticket?.batch || '');
  const [yearOfStudy, setYearOfStudy] = useState('1st year');
  const [mobileNumber, setMobileNumber] = useState(ticket?.phone || '');

  // 2. Rating Questions (Scale 1 - 5)
  // Q1: How would you rate the overall workshop? (poor -> excellent)
  const [overallWorkshopRating, setOverallWorkshopRating] = useState(5);
  // Q2: How relevant was the workshop to your academic and career goals? (Not relevant -> Extremely relevant)
  const [relevanceRating, setRelevanceRating] = useState(5);
  // Q3: How would you rate the trainer's knowledge and expertise? (Poor -> Excellent)
  const [trainerKnowledgeRating, setTrainerKnowledgeRating] = useState(5);
  // Q4: How clear and understandable were the concepts explained? (Not clear -> very clear)
  const [clarityRating, setClarityRating] = useState(5);
  // Q5: How engaging and interactive was the session? (Not engaging -> very engaging)
  const [engagementRating, setEngagementRating] = useState(5);

  // 3. Overall Feedback Description
  const [overallFeedback, setOverallFeedback] = useState('');

  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync ticket prop if passed
  useEffect(() => {
    if (ticket) {
      if (ticket.participantName) setStudentName(ticket.participantName);
      if (ticket.phone) setMobileNumber(ticket.phone);
      if (ticket.course || ticket.batch) setDepartmentAndCourse(ticket.course || ticket.batch);
      if (ticket.yearOfStudy) setYearOfStudy(ticket.yearOfStudy);

      const fb = localAttendanceStore.getFeedbackByTicketId(ticket.ticketId);
      if (fb) {
        setExistingFeedback(fb);
        if (fb.studentName || fb.participantName) setStudentName(fb.studentName || fb.participantName);
        if (fb.departmentAndCourse || fb.batch || fb.course) setDepartmentAndCourse(fb.departmentAndCourse || fb.batch || fb.course);
        if (fb.yearOfStudy) setYearOfStudy(fb.yearOfStudy);
        if (fb.mobileNumber || fb.phone) setMobileNumber(fb.mobileNumber || fb.phone);
        if (fb.overallWorkshopRating) setOverallWorkshopRating(Number(fb.overallWorkshopRating));
        if (fb.relevanceRating) setRelevanceRating(Number(fb.relevanceRating));
        if (fb.trainerKnowledgeRating) setTrainerKnowledgeRating(Number(fb.trainerKnowledgeRating));
        if (fb.clarityRating) setClarityRating(Number(fb.clarityRating));
        if (fb.engagementRating) setEngagementRating(Number(fb.engagementRating));
        if (fb.overallFeedback) setOverallFeedback(fb.overallFeedback);
      }
    }
  }, [ticket]);

  // Check if existing review exists by phone
  const checkExistingUserFeedback = (phoneNumber) => {
    const list = localAttendanceStore.getFeedbacks();
    const cleanPh = String(phoneNumber || '').replace(/\D/g, '');

    const found = list.find(f => 
      cleanPh && cleanPh.length >= 7 && (
        (f.mobileNumber && String(f.mobileNumber).replace(/\D/g, '') === cleanPh) ||
        (f.phone && String(f.phone).replace(/\D/g, '') === cleanPh)
      )
    );

    if (found && !isEditing) {
      setExistingFeedback(found);
      if (found.studentName || found.participantName) setStudentName(found.studentName || found.participantName);
      if (found.departmentAndCourse || found.batch || found.course) setDepartmentAndCourse(found.departmentAndCourse || found.batch || found.course);
      if (found.yearOfStudy) setYearOfStudy(found.yearOfStudy);
      if (found.overallWorkshopRating) setOverallWorkshopRating(Number(found.overallWorkshopRating));
      if (found.relevanceRating) setRelevanceRating(Number(found.relevanceRating));
      if (found.trainerKnowledgeRating) setTrainerKnowledgeRating(Number(found.trainerKnowledgeRating));
      if (found.clarityRating) setClarityRating(Number(found.clarityRating));
      if (found.engagementRating) setEngagementRating(Number(found.engagementRating));
      if (found.overallFeedback) setOverallFeedback(found.overallFeedback);
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
    if (!studentName.trim()) {
      alert('Please enter your student name.');
      return;
    }
    if (!departmentAndCourse.trim()) {
      alert('Please enter your department and course.');
      return;
    }
    if (!yearOfStudy) {
      alert('Please select your year of study.');
      return;
    }
    if (!mobileNumber.trim()) {
      alert('Please enter your mobile number.');
      return;
    }
    if (!overallFeedback.trim()) {
      alert('Please provide your overall feedback about the event and organization.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: existingFeedback?.id,
        ticketId: ticket?.ticketId || 'STUDENT-WALKIN',
        studentName: studentName.trim(),
        participantName: studentName.trim(),
        departmentAndCourse: departmentAndCourse.trim(),
        batch: departmentAndCourse.trim(),
        yearOfStudy,
        mobileNumber: mobileNumber.trim(),
        phone: mobileNumber.trim(),
        overallWorkshopRating,
        relevanceRating,
        trainerKnowledgeRating,
        clarityRating,
        engagementRating,
        overallFeedback: overallFeedback.trim(),
        trainerName: 'Mr. Naveen Paul',
        trainerRating: trainerKnowledgeRating,
        trainerReview: overallFeedback.trim(),
        orgTeamRating: overallWorkshopRating,
        programRating: overallWorkshopRating,
        overallRating: Math.round(((overallWorkshopRating + relevanceRating + trainerKnowledgeRating + clarityRating + engagementRating) / 5) * 10) / 10,
        submittedAt: new Date().toISOString(),
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

  // Reusable 1-5 Scale Rating Component matching Google Form questions
  const RatingScaleQuestion = ({ 
    number, 
    question, 
    lowLabel, 
    highLabel, 
    value, 
    onChange,
    colorClass = 'purple'
  }) => {
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
        <label className="block text-xs sm:text-sm font-semibold text-white">
          <span className="text-purple-400 font-mono mr-1.5">{number}.</span>
          {question} <span className="text-purple-400">*</span>
        </label>

        <div className="pt-1">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-md mx-auto">
            {[1, 2, 3, 4, 5].map((val) => {
              const isSelected = value === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange(val)}
                  className={`py-3 rounded-xl font-bold text-sm sm:text-base transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-b from-purple-600 to-indigo-600 text-white border-purple-400/80 shadow-lg shadow-purple-950/60 scale-105'
                      : 'bg-black/40 text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/10'
                  }`}
                >
                  <span>{val}</span>
                  <Star className={`w-3 h-3 ${isSelected ? 'fill-white text-white' : 'text-zinc-600'}`} />
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 mt-2.5 px-1 max-w-md mx-auto">
            <span className="text-zinc-500 uppercase tracking-wider">{lowLabel}</span>
            <span className="text-purple-300 font-semibold uppercase tracking-wider">{highLabel}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-[840px] mx-auto ${standalone ? 'my-2' : 'mt-6'} font-sans`}>
      {/* Main Glass Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0b0816]/95 border border-white/[0.12] p-5 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Official Header & Intro Notice */}
        <div className="relative z-10 pb-5 border-b border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
              ILLUMINATE Feedback Form
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
              E-Cell IIT Bombay
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2">
            <p>
              Thank you for participating in <strong className="text-white">ILLUMINATE 2026 – Entrepreneurship Workshop</strong>, conducted by <strong className="text-purple-300">E-Cell IIT Bombay</strong> at <strong className="text-white">KMCT College of Engineering for Emerging Technologies and Management, Kasaragod</strong>, on 22 October 2026.
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Illuminate aims to encourage entrepreneurial thinking and develop business acumen through learning about business models, finance, and startup fundamentals. Your feedback will help us understand your learning experience, evaluate the session, and improve future programs. Please answer honestly. Thank you for being part of Illuminate! 🚀
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
            <span>* Indicates required question</span>
            <span className="text-purple-400">Resource Person: Mr. Naveen Paul</span>
          </div>
        </div>

        {/* If feedback already submitted and not editing: show confirmation */}
        {existingFeedback && !isEditing && (
          <div className="relative z-10 py-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Feedback Submitted Successfully
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
                Thank you, <strong className="text-white">{existingFeedback.studentName || existingFeedback.participantName}</strong> ({existingFeedback.departmentAndCourse || existingFeedback.batch})! Your responses have been recorded and synced to the official records.
              </p>
            </div>

            {/* Quick Ratings Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-xl mx-auto pt-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                <span className="text-zinc-400 text-[10px] block">Overall</span>
                <span className="text-purple-300 font-bold text-sm">{existingFeedback.overallWorkshopRating || 5}.0 / 5</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                <span className="text-zinc-400 text-[10px] block">Relevance</span>
                <span className="text-purple-300 font-bold text-sm">{existingFeedback.relevanceRating || 5}.0 / 5</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                <span className="text-zinc-400 text-[10px] block">Trainer</span>
                <span className="text-amber-300 font-bold text-sm">{existingFeedback.trainerKnowledgeRating || 5}.0 / 5</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                <span className="text-zinc-400 text-[10px] block">Clarity</span>
                <span className="text-purple-300 font-bold text-sm">{existingFeedback.clarityRating || 5}.0 / 5</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-zinc-400 text-[10px] block">Engagement</span>
                <span className="text-purple-300 font-bold text-sm">{existingFeedback.engagementRating || 5}.0 / 5</span>
              </div>
            </div>

            {existingFeedback.overallFeedback && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 max-w-xl mx-auto text-left">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Your Feedback:</span>
                <p className="text-xs text-zinc-200 italic leading-relaxed">"{existingFeedback.overallFeedback}"</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Edit Your Response</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Submission Form */}
        {(!existingFeedback || isEditing) && (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">

            {/* ======================================================== */}
            {/* PART 1: STUDENT DETAILS                                  */}
            {/* ======================================================== */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-4">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span>Student Details</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. student name * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    student name <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter student name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-[#07050e] text-white text-sm px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                {/* 2. department and course * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    department and course <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter department and course"
                    value={departmentAndCourse}
                    onChange={(e) => setDepartmentAndCourse(e.target.value)}
                    className="w-full bg-[#07050e] text-white text-sm px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                {/* 3. year of study * (1st year / 2nd year) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    year of study <span className="text-purple-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['1st year', '2nd year'].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setYearOfStudy(yr)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                          yearOfStudy === yr
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/60'
                            : 'bg-[#07050e] text-zinc-400 hover:text-white border-white/10'
                        }`}
                      >
                        {yearOfStudy === yr && <Check className="w-3 h-3 text-white" />}
                        <span>{yr}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. mobile number * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    mobile number <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    onBlur={() => checkExistingUserFeedback(mobileNumber)}
                    className="w-full bg-[#07050e] text-white text-sm px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PART 2: 5 OFFICIAL EVALUATION QUESTIONS (1-5 SCALE)      */}
            {/* ======================================================== */}

            {/* Question 1 */}
            <RatingScaleQuestion
              number={1}
              question="How would you rate the overall workshop?"
              lowLabel="poor"
              highLabel="excellent"
              value={overallWorkshopRating}
              onChange={setOverallWorkshopRating}
            />

            {/* Question 2 */}
            <RatingScaleQuestion
              number={2}
              question="How relevant was the workshop to your academic and career goals?"
              lowLabel="Not relevant"
              highLabel="Extremely relevant"
              value={relevanceRating}
              onChange={setRelevanceRating}
            />

            {/* Question 3 */}
            <RatingScaleQuestion
              number={3}
              question="How would you rate the trainer's knowledge and expertise?"
              lowLabel="Poor"
              highLabel="Excellent"
              value={trainerKnowledgeRating}
              onChange={setTrainerKnowledgeRating}
            />

            {/* Question 4 */}
            <RatingScaleQuestion
              number={4}
              question="How clear and understandable were the concepts explained?"
              lowLabel="Not clear"
              highLabel="very clear"
              value={clarityRating}
              onChange={setClarityRating}
            />

            {/* Question 5 */}
            <RatingScaleQuestion
              number={5}
              question="How engaging and interactive was the session?"
              lowLabel="Not engaging"
              highLabel="very engaging"
              value={engagementRating}
              onChange={setEngagementRating}
            />

            {/* ======================================================== */}
            {/* PART 3: OVERALL FEEDBACK ABOUT EVENT & ORGANIZATION     */}
            {/* ======================================================== */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-white">
                <span className="text-purple-400 font-mono mr-1.5">6.</span>
                overall feedback about event and organization <span className="text-purple-400">*</span>
              </label>
              <textarea
                rows="3"
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                placeholder="Write your feedback about the workshop, arrangements, event organization and trainer..."
                className="w-full bg-[#07050e] text-zinc-100 text-xs sm:text-sm p-3.5 rounded-lg border border-white/[0.1] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 placeholder:text-zinc-600 transition-all resize-none outline-none font-sans"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
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
                className="w-full sm:w-auto py-3 px-8 rounded-full font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/60 transition-all disabled:opacity-50 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Feedback...</span>
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
