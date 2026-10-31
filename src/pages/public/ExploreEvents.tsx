
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import './ExploreEvents.css';

interface EventTypeOption {
  id: string;
  name: string;
  desc: string;
  image: string;
}

const EVENT_TYPES: EventTypeOption[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    desc: 'Plan your big day',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'birthday',
    name: 'Birthday',
    desc: 'Make it special',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    desc: 'Celebrate love',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    desc: 'Meetings & events',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'community',
    name: 'Community',
    desc: 'Festivals & gatherings',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'college',
    name: 'College Event',
    desc: 'Fests, hackathons',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
  },
];

export function ExploreEvents() {
  const navigate = useNavigate();

  const handleSelect = (typeName: string) => {
    navigate(`/create-event?type=${encodeURIComponent(typeName)}`);
  };

  return (
    <div className="page-container explore-page">
      <header className="page-header-nav">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="explore-hero">
        <h1 className="explore-title">Choose Your Event</h1>
        <p className="explore-subtitle">
          What are you planning?<br />
          Let's create something amazing together.
        </p>
      </div>

      <div className="event-grid">
        {EVENT_TYPES.map(type => (
          <div
            key={type.id}
            className="event-grid-card"
            onClick={() => handleSelect(type.name)}
          >
            <div className="event-img-wrap">
              <img src={type.image} alt={type.name} />
            </div>
            <div className="event-info">
              <h3>{type.name}</h3>
              <p>{type.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="custom-event-container">
        <button
          className="custom-event-card"
          onClick={() => handleSelect('Custom')}
        >
          <div className="custom-plus-icon">
            <Plus size={20} />
          </div>
          <div className="custom-info">
            <h3>Custom Event</h3>
            <p>Create your own event</p>
          </div>
        </button>
      </div>
    </div>
  );
}
