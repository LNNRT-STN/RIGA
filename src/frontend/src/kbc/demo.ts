/** Demo scenarios for the pitch. The presenter panel and the guided tour in App.tsx, and keys 1 to 7 and 0, send them. */
export type DemoScenario =
  | 'home'
  | 'invoice'
  | 'invoice-checked'
  | 'call'
  | 'supplier'
  | 'supplier-review'
  | 'control'
  | 'consent'
  | 'consent-asked'
  | 'sealed'
  | 'tampered'
  | 'reset'
export const demoEvent = 'kbc-demo'
export const kateEvent = 'kbc-demo-kate'
export const answerCallEvent = 'kbc-demo-answer-call'

export function startDemo(scenario: DemoScenario) {
  window.dispatchEvent(new CustomEvent<DemoScenario>(demoEvent, { detail: scenario }))
}

/** Opens Kate on the phone and sends a question, e.g. from the partner portal next to it. */
export function askKate(prompt: string) {
  window.dispatchEvent(new CustomEvent<string>(kateEvent, { detail: prompt }))
}

/** Accepts the ringing demo call, so the guided tour can show the call without a tap on the phone. */
export function answerCall() {
  window.dispatchEvent(new Event(answerCallEvent))
}
