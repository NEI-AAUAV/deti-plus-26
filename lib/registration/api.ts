export type  ApiError =
  | 'invalid'
  | 'invalid_token'
  | 'invalid_file'
  | 'rate_limited'
  | 'unknown_action'
  | 'server_error'
  | 'network';

export type ApiResult<T> =
  | ({ ok: true } & T)
  | ({ ok: false, error: ApiError; message: string });

export type RegisterPayload = {
  name: string;
  email: string;
  mobileNumber: string;
  curse: string;
  year: string;
  hasCvConsent: boolean;
  hasGdprConsent: boolean;
  website?: string;
  cv?: { filename: string; mime: string; data: string };
};

export type RegisterResult = {
  registered: true;
  alreadyRegistered: boolean;
  cvUploaded: boolean;
  magicLinkSent: boolean;
};

export type StatusResult = {
  name: string;
  email: string;
  hasCv: boolean;
  cvName: string;
  cvUpdatedAt: string;
};

export type CvFileResult = { filename: string; data: string };

export type UploadResult = { uploaded: true; cvName: string; cvUpdatedAt: string };

const SCRIPT_URL = process.env.NEXT_PUBLIC_SCRIPT_URL ?? '';

const GENERIC_ERROR = 'Unable to contact the server. Check your connection and try again.'

function  networkError(message = GENERIC_ERROR): ApiResult<never> {
  return { ok: false, error: 'network', message };
}

async function post<T>(payload: Record<string, unknown>): Promise<ApiResult<T>> {
  if (!SCRIPT_URL) {
    return networkError('Form currently unavailable. Contact us via email or message.');
  }

  let response: Response;
  try {
    response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
  } catch {
    return networkError();
  }

  if (!response.ok) return networkError();

  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return networkError();
  }
}

export function register(payload: RegisterPayload): Promise<ApiResult<RegisterResult>> {
  return post<RegisterResult>({action: 'register', website: '', ...payload});
}

export function fetchStatus(token: string): Promise<ApiResult<StatusResult>> {
  return post<StatusResult>({action: 'fetch_status', token});
}

export function fetchCv(token: string): Promise<ApiResult<CvFileResult>> {
  return post<CvFileResult>({action: 'fetch_cv', token});
}

export function uploadCv(args: {
  token: string;
  filename: string;
  mime: string;
  data: string;
}): Promise<ApiResult<UploadResult>> {
  return post<UploadResult>({action: 'upload', ...args});
}

export function resendLink(email: string): Promise<ApiResult<{sent: true}>> {
  return post<{sent: true}>({action: 'resend', email});
}
