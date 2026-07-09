/**
 * Rejection reasons accumulate in the single writable `rejectionReason` text field on Projects.
 * Newest entry first, each introduced by an ISO timestamp on its own line:
 *
 *   [2026-07-09T13:12:18.000Z]
 *   README has no screenshots.
 *
 *   [2026-07-02T09:03:44.000Z]
 *   Commit history looks copy-pasted.
 *
 * Values written before this format existed have no header and parse as a single undated entry.
 */

export type RejectionEntry = {
    at: string | null;
    reason: string;
};

const HEADER_LINE = /^\[([^\]\n]*)\][ \t]*$/;
const UNDATED_HEADER = "[unknown]";

const normalize = (value: unknown) => String(value ?? "").replace(/\r\n/g, "\n");

const parseStamp = (stamp: string) => {
    const trimmed = stamp.trim();
    return trimmed && !Number.isNaN(Date.parse(trimmed)) ? trimmed : null;
};

/** A reason may itself contain a line that looks like a header; indent it so it never splits an entry. */
const escapeReason = (reason: string) =>
    reason.split("\n").map((line) => (HEADER_LINE.test(line) ? ` ${line}` : line)).join("\n");

/** Newest first. */
export function parseRejectionHistory(raw: unknown): RejectionEntry[] {
    const text = normalize(raw).trim();
    if (!text) return [];

    const entries: RejectionEntry[] = [];
    let current: RejectionEntry | null = null;

    for (const line of text.split("\n")) {
        const header = line.match(HEADER_LINE);
        if (header) {
            if (current) entries.push(current);
            current = { at: parseStamp(header[1]), reason: "" };
            continue;
        }
        if (!current) current = { at: null, reason: "" };
        current.reason += current.reason ? `\n${line}` : line;
    }
    if (current) entries.push(current);

    return entries
        .map((entry) => ({ at: entry.at, reason: entry.reason.trim() }))
        .filter((entry) => entry.reason);
}

/** Returns the new field value, with `reason` prepended. Repeating the newest reason is a no-op. */
export function appendRejectionReason(existing: unknown, reason: unknown, at: Date = new Date()): string {
    const addition = escapeReason(normalize(reason).trim());
    const previousRaw = normalize(existing).trim();
    const previous = !previousRaw || HEADER_LINE.test(previousRaw.split("\n")[0])
        ? previousRaw
        : `${UNDATED_HEADER}\n${previousRaw}`;

    if (!addition) return previous;
    if (parseRejectionHistory(previous)[0]?.reason === addition) return previous;

    const entry = `[${at.toISOString()}]\n${addition}`;
    return previous ? `${entry}\n\n${previous}` : entry;
}

export function latestRejectionReason(raw: unknown): string {
    return parseRejectionHistory(raw)[0]?.reason ?? "";
}

export function formatRejectionDate(at: string | null): string {
    if (!at) return "Earlier";
    return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
