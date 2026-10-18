import type { Account } from './data'
import { formatAmount } from './format'

export type KateAction = { label: string; action: 'transfer' | 'account' | 'call' }

export type KateReply = { text: string; actions?: KateAction[] }

export const kateSuggestions = ['When can I call?', 'What can you do?', 'Make a transfer', 'What is my balance?']

/**
 * Scripted replies for the demo. Replace this function with a call to the team's backend to put
 * the real assistant inside the app; the chat screen only depends on this signature.
 */
export async function getKateReply(message: string, context: { accounts: Account[] }): Promise<KateReply> {
  await new Promise((resolve) => window.setTimeout(resolve, 900))
  const text = message.toLowerCase()
  const current = context.accounts.find((a) => a.kind === 'current')

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
  if (/(what can you do|help)/.test(text)) {
    return {
      text: 'I can show your balance and payments, help you make a transfer, block a card or find the right person to talk to. Just ask.',
    }
  }
  if (/(dream|save)/.test(text)) {
    return {
      text: 'Great idea. Tell me what you are saving for and roughly when, and I will suggest a monthly amount you can put aside.',
    }
  }
  return {
    text: 'I am not sure I understood that yet. Could you rephrase it, or pick one of the suggestions below?',
  }
}
