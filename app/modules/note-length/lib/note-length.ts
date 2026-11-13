import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteLength = {
  count: number;
  max: number;
  tooLong: boolean;
};

// Counts the trimmed body because that is what the save action measures, so
// the counter and the validation never disagree: surrounding whitespace never
// counts against the limit.
export function measureNoteLength(body: string): NoteLength {
  const count = body.trim().length;
  return {
    count,
    max: MAX_NOTE_LENGTH,
    tooLong: count > MAX_NOTE_LENGTH,
  };
}
