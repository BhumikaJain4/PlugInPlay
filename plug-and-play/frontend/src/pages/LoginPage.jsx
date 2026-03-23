import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, FormField } from '../components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center text-3xl text-gold mx-auto mb-4 shadow-xl shadow-maroon/30">
            <i className="fas fa-plug" />
          </div>
          <h1 className="font-serif text-4xl text-maroon mb-2">Plug in Play</h1>
          <p className="text-charcoal-light">ODS Task Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-10 border border-taupe-light shadow-xl shadow-maroon/5">
          <h2 className="font-serif text-2xl text-maroon mb-8">Sign In</h2>
          <form onSubmit={handleSubmit}>
            <FormField label="Email">
              <Input
                type="email" value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Password">
              <Input
                type="password" value={form.password} required
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password"
              />
            </FormField>
            <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center mt-2">
              <i className="fas fa-sign-in-alt" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-charcoal-light mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-maroon font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
