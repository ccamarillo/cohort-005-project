# Confetti greets a Student only on arrival, and never under reduced motion

A Student who has just enrolled, through an Individual Purchase or a Claimed Seat, lands on the course's welcome page with a burst of confetti. The enrolling action marks the redirect with `?celebrate=1`; the welcome page throws the confetti and then replaces the URL without the mark, so a refresh, the back button or a later visit shows the calm page. A Student whose system asks for reduced motion gets no confetti at all: the static party popper on the card is the celebration. The confetti is CSS, with no new dependency.

A Team Admin who buys a Team Licence goes to `/team`, not the welcome page, and gets no confetti: buying Seats for others is not the arrival.

## Considered Options

- **Confetti on every visit to the welcome page**: rejected, because a Student who comes back to the page has already been welcomed.
- **Record the first visit on the Enrollment**: rejected, because a schema change for a visual effect costs more than the rare replay it prevents. A copied `?celebrate=1` link replays the confetti, which harms no one.
- **A confetti library such as `canvas-confetti`**: rejected for now, because one CSS keyframe does the job without a new dependency.
