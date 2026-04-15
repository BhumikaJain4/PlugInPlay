import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const EVALUATOR_PROFILES = [
  {
    id: 'KB',
    name: 'Kalyani B',
    email: 'kalyani@mitr.app',
    title: 'Lead Evaluator',
    color: '#6a0f21',
    accent: '#b98b33',
    icon: 'fa-user-tie',
    gradient: 'linear-gradient(135deg, #6a0f21 0%, #8c1f35 100%)',
    description: 'Screening & Interview Lead',
  },
  {
    id: 'AK',
    name: 'Ameresh K',
    email: 'ameresh@mitr.app',
    title: 'Senior Evaluator',
    color: '#1a3a6a',
    accent: '#4a90d9',
    icon: 'fa-user-graduate',
    gradient: 'linear-gradient(135deg, #1a3a6a 0%, #2a5298 100%)',
    description: 'Screening & Interview Panel',
  },
  {
    id: 'KM',
    name: 'KM',
    email: 'km@mitr.app',
    title: 'Evaluator',
    color: '#1a4a2e',
    accent: '#38a169',
    icon: 'fa-user-check',
    gradient: 'linear-gradient(135deg, #1a4a2e 0%, #276749 100%)',
    description: 'Screening & Interview Panel',
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile)
    setShowCustom(false)
    setForm(f => ({ ...f, email: profile.email }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const profile = selectedProfile

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f0e8' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: profile ? profile.gradient : 'linear-gradient(135deg, #6a0f21 0%, #4a0a18 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'white' }} />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-10"
          style={{ background: 'white' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: profile ? profile.accent : '#b98b33', color: '#fff' }}>
              <i className="fas fa-heart" />
            </div>
            <div>
              <h1 className="text-white font-serif text-2xl leading-none">Mitr</h1>
              <p className="text-white/60 text-xs tracking-widest uppercase">Circle of Care</p>
            </div>
          </div>

          {profile ? (
            <div>
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <i className={`fas ${profile.icon} text-white`} />
              </div>
              <h2 className="text-white font-serif text-4xl mb-3">{profile.name}</h2>
              <p className="text-white/70 text-lg">{profile.title}</p>
              <p className="text-white/50 text-sm mt-2">{profile.description}</p>
            </div>
          ) : (
            <div>
              <h2 className="text-white font-serif text-4xl mb-4 leading-tight">
                Recruitment<br />Management<br />System
              </h2>
              <p className="text-white/60 text-base leading-relaxed">
                Manage screening, interviews, and final selection for the Mitr programme.
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-xs">Ahmedabad University · Mitr Programme</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
              style={{ background: '#6a0f21' }}>
              <i className="fas fa-heart text-yellow-400" />
            </div>
            <h1 className="font-serif text-3xl" style={{ color: '#6a0f21' }}>Mitr</h1>
          </div>

          <h2 className="font-serif text-3xl text-charcoal mb-2">Sign In</h2>
          <p className="text-charcoal-light text-sm mb-8">Choose your evaluator profile or sign in directly</p>

          {/* Evaluator profile cards */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-3">
              Quick Select — Evaluator Profile
            </p>
            <div className="grid grid-cols-3 gap-3">
              {EVALUATOR_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProfileSelect(p)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center ${
                    selectedProfile?.id === p.id
                      ? 'border-transparent shadow-lg -translate-y-0.5'
                      : 'border-taupe-light bg-white hover:border-taupe hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                  style={selectedProfile?.id === p.id ? {
                    background: p.gradient,
                    borderColor: p.color,
                  } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={selectedProfile?.id === p.id
                      ? { background: 'rgba(255,255,255,0.2)' }
                      : { background: '#fbf5ea' }}
                  >
                    <i className={`fas ${p.icon}`}
                      style={{ color: selectedProfile?.id === p.id ? '#fff' : p.color }} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold leading-none ${selectedProfile?.id === p.id ? 'text-white' : 'text-charcoal'}`}>
                      {p.id}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedProfile?.id === p.id ? 'text-white/70' : 'text-charcoal-light'}`}>
                      {p.name.split(' ')[0]}
                    </div>
                  </div>
                  {selectedProfile?.id === p.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                      <i className="fas fa-check text-white text-[8px]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedProfile(null)
                setShowCustom(true)
                setForm(f => ({ ...f, email: '' }))
              }}
              className={`w-full mt-2 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                showCustom
                  ? 'border-charcoal bg-charcoal text-white'
                  : 'border-taupe-light bg-white text-charcoal-light hover:border-taupe'
              }`}
            >
              <i className="fas fa-user-shield mr-2" />
              Admin / Other
            </button>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-3xl p-8 border border-taupe-light shadow-lg">
            {profile && (
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-taupe-light">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: profile.gradient }}>
                  <i className={`fas ${profile.icon} text-white text-sm`} />
                </div>
                <div>
                  <div className="font-semibold text-charcoal text-sm">{profile.name}</div>
                  <div className="text-xs text-charcoal-light">{profile.title}</div>
                </div>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="ml-auto text-charcoal-light hover:text-charcoal text-xs"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-charcoal mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="you@ahduni.edu.in"
                  readOnly={Boolean(profile)}
                  className="w-full px-4 py-3 bg-cream border-2 border-taupe-light rounded-xl text-charcoal text-sm transition-all focus:outline-none focus:border-gold focus:bg-white"
                />
                {profile && (
                  <p className="mt-1 text-[11px] text-charcoal-light">
                    Profile login uses {profile.email}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-charcoal mb-2">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-cream border-2 border-taupe-light rounded-xl text-charcoal text-sm transition-all focus:outline-none focus:border-gold focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: profile ? profile.gradient : 'linear-gradient(135deg, #6a0f21, #4a0a18)',
                  color: 'white',
                  boxShadow: `0 8px 24px ${profile ? profile.color + '40' : '#6a0f2140'}`,
                }}
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'}`} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-charcoal-light mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: '#6a0f21' }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
