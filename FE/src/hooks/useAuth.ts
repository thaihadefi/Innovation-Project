/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [infoCandidate, setInfoCandidate] = useState<any>(null);
  const [infoCompany, setInfoCompany] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname(); // Get current URL

  useEffect(() => {
    setAuthLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include" // Keep cookie
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "error") {
          setIsLogin(false);
          setInfoCandidate(null);
          setInfoCompany(null);
        }

        if(data.code == "success") {
          setIsLogin(true);

          if(data.infoCandidate) {
            setInfoCandidate(data.infoCandidate);
            setInfoCompany(null);
          }
          
          if(data.infoCompany) {
            setInfoCompany(data.infoCompany);
            setInfoCandidate(null);
          }
        }
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });
  }, [pathname]);

  return {
    isLogin: isLogin,
    infoCandidate: infoCandidate,
    infoCompany: infoCompany,
    authLoading: authLoading
  };
};