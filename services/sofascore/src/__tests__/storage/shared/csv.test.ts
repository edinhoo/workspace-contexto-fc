import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import { loadCsvRows, saveCsvRows } from "../../../storage/shared/csv.js";

describe("loadCsvRows", () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "csv-test-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns header string and parsed rows from a valid CSV file", async () => {
    const file = join(tmpDir, "valid.csv");
    await writeFile(file, "id;name\n01;Brasil\n02;Argentina\n", "utf8");

    const { header, rows } = await loadCsvRows(file);
    assert.equal(header, "id;name");
    assert.deepEqual(rows, [["01", "Brasil"], ["02", "Argentina"]]);
  });

  it("returns empty result when file does not exist", async () => {
    const { header, rows } = await loadCsvRows(join(tmpDir, "missing.csv"));
    assert.equal(header, null);
    assert.deepEqual(rows, []);
  });

  it("returns empty result for an empty file", async () => {
    const file = join(tmpDir, "empty.csv");
    await writeFile(file, "", "utf8");

    const { header, rows } = await loadCsvRows(file);
    assert.equal(header, null);
    assert.deepEqual(rows, []);
  });

  it("handles quoted values containing semicolons", async () => {
    const file = join(tmpDir, "quoted.csv");
    await writeFile(file, 'id;name\n01;"Estadio;São Paulo"\n', "utf8");

    const { rows } = await loadCsvRows(file);
    assert.deepEqual(rows, [["01", "Estadio;São Paulo"]]);
  });

  it("handles escaped quotes inside quoted values", async () => {
    const file = join(tmpDir, "escaped.csv");
    await writeFile(file, 'id;note\n01;"Disse ""ola""; tudo bem"\n', "utf8");

    const { rows } = await loadCsvRows(file);
    assert.deepEqual(rows, [["01", 'Disse "ola"; tudo bem']]);
  });
});

describe("saveCsvRows", () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "csv-save-test-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writes header and rows in order", async () => {
    const file = join(tmpDir, "output.csv");
    await saveCsvRows(file, "id;name", ["01;Brasil", "02;Argentina"]);

    const { header, rows } = await loadCsvRows(file);
    assert.equal(header, "id;name");
    assert.deepEqual(rows, [["01", "Brasil"], ["02", "Argentina"]]);
  });
});
