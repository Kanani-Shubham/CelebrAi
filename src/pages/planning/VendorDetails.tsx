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
import { useEvent } from '../../contexts/EventContext';
import { saveVendor } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
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
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: '0 0 8px 0', color: 'var(--color-tuxedo-black)' }}>
              About {vendor.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Specializing in premier events across {vendor.location}. Offers curated full-service packages, professional on-site staff, and flexible decor arrangements tailored to your celebration budget.
            </p>
          </div>
        )}

        {activeTab === 'packages' && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ display: 'block', fontSize: '14px' }}>Essential Package</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Basic setup, staff and 6-hour coverage</span>
              <div style={{ marginTop: '6px', fontWeight: 600 }}>{vendor.priceStart}</div>
            </div>
            <div style={{ padding: '14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ display: 'block', fontSize: '14px' }}>Signature Luxury Experience</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full-day access, customized decor and dedicated event manager</span>
              <div style={{ marginTop: '6px', fontWeight: 600 }}>Custom Quote</div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <img src={vendor.image} alt="Gallery 1" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80" alt="Gallery 2" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px', background: '#F7F1E8', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <strong>“Outstanding service and immaculate attention to detail.”</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>— Verified Client Review</div>
            </div>
          </div>
        )}
      </div>

      {/* Save / Record Quotation Modal */}
      {showQuoteModal && (
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
          onClick={() => setShowQuoteModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: 0, color: 'var(--color-tuxedo-black)' }}>
                Record Vendor for Event
              </h3>
              <button
                onClick={() => setShowQuoteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                  Booking / Evaluation Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'Shortlisted' | 'Quoted' | 'Booked')}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
                >
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Quoted">Quotation Received</option>
                  <option value="Booked">Confirmed &amp; Booked</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                  Agreed / Quoted Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                  Private Planning Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke with manager on WhatsApp. They can include complimentary welcome drinks."
                  value={quoteNotes}
                  onChange={e => setQuoteNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuoteModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveToEvent}
                  disabled={savingVendor}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '6px' }}
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
