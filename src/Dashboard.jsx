import { useNavigate } from "react-router-dom";

export default function Dashboard() {

  const navigate = useNavigate();

  return (
    <div>

      <h1>Dashboard</h1>

      <button onClick={() => navigate("/upload")}>
        Upload File
      </button>

      <button onClick={() => navigate("/review")}>
        Review Files
      </button>

    </div>
  );
}