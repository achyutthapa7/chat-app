import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<null | any>(null);
export const useAuth = () => useContext(AuthContext);
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/user/get-me", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.status === 200) {
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getMe();
  }, []);
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
