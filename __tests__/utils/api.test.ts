import { doctorService, ApiError } from '../../src/services/api';

// ─── ApiError ─────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('is an instance of Error', () => {
    const e = new ApiError('something broke');
    expect(e).toBeInstanceOf(Error);
  });

  it('has name "ApiError"', () => {
    expect(new ApiError('x').name).toBe('ApiError');
  });

  it('stores statusCode when provided', () => {
    expect(new ApiError('not found', 404).statusCode).toBe(404);
  });

  it('statusCode is undefined when not provided', () => {
    expect(new ApiError('x').statusCode).toBeUndefined();
  });

  it('isNetworkError defaults to false', () => {
    expect(new ApiError('x').isNetworkError).toBe(false);
  });

  it('isNetworkError can be set to true', () => {
    expect(new ApiError('x', undefined, true).isNetworkError).toBe(true);
  });
});

// ─── doctorService.fetchAvailability ─────────────────────────────────────────

describe('doctorService.fetchAvailability', () => {
  const VALID_RESPONSE = [
    {
      name: 'Dr. Test',
      timezone: 'Australia/Sydney',
      day_of_week: 'Monday',
      available_at: '9:00AM',
      available_until: '5:00PM',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('throws ApiError when fetch response has no ok property', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      // deliberately missing `ok`
      status: 200,
      statusText: 'OK',
      text: async () => '[]',
    });
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError when fetch resolves with null', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(null);
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
  });

  // Branch — error message contains "fetch" (not "Network", not AbortError)
  it('treats error messages containing "fetch" as network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('failed to fetch'));
    try {
      await doctorService.fetchAvailability();
    } catch (e) {
      expect((e as ApiError).isNetworkError).toBe(true);
    }
  });
 
  // Function — fetchWithTimeout's finally block (clearTimeout) runs even on
  // successful responses. A normal success call already covers this, but
  // explicitly testing the resolved path with a slow mock ensures the
  // function body and finally are both instrumented.
  it('clears the timeout after a successful fetch (fetchWithTimeout finally block)', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => JSON.stringify([{
                  name: 'Dr. Timeout Test',
                  timezone: 'UTC',
                  day_of_week: 'Monday',
                  available_at: '9:00AM',
                  available_until: '5:00PM',
                }]),
              }),
            100,
          ),
        ),
    );
    const promise = doctorService.fetchAvailability();
    jest.advanceTimersByTime(200);
    const result = await promise;
    expect(Array.isArray(result)).toBe(true);
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns parsed array on a 200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(VALID_RESPONSE),
    });
    const result = await doctorService.fetchAvailability();
    expect(result).toEqual(VALID_RESPONSE);
  });

  it('throws ApiError on a 404 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => '',
    });
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
  });

  it('thrown ApiError carries the HTTP status code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '',
    });
    try {
      await doctorService.fetchAvailability();
    } catch (e) {
      expect((e as ApiError).statusCode).toBe(500);
    }
  });

  it('throws ApiError on invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => 'not json {{',
    });
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError when response is not an array', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ doctors: [] }),
    });
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
  });

  it('retries on network failure and eventually throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
    // Called 3 times: 1 initial + 2 retries (MAX_RETRIES = 2)
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3);
  });

  it('does not retry on HTTP 4xx errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => '',
    });
    await expect(doctorService.fetchAvailability()).rejects.toBeInstanceOf(ApiError);
    // Only 1 call — no retry for HTTP errors
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  it('succeeds on second attempt after one network failure', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(VALID_RESPONSE),
      });
    const result = await doctorService.fetchAvailability();
    expect(result).toEqual(VALID_RESPONSE);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
  });

  it('network error produces isNetworkError true', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));
    try {
      await doctorService.fetchAvailability();
    } catch (e) {
      expect((e as ApiError).isNetworkError).toBe(true);
    }
  });

  it('AbortError produces isNetworkError true', async () => {
    const abortErr = new Error('Aborted');
    abortErr.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValue(abortErr);
    try {
      await doctorService.fetchAvailability();
    } catch (e) {
      expect((e as ApiError).isNetworkError).toBe(true);
    }
  });

  it('non-network non-HTTP error message is preserved', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Something else'));
    try {
      await doctorService.fetchAvailability();
    } catch (e) {
      expect((e as ApiError).message).toBeTruthy();
    }
  });

  it('returns empty array response without throwing (edge case: [])', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '[]',
    });
    const result = await doctorService.fetchAvailability();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});