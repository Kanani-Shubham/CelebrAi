import { logger } from '../../utils/logger';
import { AI_MODEL_NAME } from '../../config/ai';
import { useState } from 'react';
import { Sparkles, Heart, RefreshCw, Loader2, Bookmark } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { useAuth } from '../../contexts/useAuth';
import { generateDecorIdeas } from '../../services/ai/groq';
import { toast } from '../../components/ui/toast';
import './DecorStudio.css';

const PRESET_THEMES = [
  {
    id: 'th-1',
    name: 'Modern Garden Evening',
    desc: 'A blend of natural greenery, soft florals and elegant fairy lighting for a timeless celebration.',
    swatches: ['#D8CBF1', '#F7F1E8', '#A7C4B5', '#C4B5A5', '#272E2E'],
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80',
    ],
  },
  {
    id: 'th-2',
    name: 'Royal Heritage Gold',
    desc: 'Lush marigolds, antique brass candelabras and deep crimson drapes for an authentic festive glow.',
    swatches: ['#E0A96D', '#77202B', '#F7F1E8', '#E6C687', '#171F20'],
    images: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=400&q=80',
    ],
  },
];

const STYLES = ['Modern Minimalist', 'Royal Indian', 'Boho Chic', 'Vintage Glamour', 'Rustic Outdoor'];

export function DecorStudio() {
  const { activeEvent } = useEvent();
  const { idToken } = useAuth();

  const [activeTab, setActiveTab] = useState<'moodboard' | 'ai-ideas' | 'palette'>('moodboard');
  const [selectedStyle, setSelectedStyle] = useState('Modern Minimalist');
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<string[]>([]);

  const theme = PRESET_THEMES[currentThemeIndex];

  const handleGenerateDecor = async () => {
    setIsGenerating(true);
    setActiveTab('ai-ideas');
    try {
      const ideas = await generateDecorIdeas(
        {
          eventType: activeEvent?.eventType || 'Celebration',
          guestCount: Number(activeEvent?.guestCount) || 100,
          theme: selectedStyle,
          location: activeEvent?.location || 'India',
        },
        selectedStyle,
        idToken || ''
      );

      if (ideas && ideas.length > 0) {
        setAiIdeas(ideas);
        toast.success(`Generated 5 decor concepts using ${AI_MODEL_NAME}`);
      }
    } catch (err) {
      logger.error('[DecorStudio] Error generating decor ideas:', err);
      toast.error('Could not generate decor concepts: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveIdea = (idea: string) => {
    if (savedIdeas.includes(idea)) {
      setSavedIdeas(prev => prev.filter(i => i !== idea));
      toast.success('Idea removed from saved list');
    } else {
      setSavedIdeas(prev => [...prev, idea]);
      toast.success('Decor idea bookmarked to your workspace');
    }
  };

  return (
    <div className="decor-studio-page">
      {/* Tabs */}
      <div className="decor-tabs-row">
        <button
          className={`decor-tab-btn ${activeTab === 'moodboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('moodboard')}
        >
          Moodboard
        </button>
        <button
          className={`decor-tab-btn ${activeTab === 'ai-ideas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-ideas')}
        >
          AI Concepts {aiIdeas.length > 0 && `(${aiIdeas.length})`}
        </button>
        <button
          className={`decor-tab-btn ${activeTab === 'palette' ? 'active' : ''}`}
          onClick={() => setActiveTab('palette')}
        >
          Color Palette
        </button>
      </div>

      {activeTab === 'moodboard' && (
        <>
          {/* Photo Collage Moodboard */}
          <div className="moodboard-grid">
            <div className="collage-left">
              <img src={theme.images[0]} alt={theme.name} />
              <button
                className="heart-like-btn"
                aria-label="Toggle theme index"
                onClick={() => setCurrentThemeIndex(idx => (idx + 1) % PRESET_THEMES.length)}
              >
                <Heart size={16} fill="#E02424" color="#E02424" />
              </button>
            </div>

            <div className="collage-right">
              <div className="right-top-img">
                <img src={theme.images[1]} alt="Decor detail 1" />
              </div>
              <div className="right-bottom-img">
                <img src={theme.images[2]} alt="Decor detail 2" />
              </div>
            </div>
          </div>

          {/* Theme Title & Description */}
          <div className="theme-info-card">
            <h2 className="theme-title">{theme.name}</h2>
            <p className="theme-desc">{theme.desc}</p>

            {/* Color Palette Swatches */}
            <div className="swatches-container">
              <span className="swatches-label">Curated Color Palette</span>
              <div className="swatches-row">
                {theme.swatches.map((color, idx) => (
                  <div
                    key={idx}
                    className="swatch-circle"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Style Tag Filters */}
            <div className="style-filters-row" style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '8px' }}>
                Select Desired Aesthetic:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {STYLES.map(st => (
                  <button
                    key={st}
                    className={`style-tag-chip ${selectedStyle === st ? 'active' : ''}`}
                    onClick={() => setSelectedStyle(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ai-ideas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto', color: '#7E57C2' }} />
              <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {AI_MODEL_NAME} is generating custom {selectedStyle} decor concepts...
              </p>
            </div>
          ) : aiIdeas.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 20px',
              textAlign: 'center',
            }}>
              <Sparkles size={32} style={{ color: '#7E57C2', margin: '0 auto 12px' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 6px 0', color: 'var(--color-tuxedo-black)' }}>
                Generate Custom Decor Concepts
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 16px' }}>
                Let our AI tailor 5 creative decor styling ideas for your {activeEvent?.eventType || 'celebration'} in {selectedStyle} style.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleGenerateDecor}
                style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)' }}
              >
                Generate Decor Concepts
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-tuxedo-black)' }}>
                  Aesthetic: {selectedStyle}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateDecor}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {aiIdeas.map((idea, idx) => {
                const isBookmarked = savedIdeas.includes(idea);
                return (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      background: '#F7F1E8',
                      color: 'var(--color-tuxedo-black)',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--color-tuxedo-black)' }}>
                        {idea}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSaveIdea(idea)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isBookmarked ? '#7E57C2' : 'var(--text-secondary)',
                        padding: '4px',
                      }}
                      title={isBookmarked ? 'Bookmarked' : 'Bookmark this idea'}
                    >
                      <Bookmark size={18} fill={isBookmarked ? '#7E57C2' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {activeTab === 'palette' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PRESET_THEMES.map(th => (
            <div key={th.id} style={{ background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-serif)', fontSize: '16px' }}>{th.name}</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{th.desc}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {th.swatches.map((color, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: color, border: '1px solid rgba(0,0,0,0.1)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{color}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      {activeTab !== 'ai-ideas' && (
        <div style={{ marginTop: '20px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
            onClick={handleGenerateDecor}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>Generate AI Decor Ideas with {AI_MODEL_NAME}</span>
          </button>
        </div>
      )}
    </div>
  );
}
