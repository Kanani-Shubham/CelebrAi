function getCurrentTimestamp(): string {
  return getCurrentTimestamp();
}

import { logger } from '../../utils/logger';
import { useState } from 'react';
import { Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import {
  getEventTasks,
  getEventExpenses,
  getEventGuests,
} from '../../services/firebase/firestore';
import { toast } from '../../components/ui/toast';
import './ReportsExport.css';

const REPORTS = [
  { id: 'rep-tasks', title: 'Task Checklist', desc: 'Real task records with status, category & due dates', type: 'CSV' },
  { id: 'rep-budget', title: 'Budget & Expenses Report', desc: 'Detailed actual expenses, payment status & category breakdown', type: 'CSV' },
  { id: 'rep-guests', title: 'Guest List & RSVPs', desc: 'Guest names, party sizes, dietary restrictions & response status', type: 'CSV' },
  { id: 'rep-full', title: 'Master Event Blueprint', desc: 'Complete event summary, milestones, metrics & checklist', type: 'JSON' },
];

export function ReportsExport() {
  const { activeEvent } = useEvent();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadAllDone, setDownloadAllDone] = useState(false);

  const eventId = activeEvent?.id;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mime });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadSingle = async (repId: string, _title: string) => {
    if (!eventId) {
      toast.error('No active event selected');
      return;
    }

    setDownloadingId(repId);
    try {
      const safeName = (activeEvent?.eventName || 'Celebration').replace(/[^a-zA-Z0-9]/g, '_');

      if (repId === 'rep-tasks') {
        const tasks = (await getEventTasks(eventId)) as { title?: string; category?: string; priority?: string; dueDate?: string; completed?: boolean }[];
        const rows = [
          ['Title', 'Category', 'Priority', 'Due Date', 'Status'],
          ...tasks.map(t => [
            `"${(t.title || '').replace(/"/g, '""')}"`,
            `"${t.category || ''}"`,
            t.priority || 'Medium',
            t.dueDate || 'TBD',
            t.completed ? 'Completed' : 'Pending',
          ]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        downloadFile(csv, `${safeName}_Tasks.csv`, 'text/csv');
        toast.success(`Exported ${tasks.length} task records`);
      } else if (repId === 'rep-budget') {
        const expenses = (await getEventExpenses(eventId)) as { title?: string; vendorName?: string; category?: string; amount?: number; status?: string; date?: string }[];
        const rows = [
          ['Item', 'Vendor', 'Category', 'Amount (INR)', 'Status', 'Date'],
          ...expenses.map(e => [
            `"${(e.title || '').replace(/"/g, '""')}"`,
            `"${(e.vendorName || '').replace(/"/g, '""')}"`,
            `"${e.category || ''}"`,
            Number(e.amount) || 0,
            e.status || 'Pending',
            e.date || '',
          ]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        downloadFile(csv, `${safeName}_Budget_Expenses.csv`, 'text/csv');
        toast.success(`Exported ${expenses.length} expense records`);
      } else if (repId === 'rep-guests') {
        const guests = (await getEventGuests(eventId)) as { name?: string; partySize?: number; dietary?: string; status?: string; phone?: string; email?: string }[];
        const rows = [
          ['Guest Name', 'Party Size', 'Dietary', 'RSVP Status', 'Phone', 'Email'],
          ...guests.map(g => [
            `"${(g.name || '').replace(/"/g, '""')}"`,
            Number(g.partySize) || 1,
            `"${g.dietary || 'None'}"`,
            g.status || 'Pending',
            `"${g.phone || ''}"`,
            `"${g.email || ''}"`,
          ]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        downloadFile(csv, `${safeName}_Guest_List.csv`, 'text/csv');
        toast.success(`Exported ${guests.length} guest records`);
      } else {
        // Master Event Blueprint
        const [tasks, expenses, guests] = await Promise.all([
          getEventTasks(eventId),
          getEventExpenses(eventId),
          getEventGuests(eventId),
        ]);

        const fullExport = {
          event: activeEvent,
          exportedAt: getCurrentTimestamp(),
          tasks,
          expenses,
          guests,
        };

        const json = JSON.stringify(fullExport, null, 2);
        downloadFile(json, `${safeName}_Master_Blueprint.json`, 'application/json');
        toast.success('Master event blueprint exported');
      }
    } catch (err) {
      logger.error('[ReportsExport] Download failed:', err);
      toast.error('Failed to generate report: ' + (err as Error).message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!eventId) {
      toast.error('No active event selected');
      return;
    }
    setDownloadAllDone(true);
    await handleDownloadSingle('rep-full', 'Master Event Blueprint');
    setTimeout(() => setDownloadAllDone(false), 2500);
  };

  return (
    <div className="reports-export-page">
      <div className="reports-head-info">
        <h1 className="reports-title">Reports &amp; Export</h1>
        <p className="reports-sub">
          Export authorized, live Firestore data for your celebration into standard CSV and JSON formats.
        </p>
      </div>

      {/* Event Cover Card */}
      <div className="reports-event-card">
        <div className="rep-cover-img">
          <img
            src={activeEvent?.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'}
            alt="Event Cover"
          />
        </div>
        <div className="rep-card-footer">
          <div>
            <h3 className="rep-event-name">{activeEvent?.eventName || 'Our Celebration'}</h3>
            <span className="rep-event-date">
              {activeEvent?.eventDate || activeEvent?.date || 'Date TBD'} · {activeEvent?.location || 'India'}
            </span>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="reports-list">
        {REPORTS.map(rep => {
          const isDownloading = downloadingId === rep.id;
          return (
            <div key={rep.id} className="report-row-card">
              <div className="rep-file-icon">
                <FileText size={18} />
              </div>

              <div className="rep-details">
                <div className="rep-name-row">
                  <h4 className="rep-name">{rep.title}</h4>
                  <span className="pdf-tag">{rep.type}</span>
                </div>
                <span className="rep-desc">{rep.desc}</span>
              </div>

              <button
                className="rep-download-btn"
                onClick={() => handleDownloadSingle(rep.id, rep.title)}
                disabled={isDownloading}
                aria-label={`Download ${rep.title}`}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action */}
      <div className="reports-sticky-footer">
        <button className="btn-download-all" onClick={handleDownloadAll} disabled={downloadAllDone}>
          {downloadAllDone ? (
            <>
              <CheckCircle2 size={18} />
              <span>Export Complete!</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download Complete Event Bundle (JSON)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
