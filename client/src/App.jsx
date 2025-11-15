import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DebtAnalysis from './pages/DebtAnalysis';
import DebtMaturity from './pages/DebtMaturity';
import MacroIndicators from './pages/MacroIndicators';
import BitcoinCorrelation from './pages/BitcoinCorrelation';
import RiskDashboard from './pages/RiskDashboard';
import Correlations from './pages/Correlations';
import Alerts from './pages/Alerts';
import BubbleWatch from './pages/BubbleWatch';
import Thesis from './pages/Thesis';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/debt" element={<DebtAnalysis />} />
          <Route path="/debt-maturity" element={<DebtMaturity />} />
          <Route path="/macro" element={<MacroIndicators />} />
          <Route path="/bitcoin" element={<BitcoinCorrelation />} />
          <Route path="/risk" element={<RiskDashboard />} />
          <Route path="/correlations" element={<Correlations />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/bubble-watch" element={<BubbleWatch />} />
          <Route path="/thesis" element={<Thesis />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
