import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";
import { Button } from "~/components/ui/button";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
        Learn to code,
        <br />
        <span className="text-muted-foreground">at your own pace</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Structured courses built by experienced instructors. Track your
        progress, take quizzes, and build real-world skills.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Button asChild size="lg">
          <Link to="/courses">
            Browse Courses
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function HomeStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-6 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function HomeStats({
  totalCourses,
  totalCategories,
}: {
  totalCourses: number;
  totalCategories: number;
}) {
  return (
    <section className="border-y border-border bg-muted/50 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
        <HomeStat
          icon={BookOpen}
          value={totalCourses}
          label="Available Courses"
        />
        <HomeStat
          icon={GraduationCap}
          value={totalCategories}
          label="Categories"
        />
        <HomeStat
          icon={Users}
          value="Self-paced"
          label="Learn on your schedule"
        />
      </div>
    </section>
  );
}

export function HomeFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
        Cadence
      </div>
    </footer>
  );
}
