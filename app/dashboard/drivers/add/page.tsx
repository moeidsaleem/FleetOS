"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '../../../../components/layout/dashboard-layout'
import { RequireAuth } from '../../../../components/auth/require-auth'
import { Input } from '../../../../components/ui/input'
import { Button } from '../../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert'
import { useToast } from '../../../../components/ui/use-toast'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const LANGUAGES = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'ARABIC', label: 'Arabic' },
  { value: 'HINDI', label: 'Hindi' },
  { value: 'URDU', label: 'Urdu' },
  { value: 'FRENCH', label: 'French' },
  { value: 'RUSSIAN', label: 'Russian' },
  { value: 'TAGALOG', label: 'Tagalog' },
  { value: 'SPANISH', label: 'Spanish' },
]

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function validatePhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone)
}

export default function AddDriverPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <AddDriverForm />
      </DashboardLayout>
    </RequireAuth>
  )
}

function AddDriverForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    uberDriverId: '',
    status: 'ACTIVE',
    language: 'ENGLISH',
  })
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({})
  const [checking, setChecking] = useState<{ email: boolean; uberDriverId: boolean }>({ email: false, uberDriverId: false })
  const [duplicate, setDuplicate] = useState<{ email: boolean; uberDriverId: boolean }>({ email: false, uberDriverId: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' })
    setDuplicate({ ...duplicate, [e.target.name]: false })
  }

  const handlePhoneChange = (value: string | undefined) => {
    setForm({ ...form, phone: value || '' })
    setFieldErrors({ ...fieldErrors, phone: '' })
  }

  const handleSelect = (field: string, value: string) => {
    setForm({ ...form, [field]: value })
    setFieldErrors({ ...fieldErrors, [field]: '' })
  }

  const checkDuplicateEmail = async () => {
    if (!form.email.trim() || !validateEmail(form.email)) return
    setChecking(c => ({ ...c, email: true }))
    setDuplicate(d => ({ ...d, email: false }))
    try {
      const res = await fetch(`/api/drivers?email=${encodeURIComponent(form.email)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setDuplicate(d => ({ ...d, email: true }))
          setFieldErrors(e => ({ ...e, email: 'A driver with this email already exists.' }))
        }
      }
    } catch {}
    setChecking(c => ({ ...c, email: false }))
  }

  const checkDuplicateUberId = async () => {
    if (!form.uberDriverId.trim()) return
    setChecking(c => ({ ...c, uberDriverId: true }))
    setDuplicate(d => ({ ...d, uberDriverId: false }))
    try {
      const res = await fetch(`/api/drivers?uberDriverId=${encodeURIComponent(form.uberDriverId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setDuplicate(d => ({ ...d, uberDriverId: true }))
          setFieldErrors(e => ({ ...e, uberDriverId: 'A driver with this Uber Driver ID already exists.' }))
        }
      }
    } catch {}
    setChecking(c => ({ ...c, uberDriverId: false }))
  }

  const validate = () => {
    const errors: { [k: string]: string } = {}
    if (!form.name.trim()) errors.name = 'Name is required.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!validateEmail(form.email)) errors.email = 'Invalid email format.'
    if (!form.phone.trim()) errors.phone = 'Phone is required.'
    else if (!isValidPhoneNumber(form.phone)) errors.phone = 'Invalid phone number.'
    if (!form.status) errors.status = 'Status is required.'
    if (!form.language) errors.language = 'Language is required.'
    if (duplicate.email) errors.email = 'A driver with this email already exists.'
    if (duplicate.uberDriverId) errors.uberDriverId = 'A driver with this Uber Driver ID already exists.'
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          uberDriverId: form.uberDriverId,
          status: form.status,
          language: form.language,
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to add driver')
        toast({ title: 'Error', description: data.error || 'Failed to add driver', variant: 'destructive' })
        setLoading(false)
        return
      }
      toast({ title: 'Driver Added', description: 'Driver has been added successfully!', variant: 'default' })
      router.push('/dashboard/drivers')
    } catch (err) {
      setError('Failed to add driver')
      toast({ title: 'Error', description: 'Failed to add driver', variant: 'destructive' })
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Add Driver</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-xl p-6 border border-border shadow">
        <div className="space-y-2">
          <label htmlFor="name" className="font-medium">Name</label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={loading} />
          {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="font-medium">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={checkDuplicateEmail}
            required
            disabled={loading}
          />
          {checking.email && <p className="text-xs text-blue-600 mt-1">Checking for duplicate email...</p>}
          {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="font-medium">Phone</label>
          <PhoneInput
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handlePhoneChange}
            defaultCountry="AE"
            international
            countryCallingCodeEditable={false}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-2 w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. +971501234567"
          />
          {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="uberDriverId" className="font-medium">Uber Driver ID</label>
          <Input
            id="uberDriverId"
            name="uberDriverId"
            value={form.uberDriverId}
            onChange={handleChange}
            onBlur={checkDuplicateUberId}
            disabled={loading}
          />
          {checking.uberDriverId && <p className="text-xs text-blue-600 mt-1">Checking for duplicate Uber Driver ID...</p>}
          {fieldErrors.uberDriverId && <p className="text-xs text-red-600 mt-1">{fieldErrors.uberDriverId}</p>}
        </div>
        <div className="space-y-2">
          <label className="font-medium">Status</label>
          <Select value={form.status} onValueChange={v => handleSelect('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.status && <p className="text-xs text-red-600 mt-1">{fieldErrors.status}</p>}
        </div>
        <div className="space-y-2">
          <label className="font-medium">Language</label>
          <Select value={form.language} onValueChange={v => handleSelect('language', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.language && <p className="text-xs text-red-600 mt-1">{fieldErrors.language}</p>}
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Adding...' : 'Add Driver'}
        </Button>
      </form>
    </div>
  )
} 