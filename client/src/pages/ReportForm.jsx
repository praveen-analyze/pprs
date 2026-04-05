import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast                 from 'react-hot-toast';
import StepIndicator          from '@/components/StepIndicator';
import CameraPanel            from '@/components/CameraPanel';
import LocationPanel          from '@/components/LocationPanel';
import { submitComplaint }    from '@/utils/api';

const CATEGORIES = [
  { id: 'Road',        label: 'Road',        desc: 'Potholes, cracks, damage',     emoji: '🛣️' },
  { id: 'Garbage',     label: 'Garbage',     desc: 'Uncollected waste, dumping',   emoji: '🗑️' },
  { id: 'Streetlight', label: 'Streetlight', desc: 'Broken or missing lights',     emoji: '💡' },
  { id: 'Drainage',    label: 'Drainage',    desc: 'Blocked drains, waterlogging', emoji: '🌊' },
  { id: 'Water',       label: 'Water',       desc: 'Supply issues, leakage',       emoji: '💧' },
  { id: 'Other',       label: 'Other',       desc: 'Any other civic issue',        emoji: '📋' },
];

const INITIAL = { category:'', photoBlob:null, latitude:null, longitude:null, address:'', description:'', reporterName:'', reporterEmail:'', reporterPhone:'' };

export default function ReportForm() {
  const navigate = useNavigate();
  const [step, setStep]             = useState(1);
  const [form, setForm]             = useState(INITIAL);
  const [cameraOn, setCameraOn]     = useState(false);
  const [errors, setErrors]         = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(null);

  const update = useCallback((key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }, []);

  const handleCameraToggle = useCallback((on) => {
    setCameraOn(on);
    if (!on) { update('photoBlob', null); update('latitude', null); update('longitude', null); update('address', ''); }
  }, [update]);

  const handlePhotoCapture   = useCallback((blob) => update('photoBlob', blob), [update]);
  const handleLocationCapture = useCallback((loc) => {
    if (loc) { update('latitude', loc.latitude); update('longitude', loc.longitude); update('address', loc.address); }
    else { update('latitude', null); update('longitude', null); update('address', ''); }
  }, [update]);

  const validate = (s) => {
    const e = {};
    if (s === 1 && !form.category) e.category = 'Please select a category';
    if (s === 2) {
      if (!form.photoBlob) e.photo    = 'Please capture a photo';
      if (!form.latitude)  e.location = 'Please enable location access';
    }
    if (s === 3) {
      if (!form.description || form.description.trim().length < 20) e.description = 'Description must be at least 20 characters';
      if (form.reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporterEmail)) e.reporterEmail = 'Invalid email address';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) { setStep((s) => Math.min(s + 1, 4)); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const prev = () => { setStep((s) => Math.max(s - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description.trim());
      fd.append('latitude', String(form.latitude));
      fd.append('longitude', String(form.longitude));
      fd.append('address', form.address);
      fd.append('reporterName', form.reporterName.trim());
      fd.append('reporterEmail', form.reporterEmail.trim());
      fd.append('reporterPhone', form.reporterPhone.trim());
      if (form.photoBlob) fd.append('images', form.photoBlob, 'complaint-photo.jpg');
      const result = await submitComplaint(fd);
      setSubmitted({ complaintNo: result.complaintNo });
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center animate-entry">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint submitted!</h2>
          <p className="text-gray-500 mb-8">Your complaint has been registered with the municipal board.</p>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-primary-600 font-medium mb-2">Your complaint number</p>
            <p className="text-3xl font-bold text-primary-700 tracking-widest font-mono mb-4">{submitted.complaintNo}</p>
            <button onClick={() => { navigator.clipboard.writeText(submitted.complaintNo); toast.success('Copied!'); }}
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy number
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <Link to={`/track/${submitted.complaintNo}`} className="btn-primary w-full justify-center">Track your complaint</Link>
            <button onClick={() => { setForm(INITIAL); setStep(1); setSubmitted(null); setCameraOn(false); }} className="btn-secondary w-full justify-center">Report another problem</button>
            <Link to="/" className="btn-ghost w-full justify-center text-sm">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
            <div className="flex items-center gap-2">
              <Link to="/admin/login" className="btn-ghost p-2 text-gray-600 hover:text-primary-600 rounded-full" title="Admin Login">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </Link>
              <Link to="/" className="btn-ghost text-sm">Cancel</Link>
            </div>

      <div className="page-container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8"><StepIndicator currentStep={step} totalSteps={4} /></div>

          {/* Step 1: Category */}
          {step === 1 && (
            <div className="animate-entry">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">What type of problem are you reporting?</h2>
                <p className="text-sm text-gray-500">Select the category that best describes the issue.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => update('category', cat.id)}
                    className={`card p-5 text-left transition-all hover:shadow-panel active:scale-95 relative ${form.category === cat.id ? 'border-2 border-primary-600 bg-primary-50' : 'border border-gray-200 hover:border-primary-300'}`}>
                    {form.category === cat.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <div className="text-3xl mb-3">{cat.emoji}</div>
                    <p className={`font-semibold text-sm mb-1 ${form.category === cat.id ? 'text-primary-700' : 'text-gray-900'}`}>{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-sm text-red-500 mb-4">{errors.category}</p>}
              <button onClick={next} className="btn-primary w-full py-3">Continue →</button>
            </div>
          )}

          {/* Step 2: Photo + Location */}
          {step === 2 && (
            <div className="animate-entry">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Add a photo and your location</h2>
                <p className="text-sm text-gray-500">Enable your camera, then allow location access to pin the problem.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <CameraPanel onPhotoCapture={handlePhotoCapture} onCameraToggle={handleCameraToggle} hasPhoto={!!form.photoBlob} />
                <LocationPanel isEnabled={cameraOn} onLocationCapture={handleLocationCapture} />
              </div>
              {(errors.photo || errors.location) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  {errors.photo    && <p className="text-sm text-red-600">{errors.photo}</p>}
                  {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={prev} className="btn-secondary flex-1 py-3">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-3">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="animate-entry">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Describe the problem</h2>
                <p className="text-sm text-gray-500">Add details and optional contact info for status updates.</p>
              </div>
              <div className="card p-6 space-y-5 mb-4">
                <div>
                  <label className="label" htmlFor="desc">Description <span className="text-red-500">*</span></label>
                  <textarea id="desc" value={form.description} onChange={(e) => update('description', e.target.value)}
                    placeholder="Describe the problem in detail — location landmarks, severity, how long it has been there..."
                    rows={5} maxLength={1000}
                    className={`input resize-none ${errors.description ? 'border-red-400 focus:ring-red-400' : ''}`} />
                  <div className="flex justify-between mt-1">
                    {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : <p className="text-xs text-gray-400">Minimum 20 characters</p>}
                    <p className={`text-xs ${form.description.length < 20 ? 'text-red-400' : 'text-gray-400'}`}>{form.description.length}/1000</p>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Contact details <span className="font-normal text-gray-400">(optional)</span></p>
                  <p className="text-xs text-gray-400 mb-4">We'll send email updates when your complaint status changes.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="label" htmlFor="name">Full name</label>
                      <input id="name" type="text" value={form.reporterName} onChange={(e) => update('reporterName', e.target.value)} placeholder="Your name" className="input" />
                    </div>
                    <div>
                      <label className="label" htmlFor="email">Email address</label>
                      <input id="email" type="email" value={form.reporterEmail} onChange={(e) => update('reporterEmail', e.target.value)} placeholder="your@email.com" className={`input ${errors.reporterEmail ? 'border-red-400' : ''}`} />
                      {errors.reporterEmail && <p className="text-xs text-red-500 mt-1">{errors.reporterEmail}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="phone">Phone number</label>
                      <input id="phone" type="tel" value={form.reporterPhone} onChange={(e) => update('reporterPhone', e.target.value)} placeholder="+91 98765 43210" className="input" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={prev} className="btn-secondary flex-1 py-3">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-3">Review →</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="animate-entry">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review your complaint</h2>
                <p className="text-sm text-gray-500">Please check all details before submitting.</p>
              </div>
              <div className="card p-6 space-y-5 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Category</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORIES.find((c) => c.id === form.category)?.emoji}</span>
                      <span className="font-semibold text-gray-900">{form.category}</span>
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline">Edit</button>
                </div>
                <hr className="border-gray-100" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Photo</p>
                    {form.photoBlob ? (
                      <div className="w-24 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <img src={URL.createObjectURL(form.photoBlob)} alt="Complaint" className="w-full h-full object-cover" />
                      </div>
                    ) : <p className="text-sm text-gray-400">No photo</p>}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Location</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{form.address || 'No location'}</p>
                  </div>
                  <button onClick={() => setStep(2)} className="text-sm text-primary-600 hover:underline flex-shrink-0">Edit</button>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Description</p>
                    <button onClick={() => setStep(3)} className="text-sm text-primary-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{form.description}</p>
                </div>
                {(form.reporterName || form.reporterEmail || form.reporterPhone) && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Contact details</p>
                      <div className="space-y-1 text-sm text-gray-700">
                        {form.reporterName  && <p>Name: {form.reporterName}</p>}
                        {form.reporterEmail && <p>Email: {form.reporterEmail}</p>}
                        {form.reporterPhone && <p>Phone: {form.reporterPhone}</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
                <p className="text-xs text-blue-700">By submitting, you confirm the information is accurate. False reports may be rejected.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={prev} className="btn-secondary flex-1 py-3">← Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-1 py-3">
                  {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : 'Submit complaint'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
