import React, { useMemo } from 'react';
import { 
    Calendar, Award, BookOpen, MapPin, 
    Heart, Star, Flag, Sparkles, CheckCircle2 
} from 'lucide-react';
import { formatDate } from '../lib/dateUtils';
import clsx from 'clsx';

const MilestoneIcon = ({ type }) => {
    switch (type) {
        case 'registration': return <Calendar size={18} />;
        case 'initiation': return <Award size={18} />;
        case 'course': return <BookOpen size={18} />;
        case 'tour': return <MapPin size={18} />;
        case 'shelter': return <Heart size={18} />;
        case 'seva': return <Star size={18} />;
        default: return <Flag size={18} />;
    }
};

const JourneyTimeline = ({ devotee }) => {
    // Aggregate milestones from devotee data
    const milestones = useMemo(() => {
        const list = [];

        if (devotee.createdAt) {
            list.push({
                date: devotee.createdAt,
                title: 'Joined the Community',
                desc: 'Official registration in the management system.',
                type: 'registration',
                color: 'bg-blue-500'
            });
        }

        if (devotee.shelterDate) {
            list.push({
                date: devotee.shelterDate,
                title: 'Accepted Shelter',
                desc: 'Official acceptance of shelter from a spiritual master.',
                type: 'shelter',
                color: 'bg-rose-500'
            });
        }

        if (devotee.initiatedDate1) {
            list.push({
                date: devotee.initiatedDate1,
                title: 'First Initiation (Harinama)',
                desc: 'Sacred initiation into the chanting of the Holy Name.',
                type: 'initiation',
                color: 'bg-amber-500'
            });
        }

        if (devotee.initiatedDate2) {
            list.push({
                date: devotee.initiatedDate2,
                title: 'Second Initiation (Brahmin)',
                desc: 'Receiving the sacred thread and gayatri mantra.',
                type: 'initiation',
                color: 'bg-purple-600'
            });
        }

        // We can add logic to fetch courses/tours here if they were passed in
        // For now, let's stick to core devotee milestones
        
        return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [devotee]);

    if (milestones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Sparkles size={48} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Journey just beginning...</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:bg-slate-800">
            {milestones.map((ms, i) => (
                <div key={i} className="relative pl-12 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    {/* The Dot */}
                    <div className={clsx(
                        "absolute left-0 top-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110 group-hover:rotate-12 z-10",
                        ms.color
                    )}>
                        <MilestoneIcon type={ms.type} />
                    </div>

                    {/* Content Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-xl group-hover:border-slate-300 dark:border-slate-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-black text-slate-900">{ms.title}</h4>
                                <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
                                {ms.desc}
                            </p>
                        </div>
                        
                        <div className="shrink-0 text-right">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Milestone Date</p>
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 font-black text-slate-700 dark:text-slate-200 text-sm">
                                {formatDate(ms.date)}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* End Point */}
            <div className="relative pl-12">
                <div className="absolute left-[14px] bottom-0 w-3 h-3 rounded-full bg-slate-200 shadow-inner"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-2">Continuing the path...</p>
            </div>
        </div>
    );
};

export default JourneyTimeline;
