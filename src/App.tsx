import React, { useState, useEffect } from 'react';
import { User, Business, Representative, PaymentGatewayConfig } from './types';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, DEFAULT_PAYMENT_CONFIG } from './data/mockData';
import { calculateTotalRepCommission } from './utils/commission';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { InteractiveMap } from './components/InteractiveMap';
import { BusinessForm } from './components/BusinessForm';
import { InvoiceModal } from './components/InvoiceModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RepDashboard } from './components/RepDashboard';
import { RepProfile } from './components/RepProfile';
import { LoginModal } from './components/LoginModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { MapPin, PlusCircle, FileText, CheckCircle2, Clock, AlertCircle, Phone, Share2, Search, ExternalLink, ShieldCheck, Sparkles, Building2, Database } from 'lucide-react';
import {
  fetchBusinessesFromDb,
  saveBusinessToDb,
  updateBusinessInDb,
  deleteBusinessFromDb,
  fetchRepsFromDb,
  saveRepToDb,
} from './services/db';

export default function App() {
  // Application State - Default to null (Guest visitor) or restore saved user session
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('dalelak_logged_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.name) return parsed;
      } catch (e) {}
    }
    return null; // Guest visitor by default
  });

  // Sync user state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('dalelak_logged_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dalelak_logged_user');
    }
  }, [user]);

  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [representatives, setRepresentatives] = useState<Representative[]>(() => {
    const localReps = localStorage.getItem('dalelak_representatives');
    if (localReps) {
      try {
        const parsed = JSON.parse(localReps);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MOCK_REPRESENTATIVES;
  });
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(DEFAULT_PAYMENT_CONFIG);

  // Navigation Tabs: 'home' | 'map' | 'add' | 'invoices' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modals & Selected items
  const [selectedInvoiceBiz, setSelectedInvoiceBiz] = useState<Business | null>(null);
  const [selectedPayBiz, setSelectedPayBiz] = useState<Business | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isMobileSimulated, setIsMobileSimulated] = useState<boolean>(false);

  // Home Feed Search & Filters
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');
  const [homeStatusFilter, setHomeStatusFilter] = useState<string>('all');

  // Fetch initial data from Supabase Database & Local Backend
  useEffect(() => {
    fetchBusinessesFromDb().then((data) => {
      if (data && data.length > 0) setBusinesses(data);
    });

    fetchRepsFromDb().then((data) => {
      if (data && data.length > 0) setRepresentatives(data);
    });

    fetch('/api/payment-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fawryMerchantCode) setPaymentConfig(data);
      })
      .catch((err) => console.log('Using local payment config fallback:', err));
  }, []);

  // Handlers synced with Supabase Database
  const handleAddBusiness = async (newBiz: Business) => {
    setBusinesses([newBiz, ...businesses]);
    saveBusinessToDb(newBiz);
    try {
      await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBiz),
      });
    } catch (err) {
      console.log('Express backend sync notice:', err);
    }
  };

  const handleUpdateBusiness = async (updatedBiz: Business) => {
    setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
    updateBusinessInDb(updatedBiz.id, updatedBiz);
    try {
      await fetch(`/api/businesses/${updatedBiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBiz),
      });
    } catch (err) {
      console.log('Express backend sync notice:', err);
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    setBusinesses(businesses.filter((b) => b.id !== id));
    deleteBusinessFromDb(id);
    try {
      await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Express backend sync notice:', err);
    }
  };

  const handleAddRepresentative = async (repData: Partial<Representative>) => {
    const newRep: Representative = {
      id: repData.id || `acc_${Date.now()}`,
      name: repData.name || 'حساب جديد',
      email: repData.email || 'user@daleelek.eg',
      phone: repData.phone || '01000000000',
      nationalId: repData.nationalId || '',
      role: repData.role || 'rep',
      roleTitle: repData.roleTitle || 'مندوب مبيعات ميداني',
      governorate: repData.governorate || 'القاهرة',
      targetMonth: repData.targetMonth || 25,
      avatar: repData.avatar || '',
      avatarStatus: repData.avatarStatus || 'none',
      commissionRate: repData.commissionRate || 42.86,
      status: repData.status || 'suspended',
      password: repData.password || 'Aa123456',
    };

    setRepresentatives((prev) => {
      const filtered = prev.filter((r) => r.id !== newRep.id && r.email.toLowerCase() !== newRep.email.toLowerCase());
      const updated = [newRep, ...filtered];
      localStorage.setItem('dalelak_representatives', JSON.stringify(updated));
      return updated;
    });

    await saveRepToDb(newRep);
  };

  const handleUpdateRepresentative = async (updatedRep: Representative) => {
    setRepresentatives((prev) => {
      const updated = prev.map((r) => (r.id === updatedRep.id ? updatedRep : r));
      localStorage.setItem('dalelak_representatives', JSON.stringify(updated));
      return updated;
    });

    if (user?.repData?.id === updatedRep.id) {
      setUser({ ...user, repData: updatedRep, name: updatedRep.name, email: updatedRep.email });
    }
    await saveRepToDb(updatedRep);
  };

  const handleDeleteRepresentative = async (id: string) => {
    setRepresentatives(representatives.filter((r) => r.id !== id));
    try {
      await fetch(`/api/representatives/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Backend rep delete sync failed:', err);
    }
  };

  const handleUpdatePaymentConfig = async (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    try {
      await fetch('/api/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (err) {
      console.log('Backend payment config update failed:', err);
    }
  };

  const rawRep = user?.repData || representatives[0];
  const currentRep: Representative = {
    ...rawRep,
    commissionRate: rawRep?.commissionRate && rawRep.commissionRate > 0 && rawRep.commissionRate !== 15 ? rawRep.commissionRate : 42.86,
  };
  const isRepUser = user?.role !== 'admin';

  // Strict Scoping: If logged in as Representative, only display businesses registered by this rep!
  const scopedBusinesses = isRepUser
    ? businesses.filter((b) => b.repId === currentRep.id || b.repName === currentRep.name)
    : businesses;

  const filteredHomeBusinesses = scopedBusinesses.filter((b) => {
    if (homeSearchQuery && !b.nameAr.includes(homeSearchQuery) && !b.city.includes(homeSearchQuery) && !b.governorate.includes(homeSearchQuery)) {
      return false;
    }
    if (homeStatusFilter !== 'all' && b.paymentStatus !== homeStatusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-['Cairo',sans-serif] transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={() => setUser(null)}
        activeTab={activeTab}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl p-3 sm:p-5">
        {/* TAB 1: HOME FEED */}
        {activeTab === 'home' && (
          <div className="space-y-5 pb-20">
            {/* Field Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center justify-between">
              <div>
                <span className="bg-slate-950/20 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  منصة دليلك الميدانية
                </span>
                <h1 className="text-xl sm:text-2xl font-black mt-1">تسجيل وتوثيق الأنشطة التجارية على خرائط جوجل</h1>
                <p className="text-xs font-bold text-slate-900/90 mt-1 max-w-lg">
                  تسجيل مباشر لبيانات المحلات، إحداثيات GPS الدقيقة، وإصدار الفواتير الإلكترونية على واتساب صاحب النشاط في جميع محافظات مصر.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('add')}
                className="hidden sm:flex bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs px-4 py-3 rounded-2xl shadow-lg items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>تسجيل نشاط جديد</span>
              </button>
            </div>

            {/* Quick Rep Workspace summary if Rep logged in */}
            {user?.role === 'rep' && (
              <RepDashboard
                rep={currentRep}
                businesses={businesses}
                onAddNewClick={() => setActiveTab('add')}
                onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
              />
            )}

            {/* Registered Businesses Feed */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">الأنشطة المسجلة في مصر ({businesses.length})</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">تابع حالة الدفع والتفعيل على الخريطة أولاً بأول</p>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="بحث باسم النشاط أو المدينة..."
                      value={homeSearchQuery}
                      onChange={(e) => setHomeSearchQuery(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pr-8 pl-3 py-1.5 focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>

                  <select
                    value={homeStatusFilter}
                    onChange={(e) => setHomeStatusFilter(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shrink-0 shadow-sm font-bold"
                  >
                    <option value="all">كل حالات الدفع</option>
                    <option value="fully_paid">مدفوعة بالكامل</option>
                    <option value="partially_paid">مدفوع جزء منها</option>
                    <option value="unpaid">لم يتم الدفع نهائياً</option>
                  </select>
                </div>
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHomeBusinesses.map((biz) => {
                  const remaining = Math.max(0, biz.packagePrice - biz.amountPaid);

                  return (
                    <div key={biz.id} className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 hover:border-amber-500/30 transition-all flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                              {biz.category}
                            </span>
                            <h4 className="font-extrabold text-base text-[var(--text-primary)] mt-1">{biz.nameAr}</h4>
                            <p className="text-xs text-[var(--text-secondary)] font-bold">
                              {biz.governorate} - {biz.city} ({biz.street})
                            </p>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 shadow-sm ${
                            biz.verificationStatus === 'verified'
                              ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-900 dark:text-amber-400 border-amber-500/40'
                          }`}>
                            {biz.verificationStatus === 'verified' ? 'تم التوثيق والظهور' : 'جاري المعالجة'}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-bold line-clamp-2 leading-relaxed">{biz.description}</p>
                      </div>

                      {/* Payment status & Actions */}
                      <div className="pt-3 border-t border-[var(--border-color)] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-bold">
                            <Phone className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            <span>{biz.ownerName} (<strong className="font-mono text-amber-800 dark:text-amber-400">{biz.ownerPhone}</strong>)</span>
                          </div>

                          <div className="text-left font-bold">
                            <span className="text-emerald-700 dark:text-emerald-400 text-sm font-black">{biz.amountPaid} ج.م</span>
                            {remaining > 0 && <span className="text-rose-700 dark:text-rose-400 text-[10px] block font-extrabold">متبقي {remaining} ج.م</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedInvoiceBiz(biz)}
                            className="w-full bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            <span>الفاتورة الإلكترونية</span>
                          </button>

                          {remaining > 0 && (
                            <button
                              onClick={() => setSelectedPayBiz(biz)}
                              className="w-full bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 font-black px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-emerald-600 hover:text-white transition-colors shadow-sm cursor-pointer"
                            >
                              <span>تحصيل المتبقي</span>
                            </button>
                          )}

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${biz.lat},${biz.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-800 text-slate-200 hover:text-white font-bold p-1.5 rounded-xl border border-slate-700 shrink-0"
                            title="فتح موقع الإحداثيات على الخريطة"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE MAP OVERVIEW */}
        {activeTab === 'map' && (
          <div className="space-y-4 pb-20">
            <InteractiveMap
              mode="view"
              businesses={scopedBusinesses}
              onSelectBusiness={(b) => setSelectedInvoiceBiz(b)}
              heightClass="h-[520px]"
            />
          </div>
        )}

        {/* TAB 3: REGISTER NEW BUSINESS FORM */}
        {activeTab === 'add' && (
          <BusinessForm
            onSubmitBusiness={handleAddBusiness}
            currentRep={currentRep}
            onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
          />
        )}

        {/* TAB 4: INVOICES & WHATSAPP DISPATCH */}
        {activeTab === 'invoices' && (
          <div className="max-w-4xl mx-auto space-y-4 pb-20">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 space-y-4 shadow-md transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">سجل الفواتير والتحصيلات ({scopedBusinesses.length})</h3>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  {scopedBusinesses.length} فاتورة مسجلة
                </span>
              </div>

              <div className="space-y-3">
                {scopedBusinesses.map((biz) => {
                  const remaining = Math.max(0, biz.packagePrice - biz.amountPaid);

                  return (
                    <div key={biz.id} className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm hover:border-amber-500/30 transition-all">
                      <div>
                        <span className="text-amber-700 dark:text-amber-400 font-mono font-extrabold">{biz.invoiceNumber}</span>
                        <h4 className="font-extrabold text-sm text-[var(--text-primary)] mt-0.5">{biz.nameAr}</h4>
                        <p className="text-[var(--text-secondary)] font-bold">صاحب النشاط: {biz.ownerName} ({biz.ownerPhone})</p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-[var(--border-color)] pt-2 sm:pt-0">
                        <div className="text-left font-bold">
                          <span className="text-emerald-700 dark:text-emerald-400 text-sm block font-black">{biz.amountPaid} ج.م</span>
                          {remaining > 0 && <span className="text-rose-700 dark:text-rose-400 text-[10px] font-bold">متبقي {remaining} ج.م</span>}
                        </div>

                        <button
                          onClick={() => setSelectedInvoiceBiz(biz)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>إرسال واتساب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5 (ADMIN DASHBOARD / REP PROFILE) */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            businesses={businesses}
            representatives={representatives}
            paymentConfig={paymentConfig}
            onUpdateBusiness={handleUpdateBusiness}
            onDeleteBusiness={handleDeleteBusiness}
            onAddRepresentative={handleAddRepresentative}
            onUpdateRepresentative={handleUpdateRepresentative}
            onDeleteRepresentative={handleDeleteRepresentative}
            onUpdatePaymentConfig={handleUpdatePaymentConfig}
            onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
          />
        )}

        {(activeTab === 'profile' || (activeTab === 'admin' && user?.role !== 'admin')) && (
          user ? (
            <RepProfile
              user={user}
              rep={currentRep}
              businessesCount={scopedBusinesses.length}
              totalRevenue={scopedBusinesses.reduce((acc, b) => acc + b.amountPaid, 0)}
              totalCommission={calculateTotalRepCommission(scopedBusinesses, currentRep.commissionRate)}
              onLogout={() => setUser(null)}
              onUpdateRep={handleUpdateRepresentative}
            />
          ) : (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-4 max-w-md mx-auto shadow-md transition-colors duration-300">
              <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-black text-lg text-[var(--text-primary)]">تسجيل الدخول للحساب</h3>
              <p className="text-xs text-[var(--text-secondary)] px-6 leading-relaxed font-bold">
                برجاء تسجيل الدخول للوصول إلى لوحة التحكم وملفك الشخصي وتوثيقات الميدان.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                تسجيل الدخول الآن
              </button>
            </div>
          )
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={user?.role === 'admin'}
      />

      {/* MODAL: INVOICE VIEWER & WHATSAPP DISPATCH */}
      <InvoiceModal
        business={selectedInvoiceBiz}
        onClose={() => setSelectedInvoiceBiz(null)}
      />

      {/* MODAL: PAYMENT GATEWAY SIMULATION */}
      {selectedPayBiz && (
        <PaymentGatewayModal
          business={selectedPayBiz}
          config={paymentConfig}
          onClose={() => setSelectedPayBiz(null)}
          onPaymentSuccess={(newPaid) => {
            if (selectedPayBiz) {
              const status = newPaid >= selectedPayBiz.packagePrice ? 'fully_paid' : 'partially_paid';
              handleUpdateBusiness({
                ...selectedPayBiz,
                amountPaid: newPaid,
                paymentStatus: status,
              });
            }
          }}
        />
      )}

      {/* MODAL: LOGIN DIALOG */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(u) => {
            setUser(u);
            if (u.role === 'admin') setActiveTab('admin');
          }}
          representatives={representatives}
          onAddRepresentative={handleAddRepresentative}
        />
      )}
    </div>
  );
}
