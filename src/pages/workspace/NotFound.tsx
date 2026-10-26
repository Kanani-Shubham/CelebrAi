import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import './NotFound.css';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="signpost-illustration-wrap">
        <div className="signpost-wood">
          <span className="sign-text">404</span>
        </div>
        <div className="signpost-pole" />
        <div className="signpost-grass">
          <span>🌿</span>
          <span>🌸</span>
          <span>🌾</span>
        </div>
      </div>

      <div className="not-found-content">
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-sub">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="not-found-actions">
        <button className="btn-go-home" onClick={() => navigate('/dashboard')}>
          Go to Home
        </button>
        <button className="btn-back-prev" onClick={() => navigate(-1)}>
          Back to Previous
        </button>
      </div>
    </div>
  );
}
