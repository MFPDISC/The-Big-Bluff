import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingDown, 
  Calendar,
  Globe, 
  Bitcoin, 
  Shield, 
  Network, 
  Bell,
  Activity,
  AlertCircle,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { useEffect } from 'react';
import useStore from '../store/useStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/thesis', icon: BookOpen, label: 'Analysis' },
  { path: '/debt', icon: TrendingDown, label: 'Debt Analysis' },
  { path: '/debt-maturity', icon: Calendar, label: 'Debt Maturity' },
  { path: '/macro', icon: Globe, label: 'Macro Indicators' },
  { path: '/bitcoin', icon: Bitcoin, label: 'Bitcoin Correlation' },
  { path: '/risk', icon: Shield, label: 'Risk Dashboard' },
  { path: '/bubble-watch', icon: AlertCircle, label: 'Bubble Watch' },
  { path: '/correlations', icon: Network, label: 'Correlations' },
  { path: '/alerts', icon: Bell, label: 'Alerts' }
];

export default function Layout({ children }) {
  const location = useLocation();
  const { 
    initializeData, 
    riskIndex, 
    alerts, 
    isMobileSidebarOpen, 
    toggleMobileSidebar, 
    closeMobileSidebar 
  } = useStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  const activeAlerts = alerts.filter(a => a.is_active).length;

  return (
    <div className="flex h-screen bg-background overflow-x-hidden max-w-full">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-surface border-r border-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-danger" />
            <span className="bg-gradient-to-r from-danger to-warning bg-clip-text text-transparent">
              The Big Bluff
            </span>
          </h1>
          <p className="text-textSecondary text-sm mt-1">Economic Analysis Dashboard</p>
        </div>

        {/* Risk Index Widget */}
        {riskIndex && (
          <div className="p-4 m-4 rounded-lg glass">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-textSecondary">Big Bluff Index</span>
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {riskIndex.averageIndex}
            </div>
            <div className={`text-xs px-2 py-1 rounded inline-block ${
              riskIndex.interpretation.level === 'Bubble Territory' ? 'bg-danger/20 text-danger' :
              riskIndex.interpretation.level === 'Warning' ? 'bg-orange-500/20 text-orange-500' :
              riskIndex.interpretation.level === 'Caution' ? 'bg-warning/20 text-warning' :
              'bg-success/20 text-success'
            }`}>
              {riskIndex.interpretation.level}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-textSecondary hover:bg-surfaceHover hover:text-textPrimary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.path === '/alerts' && activeAlerts > 0 && (
                  <span className="ml-auto bg-danger text-white text-xs px-2 py-0.5 rounded-full">
                    {activeAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border text-textSecondary text-xs text-center">
          <p>© 2024 The Big Lie Dashboard</p>
          <p className="mt-1">Predicting the next crisis</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:ml-0 min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-surface border-b border-border p-4 flex items-center justify-between min-w-0">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-lg hover:bg-surfaceHover transition-colors"
          >
            <Menu className="w-6 h-6 text-textPrimary" />
          </button>
          <h1 className="text-lg font-semibold text-textPrimary">The Big Bluff</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
