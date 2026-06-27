// @ts-nocheck
import { vi } from "vitest";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";

// ─── Mock Supabase client factory ──────────────────────────────────────────

type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

export function createMockQueryBuilder(): MockQueryBuilder {
  const builder: Partial<MockQueryBuilder> = {};

  const chainable = (returnValue?: unknown) => {
    const fn = vi.fn(() => returnValue ?? builder);
    return fn;
  };

  builder.select = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.neq = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.lte = vi.fn(() => builder);
  builder.gt = vi.fn(() => builder);
  builder.lt = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.is = vi.fn(() => builder);
  builder.not = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.ilike = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: null, error: null })
  );
  builder.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
  builder.count = vi.fn(() => builder);
  builder.then = vi.fn((onfulfilled) => {
    return Promise.resolve({ data: [], error: null }).then(onfulfilled);
  });

  return builder as MockQueryBuilder;
}

export function createMockSupabaseClient(
  overrides: Partial<SupabaseClient<unknown, "public", unknown>> = {}
): SupabaseClient<unknown, "public", unknown> {
  const mockQuery = createMockQueryBuilder();

  const client = {
    from: vi.fn(() => mockQuery),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null })
      ),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(function () { return this; }),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
    ...overrides,
  } as unknown as SupabaseClient<unknown, "public", unknown>;

  return client;
}

export function createMockAuthUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-user-id",
    email: "test@example.com",
    app_metadata: { role: "admin" },
    user_metadata: {},
    aud: "authenticated",
    confirmation_sent_at: null,
    recovery_sent_at: null,
    email_change_sent_at: null,
    new_email: null,
    invited_at: null,
    action_link: null,
    phone: "",
    created_at: new Date().toISOString(),
    confirmed_at: null,
    last_sign_in_at: null,
    role: "authenticated",
    updated_at: new Date().toISOString(),
    identities: [],
    is_anonymous: false,
    factors: [],
    ...overrides,
  } as User;
}

export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: createMockAuthUser(),
    ...overrides,
  } as Session;
}

// Helper to set mock auth state
export function mockAuthenticatedUser(
  client: ReturnType<typeof createMockSupabaseClient>,
  user?: User
) {
  const mockUser = user ?? createMockAuthUser();
  client.auth.getUser = vi.fn(() =>
    Promise.resolve({ data: { user: mockUser }, error: null })
  );
  client.auth.getSession = vi.fn(() =>
    Promise.resolve({
      data: { session: createMockSession({ user: mockUser }) },
      error: null,
    })
  );
  return mockUser;
}

export function mockUnauthenticatedUser(
  client: ReturnType<typeof createMockSupabaseClient>
) {
  client.auth.getUser = vi.fn(() =>
    Promise.resolve({ data: { user: null }, error: null })
  );
  client.auth.getSession = vi.fn(() =>
    Promise.resolve({ data: { session: null }, error: null })
  );
}
