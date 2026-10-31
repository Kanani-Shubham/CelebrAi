import { logger } from '../../utils/logger';
import { useState } from 'react';
import { Sparkles, Copy, Bookmark, RefreshCw, Check, Edit3 } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { useAuth } from '../../contexts/useAuth';
import { generateInvitationText } from '../../services/ai/groq';
import { updateEvent } from '../../services/firebase/firestore';
import { toast } from '../../components/ui/toast';
import './ContentStudio.css';

export function ContentStudio() {
  const { activeEvent } = useEvent();
  const { idToken } = useAuth();
  const [contentType, setContentType] = useState<'invitation' | 'announcement' | 'caption' | 'menu'>('invitation');
  const [eventType, setEventType] = useState(activeEvent?.eventType || 'Wedding');
  const [tone, setTone] = useState('Elegant & Warm');
  const [language, setLanguage] = useState('English');
  const [keyDetails, setKeyDetails] = useState(
    `${activeEvent?.eventName || 'Celine & James'}, ${activeEvent?.eventDate || '7 March 2028'}, ${activeEvent?.location || 'Ahmedabad'}, The Grand Orchard: evening ceremony, dinner to follow`
  );
  const [generatedText, setGeneratedText] = useState(
    `Together with their families\n\nCeline & James\n\ninvite you to celebrate their wedding on 7 March 2028 at The Grand Orchard, Ahmedabad. Join us for an evening of love, laughter and unforgettable memories. Dinner and dancing to follow.`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateInvitationText(
        {
          eventName: activeEvent?.eventName || 'Our Celebration',
          eventDate: activeEvent?.eventDate || activeEvent?.date || 'TBD',
          location: activeEvent?.location || 'India',
          keyDetails,
        },
        tone,
        contentType,
        idToken || ''
      );
      if (res) {
        setGeneratedText(res);
      }
    } catch (err) {
      logger.error('[ContentStudio] Generation failed:', err);
      toast.error('Failed to generate copy: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (activeEvent?.id) {
      try {
        await updateEvent(activeEvent.id, {
          [`saved_${contentType}`]: generatedText,
        });
        setSaved(true);
        toast.success(`Saved ${contentType} to event records!`);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        toast.error('Failed to save content: ' + (err as Error).message);
      }
    } else {
      setSaved(true);
      toast.success('Content saved!');
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="content-studio-page">
      {/* Tabs */}
      <div className="studio-tabs-row">
        {(['invitation', 'announcement', 'caption', 'menu'] as const).map(tab => (
          <button
            key={tab}
            className={`studio-tab-btn ${contentType === tab ? 'active' : ''}`}
            onClick={() => setContentType(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Control Inputs */}
      <div className="studio-form-card">
        <div className="studio-form-row">
          <div className="studio-field">
            <label>Event type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}>
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Corporate">Corporate</option>
              <option value="Community">Community</option>
            </select>
          </div>

          <div className="studio-field">
            <label>Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)}>
              <option value="Elegant & Warm">Elegant & Warm</option>
              <option value="Playful & Fun">Playful & Fun</option>
              <option value="Royal & Traditional">Royal & Traditional</option>
              <option value="Minimal & Modern">Minimal & Modern</option>
            </select>
          </div>
        </div>

        <div className="studio-field">
          <label>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Gujarati">Gujarati</option>
            <option value="French">French</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>

        <div className="studio-field">
          <label>Key details</label>
          <textarea
            rows={3}
            value={keyDetails}
            onChange={e => setKeyDetails(e.target.value)}
            placeholder="Add specific names, date, venue and schedule notes..."
          />
        </div>

        {/* Generate Button */}
        <button
          className="generate-ai-text-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{isGenerating ? 'Crafting Words...' : 'Generate with AI'}</span>
        </button>
      </div>

      {/* Generated Content Card */}
      <div className="generated-content-section">
        <div className="gen-header">
          <span className="gen-label">Generated Invitation Text</span>
          <button className="gen-edit-btn" aria-label="Edit text">
            <Edit3 size={13} />
          </button>
        </div>

        <div className="generated-card-frame">
          <p className="generated-text-body">{generatedText}</p>
        </div>

        <div className="generated-actions-row">
          <button className="btn-regen" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            <span>Regenerate</span>
          </button>

          <button className="btn-tool" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button className="btn-tool" onClick={handleSave}>
            {saved ? <Check size={14} /> : <Bookmark size={14} />}
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
