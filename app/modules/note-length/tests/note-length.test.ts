import { describe, it, expect } from "vitest";
import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { noteLength } from "../index";

describe("noteLength", () => {
  it("reports an empty draft as using none of the limit", () => {
    expect(noteLength("")).toEqual({
      count: 0,
      max: MAX_NOTE_LENGTH,
      tooLong: false,
    });
  });

  it("counts the characters typed", () => {
    expect(noteLength("hello").count).toBe(5);
  });

  it("ignores leading and trailing whitespace, as the save action does", () => {
    expect(noteLength("  hello \n\n").count).toBe(5);
  });

  it("allows a note exactly at the limit", () => {
    const length = noteLength("a".repeat(MAX_NOTE_LENGTH));
    expect(length.tooLong).toBe(false);
    expect(length.count).toBe(MAX_NOTE_LENGTH);
  });

  it("flags a note one character over the limit", () => {
    const length = noteLength("a".repeat(MAX_NOTE_LENGTH + 1));
    expect(length.tooLong).toBe(true);
  });
});
