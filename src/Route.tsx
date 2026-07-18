import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import StudyPlans from "./pages/StudyPlans";
import QuizSets from "./pages/QuizSets";
import Vocabulary from "./pages/Vocabulary";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "studyPlans", element: <StudyPlans /> },
      { path: "quizSets", element: <QuizSets /> },
      { path: "vocabulary", element: <Vocabulary /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;