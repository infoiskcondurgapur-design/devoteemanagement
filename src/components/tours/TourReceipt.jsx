import React from 'react';
import { formatDate } from '../../lib/dateUtils';
import { numberToWords } from '../../lib/numberUtils';

const TourReceipt = React.forwardRef(({ booking }, ref) => {
    if (!booking) return null;
    const displayName = booking.guestName || booking.initiatedName || booking.devoteeName || 'Pilgrim';

    return (
        <div className="absolute opacity-0 pointer-events-none overflow-hidden" style={{ width: '850px' }}>
            <div ref={ref} className="bg-white dark:bg-slate-900 p-16 border-[12px] border-orange-800 relative" style={{ width: '800px', minHeight: '500px', fontFamily: "'Inter', sans-serif" }}>
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-800 opacity-10" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>

                <div className="text-center mb-8">
                    <img src="/logo.png" alt="ISKCON Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
                    <h1 className="text-5xl font-black text-orange-800 uppercase tracking-tight mb-1">ISKCON DURGAPUR</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">International Society for Krishna Consciousness</p>
                    <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 mt-2">B-II/29, Netaji Subhash Chandra Road, A-Zone, Durgapur, 713204</p>
                    <div className="flex items-center justify-center gap-4 my-6">
                        <div className="h-px bg-slate-300 flex-1"></div>
                        <h2 className="text-xl font-bold bg-orange-800 text-white px-6 py-1.5 rounded-full uppercase tracking-widest">Yatra Booking Receipt</h2>
                        <div className="h-px bg-slate-300 flex-1"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 text-[15px]">
                    <div className="space-y-5">
                        <div className="border-l-4 border-orange-600 pl-4">
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Booking Information</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">No: <span className="text-orange-700">#YATRA-{String(booking.enrollmentId).padStart(5, '0')}</span></p>
                            <p className="text-slate-600 dark:text-slate-300 font-medium">Date: {formatDate(booking.bookingDate)}</p>
                        </div>

                        <div className="border-l-4 border-orange-600 pl-4 mt-6">
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Pilgrim Details</p>
                            <p className="text-xl font-black text-slate-900 uppercase">{displayName}</p>
                            <p className="text-slate-600 dark:text-slate-300 font-medium">{booking.mobile ? `Contact: ${booking.mobile}` : 'Contact: Not Provided'}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-3">Tour Details</p>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Tour</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{booking.tourName}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Destination</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{booking.destination || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Payment Mode</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{booking.mode}</span>
                                </div>
                                {booking.reference && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Reference</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{booking.reference}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tour Fees</p>
                            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">₹{Number(booking.tourFees || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Paid Now</p>
                            <p className="text-xl font-bold text-orange-600">₹{Number(booking.paidAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Balance Due</p>
                            <p className="text-xl font-bold text-red-500">₹{Number(booking.dueAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-8 bg-orange-900 rounded-2xl flex flex-col shadow-lg ring-4 ring-orange-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-200 font-black text-xs uppercase tracking-widest mb-1">Amount Received</p>
                            <p className="text-2xl font-black text-white flex items-baseline gap-1">
                                <span className="text-lg opacity-70 font-normal">₹</span>
                                {Number(booking.paidAmount || 0).toLocaleString('en-IN')}
                                <span className="text-sm opacity-50 font-normal ml-2">/- Only</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-white mb-2">Abhijit Maji</p>
                            <div className="w-40 h-px bg-orange-400/30 mb-2 ml-auto"></div>
                            <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-orange-800/50">
                        <p className="text-orange-200/70 text-[11px] font-bold uppercase tracking-wider italic">
                            In Words: {numberToWords(booking.paidAmount || 0)}
                        </p>
                    </div>
                </div>

                <div className="mt-10 mb-2 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-orange-800 font-bold italic text-3xl opacity-30 select-none pointer-events-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Happy Journey
                    </p>
                </div>
            </div>
        </div>
    );
});

TourReceipt.displayName = 'TourReceipt';
export default TourReceipt;
