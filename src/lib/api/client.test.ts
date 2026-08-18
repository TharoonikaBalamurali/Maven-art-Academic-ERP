import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from './client';
import { ApiError } from './api-error';
import { endpoint } from './contract';
import type { ApiRequest, Transport } from './types';

function recordingTransport(
  reply: (request: ApiRequest) => unknown = () => ({ ok: true }),
): { transport: Transport; requests: ApiRequest[] } {
  const requests: ApiRequest[] = [];
  return {
    requests,
    transport: {
      name: 'mock',
      async send(request) {
        requests.push(request);
        return reply(request);
      },
    },
  };
}

const showStudent = endpoint<void, { id: string }, { include?: string }>({
  method: 'GET',
  path: '/students/:id',
  auth: true,
  permission: 'students.view',
});

describe('ApiClient', () => {
  it('resolves path parameters and forwards the query', async () => {
    const { transport, requests } = recordingTransport();
    const client = new ApiClient(transport, 1000);

    await client.call(showStudent, { params: { id: 'stu-42' }, query: { include: 'fees' } });

    expect(requests[0]?.path).toBe('/students/stu-42');
    expect(requests[0]?.query).toEqual({ include: 'fees' });
    expect(requests[0]?.auth).toBe(true);
    expect(requests[0]?.timeoutMs).toBe(1000);
  });

  it('encodes path parameters so ids cannot alter the path', async () => {
    const { transport, requests } = recordingTransport();
    const client = new ApiClient(transport, 1000);

    await client.call(showStudent, { params: { id: 'a/b?c' } });

    expect(requests[0]?.path).toBe('/students/a%2Fb%3Fc');
  });

  it('fails loudly when a required path parameter is missing', async () => {
    const { transport } = recordingTransport();
    const client = new ApiClient(transport, 1000);

    await expect(client.call(showStudent)).rejects.toThrow(/Missing path parameter "id"/);
  });

  it('notifies the auth layer exactly once when the backend rejects the session', async () => {
    const { transport } = recordingTransport(() => {
      throw new ApiError({ kind: 'unauthorized', message: 'expired', status: 401 });
    });
    const client = new ApiClient(transport, 1000);
    const onUnauthorized = vi.fn();
    client.setUnauthorizedHandler(onUnauthorized);

    await expect(client.call(showStudent, { params: { id: '1' } })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not treat a 403 as a lost session', async () => {
    const { transport } = recordingTransport(() => {
      throw new ApiError({ kind: 'forbidden', message: 'nope', status: 403 });
    });
    const client = new ApiClient(transport, 1000);
    const onUnauthorized = vi.fn();
    client.setUnauthorizedHandler(onUnauthorized);

    await expect(client.call(showStudent, { params: { id: '1' } })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('normalizes non-ApiError transport failures', async () => {
    const { transport } = recordingTransport(() => {
      throw new TypeError('socket exploded');
    });
    const client = new ApiClient(transport, 1000);

    await expect(client.call(showStudent, { params: { id: '1' } })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'unknown',
    });
  });

  it('lets a call opt out of authentication', async () => {
    const { transport, requests } = recordingTransport();
    const client = new ApiClient(transport, 1000);

    await client.call(showStudent, { params: { id: '1' }, options: { auth: false } });

    expect(requests[0]?.auth).toBe(false);
  });

  it('swaps transports without callers changing', async () => {
    const first = recordingTransport(() => ({ from: 'mock' }));
    const client = new ApiClient(first.transport, 1000);
    expect(client.transportName).toBe('mock');

    const second: Transport = { name: 'http', send: async () => ({ from: 'http' }) };
    client.setTransport(second);

    await expect(client.call(showStudent, { params: { id: '1' } })).resolves.toEqual({
      from: 'http',
    });
    expect(first.requests).toHaveLength(0);
  });
});
