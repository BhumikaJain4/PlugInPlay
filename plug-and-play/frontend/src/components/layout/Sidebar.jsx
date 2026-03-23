import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTasks } from '../../hooks/useApi'
import { getInitials, AVATAR_COLORS } from '../../utils/helpers'

const NAV_MAIN = [
  { to: '/',            icon: 'fa-th-large',      label: 'Dashboard' },
  { to: '/tasks',       icon: 'fa-tasks',          label: 'All Tasks',    badge: true },
  { to: '/calendar',    icon: 'fa-calendar-alt',   label: 'Calendar' },
  { to: '/team',        icon: 'fa-users',          label: 'Team' },
  { to: '/logs',        icon: 'fa-clipboard-list', label: 'Activity Logs' },
]

const NAV_ADMIN = [
  { to: '/admin/users', icon: 'fa-user-shield', label: 'Admin Users' },
]

const NAV_MODULES = [
  { to: '/orientation', icon: 'fa-graduation-cap', label: 'SM Orientation' },
  { to: '/comms',       icon: 'fa-envelope',       label: 'Communications' },
  { to: '/infra',       icon: 'fa-cogs',           label: 'Infrastructure' },
  { to: '/applications', icon: 'fa-file-signature', label: 'Applications' },
]

export default function Sidebar({ className = '', onNavigate, showCloseButton = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: tasks = [] } = useTasks()
  const pendingCount = tasks.filter(t => t.status !== 'completed').length
  const navMain = user?.role === 'admin' ? [...NAV_MAIN, ...NAV_ADMIN] : NAV_MAIN

  const handleLogout = () => {
    logout()
    navigate('/login')
    onNavigate?.()
  }

  const handleNavigate = () => {
    onNavigate?.()
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 xl:px-4 py-2.5 xl:py-3.5 rounded-xl cursor-pointer transition-all duration-300 mb-1.5 xl:mb-2 no-underline border text-sm xl:text-base
     ${isActive
      ? 'bg-gold/20 border-gold text-cream'
      : 'text-taupe border-transparent hover:bg-white/10 hover:text-cream hover:border-gold/30 hover:translate-x-1'}`

  const avatarBg = AVATAR_COLORS[user?.avatar_color] || AVATAR_COLORS.maroon
  const overflowClass = showCloseButton ? 'overflow-y-auto scrollbar-thin' : 'overflow-hidden'

  return (
    <aside className={`w-[255px] xl:w-[275px] 2xl:w-[300px] bg-gradient-to-b from-maroon to-maroon-dark text-cream flex flex-col top-0 h-screen lg:sticky border-r-4 border-gold shrink-0 ${overflowClass} ${className}`}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 xl:px-6 pt-5 xl:pt-7 pb-5 xl:pb-7 border-b border-white/20 mb-5 xl:mb-8">
        <div className="w-[44px] h-[44px] xl:w-[50px] xl:h-[50px] bg-gold rounded-xl flex items-center justify-center text-xl xl:text-2xl text-maroon shadow-lg shadow-gold/30 shrink-0">
          <i className="fas fa-plug" />
        </div>
        <div>
          <h1 className="font-serif text-xl xl:text-2xl text-cream mb-0.5">Plug in Play</h1>
          <p className="text-[0.65rem] xl:text-xs opacity-80 tracking-[0.14em] uppercase">ODS Management</p>
        </div>
        {showCloseButton && (
          <button
            aria-label="Close menu"
            onClick={handleNavigate}
            className="ml-auto h-9 w-9 rounded-lg border border-gold/30 text-gold"
          >
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="px-4 xl:px-6 mb-4 xl:mb-6">
        <p className="text-[0.64rem] xl:text-[0.7rem] uppercase tracking-[0.15em] opacity-60 mb-2 xl:mb-4 font-semibold">Main Menu</p>
        {navMain.map(({ to, icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={navLinkClass} onClick={handleNavigate}>
            <i className={`fas ${icon} w-5 text-center text-gold`} />
            <span>{label}</span>
            {badge && pendingCount > 0 && (
              <span className="ml-auto bg-gold text-maroon text-xs px-2.5 py-1 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Modules Nav */}
      <nav className="px-4 xl:px-6 mb-4 xl:mb-6">
        <p className="text-[0.64rem] xl:text-[0.7rem] uppercase tracking-[0.15em] opacity-60 mb-2 xl:mb-4 font-semibold">Modules</p>
        {NAV_MODULES.map(({ to, href, icon, label, external }) =>
          external ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" onClick={handleNavigate}
              className="flex items-center gap-3 px-3.5 xl:px-4 py-2.5 xl:py-3.5 rounded-xl cursor-pointer transition-all duration-300 mb-1.5 xl:mb-2 text-taupe border border-transparent hover:bg-white/10 hover:text-cream hover:border-gold/30 hover:translate-x-1 no-underline text-sm xl:text-base">
              <i className={`fas ${icon} w-5 text-center text-gold`} />
              <span>{label}</span>
              <i className="fas fa-external-link-alt ml-auto text-[0.65rem] opacity-60" />
            </a>
          ) : (
            <NavLink key={to} to={to} className={navLinkClass} onClick={handleNavigate}>
              <i className={`fas ${icon} w-5 text-center text-gold`} />
              <span>{label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* User Card */}
      <div className="mt-auto mx-4 xl:mx-6 mb-4 xl:mb-6 bg-white/5 border border-gold/20 rounded-2xl p-3.5 xl:p-5 flex items-center gap-3">
        <div
          className="w-[40px] h-[40px] xl:w-[45px] xl:h-[45px] rounded-full flex items-center justify-center font-bold text-white text-sm xl:text-base shrink-0"
          style={{ background: avatarBg }}
        >
          {getInitials(user?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs xl:text-sm font-semibold truncate">{user?.name}</h4>
          <p className="text-xs opacity-70 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-taupe hover:text-cream transition-colors p-1"
          title="Logout"
        >
          <i className="fas fa-sign-out-alt" />
        </button>
      </div>
    </aside>
  )
}
