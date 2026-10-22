import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Pill,
  Moon,
  Plus,
  Sparkles,
  Bell,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { dayName: 'Sun', date: 17 },
  { dayName: 'Mon', date: 18 },
  { dayName: 'Tue', date: 19 },
  { dayName: 'Wed', date: 20 },
  { dayName: 'Thu', date: 21 },
  { dayName: 'Fri', date: 22 },
  { dayName: 'Sat', date: 23 },
];

const SLEEP_LOGS = [
  {
    id: 'log-17',
    month: 'Oct',
    day: '17',
    title: 'Ngủ 5.2 giờ • Nhịp tim 72 bpm',
    progress: 65,
    barColor: 'bg-[#4b662b]',
    badge: 'Low Rest',
    badgeClass: 'bg-[#c7e89e] text-[#0b3026]',
    note: 'Đã uống đủ 3 cữ thuốc',
  },
  {
    id: 'log-16',
    month: 'Oct',
    day: '16',
    title: 'Ngủ 8.2 giờ • Huyết áp 118/76',
    progress: 92,
    barColor: 'bg-[#F3A871]',
    badge: 'Deep REM',
    badgeClass: 'bg-[#ffdcc5] text-[#6d390a]',
    note: '8 gợi ý dinh dưỡng AI',
  },
  {
    id: 'log-15',
    month: 'Oct',
    day: '15',
    title: 'Ngủ 6.0 giờ • Đi bộ 6,400 bước',
    progress: 75,
    barColor: 'bg-[#0b3026]',
    badge: 'Balanced',
    badgeClass: 'bg-[#31312d] text-[#f3f0ea]',
    note: 'Tuân thủ 100% phác đồ',
  },
];

export default function ScheduleTab({ scheduleItems, onToggleDose }) {
  const [selectedDate, setSelectedDate] = useState(20);

  const completedCount = scheduleItems.filter((item) => item.taken).length;
  const adherenceRate = Math.round((completedCount / scheduleItems.length) * 100);

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Calendar Month & Interactive Date Strip (From Stitch Lịch & Xu Hướng) */}
      <div className="bg-white rounded-3xl p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#0b3026]" />
            <span className="text-base font-bold text-[#1A201C]">
              Tháng 10, 2026
            </span>
          </div>
          <div className="flex items-center bg-[#F5EFE4] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => (d > 17 ? d - 1 : 23))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#687771] hover:text-[#1A201C]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => (d < 23 ? d + 1 : 17))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#687771] hover:text-[#1A201C]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1 text-center select-none">
          {DAYS_OF_WEEK.map((d) => {
            const isActive = d.date === selectedDate;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className="flex flex-col items-center gap-1.5 py-1 group"
              >
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    isActive
                      ? 'text-[#0b3026] font-extrabold'
                      : 'text-[#687771] font-semibold'
                  }`}
                >
                  {d.dayName}
                </span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0b3026] text-white shadow-[0_4px_12px_rgba(11,48,38,0.28)] scale-105'
                      : 'text-[#1A201C] hover:bg-[#F5EFE4]'
                  }`}
                >
                  {d.date}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medication Reminders by Time Slot (08:00, 19:00, 21:30) */}
      <div className="bg-white rounded-3xl p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC] flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#c4ebda] flex items-center justify-center text-[#0b3026]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#1A201C] block">
                Lịch nhắc uống thuốc hôm nay
              </span>
              <span className="text-[11px] text-[#687771]">
                Chạm vào từng khung giờ để đánh dấu đã uống
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#cceda3] text-[#0b3026] text-xs font-extrabold">
            {adherenceRate}% tuân thủ
          </span>
        </div>

        {/* Time Slot Reminder Cards: 08:00, 19:00, 21:30 */}
        <div className="space-y-2.5 pt-1">
          {scheduleItems.map((slot) => (
            <div
              key={slot.id}
              onClick={() => onToggleDose(slot.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggleDose(slot.id)}
              className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                slot.taken
                  ? 'bg-[#f6f3ed] border-[#c7e89e] shadow-sm'
                  : 'bg-white border-[#ECE7DC] hover:border-[#24473b]/40 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Time Badge */}
                <div
                  className={`px-3 py-2 rounded-xl font-extrabold text-xs shrink-0 flex flex-col items-center justify-center ${
                    slot.taken
                      ? 'bg-[#0b3026] text-[#cceda3]'
                      : 'bg-[#F5EFE4] text-[#0b3026]'
                  }`}
                >
                  <span className="text-sm leading-none">{slot.time}</span>
                  <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-85">
                    {slot.period}
                  </span>
                </div>

                {/* Medication Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-[#4b662b] shrink-0" />
                    <span
                      className={`text-sm font-bold truncate ${
                        slot.taken ? 'line-through text-[#687771]' : 'text-[#1A201C]'
                      }`}
                    >
                      {slot.name} • {slot.dosage}
                    </span>
                  </div>
                  <p className="text-xs text-[#687771] truncate mt-0.5">
                    {slot.instruction} ({slot.category})
                  </p>
                </div>
              </div>

              {/* Status Toggle Pill */}
              <div className="shrink-0">
                {slot.taken ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c7e89e] text-[#0b3026] text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã uống
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffdcc5] text-[#663304] text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    Chờ uống
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep Overview Hero Card (From Stitch Lịch & Xu Hướng) */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-[#1A201C]">Sleep Overview</h2>
          <span className="text-xs text-[#687771]">Tuần này</span>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D5EDAF] to-[#E9F6D6] p-4 shadow-[0_12px_28px_-6px_rgba(75,102,43,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0b3026] text-[#cceda3] flex items-center justify-center shadow-inner shrink-0">
              <Moon className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[#0b3026]">8.2h</span>
                <span className="w-2 h-2 rounded-full bg-[#4b662b] animate-pulse" />
                <span className="text-xs font-bold text-[#0b3026]">Trung bình/đêm</span>
              </div>
              <span className="text-xs text-[#0b3026]/80 font-medium mt-0.5">
                Nhịp sinh học ổn định sau khi duy trì thuốc đúng giờ
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#0b3026] shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Disease Risks / Health Journal Stack (From Stitch Lịch & Xu Hướng) */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-[#1A201C]">Nhật ký Sức khỏe</h2>
            <span className="text-[11px] font-bold uppercase text-[#687771]">
              / Encrypted Logs
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-[#4b662b]" />
        </div>

        <div className="flex flex-col space-y-2.5">
          {SLEEP_LOGS.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl p-3.5 flex items-center justify-between shadow-[0_8px_20px_-4px_rgba(36,71,59,0.04)] border border-[#ECE7DC]/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F5EFE4] flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#687771]">
                    {log.month}
                  </span>
                  <span className="text-xs font-extrabold text-[#1A201C] leading-none">
                    {log.day}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1A201C]">
                    {log.title}
                  </span>
                  <div className="w-28 h-1.5 bg-[#F5EFE4] rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${log.barColor} rounded-full`}
                      style={{ width: `${log.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${log.badgeClass}`}
                >
                  {log.badge}
                </span>
                <span className="text-[11px] text-[#687771] mt-1 font-medium">
                  {log.note}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
