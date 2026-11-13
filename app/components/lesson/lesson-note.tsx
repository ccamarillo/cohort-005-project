import { useState } from "react";
import { useFetcher } from "react-router";
import { NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import { noteLength } from "~/modules/note-length";
import type { Route } from "../../routes/+types/courses.$slug.lessons.$lessonId";

type Note = Route.ComponentProps["loaderData"]["note"];

export function LessonNote({ note }: { note: Note }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const [body, setBody] = useState(note?.body ?? "");

  return (
    <Card className="mb-8">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Your notes</h2>
        </div>

        <fetcher.Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            rows={6}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Only you can read this."
            aria-label="Your notes"
            className="resize-y"
          />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
            {!error && note && (
              <span
                suppressHydrationWarning
                className="text-xs text-muted-foreground"
              >
                Last edited {formatRelativeTime(note.updatedAt)}
              </span>
            )}
            <NoteLengthCounter body={body} />
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteLengthCounter({ body }: { body: string }) {
  const length = noteLength(body);
  return (
    <span
      className={cn(
        "ml-auto text-xs tabular-nums",
        length.tooLong ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {length.count.toLocaleString("en")} / {length.max.toLocaleString("en")}
    </span>
  );
}
