/** Demo scenarios for the pitch. The presenter panel in App.tsx and keys 1 to 5 and 0 send them. */
export type DemoScenario = 'invoice' | 'call' | 'supplier' | 'sealed' | 'tampered' | 'reset'
export const demoEvent = 'kbc-demo'

export function startDemo(scenario: DemoScenario) {
  window.dispatchEvent(new CustomEvent<DemoScenario>(demoEvent, { detail: scenario }))
}
