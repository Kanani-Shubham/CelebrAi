import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, WifiOff, RefreshCw } from 'lucide-react';
import './StatesDemo.css';

export function StatesDemo() {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => setRetrying(false), 1000);
  };

  return (
    <div className="states-demo-page">
      <div className="states-head">
        <h1 className="states-page-title">States Showcase</h1>
        <p className="states-sub">Interactive preview of Loading, Empty &amp; Offline states</p>
      </div>

      {/* Top: Loading Your Plan */}
      <div className="state-card loading-state-card">
        <div className="loading-flower-decor">
          <span>🌸</span>
        </div>
        <h2 className="loading-title">Loading Your Plan</h2>
        <p className="loading-desc">Our AI is preparing a personalized plan for your event...</p>

        <div className="loading-bar-wrap">
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: '70%' }} />
          </div>
          <span className="loading-pct">70%</span>
        </div>
      </div>

      {/* Bottom Grid: Empty State & Offline State */}
      <div className="states-two-col-grid">
        {/* Empty State */}
        <div className="state-card mini-card">
          <div className="mini-icon-circle store">
            <Store size={22} />
          </div>
          <h3 className="mini-card-title">No Vendors Yet</h3>
          <p className="mini-card-desc">
            Start exploring vendors to save your favorites here.
          </p>
          <button className="mini-action-btn" onClick={() => navigate('/vendors')}>
            Explore Vendors
          </button>
        </div>

        {/* Offline State */}
        <div className="state-card mini-card">
          <div className="mini-icon-circle offline">
            <WifiOff size={22} />
          </div>
          <h3 className="mini-card-title">You're Offline</h3>
          <p className="mini-card-desc">
            Please check your internet connection and try again.
          </p>
          <button className="mini-action-btn" onClick={handleRetry} disabled={retrying}>
            {retrying ? <RefreshCw size={12} className="animate-spin" /> : null}
            <span>{retrying ? 'Connecting...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
