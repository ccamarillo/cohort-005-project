import { measureNoteLength, type NoteLength } from "./lib/note-length";

export type { NoteLength };

/**
 * How much of the note limit a draft uses, measured the way the save action
 * measures it, so the counter and the validation never disagree.
 */
export function noteLength(body: string): NoteLength {
  return measureNoteLength(body);
}
