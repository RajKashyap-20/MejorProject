import { useNavigate } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";
import ProblemForm from "../components/problems/ProblemForm.jsx";
import { apiRequest } from "../lib/api.js";

function CreateProblemPage() {
  const navigate = useNavigate();

  async function createProblem(problem) {
    const result = await apiRequest("/api/problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(problem),
    });
    navigate(`/problems/${result.problem.id}`);
  }

  return (
    <PageContainer className="problem-page">
      <div className="problem-page-heading">
        <p className="eyebrow">Start a conversation</p>
        <h1>Ask the community.</h1>
        <p>Your question can help someone else learn, too.</p>
      </div>
      <ProblemForm onSubmit={createProblem} />
    </PageContainer>
  );
}

export default CreateProblemPage;
