import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import type { ReactElement } from "react";
import { HomeFooter, HomeHero, HomeStats } from "./home-landing";

function render(element: ReactElement) {
  return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
}

function classListsWith(html: string, utility: string) {
  return [...html.matchAll(/\bclass="([^"]*)"/g)]
    .map(([, classes]) => classes)
    .filter((classes) => classes.split(/\s+/).includes(utility));
}

const pageColumn = expect.stringContaining("max-w-6xl");
const statIconBox = expect.stringContaining("size-12");
const buttonLabel = expect.stringContaining("inline-flex");

describe("home landing sections", () => {
  it("left-aligns the hero headline, subtitle and call to action", () => {
    const html = render(<HomeHero />);
    expect(html).toContain("Learn to code,");
    expect(html).toContain('href="/courses"');
    expect(classListsWith(html, "text-center")).toEqual([]);
    expect(classListsWith(html, "justify-center")).toEqual([buttonLabel]);
    expect(classListsWith(html, "mx-auto")).toEqual([pageColumn]);
  });

  it("left-aligns the stats strip and shows its figures", () => {
    const html = render(<HomeStats totalCourses={4} totalCategories={5} />);
    expect(html).toContain(">4<");
    expect(html).toContain(">5<");
    expect(html).toContain("Available Courses");
    expect(html).toContain("Self-paced");
    expect(classListsWith(html, "text-center")).toEqual([]);
    expect(classListsWith(html, "justify-center")).toEqual([
      statIconBox,
      statIconBox,
      statIconBox,
    ]);
    expect(classListsWith(html, "mx-auto")).toEqual([pageColumn]);
  });

  it("left-aligns the footer", () => {
    const html = render(<HomeFooter />);
    expect(html).toContain("Cadence");
    expect(classListsWith(html, "text-center")).toEqual([]);
    expect(classListsWith(html, "mx-auto")).toEqual([pageColumn]);
  });
});
