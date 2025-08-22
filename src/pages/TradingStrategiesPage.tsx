import { TradingStrategies } from "@/components/TradingStrategies";

const TradingStrategiesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Trading Strategies</h1>
          <p className="text-xl text-muted-foreground">
            Discover proven trading strategies with detailed implementation guides and downloadable scripts
          </p>
        </div>
        
        <TradingStrategies />
      </div>
    </div>
  );
};

export default TradingStrategiesPage;