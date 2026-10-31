import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Heart,
  Share2,
  MapPin,
  Users,
  Home,
  Car,
  Utensils,
  X,
  Loader2,
} from 'lucide-react';
import { INITIAL_VENDORS } from '../../data/mockData';
import { useEvent } from '../../contexts/useEvent';
import { saveVendor } from '../../services/firebase/firestore';
import { toast } from '../../components/ui/toast';
import './VendorDetails.css';

export function VendorDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { activeEvent } = useEvent();

  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'gallery' | 'reviews'>('overview');
  const [saved, setSaved] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [status, setStatus] = useState<'Shortlisted' | 'Quoted' | 'Booked'>('Shortlisted');
  const [savingVendor, setSavingVendor] = useState(false);

  const vendor = INITIAL_VENDORS.find(v => v.id === id) || INITIAL_VENDORS[0];

  const handleSaveToEvent = async () => {
    if (!activeEvent?.id) {
      toast.error('Please create or select an event first');
      return;
    }

    setSavingVendor(true);
    try {
      await saveVendor(activeEvent.id, {
        vendorId: vendor.id,
        name: vendor.name,
        category: vendor.category,
        location: vendor.location,
        image: vendor.image,
        notes: quoteNotes,
        quotationAmount: Number(estimatedCost) || 0,
        bookingStatus: status,
      });

      setSaved(true);
      setShowQuoteModal(false);
      toast.success(`${vendor.name} saved to your event vendor list!`);
    } catch (err) {
      toast.error('Failed to save vendor: ' + (err as Error).message);
    } finally {
      setSavingVendor(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vendor.name,
        text: `${vendor.name} — ${vendor.category} in ${vendor.location}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Vendor link copied');
    }
  };

  return (
    <div className="vendor-details-page">
      {/* Top Floating Nav */}
      <div className="vd-top-nav">
        <button onClick={() => navigate(-1)} className="vd-nav-btn" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <div className="vd-top-actions">
          <button
            className={`vd-nav-btn ${saved ? 'saved' : ''}`}
            onClick={() => setShowQuoteModal(true)}
            aria-label="Save"
          >
            <Heart size={18} fill={saved ? '#DC2626' : 'none'} color={saved ? '#DC2626' : '#171F20'} />
          </button>
          <button className="vd-nav-btn" onClick={handleShare} aria-label="Share">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Hero Photo */}
      <div className="vd-photo-hero">
        <img src={vendor.image} alt={vendor.name} />
      </div>

      {/* Main Info Card */}
      <div className="vd-main-card">
        <div className="vd-title-bar">
          <div>
            <h1 className="vd-name">{vendor.name}</h1>
            <span className="vd-cat">{vendor.category}</span>
          </div>
          <button
            className="vd-quote-btn"
            onClick={() => setShowQuoteModal(true)}
          >
            {saved ? 'Saved in Shortlist ✓' : 'Save & Quote'}
          </button>
        </div>

        <div className="vd-meta-row">
          <div className="vd-meta-item">
            <MapPin size={13} />
            <span>{vendor.location}</span>
          </div>
          <span className="vd-price-tag">{vendor.priceStart}</span>
        </div>

        {/* Tabs */}
        <div className="vd-tabs-row">
          {(['overview', 'packages', 'gallery', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              className={`vd-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Feature Badges */}
        <div className="vd-amenities-grid">
          <div className="amenity-chip">
            <Users size={14} />
            <span>Up to 500 Guests</span>
          </div>
          <div className="amenity-chip">
            <Car size={14} />
            <span>Valet Parking</span>
          </div>
          <div className="amenity-chip">
            <Utensils size={14} />
            <span>In-House Catering</span>
          </div>
          <div className="amenity-chip">
            <Home size={14} />
            <span>Bridal Changing Suite</span>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="vd-tab-section">
            <h3 className="vd-section-heading">
              About {vendor.name}
            </h3>
            <p className="vd-description-text">
              Specializing in premier events across {vendor.location}. Offers curated full-service packages, professional on-site staff, and flexible decor arrangements tailored to your celebration budget.
            </p>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="vd-packages-stack">
            <div className="vd-package-card">
              <strong className="vd-package-title">Essential Package</strong>
              <span className="vd-package-sub">Basic setup, staff and 6-hour coverage</span>
              <div className="vd-package-price">{vendor.priceStart}</div>
            </div>
            <div className="vd-package-card">
              <strong className="vd-package-title">Signature Luxury Experience</strong>
              <span className="vd-package-sub">Full-day access, customized decor and dedicated event manager</span>
              <div className="vd-package-price">Custom Quote</div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="vd-gallery-grid">
            <img src={vendor.image} alt="Gallery 1" className="vd-gallery-img" />
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80" alt="Gallery 2" className="vd-gallery-img" />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="vd-packages-stack">
            <div className="vd-review-card">
              <strong>“Outstanding service and immaculate attention to detail.”</strong>
              <div className="vd-review-author">— Verified Client Review</div>
            </div>
          </div>
        )}
      </div>

      {/* Save / Record Quotation Modal */}
      {showQuoteModal && (
        <div
          className="vd-modal-backdrop"
          onClick={() => setShowQuoteModal(false)}
        >
          <div
            className="vd-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="vd-modal-header">
              <h3 className="vd-modal-title">
                Record Vendor for Event
              </h3>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="vd-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="vd-form-stack">
              <div>
                <label className="vd-form-label">
                  Booking / Evaluation Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'Shortlisted' | 'Quoted' | 'Booked')}
                  className="vd-form-input"
                >
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Quoted">Quotation Received</option>
                  <option value="Booked">Confirmed &amp; Booked</option>
                </select>
              </div>

              <div>
                <label className="vd-form-label">
                  Agreed / Quoted Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  className="vd-form-input"
                />
              </div>

              <div>
                <label className="vd-form-label">
                  Private Planning Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke with manager on WhatsApp. They can include complimentary welcome drinks."
                  value={quoteNotes}
                  onChange={e => setQuoteNotes(e.target.value)}
                  className="vd-form-input"
                />
              </div>

              <div className="vd-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary vd-cancel-btn" onClick={() => setShowQuoteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveToEvent}
                  disabled={savingVendor}
                  className="btn btn-primary vd-submit-btn"
                >
                  {savingVendor ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Save to Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
