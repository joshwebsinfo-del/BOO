import React, { useState, useEffect } from 'react';
import {
  Briefcase, Search, MapPin, DollarSign, Calendar, Upload,
  PlusCircle, Mail, FileText, CheckCircle2, X, Users, ClipboardCheck, ThumbsUp, AlertCircle,
  ExternalLink, MessageSquare, Send
} from 'lucide-react';
import { useApp } from '../App.tsx';

// Import Supabase Upload and Firestore SDK hooks
import { uploadToSupabase, firestoreDb } from '../firebase.ts';
import { collection, addDoc } from 'firebase/firestore';

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
  type: string;
  category: string;
  employerEmail?: string;
  advertLink?: string;
  advertImage?: string;
  isFeatured: boolean;
  employerId: number;
}

interface Application {
  id: number;
  jobId: number;
  userId: number;
  name: string;
  email: string;
  coverLetter: string;
  cvUrl?: string;
  status: string;
  job?: Job;
}

export default function Jobs() {
  const { user, token, addNotification } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSearchLocation] = useState('');

  // Selected Job for expanded views
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Post Job Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    description: '',
    location: 'Harare',
    salary: 'USD 1,000 - 1,500 / Month',
    type: 'Full-time',
    category: 'Tech',
    employerEmail: 'joshuamujakari15@gmail.com',
    advertLink: '',
    advertImage: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Apply form State (supports actual pdf or image base64 upload from device)
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    coverLetter: '',
    cvUrl: '' // This will contain the Supabase Hosted URL
  });
  const [cvFileName, setCvFileName] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (selectedLocation) queryParams.append('location', selectedLocation);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/jobs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.warn('Backend connection issue while fetching jobs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.warn('Could not load candidate applications.');
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [selectedCategory, selectedLocation, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Upload to Supabase Storage!
        const publicUrl = await uploadToSupabase(base64String, file.name);
        setNewJob(prev => ({ ...prev, advertImage: publicUrl }));
        setImagePreview(publicUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded resume PDF or Image file and upload to Supabase Storage
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Upload to Supabase Storage!
        const publicUrl = await uploadToSupabase(base64String, file.name);
        setApplyForm(prev => ({ ...prev, cvUrl: publicUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newJob)
      });

      if (res.ok) {
        const added = await res.json();
        setJobs([added, ...jobs]);

        // Sync job vacancy metadata to Firebase Firestore database
        try {
          await addDoc(collection(firestoreDb, 'jobs'), {
            title: added.title,
            company: added.company,
            description: added.description,
            location: added.location,
            salary: added.salary,
            type: added.type,
            category: added.category,
            employerEmail: added.employerEmail,
            advertLink: added.advertLink,
            advertImage: added.advertImage,
            createdAt: new Date().toISOString()
          });
          console.log('[Firestore] Successfully synchronized job vacancy document.');
        } catch (fsErr: any) {
          console.warn(`[Firestore sync warning] ${fsErr.message}`);
        }

        setShowPostModal(false);
        setNewJob({
          title: '',
          company: '',
          description: '',
          location: 'Harare',
          salary: 'USD 1,000 - 1,500 / Month',
          type: 'Full-time',
          category: 'Tech',
          employerEmail: 'joshuamujakari15@gmail.com',
          advertLink: '',
          advertImage: ''
        });
        setImagePreview(null);
        addNotification('Job & Advert Posted', `Successfully listed role "${added.title}" with custom promo links!`, 'Recruitment');
      }
    } catch (e) {
      alert('Failed to list job.');
    }
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setCvFileName('');
    setApplyForm({
      name: user ? user.name : '',
      email: user ? user.email : '',
      coverLetter: '',
      cvUrl: ''
    });
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      // 1. Submit application to backend for candidate tracking
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(applyForm)
      });

      if (res.ok) {
        // Sync application metadata to Firebase Firestore database
        try {
          await addDoc(collection(firestoreDb, 'applications'), {
            jobId: selectedJob.id,
            jobTitle: selectedJob.title,
            company: selectedJob.company,
            name: applyForm.name,
            email: applyForm.email,
            coverLetter: applyForm.coverLetter,
            cvUrl: applyForm.cvUrl, // Supabase hosted file URL!
            createdAt: new Date().toISOString()
          });
          console.log('[Firestore] Successfully synchronized candidate application document.');
        } catch (fsErr: any) {
          console.warn(`[Firestore sync warning] ${fsErr.message}`);
        }

        // Direct email routing check
        const targetEmail = selectedJob.employerEmail;
        if (targetEmail && targetEmail.trim().length > 0) {
          // Open direct email draft (straight to email client)
          const subject = encodeURIComponent(`Job Application for ${selectedJob.title} at ${selectedJob.company}`);
          const body = encodeURIComponent(`Dear HR Team,\n\nPlease find attached my resume and cover letter details for the position of ${selectedJob.title}.\n\nName: ${applyForm.name}\nEmail: ${applyForm.email}\n\nCover Letter Notes:\n${applyForm.coverLetter}\n\nKind regards,\n${applyForm.name}`);
          window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

          addNotification(
            'Direct Email Dispatched',
            `Redirected to email client to send resume straight to ${targetEmail}!`,
            'Recruitment'
          );
          alert(`Application Sent Straight to Email!\n\nWe launched your email client to send your PDF/Image resume directly to the employer at: ${targetEmail}!`);
        } else {
          // Fallback to in-app P2P messaging to employer!
          const chatMsgText = `📢 [New Job Application]\n\nI have applied for your position: "${selectedJob.title}" at "${selectedJob.company}".\n\n- Name: ${applyForm.name}\n- Email: ${applyForm.email}\n- Cover Letter: ${applyForm.coverLetter}\n- Attached Resume: ${applyForm.cvUrl}`;

          const msgRes = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              receiverId: selectedJob.employerId,
              text: chatMsgText
            })
          });

          if (msgRes.ok) {
            addNotification(
              'In-App Message Sent',
              `No email was configured. Application delivered straight to ${selectedJob.company} via in-app messaging!`,
              'Recruitment'
            );
            alert(`Application Sent via In-App Message!\n\nAs no recruiter email was configured, your application details and attached resume have been dispatched straight to the employer via in-app P2P messaging!`);
          }
        }

        setShowApplyModal(false);
        fetchApplications();
      } else {
        const err = await res.json();
        alert(err.error || 'Could not register application.');
      }
    } catch (err) {
      alert('Application connection issue.');
    }
  };

  const handleUpdateAppStatus = async (appId: number, status: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(applications.map(app => app.id === appId ? { ...app, status } : app));
        addNotification('Application Reviewed', `Candidate status updated to "${status}".`, 'Recruitment');
      }
    } catch (e) {
      alert('Could not update application status.');
    }
  };

  const categories = ['Tech', 'Finance', 'Healthcare', 'Education', 'Hospitality', 'Engineering', 'Agriculture'];
  const locations = ['Harare', 'Bulawayo', 'Gweru', 'Mutare', 'Victoria Falls', 'Nyanga'];

  // All roles except Customer can publish jobs/promotions
  const canPostJob = user && user.role !== 'Customer';

  return (
    <div className="space-y-6">

      {/* --- PAGE HEADER --- */}
      <div className="flex justify-between items-center gap-2 border-b pb-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">Job Board</h1>
          <p className="text-[10px] text-slate-400">Post vacancies or optional advert promotions</p>
        </div>
        {canPostJob ? (
          <button
            onClick={() => {
              setShowPostModal(true);
              setImagePreview(null);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Post Job / Advert
          </button>
        ) : (
          <div className="text-[9px] bg-slate-100 border p-2 rounded-lg text-slate-500">
            💡 Providers can publish vacancies with direct resume forwardings.
          </div>
        )}
      </div>

      {/* --- FILTERS & SEARCH ROW --- */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-[11px] font-medium w-full"
          />
        </form>

        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700 text-[10px] font-black cursor-pointer"
          >
            <option value="">Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700 text-[10px] font-black cursor-pointer"
          >
            <option value="">Cities</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      {/* --- CANDIDATES LISTING SECTION --- */}
      {canPostJob && applications.length > 0 && (
        <div className="space-y-3 bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-2xl">
          <h2 className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> Candidates Review Board ({applications.length})
          </h2>
          <div className="space-y-3">
            {applications.map(app => (
              <div key={app.id} className="bg-white border rounded-xl p-3 shadow-sm text-[10px] space-y-2">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <h4 className="font-extrabold text-slate-900">{app.name}</h4>
                    <p className="text-slate-400 font-bold">{app.email}</p>
                  </div>
                  <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded uppercase border">
                    {app.job?.title || 'Recruitment'}
                  </span>
                </div>
                <p className="text-slate-500 italic">" {app.coverLetter} "</p>
                {app.cvUrl && (
                  <div className="text-[9px] text-emerald-700 font-mono bg-emerald-50 p-2 rounded-lg border border-emerald-100/30 flex justify-between items-center">
                    <span>📄 Supabase Hosted CV Attached</span>
                    <a href={app.cvUrl} target="_blank" rel="noreferrer" className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-emerald-700">
                      Open Document
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-slate-400 font-extrabold uppercase text-[8px]">Status: {app.status}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUpdateAppStatus(app.id, 'Accepted')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateAppStatus(app.id, 'Rejected')}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[9px] px-2 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- JOBS LIST --- */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-4">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-xs mt-1">No vacancies listed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 overflow-hidden">

              {/* Optional Supabase Advert Banner display */}
              {job.advertImage && (
                <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-100">
                  <img src={job.advertImage} className="w-full h-full object-cover" alt="Vacancy Banner Promo" />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                    {job.type}
                  </span>
                  <span className="text-[8px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                    {job.category}
                  </span>
                </div>
                <h3 className="font-black text-xs text-slate-900 tracking-tight leading-snug">{job.title}</h3>
                <p className="text-[10px] font-bold text-slate-700 -mt-1">{job.company}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-3 text-[9px] text-slate-400 pt-1 border-t border-slate-50 font-semibold">
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {job.location}</span>
                  {job.salary && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> {job.salary}</span>}
                </div>
              </div>

              {/* Optional external advertisement link display */}
              {job.advertLink && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2 flex justify-between items-center text-[9px]">
                  <span className="text-amber-900 font-extrabold">External Promotion Offer:</span>
                  <a
                    href={job.advertLink.startsWith('http') ? job.advertLink : `https://${job.advertLink}`}
                    target="_blank" rel="noreferrer"
                    className="text-amber-950 font-black flex items-center gap-0.5 hover:underline"
                  >
                    Open Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center gap-1 pt-1.5 border-t">
                {job.employerEmail ? (
                  <span className="text-[8px] font-bold text-slate-400 flex items-center gap-0.5">
                    <Mail className="w-3 h-3 text-emerald-600" /> Deliver CV straight to: {job.employerEmail}
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-slate-400 flex items-center gap-0.5">
                    <MessageSquare className="w-3 h-3 text-emerald-600" /> Deliver to: In-App P2P Chat
                  </span>
                )}
                {user ? (
                  <button
                    onClick={() => handleApplyClick(job)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Apply Now
                  </button>
                ) : (
                  <span className="text-[8px] bg-slate-100 border p-1 rounded text-slate-500">Sign in to apply</span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- APPLY TO JOB MODAL (Accepts actual local PDF or image file upload) --- */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Apply to: {selectedJob.title}</h3>
                <p className="text-[9px] text-slate-400">{selectedJob.employerEmail ? `Routes to: ${selectedJob.employerEmail}` : 'Routes to: In-App Messaging'}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text" required value={applyForm.name} onChange={e => setApplyForm({...applyForm, name: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Email Address *</label>
                  <input
                    type="email" required value={applyForm.email} onChange={e => setApplyForm({...applyForm, email: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Cover Letter *</label>
                <textarea
                  required placeholder="Explain qualifications..." value={applyForm.coverLetter}
                  onChange={e => setApplyForm({...applyForm, coverLetter: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none h-20"
                />
              </div>

              {/* PDF or Image local file upload from device */}
              <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
                <label className="block text-[9px] font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-600" /> Upload Resume CV (PDF or Image) *
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  required
                  onChange={handleResumeUpload}
                  className="w-full text-[10px] text-slate-400 cursor-pointer"
                />
                {cvFileName && (
                  <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-100">
                    ✓ {cvFileName} loaded
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!applyForm.cvUrl}
                className={`w-full font-bold text-xs p-3 rounded-lg shadow-sm ${applyForm.cvUrl ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Submit Job Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- POST JOB MODAL --- */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-extrabold text-sm text-slate-900">Post Job Vacancy / Advert</h3>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Job Title *</label>
                <input
                  type="text" required placeholder="Pediatric Nurse" value={newJob.title}
                  onChange={e => setNewJob({...newJob, title: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Company *</label>
                  <input
                    type="text" required placeholder="EcoNet Wireless" value={newJob.company}
                    onChange={e => setNewJob({...newJob, company: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Direct Recruiter Email</label>
                  <input
                    type="email" placeholder="recruiter@econet.co.zw (Leave empty for in-app chat)" value={newJob.employerEmail}
                    onChange={e => setNewJob({...newJob, employerEmail: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Salary Bracket</label>
                  <input
                    type="text" placeholder="USD 1500 / Month" value={newJob.salary}
                    onChange={e => setNewJob({...newJob, salary: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">City Location</label>
                  <select
                    value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Detailed Description *</label>
                <textarea
                  required placeholder="Specify qualifications..." value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none h-14"
                />
              </div>

              {/* Optional Advert link and photo uploads */}
              <div className="border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 bg-slate-50/50">
                <span className="block font-extrabold text-slate-700 text-[9px]">Optional Promotional Advert Attachment</span>

                <div>
                  <label className="block text-[8px] font-bold text-slate-400 mb-1 uppercase">External Advert URL Link</label>
                  <input
                    type="text" placeholder="e.g. www.econet.co.zw/careers" value={newJob.advertLink}
                    onChange={e => setNewJob({...newJob, advertLink: e.target.value})}
                    className="w-full bg-white border rounded-lg p-1.5 text-[10px] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-slate-400 mb-1 uppercase">Upload Promotional Image</label>
                  <input
                    type="file" accept="image/*" onChange={handleDeviceImageUpload}
                    className="w-full text-[10px] text-slate-400 cursor-pointer"
                  />
                  {imagePreview && (
                    <img src={imagePreview} className="w-14 h-10 object-cover rounded mt-1.5 border" alt="Preview" />
                  )}
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-lg shadow-sm">
                Publish Recruitment Posting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
