import { logger } from '../../utils/logger';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Store, BookOpen, Trash2 } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { getSavedVendors, deleteVendor } from '../../services/firebase/firestore';
import { toast } from '../../components/ui/toast';
import './SavedWorkspace.css';

interface SavedVendorItem {
  id: string;
  name: string;
  category: string;
  location: string;
  image?: string;
  bookingStatus?: string;
  quotationAmount?: number;
  notes?: string;
}

export function SavedWorkspace() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();
  const [activeTab, setActiveTab] = useState<'Vendors' | 'Schedule' | 'Notebook'>('Vendors');

  const [savedVendors, setSavedVendors] = useState<SavedVendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const eventId = activeEvent?.id;

  useEffect(() => {
    let ignore = false;
    async function fetchSaved() {
      if (!eventId) {
        if (!ignore) {
          setSavedVendors([]);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await getSavedVendors(eventId);
        if (!ignore) {
          setSavedVendors(((data || []) as unknown) as SavedVendorItem[]);
        }
      } catch (err) {
        logger.warn('[SavedWorkspace] Error loading vendors:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchSaved();
    return () => { ignore = true; };
  }, [eventId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedVendors(prev => prev.filter(v => v.id !== id));
    try {
      await deleteVendor(id);
      toast.success('Removed from saved items');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  return (
    <div className="saved-workspace-page">
      <div className="saved-head-info">
        <h1 className="saved-title">Saved Workspace</h1>
        <p className="saved-sub">
          Everything you've bookmarked for {activeEvent?.eventName || 'your celebration'}
        </p>
      </div>

      {/* Tabs */}
      <div className="saved-tabs-row">
        {(['Vendors', 'Schedule', 'Notebook'] as const).map(tab => (
          <button
            key={tab}
            className={`saved-tab-chip ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Saved Items List */}
      <div className="saved-items-list">
        {loading ? (
          <div className="ui-center-empty">
            <Loader2 className="animate-spin mx-auto text-tuxedo" size={24} />
          </div>
        ) : activeTab === 'Vendors' ? (
          savedVendors.length === 0 ? (
            <div className="saved-empty-panel">
              <Store size={32} className="mx-auto mb-2 opacity-50" />
              <p>No saved vendors yet for this celebration.</p>
              <button className="btn btn-secondary btn btn-secondary rounded-full text-xs mt-2"
                onClick={() => navigate('/vendors')}
              >
                Browse &amp; Shortlist Vendors
              </button>
            </div>
          ) : (
            savedVendors.map(vendor => (
              <div
                key={vendor.id}
                className="saved-item-card"
                onClick={() => navigate('/vendors')}
              >
                <div className="saved-thumb">
                  <img
                    src={vendor.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=200&q=80'}
                    alt={vendor.name}
                  />
                </div>

                <div className="saved-body">
                  <div className="saved-line-top">
                    <h3 className="saved-name">{vendor.name}</h3>
                    <div className="saved-card-actions">
                      <button
                        onClick={(e) => handleDelete(vendor.id, e)}
                        className="ui-icon-btn-ghost text-error"
                        title="Delete from saved"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <span className="saved-loc">{vendor.location || 'Location provided'}</span>
                  <div className="inline-flex items-center gap-1 mt-1">
                    <span className="saved-category-pill">{vendor.category}</span>
                    {vendor.bookingStatus && (
                      <span className="badge badge-subtle">
                        {vendor.bookingStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'Schedule' ? (
          <div className="saved-empty-panel">
            <p>View your full event schedule on the Run Sheet.</p>
            <button className="btn btn-secondary btn btn-secondary rounded-full text-xs mt-2"
              onClick={() => navigate('/run-sheet')}
            >
              Open Event Run Sheet
            </button>
          </div>
        ) : (
          <div className="saved-empty-panel">
            <BookOpen size={28} className="mx-auto mb-2 opacity-50" />
            <p>Notes from AI Assistant and decor styling are saved in your event record.</p>
          </div>
        )}
      </div>

      {/* Add New Item Button */}
      <div className="saved-sticky-footer">
        <button className="btn-save-new" onClick={() => navigate('/vendors')}>
          <Plus size={18} />
          <span>Discover Vendors</span>
        </button>
      </div>
    </div>
  );
}
