import { AI_MODEL_NAME } from '../../config/ai';
import { useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import './SubscriptionPlans.css';

export function SubscriptionPlans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  return (
    <div className="subscription-plans-page">
      <div className="sub-head-info">
        <h1 className="sub-title">Choose Your Plan</h1>
        <p className="sub-desc">
          Get more from CelebrAI with powerful AI planning and advanced features.
        </p>
      </div>

      {/* Honest sandbox notice */}
      <div className="sub-sandbox-banner">
        <Info size={18} className="flex-shrink-0" />
        <span>
          <strong>Evaluation Preview:</strong> Payment gateway integrations are running in sandbox preview mode. No live card charges will be billed.
        </span>
      </div>

      {/* Monthly / Yearly Toggle */}
      <div className="sub-billing-toggle">
        <button
          className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('yearly')}
        >
          <span>Yearly</span>
          <span className="save-badge">Save 20%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="plans-cards-grid">
        {/* Essential Free Card */}
        <div className="plan-pricing-card">
          <div className="plan-top-info">
            <span className="plan-tier-name">Essential</span>
            <div className="plan-price-row">
              <span className="plan-big-price">Free</span>
            </div>
            <p className="plan-pitch">
              Standard event planning with core tools and essential AI access.
            </p>
          </div>

          <div className="plan-feature-bullets">
            <div className="feature-bullet">
              <Check size={14} />
              <span>AI planning with {AI_MODEL_NAME}</span>
            </div>
            <div className="feature-bullet">
              <Check size={14} />
              <span>Task &amp; budget tracking</span>
            </div>
            <div className="feature-bullet">
              <Check size={14} />
              <span>Guest list &amp; RSVP management</span>
            </div>
            <div className="feature-bullet">
              <Check size={14} />
              <span>Real Firestore database storage</span>
            </div>
          </div>

          <button className="btn-current-plan" disabled>
            Current Active Plan
          </button>
        </div>

        {/* Pro Plan Card */}
        <div className="plan-pricing-card pro-card">
          <span className="most-popular-pill">Most Popular</span>

          <div className="plan-top-info">
            <span className="plan-tier-name">Pro</span>
            <div className="plan-price-row">
              <span className="plan-big-price">{billingCycle === 'monthly' ? '₹999' : '₹799'}</span>
              <span className="plan-period">/ month</span>
            </div>
            <p className="plan-pitch">
              For event planners and teams wanting unlimited AI capacity.
            </p>
          </div>

          <div className="plan-feature-bullets">
            <div className="feature-bullet">
              <Check size={14} />
              <span>Unlimited {AI_MODEL_NAME} AI tokens</span>
            </div>
            <div className="feature-bullet">
              <Check size={14} />
              <span>All planning and export modules</span>
            </div>
            <div className="feature-bullet">
              <Check size={14} />
              <span>Multi-user collaboration</span>
            </div>
            <div className="feature-bullet">
              <Check size={14} />
              <span>Custom invitation content studio</span>
            </div>
          </div>

          <button className="btn-upgrade-pro" onClick={() => setShowGatewayModal(true)}>
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Compare Plans Table */}
      <div className="compare-plans-section">
        <h3 className="compare-title">Compare Features</h3>

        <div className="compare-table-frame">
          <div className="compare-header-row">
            <span className="th-feature">Features</span>
            <span className="th-col">Essential</span>
            <span className="th-col">Pro</span>
          </div>

          <div className="compare-data-row">
            <span className="td-feature">AI Model</span>
            <span className="td-val">{AI_MODEL_NAME}</span>
            <span className="td-val font-semibold">{AI_MODEL_NAME}</span>
          </div>

          <div className="compare-data-row">
            <span className="td-feature">Events Storage</span>
            <span className="td-val">Standard</span>
            <span className="td-val font-semibold">Unlimited</span>
          </div>

          <div className="compare-data-row">
            <span className="td-feature">Export Reports</span>
            <span className="td-val">CSV &amp; JSON</span>
            <span className="td-val font-semibold">Full Bundle</span>
          </div>

          <div className="compare-data-row">
            <span className="td-feature">Guest RSVP Links</span>
            <span className="td-val checkmark">✓</span>
            <span className="td-val checkmark">✓</span>
          </div>
        </div>
      </div>

      {/* Gateway modal */}
      {showGatewayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowGatewayModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <h3 className="ui-modal-title">
                Payment Gateway Status
              </h3>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="ui-icon-btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-muted mb-4">
              Live credit card and UPI billing is configured in test/sandbox mode. During this preview period, all Pro capabilities are accessible without billing real customer funds.
            </p>

            <button className="btn btn-primary btn btn-primary rounded-full w-full p-2"
              onClick={() => setShowGatewayModal(false)}
            >
              Acknowledge &amp; Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
