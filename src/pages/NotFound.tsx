import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Some environments can incorrectly include query params in `pathname`
    // (e.g. "/auth?reset=true"), which would bypass our router match.
    // Auto-correct by redirecting to the proper path+query.
    if (location.pathname.includes("?")) {
      const [path, query = ""] = location.pathname.split("?");
      const target = query ? `${path}?${query}${location.hash ?? ""}` : `${path}${location.hash ?? ""}`;
      window.location.replace(target);
      return;
    }

    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
