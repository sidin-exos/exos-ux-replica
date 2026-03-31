/**
 * Plain API helper for Deno Edge Functions.
 * Fire-and-forget thread creation — never throws.
 */

const PLAIN_API_URL = "https://core-api.uk.plain.com/graphql/v1";

export interface PlainCustomerInput {
  email: string;
  name?: string;
  company?: string;
}

export interface PlainThreadInput {
  customerIdentifier: { emailAddress: string };
  title: string;
  description: string;
  labelTypeIds?: string[];
  components?: Array<{ componentText: { text: string } }>;
}

export interface PlainResult {
  ok: boolean;
  threadId?: string;
  error?: string;
}

/**
 * Create a thread in Plain for a customer.
 * Upserts the customer by email, then creates a thread.
 * Returns { ok, threadId } on success, { ok: false, error } on failure.
 */
export async function createPlainThread(
  apiKey: string,
  input: {
    email: string;
    name?: string;
    company?: string;
    title: string;
    description: string;
    labelTypeIds?: string[];
  }
): Promise<PlainResult> {
  try {
    // Step 1: Upsert customer
    const upsertRes = await gql(apiKey, {
      query: `
        mutation UpsertCustomer($input: UpsertCustomerInput!) {
          upsertCustomer(input: $input) {
            customer { id }
            error { message code }
          }
        }
      `,
      variables: {
        input: {
          identifier: { emailAddress: input.email },
          onCreate: {
            fullName: input.name || "Anonymous User",
            email: { email: input.email, isVerified: false },
            ...(input.company
              ? { externalId: input.company }
              : {}),
          },
          onUpdate: {
            ...(input.name ? { fullName: { value: input.name } } : {}),
          },
        },
      },
    });

    const upsertData = upsertRes?.data?.upsertCustomer;
    if (upsertData?.error) {
      return { ok: false, error: `upsertCustomer: ${upsertData.error.message}` };
    }

    const customerId = upsertData?.customer?.id;
    if (!customerId) {
      return { ok: false, error: "upsertCustomer returned no customer ID" };
    }

    // Step 2: Create thread
    const threadComponents = [
      { componentText: { text: input.description } },
    ];

    const threadRes = await gql(apiKey, {
      query: `
        mutation CreateThread($input: CreateThreadInput!) {
          createThread(input: $input) {
            thread { id }
            error { message code }
          }
        }
      `,
      variables: {
        input: {
          customerIdentifier: { customerId },
          title: input.title.slice(0, 500),
          components: threadComponents,
          ...(input.labelTypeIds?.length
            ? { labelTypeIds: input.labelTypeIds }
            : {}),
        },
      },
    });

    const threadData = threadRes?.data?.createThread;
    if (threadData?.error) {
      return { ok: false, error: `createThread: ${threadData.error.message}` };
    }

    const threadId = threadData?.thread?.id;
    return { ok: true, threadId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Plain] Unexpected error:", msg);
    return { ok: false, error: msg };
  }
}

// --- Internal GraphQL helper ---

async function gql(
  apiKey: string,
  body: { query: string; variables?: Record<string, unknown> }
): Promise<Record<string, any>> {
  const res = await fetch(PLAIN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Plain API ${res.status}: ${text}`);
  }

  return await res.json();
}
