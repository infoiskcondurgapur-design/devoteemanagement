import React, { useState } from 'react';
import { X, Calendar, User, CreditCard, Users, Plus } from 'lucide-react';
import type { Course, Participant } from '../types';

interface CourseDetailsModalProps {
  course: Course | null;
  onClose: () => void;
  onAddParticipant: (courseId: string, participant: Participant) => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  onClose,
  onAddParticipant,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [devoteeName, setDevoteeName] = useState('');
  const [contact, setContact] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING' | 'EXEMPTED'>('PAID');

  if (!course) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeName.trim()) return;

    const newParticipant: Participant = {
      id: `p-${Date.now()}`,
      name: devoteeName.trim(),
      contact: contact.trim() || 'N/A',
      paymentStatus,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    onAddParticipant(course.id, newParticipant);
    setDevoteeName('');
    setContact('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  course.status === 'UPCOMING'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : course.status === 'ONGOING'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {course.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{course.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Info Cards */}
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/20">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-xs truncate">
              <div className="text-slate-400 font-medium">Schedule</div>
              <div className="font-semibold text-slate-800">{course.dateRange}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70">
            <User className="w-4 h-4 text-purple-600 shrink-0" />
            <div className="text-xs truncate">
              <div className="text-slate-400 font-medium">Instructor</div>
              <div className="font-semibold text-slate-800">{course.instructor}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70">
            <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-xs truncate">
              <div className="text-slate-400 font-medium">Fees</div>
              <div className="font-semibold text-slate-800">₹{course.fees}</div>
            </div>
          </div>
        </div>

        {/* Participants Header */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-800">
              Enrolled Devotees ({course.participants.length})
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Cancel' : 'Enroll Devotee'}
          </button>
        </div>

        {/* Enroll Devotee Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 mx-6 my-2 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Devotee Name *</label>
                <input
                  type="text"
                  required
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  placeholder="e.g. Radhanath Das"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91 99999 88888"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fee Payment</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="EXEMPTED">Exempted</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Save Enrollment
              </button>
            </div>
          </form>
        )}

        {/* Participants Table / List */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {course.participants.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No participants enrolled in this course yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {course.participants.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.contact}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : p.paymentStatus === 'PENDING'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p.paymentStatus}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {p.joinedDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

