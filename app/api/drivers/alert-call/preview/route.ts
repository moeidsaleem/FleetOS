import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Helper to load versioned prompts
async function getVersionedPrompt({ language, reason, tone, driverName }:{ language: string, reason: string, tone: string, driverName: string }): Promise<{ prompt: string, version: number }> {
  const promptsPath = path.resolve(process.cwd(), 'prompts/alert-call-prompts.json')
  const promptsData = JSON.parse(await fs.readFile(promptsPath, 'utf8'))
  const version = promptsData.version || 1
  const langPrompts = promptsData.languages[language] || promptsData.languages['en']
  const tonePrompts = langPrompts?.[tone] || langPrompts?.['neutral']
  let template = tonePrompts?.[reason] || promptsData.default?.[tone] || promptsData.default?.neutral
  if (!template) template = 'Dear {DRIVER_NAME}, please address the following issue.'
  return { prompt: template.replace('{DRIVER_NAME}', driverName), version }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, reason, message, driverName, currentScore, language, tone } = body as { driverId: string, reason: string, message: string, driverName: string, currentScore: number, language: string, tone: string }
    const { prompt, version } = await getVersionedPrompt({ language, reason, tone, driverName })
    return NextResponse.json({ success: true, preview: prompt, promptVersion: version })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate preview' }, { status: 500 })
  }
}
