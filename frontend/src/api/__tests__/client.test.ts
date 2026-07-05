import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { problemMessage } from '../client'

function axios401(data: unknown): AxiosError {
  const headers = new AxiosHeaders()
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', { headers } as never, null, {
    status: 401, statusText: 'Unauthorized', headers: {}, config: { headers } as never, data,
  } as never)
}

describe('problemMessage', () => {
  it('prefers the RFC 7807 detail', () => {
    expect(problemMessage(axios401({ title: 'Auth failed', status: 401, detail: 'Bad credentials' })))
      .toBe('Bad credentials')
  })

  it('joins field validation errors', () => {
    const msg = problemMessage(
      axios401({ title: 'Validation failed', status: 400, detail: 'x', errors: { email: 'must not be blank' } }),
    )
    expect(msg).toContain('email: must not be blank')
  })

  it('falls back to Error.message for non-axios errors', () => {
    expect(problemMessage(new Error('boom'))).toBe('boom')
  })
})
