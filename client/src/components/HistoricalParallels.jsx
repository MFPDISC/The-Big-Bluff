import { AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function HistoricalParallels() {
  const crisisComparisons = [
    {
      period: '2000 Dot-Com Bubble',
      year: '2000-2002',
      icon: Activity,
      color: 'warning',
      metrics: {
        peRatio: '~30 (S&P 500)',
        debtToGDP: '~55%',
        interestRate: '6.5%',
        marketCap: '$17T peak',
        outcome: '-49% market decline over 2.5 years'
      },
      parallels: [
        'Irrational exuberance in tech sector',
        'Massive overvaluation of unprofitable companies',
        'Fed rate hikes to cool economy',
        'Corporate debt levels moderate but rising'
      ],
      differences: [
        'Lower overall debt-to-GDP ratio',
        'Higher interest rates provided cushion',
        'Less systemic financial risk',
        'Stronger fiscal position'
      ]
    },
    {
      period: '2008 Financial Crisis',
      year: '2007-2009',
      icon: AlertTriangle,
      color: 'danger',
      metrics: {
        peRatio: '~27 (pre-crisis)',
        debtToGDP: '~64%',
        interestRate: '5.25% → 0%',
        marketCap: '$20T → $11T',
        outcome: '-57% market decline, global recession'
      },
      parallels: [
        'Excessive leverage throughout system',
        'Complex financial instruments hiding risk',
        'Housing/asset bubble dynamics',
        'Credit quality deterioration'
      ],
      differences: [
        'Different asset class (housing vs tech)',
        'Banks better capitalized today',
        'More regulatory oversight',
        'Different monetary policy starting point'
      ]
    },
    {
      period: 'Current Environment',
      year: '2024',
      icon: TrendingUp,
      color: 'primary',
      metrics: {
        peRatio: '~25-30 (S&P 500)',
        debtToGDP: '~125%',
        interestRate: '5.25%',
        marketCap: '$45T+',
        outcome: 'TBD - Multiple risk factors converging'
      },
      parallels: [
        'AI hype cycle similar to dot-com',
        'Record corporate debt levels',
        'Inverted yield curve signals',
        'Extreme valuations in mega-cap tech'
      ],
      uniqueRisks: [
        'Unprecedented debt-to-GDP ratio (125% vs 55-64%)',
        'Corporate debt maturity wall 2024-2026',
        'Geopolitical instability and deglobalization',
        'Structural inflation vs transitory',
        'Fed balance sheet still massive',
        'Commercial real estate crisis brewing'
      ]
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      warning: 'border-warning/30 bg-warning/5',
      danger: 'border-danger/30 bg-danger/5',
      primary: 'border-primary/30 bg-primary/5'
    };
    return colors[color] || colors.primary;
  };

  const getIconColor = (color) => {
    const colors = {
      warning: 'text-warning',
      danger: 'text-danger',
      primary: 'text-primary'
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Historical Parallels: Will History Repeat?
        </h2>
        <p className="text-textSecondary mt-2">
          Comparing current market conditions to previous major crises
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {crisisComparisons.map((crisis, index) => {
          const Icon = crisis.icon;
          return (
            <div
              key={index}
              className={`rounded-lg border-2 p-5 ${getColorClass(crisis.color)}`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-6 h-6 ${getIconColor(crisis.color)}`} />
                <div>
                  <h3 className="font-bold text-lg">{crisis.period}</h3>
                  <p className="text-sm text-textSecondary">{crisis.year}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="mb-4 p-3 bg-surface/50 rounded-lg">
                <div className="text-xs font-semibold text-textSecondary mb-2">
                  KEY METRICS
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-textSecondary">P/E Ratio:</span>
                    <span className="font-semibold">{crisis.metrics.peRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Debt/GDP:</span>
                    <span className="font-semibold">{crisis.metrics.debtToGDP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Interest Rate:</span>
                    <span className="font-semibold">{crisis.metrics.interestRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Market Cap:</span>
                    <span className="font-semibold">{crisis.metrics.marketCap}</span>
                  </div>
                </div>
              </div>

              {/* Outcome */}
              <div className={`mb-4 p-3 rounded-lg ${
                crisis.color === 'danger' ? 'bg-danger/10' :
                crisis.color === 'warning' ? 'bg-warning/10' :
                'bg-primary/10'
              }`}>
                <div className="text-xs font-semibold mb-1">OUTCOME</div>
                <div className="text-sm font-semibold">{crisis.metrics.outcome}</div>
              </div>

              {/* Parallels */}
              {crisis.parallels && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-textSecondary mb-2">
                    PARALLELS TO TODAY
                  </div>
                  <ul className="space-y-1">
                    {crisis.parallels.map((parallel, idx) => (
                      <li key={idx} className="text-xs text-textSecondary flex items-start gap-2">
                        <span className="text-warning mt-0.5">•</span>
                        <span>{parallel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Differences or Unique Risks */}
              {crisis.differences && (
                <div>
                  <div className="text-xs font-semibold text-textSecondary mb-2">
                    KEY DIFFERENCES
                  </div>
                  <ul className="space-y-1">
                    {crisis.differences.map((diff, idx) => (
                      <li key={idx} className="text-xs text-textSecondary flex items-start gap-2">
                        <span className="text-success mt-0.5">•</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {crisis.uniqueRisks && (
                <div>
                  <div className="text-xs font-semibold text-danger mb-2">
                    UNIQUE RISKS TODAY
                  </div>
                  <ul className="space-y-1">
                    {crisis.uniqueRisks.map((risk, idx) => (
                      <li key={idx} className="text-xs text-textSecondary flex items-start gap-2">
                        <span className="text-danger mt-0.5">⚠</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Warning */}
      <div className="mt-6 bg-danger/10 border-2 border-danger/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold text-danger mb-2">Critical Observation</div>
            <p className="text-sm text-textSecondary">
              While each crisis has unique characteristics, the current environment combines elements of both 
              previous crises with significantly worse fundamentals. The debt-to-GDP ratio of 125% is more than 
              double the 2000 level and nearly double the 2008 level. Combined with a corporate debt maturity 
              wall, persistent inflation, and geopolitical instability, the potential for a severe correction 
              is historically elevated. The key difference: <span className="text-danger font-semibold">we have 
              far less fiscal and monetary ammunition to respond</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
