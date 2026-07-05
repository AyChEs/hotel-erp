import { describe, expect, it } from 'vitest'
import { money, nights, plusDaysIso } from '../format'

describe('money', () => {
  it('formats euros in es-ES', () => {
    expect(money(420)).toMatch(/420,00\s*€/)
    expect(money(69.9)).toMatch(/69,90\s*€/)
  })
})

describe('nights', () => {
  it('counts whole nights between ISO dates', () => {
    expect(nights('2027-03-01', '2027-03-04')).toBe(3)
    expect(nights('2027-03-01', '2027-03-02')).toBe(1)
  })
})

describe('plusDaysIso', () => {
  it('adds days and returns ISO date', () => {
    expect(plusDaysIso(2, new Date('2027-01-30T00:00:00'))).toBe('2027-02-01')
  })
})
