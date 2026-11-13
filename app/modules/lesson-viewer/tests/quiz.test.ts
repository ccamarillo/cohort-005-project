import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";

// lesson-viewer reads the app's shared `db`, so point it at a fresh test
// database for each test.
let db: TestDb;
vi.mock("~/db", () => ({
  get db() {
    return db;
  },
}));

const { getQuizForLesson, getQuizWithQuestions } = await import(
  "../quiz.server"
);

let lessonId: number;
let otherLessonId: number;

beforeEach(() => {
  db = createTestDb();
  const { course } = seedBaseData(db);
  const mod = db
    .insert(schema.modules)
    .values({ courseId: course.id, title: "Module", position: 1 })
    .returning()
    .get();
  lessonId = addLesson(mod.id, 1);
  otherLessonId = addLesson(mod.id, 2);
});

// ─── Fixtures ───
// The module has no functions that write quizzes, so rows go in directly.

function addLesson(moduleId: number, position: number) {
  return db
    .insert(schema.lessons)
    .values({ moduleId, title: `Lesson ${position}`, position })
    .returning()
    .get().id;
}

function addQuiz(forLessonId: number) {
  return db
    .insert(schema.quizzes)
    .values({ lessonId: forLessonId, title: "Quiz", passingScore: 0.5 })
    .returning()
    .get().id;
}

function addQuestion(quizId: number, position: number, options: string[]) {
  const question = db
    .insert(schema.quizQuestions)
    .values({
      quizId,
      questionText: `Question ${position}`,
      questionType: schema.QuestionType.MultipleChoice,
      position,
    })
    .returning()
    .get();
  for (const optionText of options) {
    db.insert(schema.quizOptions)
      .values({ questionId: question.id, optionText, isCorrect: false })
      .run();
  }
  return question.id;
}

describe("getQuizForLesson", () => {
  it("finds a quiz on its own lesson", () => {
    const quizId = addQuiz(lessonId);
    expect(getQuizForLesson(quizId, lessonId)?.id).toBe(quizId);
  });

  it("does not find a quiz that belongs to another lesson", () => {
    const quizId = addQuiz(otherLessonId);
    expect(getQuizForLesson(quizId, lessonId)).toBeUndefined();
  });
});

describe("getQuizWithQuestions", () => {
  it("gives each question only its own options", () => {
    const quizId = addQuiz(lessonId);
    addQuestion(quizId, 2, ["c", "d", "e"]);
    addQuestion(quizId, 1, ["a", "b"]);

    const quiz = getQuizWithQuestions(quizId);

    expect(
      quiz?.questions.map((question) =>
        question.options.map((option) => option.optionText)
      )
    ).toEqual([
      ["a", "b"],
      ["c", "d", "e"],
    ]);
  });

  it("returns a quiz with no questions", () => {
    const quizId = addQuiz(lessonId);
    expect(getQuizWithQuestions(quizId)?.questions).toEqual([]);
  });

  it("returns null for a missing quiz", () => {
    expect(getQuizWithQuestions(999)).toBeNull();
  });
});
