import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, FormField, Select } from '../components/ui'
import toast from 'react-hot-toast'

const COLORS = ['maroon','gold','green','blue','purple','pink']
const COLOR_STYLES = {
  maroon: 'bg-maroon', gold: 'bg-gold', green: 'bg-emerald-600',
  blue: 'bg-blue-500', purple: 'bg-purple-500', pink: 'bg-rose-500',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', avatar_color:'maroon' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.avatar_color)
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center text-3xl text-gold mx-auto mb-4 shadow-xl shadow-maroon/30">
            <i className="fas fa-plug" />
          </div>
          <h1 className="font-serif text-4xl text-maroon mb-2">Plug in Play</h1>
          <p className="text-charcoal-light">Create your account</p>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-taupe-light shadow-xl shadow-maroon/5">
          <h2 className="font-serif text-2xl text-maroon mb-8">Register</h2>
          <form onSubmit={handleSubmit}>
            <FormField label="Full Name" required>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma" required />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
            </FormField>
            <FormField label="Password" required>
              <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" required minLength={8} />
            </FormField>

            <FormField label="Avatar Color">
              <div className="flex gap-3 mt-1">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('avatar_color', c)}
                    className={`w-9 h-9 rounded-full ${COLOR_STYLES[c]} transition-all cursor-pointer
                      ${form.avatar_color === c ? 'ring-4 ring-offset-2 ring-gold scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                  />
                ))}
              </div>
            </FormField>

            <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center mt-2">
              <i className="fas fa-user-plus" />
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-charcoal-light mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-maroon font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
