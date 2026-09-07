import React from 'react';
import { formatDate } from '../../lib/dateUtils';
import { numberToWords } from '../../lib/numberUtils';

const MoneyReceipt = React.forwardRef(({ donation }, ref) => {
    if (!donation) return null;

    const formattedDate = formatDate(donation.date);

    return (
        <div className="absolute opacity-0 pointer-events-none overflow-hidden" style={{ width: '850px' }}>
            <div ref={ref} className="bg-white dark:bg-slate-900 p-16 border-[12px] border-emerald-800 relative" style={{ width: '800px', minHeight: '500px', fontFamily: "'Inter', sans-serif" }}>
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800 clip-path-polygon-[100%_0,0_0,100%_100%] opacity-10"></div>
                
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="ISKCON Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
                    <h1 className="text-5xl font-black text-emerald-800 uppercase tracking-tight mb-1">ISKCON DURGAPUR</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">International Society for Krishna Consciousness</p>
                    <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 mt-2">B-II/29, Netaji Subhash Chandra Road, A-Zone, Durgapur, 713204</p>
                    <div className="flex items-center justify-center gap-4 my-6">
                        <div className="h-px bg-slate-300 flex-1"></div>
                        <h2 className="text-xl font-bold bg-emerald-800 text-white px-6 py-1.5 rounded-full uppercase tracking-widest">Official Money Receipt</h2>
                        <div className="h-px bg-slate-300 flex-1"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 text-[15px]">
                    <div className="space-y-5">
                        <div className="border-l-4 border-emerald-600 pl-4">
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Receipt Information</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">No: <span className="text-emerald-700">#REC-{String(donation.id).padStart(5, '0')}</span></p>
                            <p className="text-slate-600 dark:text-slate-300 font-medium">Date: {formattedDate}</p>
                        </div>
                        
                        <div className="border-l-4 border-emerald-600 pl-4 mt-6">
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Donor Details</p>
                            <p className="text-xl font-black text-slate-900 uppercase">{donation.initiatedName || donation.devoteeNameFull || donation.devoteeName || 'General Donor'}</p>
                            <p className="text-slate-600 dark:text-slate-300 font-medium">{donation.mobile ? `Contact: ${donation.mobile}` : 'Contact: Not Provided'}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-3">Transaction Summary</p>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Purpose</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{donation.purpose}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Payment Mode</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{donation.mode}</span>
                                </div>
                                {donation.reference && (
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <span className="text-slate-500 dark:text-slate-400">Reference</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{donation.reference}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">₹{(Number(donation.totalAmount) || Number(donation.amount)).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Paid Today</p>
                            <p className="text-xl font-bold text-emerald-600">₹{Number(donation.amount).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Balance Due</p>
                            <p className="text-xl font-bold text-red-500">₹{(Number(donation.dueAmount) || 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-8 bg-emerald-900 rounded-2xl flex flex-col shadow-lg ring-4 ring-emerald-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-200 font-black text-xs uppercase tracking-widest mb-1">Amount Received</p>
                            <p className="text-2xl font-black text-white flex items-baseline gap-1">
                                <span className="text-lg opacity-70 font-normal">₹</span>
                                {Number(donation.amount).toLocaleString('en-IN')}
                                <span className="text-sm opacity-50 font-normal ml-2">/- Only</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-serif italic text-white mb-1 mr-4">A.</p>
                            <div className="w-40 h-px bg-emerald-400/30 mb-2 ml-auto"></div>
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-800/50">
                        <p className="text-emerald-200/70 text-[11px] font-bold uppercase tracking-wider italic">
                            In Words: {numberToWords(donation.amount)}
                        </p>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-emerald-800 font-bold italic text-sm mb-1">
                        "Whatever you do, whatever you eat, whatever you offer or give away, and whatever austerities you perform—do that as an offering to Me."
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-tighter">— Bhagavad Gita 9.27 —</p>
                </div>
            </div>
        </div>
    );
});

export default MoneyReceipt;
