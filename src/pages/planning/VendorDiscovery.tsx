import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Heart, Bookmark } from 'lucide-react';
import { INITIAL_VENDORS, type VendorItem } from '../../data/seed';
import './VendorDiscovery.css';

export function VendorDiscovery() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorItem[]>(INITIAL_VENDORS);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVendors(prev =>
      prev.map(v => (v.id === id ? { ...v, saved: !v.saved } : v))
    );
  };

  const filtered = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                          v.location.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (category === 'All') return true;
    return v.category.toLowerCase() === category.toLowerCase();
  });

  return (
    <div className="vendor-discovery-page">
      <div className="vendor-head-row">
        <h1 className="vendor-page-title">Find Vendors</h1>
      </div>

      {/* Search Bar */}
      <div className="vendor-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search vendors, location or service..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="filter-btn" aria-label="Filter options">
          <Filter size={16} />
        </button>
      </div>

      {/* Category Pills */}
      <div className="category-pill-row">
        {['All', 'Photographer', 'Venue', 'Catering', 'Decor'].map(cat => (
          <button
            key={cat}
            className={`cat-pill ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vendor Cards List */}
      <div className="vendors-grid-list">
        {filtered.map(vendor => (
          <div
            key={vendor.id}
            className="vendor-card"
            onClick={() => navigate(`/vendors/${vendor.id}`)}
          >
            <div className="vendor-img-wrap">
              <img src={vendor.image} alt={vendor.name} />
              <button
                className={`heart-save-btn ${vendor.saved ? 'saved' : ''}`}
                onClick={e => toggleSave(vendor.id, e)}
                aria-label="Save vendor"
              >
                <Heart size={16} fill={vendor.saved ? '#E02424' : 'none'} color={vendor.saved ? '#E02424' : '#171F20'} />
              </button>
            </div>

            <div className="vendor-info-body">
              <h3 className="vendor-name">{vendor.name}</h3>
              <span className="vendor-meta-sub">
                {vendor.category} · {vendor.location}
              </span>
              <strong className="vendor-price">{vendor.priceStart}</strong>

              <div className="vendor-card-actions">
                <button
                  className="btn-view-profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/vendors/${vendor.id}`);
                  }}
                >
                  View Profile
                </button>
                <button
                  className={`btn-save-toggle ${vendor.saved ? 'is-saved' : ''}`}
                  onClick={e => toggleSave(vendor.id, e)}
                >
                  <Bookmark size={13} fill={vendor.saved ? 'currentColor' : 'none'} />
                  <span>{vendor.saved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
