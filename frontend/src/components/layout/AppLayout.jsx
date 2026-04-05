import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden lg:flex" />

      {mobileSidebarOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-charcoal/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        className={`fixed left-0 top-0 z-40 h-screen w-[280px] transform transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onNavigate={() => setMobileSidebarOpen(false)}
        showCloseButton
      />

      <main className="h-screen flex-1 overflow-y-auto bg-cream p-4 scrollbar-thin sm:p-6 xl:p-8 2xl:p-10">
        <header className="sticky top-0 z-20 mb-4 rounded-xl border border-taupe-light bg-cream/95 backdrop-blur px-3 py-2.5 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              aria-label="Open navigation menu"
              onClick={() => setMobileSidebarOpen(true)}
              className="h-10 w-10 rounded-lg border border-taupe bg-white text-maroon"
            >
              <i className="fas fa-bars" />
            </button>
            <h1 className="font-serif text-lg text-maroon">Plug in Play</h1>
            <span className="w-10" />
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
