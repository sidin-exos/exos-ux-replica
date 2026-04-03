/**
 * Shared funnel-event tracking helper for edge functions.
 * Fire-and-forget — never blocks the main response, never throws.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface TrackEventOptions {
  userId: string;
  event: string;
  checkpoint: string;
  properties?: Record<string, unknown>;
}

/**
 * Insert a funnel event. Fire-and-forget — never throws, never blocks.
 */
export function trackEvent(opts: TrackEventOptions): void {
  _insertEvent(opts.userId, opts.event, opts.checkpoint, opts.properties).catch(
    (e) => console.error("[Track] Failed to record event:", opts.event, e),
  );
}

/**
 * Track an event that should fire at most ONCE per user (ever).
 * Skips insert if user already has this event. Fail-open on errors.
 */
export function trackOnceEvent(opts: TrackEventOptions): void {
  _trackOnce(opts).catch((e) =>
    console.error("[Track] Failed once-event:", opts.event, e),
  );
}

/**
 * Track an event at most once per UTC calendar day per user.
 * Accepts an optional computeProps callback for derived properties —
 * return null from the callback to skip the event entirely.
 */
export function trackDailyEvent(
  opts: TrackEventOptions & {
    computeProps?: (
      supabase: ReturnType<typeof createClient>,
    ) => Promise<Record<string, unknown> | null>;
  },
): void {
  _trackDaily(opts).catch((e) =>
    console.error("[Track] Failed daily-event:", opts.event, e),
  );
}

// ---- internal helpers ----

function _getClient(): ReturnType<typeof createClient> {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function _insertEvent(
  userId: string,
  event: string,
  checkpoint: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const supabase = _getClient();
  const { error } = await supabase.from("user_funnel_events").insert({
    user_id: userId,
    event_name: event,
    checkpoint,
    properties: properties ?? {},
    source: "edge_fn",
  });
  if (error) {
    console.error("[Track] Insert error:", event, error.message);
  }
}

async function _trackOnce(opts: TrackEventOptions): Promise<void> {
  const supabase = _getClient();

  const { count, error: countError } = await supabase
    .from("user_funnel_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", opts.userId)
    .eq("event_name", opts.event);

  if (countError) {
    console.error("[Track] Once-check error:", opts.event, countError.message);
    return; // fail-open: skip rather than double-fire
  }
  if ((count ?? 0) > 0) return; // already recorded

  await _insertEvent(opts.userId, opts.event, opts.checkpoint, opts.properties);
}

async function _trackDaily(
  opts: TrackEventOptions & {
    computeProps?: (
      supabase: ReturnType<typeof createClient>,
    ) => Promise<Record<string, unknown> | null>;
  },
): Promise<void> {
  const supabase = _getClient();

  // Dedup: check for existing event today (UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from("user_funnel_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", opts.userId)
    .eq("event_name", opts.event)
    .gte("created_at", todayStart.toISOString());

  if (countError) {
    console.error("[Track] Daily-check error:", opts.event, countError.message);
    return;
  }
  if ((count ?? 0) > 0) return; // already fired today

  // Compute dynamic properties if callback provided
  let mergedProps = opts.properties ?? {};
  if (opts.computeProps) {
    const computed = await opts.computeProps(supabase);
    if (computed === null) return; // callback signals "do not fire"
    mergedProps = { ...mergedProps, ...computed };
  }

  await _insertEvent(opts.userId, opts.event, opts.checkpoint, mergedProps);
}
