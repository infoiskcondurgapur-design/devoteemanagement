import React from 'react';
import { Calendar, User, CreditCard, ChevronRight, Bookmark } from 'lucide-react';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onViewDetails: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onViewDetails }) => {
  const isUpcoming = course.status === 'UPCOMING';
  const isOngoing = course.status === 'ONGOING';
  const isCompleted = course.status === 'COMPLETED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-6">
        {/* Top Badges & Icons */}
        <div className="flex items-center justify-between mb-4">
          {isUpcoming && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-600 border border-amber-200/60">
              Upcoming
            </span>
          )}
          {isOngoing && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              Ongoing
            </span>
          )}
          {isCompleted && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
              Completed
            </span>
          )}

          <button className="text-slate-300 hover:text-slate-500 transition-colors">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {course.description || 'No description provided.'}
          </p>
        </div>

        {/* Details List */}
        <div className="space-y-2.5 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{course.dateRange || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Instructor: {course.instructor || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-blue-600">
              Fees: ₹{course.fees}
            </span>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <button
        onClick={() => onViewDetails(course)}
        className="w-full px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 hover:bg-blue-50/50 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <span>View Details & Participants</span>
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};

