'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateToYYYYMMDD } from '@/utils/time';

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ currentDate, onDateChange }: DateNavigatorProps) {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date>(() => new Date(0));

  useEffect(() => {
    setToday(new Date());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between gap-3 py-3 px-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl my-4 animate-pulse">
        <div className="h-6 w-48 bg-zinc-800 rounded"></div>
        <div className="h-6 w-32 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  const isToday =
    formatDateToYYYYMMDD(currentDate) === formatDateToYYYYMMDD(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    formatDateToYYYYMMDD(currentDate) === formatDateToYYYYMMDD(yesterday);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    formatDateToYYYYMMDD(currentDate) === formatDateToYYYYMMDD(tomorrow);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    onDateChange(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    onDateChange(next);
  };

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    onDateChange(selected);
  };

  // Convert currentDate to YYYY-MM-DD for input value
  const toInputDate = (d: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl my-4">
      {/* Quick Day Chips */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onDateChange(yesterday)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            isYesterday
              ? 'bg-zinc-200 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
          }`}
        >
          Yesterday
        </button>
        <button
          onClick={() => onDateChange(today)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            isToday
              ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => onDateChange(tomorrow)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            isTomorrow
              ? 'bg-zinc-200 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
          }`}
        >
          Tomorrow
        </button>
      </div>

      {/* Date Navigation arrows & picker */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevDay}
          title="Previous Day"
          className="p-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative flex items-center">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-700/60 hover:border-zinc-500 cursor-pointer text-xs font-medium text-zinc-200 transition-colors">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {currentDate.toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year:
                  currentDate.getFullYear() !== today.getFullYear()
                    ? 'numeric'
                    : undefined,
              })}
            </span>
            <input
              type="date"
              value={toInputDate(currentDate)}
              onChange={handleDatePick}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </label>
        </div>

        <button
          onClick={handleNextDay}
          title="Next Day"
          className="p-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
