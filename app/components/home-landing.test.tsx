import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import type { ReactElement } from "react";
import { HomeFooter, HomeHero, HomeStats } from "./home-landing";

function render(element: ReactElement) {
  return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
}

const centering = /\b(text-center|justify-center|mx-auto)\b/;

function withoutExpectedCentring(classes: string) {
  if (classes.includes("max-w-6xl")) return classes.replace("mx-auto", "");
  if (classes.includes("size-12")) return classes.replace("justify-center", "");
  return classes;
}

function centredLayoutElements(html: string) {
  return [...html.matchAll(/<(section|footer|div|h1|p)\b[^>]*class="([^"]*)"/g)]
    .map(([, , classes]) => withoutExpectedCentring(classes))
    .filter((classes) => centering.test(classes));
}

describe("home landing sections", () => {
  it("left-aligns the hero headline, subtitle and call to action", () => {
    const html = render(<HomeHero />);
    expect(html).toContain("Learn to code,");
    expect(html).toContain('href="/courses"');
    expect(centredLayoutElements(html)).toEqual([]);
  });

  it("left-aligns the stats strip and shows its figures", () => {
    const html = render(<HomeStats totalCourses={4} totalCategories={5} />);
    expect(html).toContain(">4<");
    expect(html).toContain(">5<");
    expect(html).toContain("Available Courses");
    expect(html).toContain("Self-paced");
    expect(centredLayoutElements(html)).toEqual([]);
  });

  it("left-aligns the footer", () => {
    const html = render(<HomeFooter />);
    expect(html).toContain("Cadence");
    expect(centredLayoutElements(html)).toEqual([]);
  });
});
