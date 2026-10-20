/** Demo scenarios for the pitch. The presenter panel in App.tsx and keys 1, 2, 3 and 0 send them. */
export type DemoScenario = 'invoice' | 'call' | 'supplier' | 'reset'
export const demoEvent = 'kbc-demo'
export const kateEvent = 'kbc-demo-kate'

export function startDemo(scenario: DemoScenario) {
  window.dispatchEvent(new CustomEvent<DemoScenario>(demoEvent, { detail: scenario }))
}

/** Opens Kate on the phone and sends a question, e.g. from the partner portal next to it. */
export function askKate(prompt: string) {
  window.dispatchEvent(new CustomEvent<string>(kateEvent, { detail: prompt }))
}
