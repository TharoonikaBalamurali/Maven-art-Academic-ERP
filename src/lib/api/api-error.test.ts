import { describe, expect, it } from 'vitest';
import { ApiError, isApiError, kindFromStatus, messageForKind, toApiError } from './api-error';

describe('error normalization', () => {
  it('maps every status called out in specification §29', () => {
    expect(kindFromStatus(400)).toBe('bad_request');
    expect(kindFromStatus(401)).toBe('unauthorized');
    expect(kindFromStatus(403)).toBe('forbidden');
    expect(kindFromStatus(404)).toBe('not_found');
    expect(kindFromStatus(409)).toBe('conflict');
    expect(kindFromStatus(422)).toBe('validation');
    expect(kindFromStatus(500)).toBe('server');
    expect(kindFromStatus(503)).toBe('server');
  });

  it('maps unlisted 4xx statuses to a client error rather than to unknown', () => {
    expect(kindFromStatus(418)).toBe('bad_request');
    expect(kindFromStatus(429)).toBe('bad_request');
  });

  it('produces a user-facing message for every kind', () => {
    expect(messageForKind('unauthorized')).toMatch(/session/i);
    expect(messageForKind('forbidden')).toMatch(/permission/i);
    expect(messageForKind('network')).toMatch(/connection|reach/i);
  });

  it('wraps unknown throwables so callers only ever handle ApiError', () => {
    const error = toApiError(new TypeError('boom'));
    expect(isApiError(error)).toBe(true);
    expect(error.kind).toBe('unknown');
    // The original is preserved for logging but never surfaced to the user.
    expect(error.cause).toBeInstanceOf(TypeError);
    expect(error.message).not.toContain('boom');
  });

  it('recognises an aborted request rather than reporting a failure', () => {
    const error = toApiError(new DOMException('Aborted', 'AbortError'));
    expect(error.kind).toBe('aborted');
  });

  it('passes an existing ApiError through unchanged', () => {
    const original = new ApiError({ kind: 'conflict', message: 'x', status: 409 });
    expect(toApiError(original)).toBe(original);
  });

  it('carries field errors for validation failures', () => {
    const error = new ApiError({
      kind: 'validation',
      message: messageForKind('validation'),
      status: 422,
      fieldErrors: { email: ['Email is already registered.'] },
    });
    expect(error.fieldErrors.email).toEqual(['Email is already registered.']);
  });
});
