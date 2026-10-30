import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Download, Trash2, Cookie, ChevronRight, ArrowLeft } from 'lucide-react';
import './PrivacyConsent.css';

export function PrivacyConsent() {
  const navigate = useNavigate();
  return (
    <div className="privacy-consent-page">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
          fontWeight: 600,
          fontSize: 'var(--text-sm, 14px)',
          color: 'var(--color-tuxedo-black, #1a1a1a)',
          padding: '8px 0 16px',
          letterSpacing: '0.01em',
        }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="privacy-head-info">
        <h1 className="privacy-title">Privacy &amp; Consent</h1>
        <p className="privacy-sub">
          Your privacy matters.<br />
          Here's how we protect your data.
        </p>
      </div>

      <div className="privacy-card-list">
        <div className="privacy-row-card">
          <div className="pr-icon-col purple">
            <Shield size={18} />
          </div>
          <div className="pr-details">
            <h4 className="pr-heading">Privacy Policy</h4>
            <span className="pr-sub">How we collect, use and protect your data</span>
          </div>
          <ChevronRight size={16} className="pr-arrow" />
        </div>

        <div className="privacy-row-card">
          <div className="pr-icon-col violet">
            <Sparkles size={18} />
          </div>
          <div className="pr-details">
            <h4 className="pr-heading">AI Disclosures</h4>
            <span className="pr-sub">How our AI assistant works</span>
          </div>
          <ChevronRight size={16} className="pr-arrow" />
        </div>

        <div className="privacy-row-card">
          <div className="pr-icon-col green">
            <Download size={18} />
          </div>
          <div className="pr-details">
            <h4 className="pr-heading">Data Export</h4>
            <span className="pr-sub">Download your data anytime</span>
          </div>
          <ChevronRight size={16} className="pr-arrow" />
        </div>

        <div className="privacy-row-card">
          <div className="pr-icon-col red">
            <Trash2 size={18} />
          </div>
          <div className="pr-details">
            <h4 className="pr-heading">Account Deletion</h4>
            <span className="pr-sub">Permanently delete your account</span>
          </div>
          <ChevronRight size={16} className="pr-arrow" />
        </div>

        <div className="privacy-row-card">
          <div className="pr-icon-col orange">
            <Cookie size={18} />
          </div>
          <div className="pr-details">
            <h4 className="pr-heading">Cookie Preferences</h4>
            <span className="pr-sub">Manage your cookie settings</span>
          </div>
          <ChevronRight size={16} className="pr-arrow" />
        </div>
      </div>
    </div>
  );
}
