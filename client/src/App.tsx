import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import { useAuth } from "./context/AuthProvider";
import Home from "./components/Home";

const App = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  if (loading) return <>Loading...</>;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;
