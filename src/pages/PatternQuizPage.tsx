import { PageMeta } from "@/components/PageMeta";
import QuizHub from "./QuizHub";

const PatternQuizPage = () => {
  return (
    <>
      <PageMeta
        title="Pattern Quiz — ChartingPath"
        description="Test your chart pattern knowledge with interactive quizzes. Learn to identify head and shoulders, triangles, wedges, and more."
        canonicalPath="/chart-patterns/quiz"
      />
      <QuizHub />
    </>
  );
};

export default PatternQuizPage;
