import { getTaskCountsByDay } from '../utils/helpers'

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function CalendarWidget({ tasks = [], onDayClick, selectedDay = null, month, year }) {
  const now = new Date()
  const calendarMonth = month || (now.getMonth() + 1)
  const calendarYear = year || now.getFullYear()
  const firstWeekday = new Date(calendarYear, calendarMonth - 1, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate()
  const isCurrentMonth = calendarMonth === (now.getMonth() + 1) && calendarYear === now.getFullYear()
  const today = isCurrentMonth ? now.getDate() : null

  const counts = getTaskCountsByDay(tasks, calendarMonth, calendarYear)

  return (
    <div className="w-full grid grid-cols-7 gap-1 text-center">
      {DAY_HEADERS.map((d, i) => (
        <div key={i} className="text-[0.7rem] font-semibold text-charcoal-light py-1.5 uppercase">
          {d}
        </div>
      ))}

      {Array.from({ length: firstWeekday }, (_, i) => (
        <div key={`empty-${i}`} className="min-h-[44px]" />
      ))}

      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
        const count = counts[day] || 0
        const isToday = day === today
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
