// The Funniest Out-of-Office entry writer — program/v1, Node 22,
// standard library only, no network.
// Writes one out-of-office auto-reply line to
// $MAKEFUN_OUTPUT_DIR/entry.txt (or /output/entry.txt when the
// variable is unset), then proves the bytes on disk are exactly
// the line it meant to write.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The entry itself: a straight out-of-office opener, then the twist —
// the auto-reply is the one doing the work this week, so it is the
// one asking for a raise. The reply has become the employee.
const ENTRY =
  "I'm out of office until the 12th. My auto-reply is doing all my work this week, and it's already asked for a raise.";

// The gate, from the kit: 1 to 140 characters, a single line of
// UTF-8 text, not only white space.
const MIN_CHARS = 1;
const MAX_CHARS = 140;

// Characters counted as code points, so any non-ASCII in the line
// is measured the way a reader counts it, not by UTF-16 units.
function charCount(text: string): number {
  return [...text].length;
}

// Collect every shape problem instead of failing on the first, so a
// bad entry reports all of its faults in one run.
function shapeProblems(text: string): string[] {
  const problems: string[] = [];

  if (/[\r\n]/.test(text)) {
    problems.push("must be a single line");
  }
  if (text.trim().length === 0) {
    problems.push("must not be only white space");
  }
  const chars = charCount(text);
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    problems.push(
      `must be ${MIN_CHARS} to ${MAX_CHARS} characters, got ${chars}`,
    );
  }
  return problems;
}

function fail(message: string): never {
  throw new Error(`entry rejected: ${message}`);
}

function main(): void {
  const problems = shapeProblems(ENTRY);
  if (problems.length > 0) {
    fail(problems.join("; "));
  }
  console.log(`entry is ${charCount(ENTRY)} characters, inside the limit`);

  const folder = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(folder, { recursive: true });
  const target = join(folder, "entry.txt");
  writeFileSync(target, ENTRY, "utf8");

  // Read it straight back as bytes: what the judge sees must be
  // exactly what we wrote, with no trailing newline or extra byte.
  const written = readFileSync(target);
  if (!written.equals(Buffer.from(ENTRY, "utf8"))) {
    fail(`${target} does not match the entry byte for byte`);
  }

  // The file on disk must pass the gate on its own terms, not just
  // the constant in memory — a stray byte would fail it there.
  const onDisk = written.toString("utf8");
  const diskProblems = shapeProblems(onDisk);
  if (diskProblems.length > 0) {
    fail(`file on disk fails the gate: ${diskProblems.join("; ")}`);
  }
  console.log(`wrote ${target} (${charCount(ENTRY)} characters, verified)`);
  console.log(ENTRY);
}

main();
