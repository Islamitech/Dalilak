'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, UserPlus, Layers, DollarSign,
  Search, Filter, RefreshCw, LogOut, ShieldCheck, CheckCircle, Clock, X, Store
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PlaceItem } from '../page';

interface DocumenterUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
  password_hash?: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<DocumenterUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [documenters, setDocumenters] = useState<DocumenterUser[]>([]);
  const [allPlaces, setAllPlaces] = useState<PlaceItem[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumenterFilter, setSelectedDocumenterFilter] = useState('الكل');
  const [selectedPayFilter, setSelectedPayFilter] = useState('الكل');

  // New documenter modal
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [addDocLoading, setAddDocLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Documenters
    try {
      const { data: profilesData } = await supabase.from('profiles').select('*');
      let docs: DocumenterUser[] = [];
      if (profilesData && profilesData.length > 0) {
        docs = profilesData;
      }

      // Merge local fallback
      const localUsers = JSON.parse(localStorage.getItem('daleelak_users') || '[]');
      localUsers.forEach((lu: DocumenterUser) => {
        if (!docs.some((d) => d.email === lu.email)) {
          docs.push(lu);
        }
      });

      setDocumenters(docs);
    } catch {
      /* ignore */
    }

    // 2. Fetch All Places
    try {
      const { data: placesData } = await supabase.from('places').select('*');
      let placesList: PlaceItem[] = [];
      if (placesData && placesData.length > 0) {
        placesList = placesData.map((p) => ({
          id: p.id,
          businessName: p.business_name,
          nameEn: p.name_en,
          status: p.status,
          category: p.category,
          subCategory: p.sub_category,
          customCategory: p.custom_category,
          latitude: p.latitude,
          longitude: p.longitude,
          city: p.city,
          neighborhood: p.neighborhood,
          street: p.street,
          landmark: p.landmark,
          phone: p.phone,
          whatsapp: p.whatsapp,
          googleEmail: p.google_email,
          workFrom: p.work_from,
          workTo: p.work_to,
          holidays: p.holidays || [],
          facadeImage: p.facade_image,
          internalImage: p.internal_image,
          documenterName: p.documenter_name,
          notes: p.notes,
          date: p.date,
          time: p.time,
          dms: p.dms,
          totalAmount: p.total_amount || 300,
          paidAmount: p.paid_amount || 0,
          remainingAmount: p.remaining_amount || 0,
          paymentStatus: p.payment_status || 'مدفوعة بالكامل',
        }));
      }

      // Merge local places
      const localPlaces = JSON.parse(localStorage.getItem('field_notified_places') || '[]');
      localPlaces.forEach((lp: PlaceItem) => {
        if (!placesList.some((p) => p.id === lp.id)) {
          placesList.push(lp);
        }
      });

      setAllPlaces(placesList);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check Session
    const checkSession = () => {
      try {
        const u = localStorage.getItem('daleelak_current_user');
        if (!u) {
          router.push('/login');
          return;
        }
        const parsed = JSON.parse(u);
        if (parsed.role !== 'admin') {
          router.push('/login');
          return;
        }
        setCurrentUser(parsed);
        loadData();
      } catch {
        router.push('/login');
      }
    };
    const timer = setTimeout(checkSession, 0);
    return () => clearTimeout(timer);
  }, [router, loadData]);

  const handleAddDocumenter = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDocLoading(true);

    const docObj: DocumenterUser = {
      id: 'doc-' + Date.now(),
      full_name: newDocName.trim(),
      email: newDocEmail.trim().toLowerCase(),
      phone: newDocPhone.trim(),
      role: 'documenter',
      password: newDocPassword.trim(),
      password_hash: newDocPassword.trim(),
      created_at: new Date().toISOString(),
    };

    // Save to Supabase
    try {
      await supabase.from('profiles').insert([
        {
          id: docObj.id,
          full_name: docObj.full_name,
          email: docObj.email,
          phone: docObj.phone,
          role: 'documenter',
          password_hash: docObj.password,
        },
      ]);
    } catch {
      /* ignore */
    }

    // Save locally
    const existing = JSON.parse(localStorage.getItem('daleelak_users') || '[]');
    existing.push(docObj);
    localStorage.setItem('daleelak_users', JSON.stringify(existing));

    setDocumenters((prev) => [...prev, docObj]);
    setAddDocLoading(false);
    setShowAddDocModal(false);

    setNewDocName('');
    setNewDocEmail('');
    setNewDocPassword('');
    setNewDocPhone('');

    showToast(`تم إنشاء حساب الموثق الميداني "${docObj.full_name}" بنجاح!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('daleelak_current_user');
    router.push('/login');
  };

  // Filtered places list
  const filteredPlaces = allPlaces.filter((place) => {
    const matchesDoc =
      selectedDocumenterFilter === 'الكل' ||
      place.documenterName === selectedDocumenterFilter;
    const matchesPay =
      selectedPayFilter === 'الكل' || place.paymentStatus === selectedPayFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      place.businessName.toLowerCase().includes(q) ||
      place.phone.includes(q) ||
      place.city.toLowerCase().includes(q) ||
      place.neighborhood.toLowerCase().includes(q) ||
      (place.documenterName && place.documenterName.toLowerCase().includes(q));

    return matchesDoc && matchesPay && matchesSearch;
  });

  // Calculate statistics
  const totalMoneyCollected = allPlaces.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalMoneyRemaining = allPlaces.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 dir-rtl">

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Navigation Bar */}
        <header className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-indigo-600/30 border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="دليلك" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">لوحة تحكم المسؤول الرئيسي</h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {currentUser ? currentUser.full_name : 'Admin System'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة الموثقين الميدانيين وإصدار التقارير وإدارة قواعد البيانات الموحدة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => router.push('/')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-indigo-400" /> واجهة التوثيق الميداني
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث البيانات
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </header>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-indigo-500/20 text-indigo-400 p-3.5 rounded-2xl border border-indigo-500/30">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">إجمالي التوثيقات الميدانية</span>
              <span className="text-2xl font-black text-white">{allPlaces.length} <span className="text-xs text-slate-500">مكان</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-emerald-500/20 text-emerald-400 p-3.5 rounded-2xl border border-emerald-500/30">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">المبالغ المحصلة المباشرة</span>
              <span className="text-2xl font-black text-emerald-400">{totalMoneyCollected} <span className="text-xs">ج.م</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-amber-500/20 text-amber-400 p-3.5 rounded-2xl border border-amber-500/30">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">المبالغ المؤجلة لحين الظهور</span>
              <span className="text-2xl font-black text-amber-400">{totalMoneyRemaining} <span className="text-xs">ج.م</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-purple-500/20 text-purple-400 p-3.5 rounded-2xl border border-purple-500/30">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">الموثقين الميدانيين المسجلين</span>
              <span className="text-2xl font-black text-white">{documenters.length} <span className="text-xs text-slate-500">موثق</span></span>
            </div>
          </div>
        </div>

        {/* Section 1: Documenters Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="text-lg font-black text-white">إدارة وتتبع الموثقين الميدانيين</h2>
                <p className="text-xs text-slate-400">إنشاء حسابات الموثقين وتتبع إجمالي التوثيقات لكل موثق</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddDocModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> إضافة موثق ميداني جديد
            </button>
          </div>

          {documenters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-3.5 rounded-r-xl">الاسم الكامل للموثق</th>
                    <th className="p-3.5">البريد الإلكتروني</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">الأماكن الموثقة</th>
                    <th className="p-3.5">المبالغ المحصلة</th>
                    <th className="p-3.5 rounded-l-xl">الحالة والأذونات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {documenters.map((doc) => {
                    const docPlaces = allPlaces.filter((p) => p.documenterName === doc.full_name);
                    const docCollected = docPlaces.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-black flex items-center justify-center text-xs">
                            {doc.full_name.charAt(0)}
                          </div>
                          <span>{doc.full_name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 dir-ltr text-right">{doc.email}</td>
                        <td className="p-3.5 font-mono text-slate-300 dir-ltr text-right">{doc.phone || 'غير مسجل'}</td>
                        <td className="p-3.5 font-bold text-indigo-400">{docPlaces.length} مكان</td>
                        <td className="p-3.5 font-extrabold text-emerald-400">{docCollected} ج.م</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            doc.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {doc.role === 'admin' ? 'مدير مسؤول' : 'موثق ميداني'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">لا يوجد موثقين مسجلين حالياً. اضغط أعلاه لإضافة موثق جديد.</p>
          )}
        </div>

        {/* Section 2: Master Places & Filterable Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h2 className="text-lg font-black text-white">سجل كافة الأماكن والفواتير الموثقة</h2>
                <p className="text-xs text-slate-400">تصفح ومراجعة كل ما تم إدخاله في الميدان من قِبل كافة الموثقين</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                المعروض: {filteredPlaces.length} من {allPlaces.length} مكان
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المكان، الموثق، المدينة، الهاتف..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={selectedDocumenterFilter}
                onChange={(e) => setSelectedDocumenterFilter(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="الكل">جميع الموثقين الميدانيين</option>
                {documenters.map((d) => (
                  <option key={d.id} value={d.full_name}>{d.full_name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={selectedPayFilter}
                onChange={(e) => setSelectedPayFilter(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="الكل">جميع حالات السداد</option>
                <option value="مدفوعة بالكامل">مدفوعة بالكامل</option>
                <option value="غير مدفوعة (مؤجلة)">غير مدفوعة (مؤجلة)</option>
                <option value="دفع جزء من المبلغ (عربون)">دفع جزء (عربون)</option>
              </select>
            </div>
          </div>

          {/* Master Table */}
          {filteredPlaces.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-3.5 rounded-r-xl">المكان التجاري</th>
                    <th className="p-3.5">القطاع والنشاط</th>
                    <th className="p-3.5">العنوان الميداني</th>
                    <th className="p-3.5">الموثق المسؤول</th>
                    <th className="p-3.5">حالة السداد</th>
                    <th className="p-3.5">المدفوع / الإجمالي</th>
                    <th className="p-3.5 rounded-l-xl">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPlaces.map((p) => {
                    const payStatusColor =
                      p.paymentStatus === 'مدفوعة بالكامل'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : p.paymentStatus === 'دفع جزء من المبلغ (عربون)'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex flex-col">
                            <span>{p.businessName}</span>
                            <span className="text-[10px] text-slate-500 font-mono dir-ltr text-right">{p.phone}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-300">{p.subCategory || p.category}</td>
                        <td className="p-3.5 text-slate-300">{p.city} - {p.neighborhood}</td>
                        <td className="p-3.5 font-bold text-indigo-400">{p.documenterName || 'مكتب دليلك'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${payStatusColor}`}>
                            {p.paymentStatus || 'مدفوعة بالكامل'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold dir-ltr text-right">
                          <span className="text-emerald-400">{p.paidAmount ?? 300}</span>
                          <span className="text-slate-500"> / {p.totalAmount || 300} ج.م</span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px]">{p.date} - {p.time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">لا توجد أماكن موثقة مطابقة لخيارات البحث الحالية.</p>
          )}
        </div>

      </div>

      {/* Modal: Add New Documenter */}
      <AnimatePresence>
        {showAddDocModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowAddDocModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-black">إضافة موثق ميداني جديد</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-1.5 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumenter} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">الاسم الكامل للموثق الميداني *</label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="مثال: أحمد محمود علي"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني لدخول النظام *</label>
                  <input
                    type="email"
                    required
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    placeholder="ahmed@daleelak.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={newDocPassword}
                    onChange={(e) => setNewDocPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">رقم هاتف الموثق *</label>
                  <input
                    type="tel"
                    required
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addDocLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {addDocLoading ? 'جاري الحفظ...' : 'إنشاء وحفظ حساب الموثق'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
