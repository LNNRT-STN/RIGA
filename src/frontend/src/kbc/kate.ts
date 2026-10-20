import { customer, type Account } from './data'
import { formatAmount } from './format'

export type KateAction = { label: string; action: 'transfer' | 'account' | 'call' | 'upload' }

/** `ai` marks a reply written by the LLM in the backend, so the chat can label it. */
export type KateReply = { text: string; actions?: KateAction[]; ai?: boolean }

export type KateTurn = { from: 'user' | 'kate'; text: string }

export const kateSuggestions = ['Is this real?', 'When can I call?', 'What can you do?', 'Make a transfer', 'What is my balance?']

/**
 * Questions that lead to an app action (balance, transfer, KBC Live, a trust check) keep their
 * scripted reply and button. Anything else goes to the LLM in the backend (`/api/kate/chat`);
 * when it can't answer, Kate falls back to her scripted reply.
 */
export async function getKateReply(
  message: string,
  context: { accounts: Account[]; history?: KateTurn[] },
): Promise<KateReply> {
  const scripted = scriptedReply(message, context.accounts)
  if (scripted) {
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    return scripted
  }
  try {
    const response = await fetch('/api/kate/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: context.history ?? [],
        context: { customer: customer.firstName, accounts: context.accounts },
      }),
    })
    if (!response.ok) throw new Error(`Kate returned ${response.status}`)
    const { text } = (await response.json()) as { text: string }
    return { text, ai: true }
  } catch {
    return fallbackReply(message)
  }
}

function scriptedReply(message: string, accounts: Account[]): KateReply | null {
  const text = message.toLowerCase()
  const current = accounts.find((a) => a.kind === 'current')

  if (/(balance|how much|saldo)/.test(text) && current) {
    return {
      text: `Your ${current.name} has ${formatAmount(current.balance)}. Some card payments are still reserved and may change this amount.`,
      actions: [{ label: 'View account', action: 'account' }],
    }
  }
  if (/(transfer|pay|send)/.test(text)) {
    return {
      text: 'Sure. Who would you like to send money to? You can check everything before you confirm.',
      actions: [{ label: 'Start a transfer', action: 'transfer' }],
    }
  }
  if (/(call|phone|human|advisor)/.test(text)) {
    return {
      text: 'KBC Live is available on weekdays from 8:00 to 22:00 and on Saturdays from 9:00 to 17:00. Would you like me to call you back?',
      actions: [{ label: 'Call KBC Live', action: 'call' }],
    }
  }
  if (/(real|fake|scam|fraud|phishing|trust)/.test(text)) {
    return {
      text: 'Send me the invoice or email, or type a website address. I’ll check it against KBC’s verified partners and reports from other KBC customers.',
      actions: [{ label: 'Upload a document', action: 'upload' }],
    }
  }
  if (/(what can you do|help)/.test(text)) {
    return {
      text: 'I can show your balance and payments, help you make a transfer, check whether an invoice, caller or website is real, or find the right person to talk to. Just ask.',
    }
  }
  return null
}

function fallbackReply(message: string): KateReply {
  if (/(dream|save)/.test(message.toLowerCase())) {
    return {
      text: 'Great idea. Tell me what you are saving for and roughly when, and I will suggest a monthly amount you can put aside.',
    }
  }
  return {
    text: 'I am not sure I understood that yet. Could you rephrase it, or pick one of the suggestions below?',
  }
}
