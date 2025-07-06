"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function CareersPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center text-black dark:text-white">Join Our Team</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 text-center">At Fleet OS, we&apos;re building the future of AI-powered fleet management. We believe in innovation, teamwork, and making a real impact for our customers. If you&apos;re passionate about technology and want to help shape the future of mobility, we&apos;d love to hear from you!</p>
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">Open Roles</h2>
          <ul className="space-y-2">
            {/* Example: No current openings */}
            <li className="text-gray-600 dark:text-gray-400">No current openings, but we&apos;re always looking for great talent! Send us your CV and we&apos;ll be in touch.</li>
            {/* To add roles, uncomment and edit below:
            <li>
              <span className="font-semibold text-black dark:text-white">Frontend Engineer</span> – Remote / Dubai
            </li>
            <li>
              <span className="font-semibold text-black dark:text-white">Customer Success Lead</span> – Dubai
            </li>
            */}
          </ul>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">Apply Now</h2>
          {submitted ? (
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg p-4 text-center font-semibold">Thank you for your interest! We&apos;ll be in touch soon.</div>
          ) : (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input id="name" name="name" type="text" required className="w-full rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input id="email" name="email" type="email" required className="w-full rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message / Cover Letter</label>
                <textarea id="message" name="message" rows={4} required className="w-full rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Tell us about yourself and why you want to join Fleet OS" />
              </div>
              <div>
                <label htmlFor="cv" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CV/Resume (optional)</label>
                <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" className="w-full text-gray-700 dark:text-gray-300" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Submit Application</Button>
            </form>
          )}
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <Link href="/" className="hover:underline text-blue-600 dark:text-blue-400">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
} 