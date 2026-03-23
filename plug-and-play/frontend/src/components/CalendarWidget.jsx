import { getTaskCountsByDay } from '../utils/helpers'

const DAY_HEADERS = ['S','M','T','W','T','F','S']
const TODAY = 20 // March 20, 2026

export default function CalendarWidget({ tasks = [], onDayClick, selectedDay = null }) {
  const counts = getTaskCountsByDay(tasks)

  return (
    <div className="w-full grid grid-cols-7 gap-1 text-center">
      {DAY_HEADERS.map((d, i) => (
        <div key={i} className="text-[0.7rem] font-semibold text-charcoal-light py-1.5 uppercase">
          {d}
        </div>
      ))}
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
        const count = counts[day] || 0
        const isToday = day === TODAY
        const isSelected = day === selectedDay

        return (
          <div
            key={day}
            onClick={() => onDayClick?.(day)}
            className={`flex flex-col items-center justify-center rounded-lg text-[0.8rem] cursor-pointer transition-all duration-200 py-1.5 min-h-[44px] font-medium
              ${isSelected ? 'bg-gold text-charcoal font-bold shadow-md' : ''}
              ${isToday && !isSelected ? 'bg-maroon text-cream font-semibold' : ''}
              ${!isToday && !isSelected ? 'hover:bg-cream-dark' : ''}`}
          >
            <span className="leading-tight">{day}</span>
            {count > 0 && (
              <span className={`text-[0.6rem] font-bold leading-none mt-0.5
                ${isToday && !isSelected ? 'text-gold-light' : 'text-gold'}`}>
                {count}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
