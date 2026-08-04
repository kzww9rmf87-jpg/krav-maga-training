/**
 * Combat Athlete System — Public Session Output Fixture Generator
 * Version 1
 *
 * A dedicated script — never a test that writes conditionally. Runs one
 * real, complete `runEngine` scenario (the "bench_press" pilot registry
 * entry, exercised end to end through eligibility, scoring, session
 * assembly and prescription), pipes the result through the public
 * `serializeEngineRunResult`, and writes the projection to
 * `sessionOutput/fixtures/cas-session-output-v1.sample.json`.
 *
 * `generatedAt` is a fixed constant — never `new Date()` — so re-running
 * this script without touching the engine or the serializer reproduces a
 * byte-identical file. The normal test suite never calls this script and
 * never writes to disk; it only regenerates the same projection in memory
 * and compares it against the committed file (see
 * `__tests__/sessionOutput/serializeEngineRunResult.test.ts`).
 *
 * Run via: npm run generate:cas-session-output-fixture
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runEngine } from "../index";
import { serializeEngineRunResult } from "../sessionOutput/serializeEngineRunResult";
import { makeAthleteProfile, makeExercise, makeValidInput } from "../__tests__/fixtures";
import { makeOneRepMaxReference } from "../__tests__/prescription/fixtures";

/**
 * Fixed, never `new Date()` — keeps the generated fixture byte-reproducible.
 * Exported (together with `buildScenario`) so the fixture-consistency test
 * can regenerate the exact same projection in memory, from the exact same
 * scenario, and compare it against the committed file — without ever
 * writing to disk itself (see the entry-point guard at the bottom of this
 * file: `main()` only runs when this file is executed directly, never on
 * import).
 */
export const FIXTURE_GENERATED_AT = "2026-01-15T09:00:00.000Z";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(SCRIPT_DIRECTORY, "..", "sessionOutput", "fixtures", "cas-session-output-v1.sample.json");

/**
 * Exported (not just used by `main`) so the fixture-consistency test can
 * reconstruct the exact same scenario in memory — never a re-implementation
 * prone to drifting from what actually generated the committed file.
 */
export function buildScenario() {
  // Everything the prescription needs is now an athlete FACT carried by the
  // input: declared equipment (not capabilities), reported readiness (not a
  // range context), and a measured one-rep max (not a hand-built reference
  // list). CAS derives the whole execution context from them, so this
  // scenario passes no prescription sources at all.
  const input = makeValidInput({
    athleteProfile: makeAthleteProfile({
      performanceReferences: [makeOneRepMaxReference({ value: 100 })],
    }),
    environment: {
      locationType: "gym",
      availableEquipment: [{ type: "barbell" }, { type: "bench" }, { type: "rack" }, { type: "plates" }],
      availableSpace: "moderate",
    },
  });
  // Matches the real pilot prescription registry's "bench_press" entry
  // (module "strength", role "primary") — the same scenario already
  // exercised end to end in `runEnginePrescription.test.ts`.
  const exercise = makeExercise({ id: "bench_press", name: "Bench Press" });

  return { input, exercises: [exercise] };
}

function main(): void {
  const { input, exercises } = buildScenario();

  const result = runEngine(input, exercises);
  if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
    throw new Error(
      `Fixture generation expected a prescribed draft but got outcome "${result.outcome}"` +
        (result.outcome === "draft" ? ` / prescription status "${result.prescription?.status}"` : "") +
        ". The scenario or the engine changed — investigate before regenerating the fixture.",
    );
  }

  const output = serializeEngineRunResult(result, exercises, FIXTURE_GENERATED_AT);

  writeFileSync(FIXTURE_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf-8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${FIXTURE_PATH}`);
}

// Runs only when this file is executed directly (`npm run
// generate:cas-session-output-fixture`) — never as a side effect of the
// fixture-consistency test importing `buildScenario`/`FIXTURE_GENERATED_AT`.
const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main();
}
