/** Demo scenarios for the pitch. The presenter panel in App.tsx and keys 1, 2, 3 and 0 send them. */
export type DemoScenario = 'invoice' | 'call' | 'supplier' | 'reset'
export const demoEvent = 'kbc-demo'

export function startDemo(scenario: DemoScenario) {
  window.dispatchEvent(new CustomEvent<DemoScenario>(demoEvent, { detail: scenario }))
}
