import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * A ultra-reliable database fetcher that bypasses SDK internal hangs 
 * by using the native Fetch API directly.
 */
export const dbFetch = async (table, options = {}) => {
    const {
        select = '*',
        order = null,
        limit = null,
        count = false,
        head = false,
        method = 'GET',
        token: explicitToken = null,
        body: requestBody = null
    } = options;

    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;

    // Handle filters for UPDATE/DELETE if needed, for simplicity we'll add a generic query param support
    if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
            // If value already contains an operator like 'eq.', 'neq.', etc., don't prepend 'eq.'
            if (typeof value === 'string' && value.includes('.')) {
                url += `&${key}=${value}`;
            } else {
                url += `&${key}=eq.${value}`;
            }
        });
    }

    if (order) {
        const [column, config] = order.split('.');
        url += `&order=${column}.${config || 'desc'}`;
    }

    if (limit) {
        url += `&limit=${limit}`;
    }

    // Use explicit token if provided, otherwise try to get from SDK (risky if SDK is hung)
    let token = explicitToken;
    if (!token) {
        try {
            // Add a timeout to getSession to prevent hangs
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session timeout')), 2000)
            );

            const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
            token = session?.access_token;
        } catch (e) {
            console.warn("dbFetch: Could not get session from SDK or timed out", e);
            // We'll fall back to anon key below
        }
    }

    const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    let useServiceRole = false;
    // Bypass RLS for inquiries reply and profile credits updates/deletion
    if (
        (table === 'inquiries' && (method === 'PATCH' || method === 'DELETE')) ||
        (table === 'profiles' && (method === 'PATCH' || method === 'DELETE')) ||
        (table === 'generations' && method === 'DELETE') ||
        (table === 'payments' && method === 'DELETE')
    ) {
        if (SUPABASE_SERVICE_ROLE_KEY) {
            useServiceRole = true;
        } else {
            console.warn(`dbFetch: Missing VITE_SUPABASE_SERVICE_ROLE_KEY. Operation on ${table} might fail due to RLS.`);
        }
    }

    const finalToken = useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : (token || SUPABASE_ANON_KEY);
    const finalApiKey = useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;

    const headers = {
        'apikey': finalApiKey,
        'Authorization': `Bearer ${finalToken}`,
        'Content-Type': 'application/json',
        'Prefer': count ? `count=exact${head ? ',head=true' : ''}` : ''
    };

    if (method === 'PATCH' || method === 'POST') {
        headers['Prefer'] = (headers['Prefer'] ? headers['Prefer'] + ',' : '') + 'return=representation';
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const fetchOptions = { method, headers, signal: controller.signal };
        if (requestBody) {
            fetchOptions.body = JSON.stringify(requestBody);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
            let error;
            try {
                error = await response.json();
            } catch {
                error = { message: `HTTP Error ${response.status}: ${response.statusText}` };
            }
            return { data: null, error, status: response.status };
        }

        if (head) {
            const contentRange = response.headers.get('content-range');
            const countValue = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
            return { data: null, error: null, count: countValue, status: response.status };
        }

        if (response.status === 204) {
            return { data: null, error: null, status: response.status };
        }

        const data = await response.json();
        return { data, error: null, status: response.status };
    } catch (error) {
        console.error(`dbFetch Error (${table}):`, error);
        return { data: null, error, status: 500 };
    }
};

/**
 * A native fetcher for Supabase Auth API to bypass SDK hangs.
 */
export const authFetch = async (endpoint, options = {}) => {
    const { method = 'POST', body = null, token = null } = options;
    const url = `${SUPABASE_URL}/auth/v1/${endpoint}`;

    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log(`authFetch: [${method}] ${url}`, { hasToken: !!token, body });
        const fetchOptions = { method, headers };
        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        if (response.status === 204) {
            return { data: null, error: null, status: response.status };
        }
        const data = await response.json();

        if (!response.ok) {
            console.error(`authFetch Error [${response.status}]:`, data);
            return { data: null, error: data, status: response.status };
        }
        return { data, error: null, status: response.status };
    } catch (error) {
        console.error(`authFetch Error (${endpoint}):`, error);
        return { data: null, error, status: 500 };
    }
};

/**
 * Deletes a user completely including profile and auth record.
 * REQUIRES VITE_SUPABASE_SERVICE_ROLE_KEY to be set.
 */
export const adminDeleteUserFull = async (uid, providedEmail = null) => {
    const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error("adminDeleteUserFull: Missing service role key!");
        throw new Error("서버 보안 키가 설정되지 않았습니다. 관리자에게 문의하세요.");
    }

    console.log(`adminDeleteUserFull: Starting full deletion for ${uid} (email: ${providedEmail || 'not provided'})`);

    try {
        // 1. Delete dependent data first (Generations)
        console.log("adminDeleteUserFull: Deleting generations...");
        await dbFetch('generations', {
            method: 'DELETE',
            filters: { user_id: uid }
        });

        // 2. Delete dependent data (Inquiries)
        console.log("adminDeleteUserFull: Deleting inquiries...");
        await dbFetch('inquiries', {
            method: 'DELETE',
            filters: { user_id: uid }
        });

        // 3. Delete the profile itself
        console.log("adminDeleteUserFull: Deleting profile...");
        const { error: profileError } = await dbFetch('profiles', {
            method: 'DELETE',
            filters: { id: uid }
        });

        if (profileError) {
            console.error("adminDeleteUserFull: Profile deletion failed", profileError);
            throw profileError;
        }

        // 4. Delete payment records (by email)
        const targetEmail = providedEmail;
        if (targetEmail) {
            console.log(`adminDeleteUserFull: Deleting payments for ${targetEmail}...`);
            await dbFetch('payments', {
                method: 'DELETE',
                filters: { user_email: targetEmail }
            });
        }

        // 5. Delete the Auth User (The most important part for "real" withdrawal)
        console.log("adminDeleteUserFull: Deleting auth user record...");
        const url = `${SUPABASE_URL}/auth/v1/admin/users/${uid}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok && response.status !== 204) {
            let errData;
            try {
                errData = await response.json();
            } catch {
                errData = { message: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error("adminDeleteUserFull: Auth deletion failed", errData);
            throw new Error(errData.message || "계정 정보 삭제 중 오류가 발생했습니다.");
        }

        console.log("adminDeleteUserFull: Successfully deleted everyone.");
        return true;
    } catch (error) {
        console.error("adminDeleteUserFull: Unexpected error", error);
        throw error;
    }
};

