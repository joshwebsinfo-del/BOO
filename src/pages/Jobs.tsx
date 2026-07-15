import React, { useState, useEffect } from 'react';
import {
  Briefcase, Search, MapPin, DollarSign, Calendar, Upload,
  PlusCircle, Mail, FileText, CheckCircle2, X, Users
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
  type: string;
  category: string;
  isFeatured: boolean;
}

export default function Jobs() {
  const { user, token, addNotification } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Post Job Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    description: '',
    location: 'Harare',
    salary: 'USD 1,000 - 1,500 / Month',
    type: 'Full-time',
    category: 'Tech'
  });

  // Apply Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyForm, setApplyForm] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    coverLetter: '',
    cvUrl: 'https://zimhub.co.zw/cvs/mock-uploaded-resume.pdf' // Mock file path string
  });

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

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
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
        setShowAddModal(false);
        setNewJob({
          title: '',
          company: '',
          description: '',
          location: 'Harare',
          salary: 'USD 1,000 - 1,500 / Month',
          type: 'Full-time',
          category: 'Tech'
        });
        addNotification('Job Posted', `Successfully listed role "${added.title}" for ${added.company}!`, 'Recruitment');
      }
    } catch (e) {
      alert('Failed to list job.');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(applyForm)
      });

      if (res.ok) {
        addNotification(
          'Application Submitted',
          `Your application for "${selectedJob.title}" at ${selectedJob.company} was sent successfully.`,
          'Recruitment'
        );
        setSelectedJob(null);
        setApplyForm({
          name: user ? user.name : '',
          email: user ? user.email : '',
          coverLetter: '',
          cvUrl: 'https://zimhub.co.zw/cvs/mock-uploaded-resume.pdf'
        });
        alert(`Application sent! Employers will contact you at ${applyForm.email}.`);
      }
    } catch (err) {
      alert('Application failed.');
    }
  };

  const categories = ['Tech', 'Finance', 'Healthcare', 'Education', 'Hospitality', 'Engineering', 'Agriculture'];
  const locations = ['Harare', 'Bulawayo', 'Gweru', 'Mutare', 'Victoria Falls', 'Nyanga'];

  return (
    <div className="space-y-8">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Zimbabwe Job Board</h1>
          <p className="text-slate-500 text-sm">Post vacancies, find rewarding tech contracts, management roles, and medical internships across the nation.</p>
        </div>
        {user?.role === 'Employer' || user?.role === 'Administrator' ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Post a Vacancy
          </button>
        ) : (
          <div className="text-xs bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-500">
            💡 Employers can post job listings directly with custom dashboards.
          </div>
        )}
      </div>

      {/* --- FILTERS & SEARCH ROW --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search React developer, operations manager, company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-sm font-medium w-full"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <option value="">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      {/* --- JOBS GRID LIST --- */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-2">Discovering careers...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No vacancies listed under these filters.</p>
          <p className="text-slate-400 text-xs">Register your company or check other professional directories!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                    {job.type}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                    {job.category}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{job.title}</h3>
                <p className="text-xs font-bold text-slate-700 -mt-1">{job.company}</p>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{job.description}</p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}</span>
                  {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> {job.salary}</span>}
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => setSelectedJob(job)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm tracking-wide transition-all shrink-0 active:scale-95 self-end md:self-auto"
                >
                  Apply to Job
                </button>
              ) : (
                <div className="text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-500 self-end md:self-auto">
                  Sign in to apply
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* --- APPLY TO JOB MODAL --- */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Apply to: {selectedJob.title}</h3>
                <p className="text-[11px] text-slate-500">Corporate Recruiter: {selectedJob.company}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applyForm.name}
                    onChange={e => setApplyForm({...applyForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    required
                    value={applyForm.email}
                    onChange={e => setApplyForm({...applyForm, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Cover Letter (Brief Introduction) *</label>
                <textarea
                  required
                  placeholder="Tell the employer why you are a perfect fit for this Zimbabwean vacancy..."
                  value={applyForm.coverLetter}
                  onChange={e => setApplyForm({...applyForm, coverLetter: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">CV File Upload (PDF/Word Path) *</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer space-y-1 bg-slate-50/50">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Simulate Resume Attachment</p>
                  <p className="text-[10px] text-slate-400">PDF, DOCX up to 10MB (Local Sandbox Upload)</p>
                  <input
                    type="text"
                    value={applyForm.cvUrl}
                    onChange={e => setApplyForm({...applyForm, cvUrl: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-mono text-center focus:outline-none mt-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Submit Job Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- POST JOB MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">Post a Corporate Vacancy</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Pediatric Nurse"
                  value={newJob.title}
                  onChange={e => setNewJob({...newJob, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company / Institution Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EcoNet Wireless"
                    value={newJob.company}
                    onChange={e => setNewJob({...newJob, company: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Salary Bracket</label>
                  <input
                    type="text"
                    placeholder="e.g. USD 2,500 / Month"
                    value={newJob.salary}
                    onChange={e => setNewJob({...newJob, salary: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={newJob.category}
                    onChange={e => setNewJob({...newJob, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Job Type</label>
                  <select
                    value={newJob.type}
                    onChange={e => setNewJob({...newJob, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City Location</label>
                  <select
                    value={newJob.location}
                    onChange={e => setNewJob({...newJob, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Detailed Description *</label>
                <textarea
                  required
                  placeholder="Specify key roles, mandatory qualifications, working days, and resume deadlines..."
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Publish Recruitment Posting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
