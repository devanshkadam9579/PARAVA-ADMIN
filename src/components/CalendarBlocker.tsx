import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarBlockerProps {
  busyDates: string[];
  onChange: (dates: string[]) => void;
}

export default function CalendarBlocker({ busyDates, onChange }: CalendarBlockerProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const toggleDate = (day: number) => {
    const d = new Date(year, month, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dd}`;

    if (busyDates.includes(dateStr)) {
      onChange(busyDates.filter(bd => bd !== dateStr));
    } else {
      onChange([...busyDates, dateStr]);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="border border-gray-100 rounded-[24px] p-6 bg-white shadow-sm mt-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h4 className="text-brand-primary font-black uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E33B54]" />
            OPERATIONAL SCHEDULE MANAGER
          </h4>
          <p className="text-[10px] text-gray-500 mt-1">Green = Booked, Red = Blocked. Tap dates to toggle block state.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={prevMonth} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition active:scale-95">
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-sm min-w-[100px] text-center">{monthName} {year}</span>
          <button type="button" onClick={nextMonth} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition active:scale-95">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-gray-400 mb-2">{day}</div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-gray-50/30 rounded-2xl" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const y = year;
          const m = String(month + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const dateStr = `${y}-${m}-${dd}`;
          const isBlocked = busyDates.includes(dateStr);

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDate(day)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                isBlocked
                  ? 'bg-[#E33B54] text-white shadow-[#E33B54]/20' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-dashed border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span className="text-[10px] font-black text-gray-500 uppercase">Booked Date</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#E33B54]" />
          <span className="text-[10px] font-black text-gray-500 uppercase">Blocked Date</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="text-[10px] font-black text-gray-500 uppercase">Available Date</span>
        </div>
      </div>
    </div>
  );
}
