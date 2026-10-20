import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, IndianRupee, RotateCcw, CheckCircle, ShieldAlert } from 'lucide-react';

const CancelRefundModal = ({
    isOpen,
    onClose,
    participant,
    itemType = 'Tour',
    itemTitle = '',
    onConfirm,
    isExistingCancelled = false
}) => {
    const [refundType, setRefundType] = useState('full'); // 'full', 'partial', 'none'
    const [partialAmount, setPartialAmount] = useState('');
    const [refundMode, setRefundMode] = useState('Cash');
    const [reason, setReason] = useState('');
    const [targetStatus, setTargetStatus] = useState('Cancelled');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const name = participant 
        ? (participant.initiatedName || participant.devoteeName || participant.devoteename || participant.guestName || 'Participant')
        : 'Participant';

    const netPaid = Math.max(0, Number(participant?.totalPaid || 0));
    const alreadyRefunded = Math.max(0, Number(participant?.totalRefunded || participant?.totalrefunded || 0));
    const totalReceived = Math.max(netPaid + alreadyRefunded, Number(participant?.totalReceived || participant?.totalreceived || netPaid));

    // The maximum amount available to refund right now is whatever net paid balance remains
    const refundableBalance = netPaid;

    useEffect(() => {
        if (isOpen) {
            if (refundableBalance > 0) {
                setRefundType('full');
                setPartialAmount(String(refundableBalance));
            } else {
                setRefundType('none');
                setPartialAmount('0');
            }
            setRefundMode('Cash');
            setReason('');
            setTargetStatus(participant?.status === 'Dropped' ? 'Dropped' : 'Cancelled');
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen, participant, refundableBalance]);

    if (!isOpen || !participant) return null;

    let computedRefundAmount = 0;
    if (refundType === 'full') {
        computedRefundAmount = refundableBalance;
    } else if (refundType === 'partial') {
        computedRefundAmount = parseFloat(partialAmount) || 0;
    } else {
        computedRefundAmount = 0;
    }

    const deductionAmount = Math.max(0, refundableBalance - computedRefundAmount);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (refundType === 'partial') {
            const parsed = parseFloat(partialAmount);
            if (isNaN(parsed) || parsed <= 0) {
                setError('Please enter a valid refund amount greater than 0.');
                return;
            }
            if (parsed > refundableBalance) {
                setError(`Refund amount cannot exceed the remaining balance of ₹${refundableBalance.toLocaleString('en-IN')}.`);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            await onConfirm({
                enrollmentId: participant.id,
                refundAmount: computedRefundAmount,
                refundMode: computedRefundAmount > 0 ? refundMode : 'N/A',
                reason: reason.trim() || (computedRefundAmount > 0 ? `Refund via ${refundMode}` : 'Cancelled without refund'),
                newStatus: isExistingCancelled ? (participant.status || 'Cancelled') : targetStatus
            });
            onClose();
        } catch (err) {
            console.error('Refund processing error:', err);
            setError(err?.message || 'Failed to process cancellation and refund. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center font-bold">
                            {isExistingCancelled ? <RotateCcw size={20} /> : <AlertTriangle size={20} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                                {isExistingCancelled ? 'Process Refund' : `Cancel & Refund ${itemType}`}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {name} &bull; {itemTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                            <ShieldAlert size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Balance Summary Cards */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Paid</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">₹{totalReceived.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Refunded</p>
                            <p className="text-sm font-black text-amber-600 mt-0.5">₹{alreadyRefunded.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Refundable</p>
                            <p className="text-sm font-black text-emerald-600 mt-0.5">₹{refundableBalance.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Status Selection (only for active participants) */}
                    {!isExistingCancelled && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                                Set Status To
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetStatus('Cancelled')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                        targetStatus === 'Cancelled'
                                            ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    Cancelled
                                </button>
                                {itemType === 'Course' ? (
                                    <button
                                        type="button"
                                        onClick={() => setTargetStatus('Dropped')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                            targetStatus === 'Dropped'
                                                ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        Dropped
                                    </button>
                                ) : (
                                    <div className="py-2 px-3 rounded-xl text-xs font-medium text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        Booking Cancellation
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Refund Options */}
                    {refundableBalance > 0 ? (
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Refund Amount Option
                            </label>

                            <div className="space-y-2">
                                {/* Full Refund Option */}
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    refundType === 'full' 
                                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="refundType"
                                        checked={refundType === 'full'}
                                        onChange={() => setRefundType('full')}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Full Refund</span>
                                            <span className="text-sm font-black text-emerald-600">₹{refundableBalance.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Return the full paid balance to the devotee.</p>
                                    </div>
                                </label>

                                {/* Partial Refund Option */}
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    refundType === 'partial' 
                                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="refundType"
                                        checked={refundType === 'partial'}
                                        onChange={() => {
                                            setRefundType('partial');
                                            if (!partialAmount || Number(partialAmount) <= 0) {
                                                setPartialAmount(String(Math.round(refundableBalance * 0.8)));
                                            }
                                        }}
                                        className="mt-1 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Partial Refund</span>
                                            <span className="text-xs font-semibold text-amber-600">Custom Deduction</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Apply a cancellation fee or partial refund.</p>

                                        {refundType === 'partial' && (
                                            <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={refundableBalance}
                                                            value={partialAmount}
                                                            onChange={(e) => setPartialAmount(e.target.value)}
                                                            placeholder="Amount to refund"
                                                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black focus:ring-2 focus:ring-amber-500 outline-none"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                                                    <span>Refunding: ₹{(parseFloat(partialAmount) || 0).toLocaleString('en-IN')}</span>
                                                    <span>Deduction Retained: ₹{deductionAmount.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                {/* No Refund Option */}
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    refundType === 'none' 
                                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-500 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="refundType"
                                        checked={refundType === 'none'}
                                        onChange={() => setRefundType('none')}
                                        className="mt-1 text-rose-600 focus:ring-rose-500"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">No Refund (₹0)</span>
                                            <span className="text-sm font-black text-rose-600">₹0</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Non-refundable policy. Entire balance remains with the temple.</p>
                                    </div>
                                </label>
                            </div>

                            {/* Refund Payment Mode */}
                            {computedRefundAmount > 0 && (
                                <div className="space-y-1.5 pt-2">
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        Refund Mode / Channel
                                    </label>
                                    <select
                                        value={refundMode}
                                        onChange={(e) => setRefundMode(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                            <CheckCircle className="mx-auto text-slate-400 mb-1" size={24} />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {alreadyRefunded > 0 
                                    ? `Total of ₹${alreadyRefunded.toLocaleString('en-IN')} has already been refunded.` 
                                    : 'No payments have been recorded for this participant.'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {isExistingCancelled 
                                    ? 'No further refund can be issued.' 
                                    : 'Cancellation will be saved with ₹0 refund.'}
                            </p>
                        </div>
                    )}

                    {/* Reference / Reason */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Cancellation & Refund Reason / Note
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Devotee health reasons, family emergency, scheduling conflict..."
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                    </div>

                    {/* Summary Callout */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-950 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Refund Payout</p>
                            <p className="text-xl font-black text-emerald-400">
                                ₹{computedRefundAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                        {refundableBalance > 0 && (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Retained / Fee</p>
                                <p className="text-sm font-bold text-slate-300">
                                    ₹{deductionAmount.toLocaleString('en-IN')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (isExistingCancelled && refundableBalance <= 0)}
                            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={15} />
                                    <span>
                                        {isExistingCancelled 
                                            ? `Confirm ₹${computedRefundAmount.toLocaleString('en-IN')} Refund` 
                                            : computedRefundAmount > 0 
                                                ? `Cancel & Refund ₹${computedRefundAmount.toLocaleString('en-IN')}` 
                                                : 'Confirm Cancellation'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CancelRefundModal;
