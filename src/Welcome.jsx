import { useNavigate } from "react-router-dom";

export default function Welcome() {

  const navigate = useNavigate();

  return (
    <div>
      <h1>Welcome</h1>

      <button onClick={() => navigate("/login")}>
        Login
      </button>

      <button onClick={() => navigate("/signup")}>
        Signup
      </button>
    </div>
  );
}