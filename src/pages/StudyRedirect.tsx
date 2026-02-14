import { Navigate, useParams } from 'react-router-dom';

/** Redirects legacy /study/:symbol routes to the dashboard with the symbol pre-selected */
const StudyRedirect = () => {
  const { symbol } = useParams<{ symbol: string }>();
  
  return (
    <Navigate 
      to="/members/dashboard" 
      state={{ initialSymbol: symbol ? decodeURIComponent(symbol).toUpperCase() : undefined }}
      replace 
    />
  );
};

export default StudyRedirect;
