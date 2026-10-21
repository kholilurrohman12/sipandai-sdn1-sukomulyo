import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, BookOpen, FileText, ClipboardList, 
  LogOut, Shield, GraduationCap, CalendarCheck, Home, 
  Menu, X, CheckSquare, Trash2, Edit, Download, Printer, Box, Mail, MessageSquare, ChevronRight, Settings, FileDown, ChevronLeft, Bell, Sparkles, Loader2, Plus, FileSignature,
  LayoutGrid, BookText, Target, FileCheck, CalendarDays, ArrowLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, writeBatch } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const getEnvVar = (key: string) => {
  if (key === 'VITE_FIREBASE_API_KEY') return import.meta.env.VITE_FIREBASE_API_KEY || "";
  if (key === 'VITE_FIREBASE_AUTH_DOMAIN') return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "";
  if (key === 'VITE_FIREBASE_PROJECT_ID') return import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
  if (key === 'VITE_FIREBASE_STORAGE_BUCKET') return import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "";
  if (key === 'VITE_FIREBASE_MESSAGING_SENDER_ID') return import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "";
  if (key === 'VITE_FIREBASE_APP_ID') return import.meta.env.VITE_FIREBASE_APP_ID || "";
  
  return "";
};

let app: any, auth: any, firestoreDb: any, globalAppId: string;
try {
  const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || "",
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || "",
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || "",
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || "",
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || "",
    appId: getEnvVar('VITE_FIREBASE_APP_ID') || ""
  };
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestoreDb = getFirestore(app);
  globalAppId = getEnvVar('VITE_FIREBASE_PROJECT_ID') || 'sipandai-app-default';
} catch (e) {
  console.error("Firebase init failed:", e);
}

const ROLES: Record<string, string> = {
  admin: 'Admin', guru_kelas_1: 'Guru Kelas 1', guru_kelas_2: 'Guru Kelas 2',
  guru_kelas_3: 'Guru Kelas 3', guru_kelas_4: 'Guru Kelas 4', guru_kelas_5: 'Guru Kelas 5',
  guru_kelas_6: 'Guru Kelas 6', guru_paibp: 'Guru PAIBP & Bahasa Arab', guru_pjok: 'Guru PJOK',
  guru_ekstra_bta: 'Guru Ekstra BTA', guru_ekstra_tik: 'Guru Ekstra TIK', guru_ekstra_futsal: 'Guru Ekstra Futsal',
  guru_ekstra_pramuka: 'Guru Ekstra Pramuka', tendik: 'Tendik'
};

const KELAS_OPTIONS = ['1', '2', '3', '4', '5', '6'];
const SEMESTER_OPTIONS = [{val: '1', label: '1 (Ganjil)'}, {val: '2', label: '2 (Genap)'}];
const BULAN_OPTIONS = [
  { val: '', label: 'Semua Bulan' }, { val: '01', label: 'Januari' }, { val: '02', label: 'Februari' },
  { val: '03', label: 'Maret' }, { val: '04', label: 'April' }, { val: '05', label: 'Mei' },
  { val: '06', label: 'Juni' }, { val: '07', label: 'Juli' }, { val: '08', label: 'Agustus' },
  { val: '09', label: 'September' }, { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
];
const SATUAN_BARANG = ['Rim', 'Lembar', 'Kotak', 'Buah', 'Pack', 'Pcs', 'Unit', 'Set', 'Buku', 'Botol', 'Liter', 'Exemplar', '/orang', '/hari'];
const DIMENSI_PROFIL = ['Keimanan dan Ketakwaan kepada Tuhan YME', 'Kewargaan', 'Penalaran Kritis', 'Kreativitas', 'Kolaborasi', 'Kemandirian', 'Kesehatan', 'Komunikasi'];
const KATEGORI_NILAI = ['Berkembang', 'Cakap', 'Mahir'];
const HAFALAN_NILAI = ['Belum Lancar', 'Kurang Lancar', 'Lancar'];
const EKSTRA_NILAI = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'];

const getFase = (kelas: string) => {
  if (['1', '2'].includes(kelas)) return 'A';
  if (['3', '4'].includes(kelas)) return 'B';
  if (['5', '6'].includes(kelas)) return 'C';
  return '-';
};

const getAvailableMapel = (role: string) => {
  if (['guru_kelas_1', 'guru_kelas_2'].includes(role)) return ['Pendidikan Kewarganegaraan', 'Bahasa Indonesia', 'Matematika', 'Seni', 'Bahasa Jawa', 'Bahasa Inggris', 'Kokurikuler'];
  if (['guru_kelas_3', 'guru_kelas_4', 'guru_kelas_5', 'guru_kelas_6'].includes(role)) return ['Pendidikan Kewarganegaraan', 'Bahasa Indonesia', 'IPAS', 'Matematika', 'Seni', 'Bahasa Jawa', 'Bahasa Inggris', 'Kokurikuler'];
  if (role === 'guru_paibp') return ['PAIBP', 'Bahasa Arab'];
  if (role === 'guru_pjok') return ['PJOK'];
  if (role === 'guru_ekstra_bta') return ['BTA'];
  if (role === 'guru_ekstra_tik') return ['TIK'];
  if (role === 'guru_ekstra_futsal') return ['Futsal'];
  if (role === 'guru_ekstra_pramuka') return ['Pramuka'];
  if (role.startsWith('guru_ekstra')) return ['Ekstrakurikuler'];
  return [];
};

const getBtaDetail = (score: string | number) => {
  const num = typeof score === 'string' ? parseInt(score) : score;
  if (isNaN(num)) return { p: '', d: '' };
  if (num >= 85) return { p: 'Sangat Baik / Fasih', d: 'Bacaan sangat lancar, makhraj dan tajwid sangat tepat, serta tulisan benar dan sangat rapi.' };
  if (num >= 70) return { p: 'Baik / Jayyid', d: 'Bacaan lancar, makhraj dan tajwid tepat, serta tulisan benar dan rapi.' };
  if (num >= 51) return { p: 'Cukup / Mutawasit', d: 'Bacaan lancar namun masih terdapat beberapa kesalahan tajwid, tulisan cukup baik.' };
  return { p: 'Kurang / Mubtadi', d: 'Bacaan terbata-bata atau salah, belum menguasai kaidah tajwid, tulisan belum sempurna.' };
};

const getKokuDeskripsi = (aspek: string, predikat: string, isDimensi: boolean = false, tema: string = '', proyek: string = '') => {
  if(!predikat) return '-';
  const konteks = tema && proyek ? ` pada proyek "${proyek}" (Tema: ${tema})` : '';
  if(isDimensi) {
    if(predikat === 'Mahir') return `Siswa sangat konsisten dan mandiri dalam menunjukkan sikap yang mencerminkan ${aspek} dengan sangat baik${konteks}.`;
    if(predikat === 'Cakap') return `Siswa mampu menunjukkan sikap yang mencerminkan ${aspek} dengan baik${konteks}, terkadang membutuhkan sedikit bimbingan dari guru.`;
    return `Siswa mulai mengembangkan sikap terkait ${aspek}${konteks} dan masih membutuhkan dorongan serta bimbingan lebih lanjut secara intensif.`;
  } else {
    if(predikat === 'Mahir') return `Menunjukkan kemampuan ${aspek} yang luar biasa, inisiatif tinggi, dan mampu memotivasi teman sebayanya selama pengerjaan proyek${konteks ? ` "${proyek}"` : ''}.`;
    if(predikat === 'Cakap') return `Mampu beradaptasi dengan baik dan menunjukkan ${aspek} yang memadai sesuai dengan harapan proyek${konteks ? ` "${proyek}"` : ''}.`;
    return `Masih memerlukan pendampingan berkelanjutan untuk meningkatkan kemampuan ${aspek} di proyek${konteks ? ` "${proyek}"` : ''} selanjutnya.`;
  }
};

const getEkstraLainDeskripsi = (mapel: string, predikat: string) => {
  if (!predikat || predikat === '-') return '-';
  const m = mapel.toLowerCase();
  if (m.includes('pramuka')) {
    if (predikat === 'Sangat Baik') return 'Siswa sangat aktif, disiplin, dan menguasai seluruh kecakapan kepramukaan dengan sangat baik, serta menunjukkan jiwa kepemimpinan yang tinggi.';
    if (predikat === 'Baik') return 'Siswa aktif dalam kegiatan kepramukaan, menguasai kecakapan dasar dengan baik, disiplin, dan mampu bekerja kerja sama.';
    if (predikat === 'Cukup') return 'Siswa cukup berpartisipasi dalam kegiatan kepramukaan, namun masih perlu bimbingan dalam penguasaan materi kecakapan dan kemandirian.';
    return 'Siswa kurang aktif dan perlu motivasi serta pendampingan lebih intensif dalam mengikuti kegiatan kepramukaan.';
  } else if (m.includes('futsal')) {
     if (predikat === 'Sangat Baik') return 'Siswa menunjukkan penguasaan teknik dasar futsal yang sangat baik, fisik prima, mampu bekerja sama dalam tim secara taktis, dan menjunjung tinggi sportivitas.';
     if (predikat === 'Baik') return 'Siswa menguasai teknik dasar futsal dengan baik, aktif, dan mampu bermain dalam tim secara solid.';
     if (predikat === 'Cukup') return 'Siswa cukup memahami teknik futsal, namun perlu peningkatan dalam kelincahan, stamina, dan kerja sama tim.';
     return 'Siswa perlu bimbingan dan latihan lebih rutin untuk menguasai teknik dasar futsal.';
  } else if (m.includes('tik')) {
     if (predikat === 'Sangat Baik') return 'Siswa sangat terampil mengoperasikan perangkat lunak dan keras, serta mampu menyelesaikan tugas komputasi dengan sangat baik, cepat, dan kreatif.';
     if (predikat === 'Baik') return 'Siswa terampil menggunakan perangkat komputer dan memahami dasar-dasar literasi TIK dengan baik sesuai instruksi.';
     if (predikat === 'Cukup') return 'Siswa cukup memahami pengoperasian komputer dasar, namun masih perlu bimbingan pada pemahaman materi komputasi lanjutan.';
     return 'Siswa perlu pendampingan intensif dalam mengoperasikan perangkat komputer dasar.';
  } else {
     if (predikat === 'Sangat Baik') return `Siswa sangat berprestasi dan menunjukkan kompetensi serta minat yang sangat tinggi pada ekstrakurikuler ${mapel}.`;
     if (predikat === 'Baik') return `Siswa menunjukkan keaktifan dan penguasaan yang baik pada ekstrakurikuler ${mapel}.`;
     if (predikat === 'Cukup') return `Siswa cukup berpartisipasi, namun kompetensi pada ekstrakurikuler ${mapel} masih bisa ditingkatkan lebih lanjut.`;
     return `Siswa memerlukan motivasi dan bimbingan lebih terarah pada ekstrakurikuler ${mapel}.`;
  }
};

const exportToExcel = (data: any[], filename: string, mode: 'semua_bulan' | 'per_bulan' = 'semua_bulan', targetBulan: string = '') => {
  if (!data || !data.length) return false;
  
  const workbook = XLSX.utils.book_new();

  if (mode === 'semua_bulan') {
    const groupedData = data.reduce((acc, item) => {
      const tgl = item.date || item.tanggal || item.tgl || item.tanggalBuat || '';
      const bulan = tgl ? tgl.split('-')[1] : 'Lainnya';
      if (!acc[bulan]) { acc[bulan] = []; }
      acc[bulan].push(item);
      return acc;
    }, {});

    for (const [namaBulan, records] of Object.entries(groupedData)) {
      const formattedData = (records as any[]).map((item, index) => ({
        'No': index + 1,
        'NISN': item.nisn ? String(item.nisn) : '-',
        'Nama Siswa / Subjek': item.name || item.nama || item.nama_siswa || 'Tanpa Nama',
        'Tanggal Lengkap': item.date || item.tanggal || item.tgl || item.tanggalBuat || '-',
        'Status / Keterangan': item.status || item.hal || item.keterangan || item.uraian || 'Hadir'
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      worksheet['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
      const namaSheetClean = `Bulan_${namaBulan}`.replace(/[:\\\/?*\[\]]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, namaSheetClean);
    }
  } else {
    const filteredData = targetBulan ? data.filter(item => {
      const tgl = item.date || item.tanggal || item.tgl || item.tanggalBuat || '';
      return tgl.split('-')[1] === targetBulan;
    }) : data;

    const formattedData = filteredData.map((item, index) => ({
      'No': index + 1,
      'NISN': item.nisn ? String(item.nisn) : '-',
      'Nama Siswa / Subjek': item.name || item.nama || item.nama_siswa || 'Tanpa Nama',
      'Tanggal Lengkap': item.date || item.tanggal || item.tgl || item.tanggalBuat || '-',
      'Status / Keterangan': item.status || item.hal || item.keterangan || item.uraian || 'Hadir'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    worksheet['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
    const namaSheetClean = `Rekap_${targetBulan || 'Data'}`.replace(/[:\\\/?*\[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, namaSheetClean);
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
  return true;
};

const exportToWord = (elementId: string, filename: string) => {
  const el = document.getElementById(elementId);
  if(!el) return false;
  const html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>" + el.innerHTML + "</body></html>";
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = filename + '.doc';
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  return true;
};

const exportToPDF = (elementId: string, filename: string, showToast?: any) => {
  const el = document.getElementById(elementId);
  if(!el) return false;
  
  const performExport = () => {
    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4],
      filename:     `${filename}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };
    
    // @ts-ignore
    window.html2pdf().set(opt).from(el).save().then(() => {
       if(showToast) showToast("File PDF berhasil diunduh!", "success");
    }).catch((e: any) => {
       console.error(e);
       if(showToast) showToast("Gagal memproses PDF.", "error");
    });
  };

  // @ts-ignore
  if (typeof window.html2pdf === 'undefined') {
    if(showToast) showToast("Mengunduh modul konversi PDF... Mohon tunggu sesaat ⏳");
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = performExport;
    document.head.appendChild(script);
  } else {
    performExport();
  }
  return true;
};

const callGeminiAPI = async (payload: any) => {
  const retries = [1000, 2000, 4000];

  for (let i = 0; i < retries.length; i++) {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `HTTP Error ${response.status}`);
      return data;
    } catch (error) {
      if (i === retries.length - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, retries[i]));
    }
  }
};

function useFirestoreSync(collectionName: string, defaultData: any = [], isSingleDoc: boolean = false, fbUser: any = null): [any, (newData: any | ((prev: any) => any)) => Promise<void>] {
  const [data, setData] = useState<any>(defaultData);
  const dataRef = useRef<any>(defaultData);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!fbUser || !firestoreDb) return;
    const q = collection(firestoreDb, 'artifacts', globalAppId, 'public', 'data', collectionName);

    const unsubscribe = onSnapshot(q,
      (snap) => {
        let nextData: any;
        if (isSingleDoc) {
          nextData = snap.empty ? defaultData : snap.docs[0].data();
        } else {
          nextData = snap.empty ? (isInitialLoad.current ? defaultData : dataRef.current) : snap.docs.map(d => d.data());
        }
        dataRef.current = nextData;
        setData(nextData);
        isInitialLoad.current = false;
      },
      (err) => console.error(`Firestore Snapshot Error [${collectionName}]:`, err)
    );

    return () => unsubscribe();
  }, [fbUser, collectionName, isSingleDoc]);

  const syncData = (newDataOrUpdater: any | ((prev: any) => any)): Promise<void> => {
    if (!fbUser || !firestoreDb) {
      return Promise.reject(new Error('Firebase belum siap. Silakan tunggu koneksi Firebase.'));
    }

    const previousData = dataRef.current;
    const nextData = typeof newDataOrUpdater === 'function'
      ? newDataOrUpdater(previousData)
      : newDataOrUpdater;
    const safeData = JSON.parse(JSON.stringify(nextData));

    // Optimistic local update: subsequent actions immediately see the latest data,
    // while Firestore writes are serialized per collection.
    dataRef.current = safeData;
    setData(safeData);

    const task = async () => {
      try {
        const basePath = ['artifacts', globalAppId, 'public', 'data', collectionName];

        if (isSingleDoc) {
          await setDoc(doc(firestoreDb, ...basePath, 'config'), safeData);
          return;
        }

        const previous = Array.isArray(previousData) ? previousData : [];
        const next = Array.isArray(safeData) ? safeData : [];
        const previousMap = new Map(previous.map((item: any) => [String(item.id), item]));
        const nextMap = new Map(next.map((item: any) => [String(item.id), item]));
        const operations: Array<{ type: 'set' | 'delete'; id: string; data?: any }> = [];

        previousMap.forEach((_item, id) => {
          if (!nextMap.has(id)) operations.push({ type: 'delete', id });
        });
        nextMap.forEach((item, id) => {
          const oldItem = previousMap.get(id);
          if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
            operations.push({ type: 'set', id, data: item });
          }
        });

        // Firestore accepts at most 500 operations per batch. Keep a safety margin.
        for (let i = 0; i < operations.length; i += 450) {
          const chunk = operations.slice(i, i + 450);
          if (!chunk.length) continue;
          const batch = writeBatch(firestoreDb);
          chunk.forEach(op => {
            const ref = doc(firestoreDb, ...basePath, op.id);
            if (op.type === 'delete') batch.delete(ref);
            else batch.set(ref, op.data);
          });
          await batch.commit();
        }
      } catch (error) {
        console.error(`Firestore write error [${collectionName}]:`, error);
        throw error;
      }
    };

    // Serialize writes so rapid changes cannot overwrite each other with stale arrays.
    const result = writeQueueRef.current.then(task, task);
    writeQueueRef.current = result.catch(() => undefined);
    return result;
  };

  return [data, syncData];
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [fbUser, setFbUser] = useState<any>(null);

  useEffect(() => {
    if (!auth) { setIsAuthReady(true); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error(e); }
    };
    initAuth();
    
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  const [users, setUsers] = useFirestoreSync('users', [
    { id: '1', name: 'Administrator', nip: '-', role: 'admin', username: 'admin', password: '123' },
    { id: '2', name: 'Guru Kelas 1', nip: '11111', role: 'guru_kelas_1', username: 'guru1', password: '123' },
    { id: '3', name: 'Guru PAIBP', nip: '77777', role: 'guru_paibp', username: 'pai', password: '123' },
    { id: '4', name: 'Guru BTA', nip: '55555', role: 'guru_ekstra_bta', username: 'bta', password: '123' },
    { id: '5', name: 'Staff TU', nip: '99999', role: 'tendik', username: 'tendik', password: '123' }
  ], false, fbUser);
  const [students, setStudents] = useFirestoreSync('students', [{ id: 1, name: 'Andi Saputra', nisn: '00112233', kelas: '1', jk: 'L' }], false, fbUser);
  const [jurnals, setJurnals] = useFirestoreSync('jurnals', [], false, fbUser);
  const [nilais, setNilais] = useFirestoreSync('nilais', [], false, fbUser);
  const [absenGuru, setAbsenGuru] = useFirestoreSync('absenGuru', [], false, fbUser);
  const [absenSiswa, setAbsenSiswa] = useFirestoreSync('absenSiswa', [], false, fbUser);
  const [barang, setBarang] = useFirestoreSync('barang', [], false, fbUser);
  const [stokOpname, setStokOpname] = useFirestoreSync('stokOpname', [], false, fbUser);
  const [suratMasuk, setSuratMasuk] = useFirestoreSync('suratMasuk', [], false, fbUser);
  const [suratKeluar, setSuratKeluar] = useFirestoreSync('suratKeluar', [], false, fbUser);
  const [konfigurasi, setKonfigurasi] = useFirestoreSync('konfigurasi', {
    pemkab: 'Pemerintah Kabupaten Lamongan', dinas: 'Dinas Pendidikan', namaSekolah: 'SD NEGERI 1 SUKOMULYO',
    alamat: 'Jl. Raya Sukomulyo No. 1, Lamongan', email: 'sdn1sukomulyo@gmail.com', nss: '101052405001',
    npsn: '20505123', kepsek: 'Kholilur Rohman, S.Pd.', nipKepsek: '198001012010011001'
  }, true, fbUser);

  const showToast = (message: string, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogin = (username: string, password: string) => {
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); showToast('Login berhasil! Selamat datang.', 'success'); } 
    else showToast("Username atau password salah!", 'error');
  };

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600"><Loader2 className="animate-spin" size={40}/></div>;
  
  const db = { users, setUsers, students, setStudents, jurnals, setJurnals, nilais, setNilais, absenGuru, setAbsenGuru, absenSiswa, setAbsenSiswa, barang, setBarang, stokOpname, setStokOpname, suratMasuk, setSuratMasuk, suratKeluar, setSuratKeluar, konfigurasi, setKonfigurasi, showToast };
  
  const bgSvg = encodeURIComponent(`
  <svg width="150" height="173.2" viewBox="0 0 150 173.2" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#bae6fd" stroke-width="1.5" opacity="0.4">
      <path d="M75 0 L150 43.3 L150 129.9 L75 173.2 L0 129.9 L0 43.3 Z" />
      <path d="M75 22 L113 44 L113 87 L75 109 L37 87 L37 44 Z" stroke="#38bdf8" stroke-width="0.5" opacity="0.5"/>
      <circle cx="75" cy="86.6" r="3" fill="#0ea5e9" opacity="0.4"/>
    </g>
  </svg>
  `);
  
  const backgroundStyle = {
    backgroundColor: '#f1f5f9',
    backgroundImage: `url("data:image/svg+xml,${bgSvg}"), radial-gradient(circle at 10% 20%, #e0f2fe 0%, transparent 50%), radial-gradient(circle at 90% 80%, #dbeafe 0%, transparent 50%)`,
    backgroundSize: '150px 173.2px, 100% 100%, 100% 100%',
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center center'
  };

  return (
    <div style={backgroundStyle} className="h-screen w-screen overflow-hidden font-sans text-gray-800 selection:bg-blue-300 flex">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-xl shadow-2xl flex items-center gap-3 text-white transition-all transform animate-fade-in-up ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <Bell size={20} /> <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
      {!currentUser ? <LoginScreen onLogin={handleLogin} konfigurasi={konfigurasi} /> : <Dashboard user={currentUser} onLogout={() => setCurrentUser(null)} db={db} />}
    </div>
  );
}

const GlassPanel = ({ children, className = '' }: {children: React.ReactNode, className?: string}) => (
  <div className={`bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

function LoginScreen({ onLogin, konfigurasi }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);
  
  const QUOTES = [
    { text: "Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani. (Di depan memberi teladan, di tengah membangun kemauan, di belakang memberi dorongan)", author: "Ki Hajar Dewantara" },
    { text: "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia.", author: "Nelson Mandela" },
    { text: "Tujuan pendidikan itu untuk mempertajam kecerdasan, memperkukuh kemauan serta memperhalus perasaan.", author: "Tan Malaka" },
    { text: "Hiduplah seolah engkau mati besok. Belajarlah seolah engkau hidup selamanya.", author: "Mahatma Gandhi" },
    { text: "Hanya pendidikan yang bisa menyelamatkan masa depan, tanpa pendidikan Indonesia tak mungkin bertahan.", author: "Najwa Shihab" },
    { text: "Pendidikan bukanlah persiapan untuk kehidupan; pendidikan adalah kehidupan itu sendiri.", author: "John Dewey" },
    { text: "Mendidik pikiran tanpa mendidik hati adalah bukan pendidikan sama sekali.", author: "Aristoteles" },
    { text: "Guru adalah seorang pejuang tulus tanpa tanda jasa mencerdaskan bangsa.", author: "Ki Hajar Dewantara" },
    { text: "Setiap orang menjadi guru, setiap rumah menjadi sekolah.", author: "Ki Hajar Dewantara" },
    { text: "Keberhasilan bukanlah milik orang yang pintar. Keberhasilan adalah kepunyaan mereka yang senantiasa berusaha.", author: "B.J. Habibie" },
    { text: "Seseorang yang berhenti belajar adalah orang lanjut usia, meskipun umurnya masih remaja. Seseorang yang tidak pernah berhenti belajar akan selamanya menjadi pemuda.", author: "Henry Ford" }
  ];

  useEffect(() => {
     const interval = setInterval(() => {
         setQuoteIdx(prev => (prev + 1) % QUOTES.length);
     }, 8000); 
     return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative z-10 overflow-y-auto">
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative z-20 my-auto">
        <div className="flex justify-center mb-6"><div className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200/50 p-4 rounded-2xl text-white"><BookOpen size={36} /></div></div>
        <h1 className="text-3xl font-black text-center text-gray-800 mb-1 tracking-tight">SIPANDAI</h1>
        <p className="text-center text-blue-800 font-bold mb-1 text-sm uppercase">{konfigurasi.namaSekolah}</p>
        <p className="text-center text-gray-500 mb-4 text-xs px-4">Sistem Informasi Pengelolaan Administrasi, Nilai, dan Arsip Digital Terpadu</p>
        
        <div className="mt-2 mb-6 bg-blue-50/60 p-4 rounded-xl border border-blue-100 italic text-center text-sm text-blue-800 font-medium transition-opacity duration-500 shadow-inner min-h-[90px] flex flex-col justify-center items-center">
           <span className="leading-relaxed">"{QUOTES[quoteIdx].text}"</span>
           <div className="mt-2 text-xs font-bold text-blue-600">- {QUOTES[quoteIdx].author}</div>
        </div>

        <form onSubmit={(e: any) => { e.preventDefault(); onLogin(username, password); }}>
          <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Username</label><input type="text" className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-inner" value={username} onChange={e => setUsername(e.target.value)} required /></div>
          <div className="mb-6"><label className="block text-gray-700 text-sm font-bold mb-2">Password</label><input type="password" className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-inner" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 backdrop-blur-sm text-white font-bold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-600 hover:shadow-lg transition-all transform hover:-translate-y-0.5 shadow-md">Masuk ke Dashboard</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout, db }: any) {
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const isAdmin = user.role === 'admin';
  const isTendik = user.role === 'tendik';
  const isGuru = user.role.startsWith('guru_');
  const isGuruKelas = ['guru_kelas_1', 'guru_kelas_2', 'guru_kelas_3', 'guru_kelas_4', 'guru_kelas_5', 'guru_kelas_6'].includes(user.role);
  
  const menuItems = [
    { id: 'konfigurasi', label: 'Konfigurasi Sekolah', icon: Settings, show: isAdmin },
    { id: 'data_akun', label: 'Kelola Akun', icon: Shield, show: isAdmin },
    { id: 'data_siswa', label: 'Data Siswa', icon: Users, show: isAdmin },
    { id: 'absen_guru', label: 'Absen Guru', icon: UserPlus, show: isGuru || isTendik },
    { id: 'absen_siswa', label: 'Absen Siswa', icon: CheckSquare, show: isGuruKelas },
    { id: 'jurnal', label: 'Jurnal Harian', icon: BookOpen, show: isGuru },
    { id: 'nilai', label: 'Input Nilai', icon: ClipboardList, show: isGuru },
    { id: 'ai_kurikulum', label: 'Asisten Kurikulum AI', icon: LayoutGrid, show: isGuru },
    { id: 'rapor', label: 'Cetak Rapor', icon: Printer, show: isGuruKelas || isAdmin },
    { id: 'inventaris', label: 'Inventaris & Stok', icon: Box, show: isTendik },
    { id: 'surat', label: 'Surat Menyurat', icon: Mail, show: isTendik || isAdmin },
    { id: 'rekap', label: 'Rekap & Download', icon: FileDown, show: isAdmin || isGuru || isTendik },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'konfigurasi': return <KonfigurasiSekolah db={db} />;
      case 'data_akun': return <KelolaAkun db={db} adminId={user.id} />;
      case 'data_siswa': return <DataSiswa db={db} />;
      case 'absen_guru': return <AbsenGuru db={db} user={user} />;
      case 'absen_siswa': return <AbsenSiswa db={db} user={user} />;
      case 'jurnal': return <JurnalHarian db={db} user={user} />;
      case 'nilai': return <InputNilai db={db} user={user} />;
      case 'ai_kurikulum': return <AsistenKurikulum db={db} user={user} />;
      case 'rapor': return <CetakRapor db={db} user={user} isAdmin={isAdmin} />;
      case 'inventaris': return <Inventaris db={db} />;
      case 'surat': return <SuratMenyurat db={db} isAdmin={isAdmin} />;
      case 'rekap': return <RekapData db={db} user={user} />;
      default: return <HomeMenu user={user} menuItems={menuItems} setActiveMenu={setActiveMenu} db={db} />;
    }
  };

  return (
    <div className="h-full w-full flex relative z-10">
      <div className={`print:hidden bg-blue-900/90 backdrop-blur-2xl text-white w-72 flex-shrink-0 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} absolute md:relative z-40 h-full shadow-[4px_0_24px_rgba(0,0,0,0.1)] border-r border-white/20 flex flex-col`}>
        <div className="p-5 flex items-center justify-between border-b border-white/20 flex-none">
          <div className="font-extrabold text-xl flex items-center gap-3 tracking-wide"><GraduationCap size={28}/> SIPANDAI</div>
          <button className="md:hidden text-blue-200 hover:text-white bg-white/10 p-1.5 rounded-lg transition" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        
        <div className="p-5 border-b border-white/10 bg-blue-800/30 flex-none">
          <div className="text-xs text-blue-300 uppercase tracking-wider font-semibold mb-1">Profil Pengguna</div>
          <div className="font-bold text-lg truncate text-white">{user.name}</div>
          <div className="text-[10px] text-blue-100 bg-white/20 px-2 py-1 rounded-md inline-block mt-1 border border-white/10">{ROLES[user.role] || user.role}</div>
        </div>
        <div className="p-5 flex-1 min-h-0 overflow-y-auto pb-24 md:pb-32">
          <nav className="space-y-1.5">
            {menuItems.filter(m => m.show).map(menu => (
              <button key={menu.id} onClick={() => { setActiveMenu(menu.id); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeMenu === menu.id ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}>
                <menu.icon size={18} className={activeMenu === menu.id ? 'text-white' : 'text-blue-300'} /> {menu.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)}></div>}
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-20">
        <header className="print:hidden bg-white/60 backdrop-blur-md shadow-sm border-b border-white/60 p-4 flex items-center justify-between z-20 flex-none">
          <div className="flex items-center">
            <button className="text-blue-900 bg-white/60 p-2 rounded-lg hover:bg-white/90 md:hidden mr-4 transition shadow-sm border border-white/80" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 drop-shadow-sm">
              {activeMenu === 'home' ? 'Dashboard' : (menuItems.find(m => m.id === activeMenu)?.label || 'SIPANDAI')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200 shadow-sm hidden sm:flex">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> DB Terhubung
             </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10 pb-28 md:pb-32">
          {renderContent()}
        </main>
      </div>
      
      <div className="fixed bottom-20 md:bottom-28 right-6 pointer-events-none opacity-40 text-blue-900/60 font-bold text-lg md:text-xl z-10 text-right tracking-widest print:opacity-100 print:text-black print:text-sm uppercase drop-shadow-sm mix-blend-multiply">
        {db.konfigurasi.kepsek} - {db.konfigurasi.namaSekolah}
      </div>
      
      <div className="print:hidden fixed z-[60] bottom-0 left-0 w-full md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[320px] bg-white/90 md:bg-white/70 backdrop-blur-xl border-t md:border border-white/60 md:rounded-full shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 md:p-3 flex justify-around md:justify-center md:gap-4 items-center transition-all">
        <button onClick={() => setActiveMenu('home')} className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-6 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-full transition-all flex-1 md:flex-none ${activeMenu === 'home' ? 'bg-blue-600 text-white shadow-md border border-blue-400' : 'text-blue-800 hover:bg-white/80 hover:shadow-sm'}`}>
           <Home size={20} className={activeMenu === 'home' ? 'text-white' : 'text-blue-600'} /> 
           <span className="text-[10px] md:text-sm font-bold">Menu Dashboard</span>
        </button>
        <div className="w-px h-8 bg-blue-900/10 hidden md:block"></div>
        <button onClick={onLogout} className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-6 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-full transition-all flex-1 md:flex-none text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200">
           <LogOut size={20} /> 
           <span className="text-[10px] md:text-sm font-bold">Keluar Aplikasi</span>
        </button>
      </div>
      
      {isGuru && <AIAssistant db={db} user={user} />}
    </div>
  );
}

function HomeMenu({ user, menuItems, setActiveMenu, db }: any) {
  const visibleMenus = menuItems.filter((m: any) => m.show && m.id !== 'home');
  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <GlassPanel className="flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden z-10">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 drop-shadow-sm">Halo, {user.name}!</h1>
          <p className="text-gray-700 max-w-xl text-lg">Selamat datang di sistem manajemen digital <span className="font-bold text-blue-700">{db.konfigurasi.namaSekolah}</span>. Anda mengakses sistem dengan hak akses <span className="font-semibold text-blue-700 px-2 py-0.5 bg-blue-100/60 rounded-md border border-blue-200/50">{ROLES[user.role] || user.role}</span>.</p>
        </div>
        <div className="bg-gradient-to-br from-blue-100/60 to-blue-50/60 backdrop-blur-md p-6 rounded-full text-blue-600 hidden md:block relative z-10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.7)] border border-white/80">
          <GraduationCap size={64} />
        </div>
      </GlassPanel>
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2 drop-shadow-sm">Menu Cepat Dashboard</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
          {visibleMenus.map((menu: any) => (
            <button key={menu.id} onClick={() => setActiveMenu(menu.id)} className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/80 hover:shadow-lg hover:bg-white/90 transition-all text-left flex flex-col items-start gap-4 group transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-blue-100/80 to-blue-50/80 p-3 rounded-xl text-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all shadow-sm border border-white/80"><menu.icon size={24} /></div>
              <div className="font-bold text-gray-800 group-hover:text-blue-800 drop-shadow-sm">{menu.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function KonfigurasiSekolah({ db }: any) {
  const [form, setForm] = useState(db.konfigurasi);
  const saveConfig = async (e: any) => {
    e.preventDefault();
    try {
      await db.setKonfigurasi(form);
      db.showToast('Data konfigurasi sekolah berhasil disimpan!');
    } catch (error) {
      console.error(error);
      db.showToast('Data konfigurasi gagal disimpan ke Firebase.', 'error');
    }
  };
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GlassPanel>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800"><Settings size={22}/> Pengaturan Identitas Sekolah</h3>
        <p className="text-sm text-gray-600 mb-6 bg-white/50 p-3 rounded-xl border border-white/50">Data ini akan digunakan sebagai KOP Surat pada Cetak Rapor dan Surat Keluar.</p>
        <form onSubmit={saveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries({pemkab: 'Pemerintah Kabupaten', dinas: 'Dinas Terkait', namaSekolah: 'Nama Sekolah', alamat: 'Alamat Lengkap', email: 'Email Sekolah', nss: 'NSS', npsn: 'NPSN'}).map(([k, label]) => (
             <div key={k} className={k==='namaSekolah'||k==='alamat'?'md:col-span-2':''}><label className="block text-xs font-bold text-gray-700 mb-1">{label}</label><input type={k==='email'?'email':'text'} className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form[k]} onChange={e=>setForm({...form, [k]:e.target.value})} required={['pemkab','dinas','namaSekolah','alamat'].includes(k)}/></div>
          ))}
          <div className="md:col-span-2 mt-4 border-t border-gray-200/50 pt-4"><h4 className="font-bold text-gray-800 mb-4">Data Kepala Sekolah</h4></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Nama Kepala Sekolah</label><input type="text" className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.kepsek} onChange={e=>setForm({...form, kepsek:e.target.value})} required/></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">NIP Kepala Sekolah</label><input type="text" className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.nipKepsek} onChange={e=>setForm({...form, nipKepsek:e.target.value})} required/></div>
          <div className="md:col-span-2 flex justify-end mt-4">
            <button type="submit" className="px-8 py-3 bg-blue-600/90 backdrop-blur-md hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition">Simpan Konfigurasi</button>
          </div>
        </form>
      </GlassPanel>
    </div>
  )
}

function RekapData({ db, user }: any) {
  const isAdmin = user.role === 'admin';
  const isGuru = user.role.startsWith('guru_');
  const isTendik = user.role === 'tendik';
  const lockedClass = isGuru && user.role.startsWith('guru_kelas_') ? user.role.replace('guru_kelas_', '') : '';
  
  const [filter, setFilter] = useState({ 
    jenis: isTendik && !isAdmin ? 'suratMasuk' : 'absenSiswa', 
    bulan: '', 
    tahun: new Date().getFullYear().toString(), 
    kelas: lockedClass || '1' 
  });
  
  const getFilteredData = () => {
    let rawData: any[] = []; let dateField = 'date';
    switch(filter.jenis) {
      case 'absenSiswa': rawData = db.absenSiswa; break; 
      case 'absenGuru': rawData = db.absenGuru; break;
      case 'jurnal': rawData = db.jurnals; dateField = 'tanggal'; break; 
      case 'nilai': rawData = db.nilais; break;
      case 'suratMasuk': rawData = db.suratMasuk; dateField = 'tanggal'; break; 
      case 'suratKeluar': rawData = db.suratKeluar; dateField = 'tanggalBuat'; break;
      case 'stokOpname': rawData = db.stokOpname; dateField = 'tgl'; break; 
      default: break;
    }
    
    // Batasi akses data guru: jika guru, hanya ambil data milik user yang bersangkutan
    if (isGuru && !isAdmin) {
      if (['jurnal', 'nilai', 'absenGuru'].includes(filter.jenis)) {
        rawData = rawData.filter((d: any) => String(d.userId || d.guruId) === String(user.id));
      }
    }

    if (['absenSiswa', 'jurnal', 'nilai'].includes(filter.jenis) && filter.kelas) {
      rawData = rawData.filter((d: any) => d.kelas === filter.kelas);
    }
    
    if (filter.jenis !== 'nilai') {
      if (filter.bulan) {
        rawData = rawData.filter((d: any) => d[dateField]?.split('-')[1] === filter.bulan);
      }
      if (filter.tahun) {
        rawData = rawData.filter((d: any) => d[dateField]?.split('-')[0] === filter.tahun);
      }
    }
    return rawData;
  };
  
  const handleDownloadExcel = () => {
    const data = getFilteredData();
    if(data.length === 0) return db.showToast("Data kosong pada filter ini.", 'error');
    
    const processedData = data.map((item: any) => {
      if (filter.jenis === 'absenSiswa') {
        const studentInfo = db.students.find((s: any) => String(s.id) === String(item.studentId));
        return {
          ...item,
          nisn: studentInfo ? studentInfo.nisn : '-',
          name: studentInfo ? studentInfo.name : (item.name || 'Siswa Tidak Ditemukan')
        };
      } else if (filter.jenis === 'absenGuru') {
        const guruInfo = db.users?.find((u: any) => String(u.id) === String(item.userId || item.guruId)) 
                      || db.teachers?.find((t: any) => String(t.id) === String(item.userId || item.guruId));
        return {
          ...item,
          nisn: guruInfo ? (guruInfo.nip || guruInfo.nik || '-') : (item.nip || '-'),
          name: guruInfo ? guruInfo.name : (item.name || item.nama || user.name || 'Guru')
        };
      }
      return item;
    });

    const mode = filter.bulan ? 'per_bulan' : 'semua_bulan';
    const filename = `Rekap_${filter.jenis}${filter.kelas ? `_Kls\${filter.kelas}`:''}${filter.bulan ? `_Bln\${filter.bulan}`:`_Jan-Des_\${filter.tahun}`}`;
    
    exportToExcel(processedData, filename, mode, filter.bulan);
    db.showToast("Data Excel berhasil diunduh!", 'success');
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GlassPanel>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800"><FileDown size={22}/> Rekap & Unduh Data Excel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Jenis Data</label>
            <select className="w-full bg-white/75 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.jenis} onChange={e=>setFilter({...filter, jenis:e.target.value})}>
              {(isAdmin || isGuru) && <><option value="absenSiswa">Absen Siswa</option><option value="jurnal">Jurnal Pembelajaran</option><option value="nilai">Data Nilai</option></>}
              {(isAdmin || isTendik || isGuru) && <option value="absenGuru">{isAdmin ? 'Absen Guru (Keseluruhan)' : 'Absen Guru Saya'}</option>}
              {(isAdmin || isTendik) && <><option value="suratMasuk">Surat Masuk</option><option value="suratKeluar">Surat Keluar</option><option value="stokOpname">Stok Opname</option></>}
            </select>
          </div>
          {['absenSiswa', 'jurnal', 'nilai'].includes(filter.jenis) && (
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Filter Kelas</label><select className="w-full bg-white/75 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none shadow-inner" value={filter.kelas} onChange={e=>setFilter({...filter, kelas:e.target.value})} disabled={lockedClass !== ''}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>
          )}
          {filter.jenis !== 'nilai' && (
            <>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Filter Bulan</label>
                <select className="w-full bg-white/75 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none shadow-inner" value={filter.bulan} onChange={e=>setFilter({...filter, bulan:e.target.value})}>
                  <option value="">-- Semua Bulan (Jan - Des) --</option>
                  {BULAN_OPTIONS.filter(b => b.val !== '').map(b=><option key={b.val} value={b.val}>{b.label}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Filter Tahun</label><input type="text" className="w-full bg-white/75 backdrop-blur-sm border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder={`Contoh: ${new Date().getFullYear()}`} value={filter.tahun} onChange={e=>setFilter({...filter, tahun:e.target.value})} /></div>
            </>
          )}
        </div>
        <div className="mt-6 border-t border-gray-200/50 pt-6 flex justify-between items-center bg-white/30 p-4 rounded-xl border border-white/50">
          <div className="text-sm text-gray-700">Jumlah Data: <span className="font-bold text-blue-800 text-lg">{getFilteredData().length}</span> baris</div>
          <button onClick={handleDownloadExcel} className="px-6 py-3 bg-blue-600/90 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2"><Download size={18}/> Unduh Excel (.xlsx)</button>
        </div>
      </GlassPanel>
    </div>
  )
}
function AIAssistant({ db, user }: any) {
  const [open, setOpen] = useState(false); const [isLoading, setIsLoading] = useState(false);
  const [msgs, setMsgs] = useState([{sender: 'ai', text: `Halo ${user.name}! Saya asisten AI SIPANDAI. Ada yang bisa saya bantu terkait ide mengajar atau penyusunan Uraian KBM?`}]);
  const [input, setInput] = useState(''); const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, isLoading]);
  
  const handleSend = async () => {
    if(!input || isLoading) return;
    const userText = input; setMsgs(prev => [...prev, {sender: 'user', text: userText}]); setInput(''); setIsLoading(true);
    const systemPrompt = `Anda adalah Asisten AI Pendidikan untuk sistem SIPANDAI (${db.konfigurasi.namaSekolah}). Bantu guru dan staf dengan ide KBM, soal, administratif, referensi. Berbicaralah sopan, ringkas, dan berbahasa Indonesia yang baik. Jabatan lawan bicara: ${ROLES[user.role]}.`;
    try {
      const payload = { contents: [{ parts: [{ text: userText }] }], systemInstruction: { parts: [{ text: systemPrompt }] } };
      const result = await callGeminiAPI(payload);
      const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak dapat merespon saat ini.";
      setMsgs(prev => [...prev, {sender: 'ai', text: replyText}]);
    } catch (error) { setMsgs(prev => [...prev, {sender: 'ai', text: "Maaf, gagal menghubungi server AI."}]); } finally { setIsLoading(false); }
  }
  
  return (
    <div className="fixed bottom-24 md:bottom-28 right-6 z-50 print:hidden">
      {!open && <button onClick={()=>setOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:scale-110 transition-transform flex items-center justify-center relative"><MessageSquare size={24}/><span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-white border-2 border-blue-600"></span></span></button>}
      {open && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center font-bold shadow-md z-10 border-b border-white/20">
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-yellow-300"/> Asisten AI Guru</div> 
            <button onClick={()=>setOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={18}/></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-blue-50/30 flex flex-col gap-3 custom-scrollbar">
            {msgs.map((m,i) => (
              <div key={i} className={`p-3.5 rounded-2xl text-sm max-w-[88%] shadow-sm whitespace-pre-wrap leading-relaxed ${m.sender==='ai'?'bg-white border border-white/80 self-start rounded-tl-sm text-gray-800':'bg-gradient-to-br from-blue-500 to-blue-600 text-white self-end rounded-tr-sm'}`}>{m.text}</div>
            ))}
            {isLoading && (<div className="bg-white border border-white/80 p-3 rounded-2xl text-sm max-w-[80%] self-start rounded-tl-sm flex items-center gap-2 text-blue-600 font-medium shadow-sm"><Loader2 size={16} className="animate-spin"/> AI sedang mengetik...</div>)}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-white/50 bg-white/60 flex gap-2">
            <input type="text" className="flex-1 bg-white/80 border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="Ketik pesan..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} disabled={isLoading} />
            <button onClick={handleSend} disabled={isLoading || !input} className="bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700 text-white px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"><ChevronRight size={20}/></button>
          </div>
        </div>
      )}
    </div>
  )
}

function AsistenKurikulum({ db, user }: any) {
  const [view, setView] = useState('grid'); 
  const [outputHtml, setOutputHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const mapelOptions = getAvailableMapel(user.role);
  const isGuruKelas = ['guru_kelas_1', 'guru_kelas_2', 'guru_kelas_3', 'guru_kelas_4', 'guru_kelas_5', 'guru_kelas_6'].includes(user.role);
  const defaultKelas = isGuruKelas ? user.role.replace('guru_kelas_', '') : '1';
  
  const [formConfig, setFormConfig] = useState({ jenisUtama: '', tempatTgl: `${db.konfigurasi.pemkab}, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}` });
  
  const [fModul, setFModul] = useState({ kelas: defaultKelas, mapel: mapelOptions[0]||'', topik: '', model: 'Deep Learning', tahunPelajaran: '2025/2026' });
  const [fSoal, setFSoal] = useState({ kelas: defaultKelas, mapel: mapelOptions[0]||'', topik: '', jumlahSoal: '10', bentukSoal: 'Pilihan Ganda', level: 'Campuran (Proporsi C1-C2 30%, C3-C4 50%, C5-C6 20%)', soalListManual: '' });
  const [fKur, setFKur] = useState({ jenis: 'Capaian Pembelajaran (CP)', kelas: defaultKelas, mapel: mapelOptions[0]||'', semester: '1', tahunPelajaran: '2025/2026' });
  
  const MODEL_PEMBELAJARAN = ['Project-Based Learning (PjBL)', 'Problem-Based Learning (PBL)', 'Inquiry-Based Learning', 'Discovery Learning', 'Deep Learning'];
  const LEVEL_SOAL = ['Campuran (Proporsi C1-C2 30%, C3-C4 50%, C5-C6 20%)', 'Full HOTS (Fokus C4, C5, C6)', 'Full LOTS (Fokus C1, C2, C3)'];
  const JENIS_KURIKULUM = ['Capaian Pembelajaran (CP)', 'Alur Tujuan Pembelajaran (ATP)', 'Program Semester (PROSEM)', 'Program Tahunan (PROTA)'];

  const aiContentStyle = `
    .html-render-wrapper table { width: 100%; border-collapse: collapse; margin-top: 1em; margin-bottom: 1em; font-size: 11pt; border: 1px solid black; }
    .html-render-wrapper th, .html-render-wrapper td { border: 1px solid black; padding: 8px 12px; text-align: left; vertical-align: top; }
    .html-render-wrapper th { background-color: #f3f4f6; font-weight: bold; }
    .html-render-wrapper h3, .html-render-wrapper h4 { margin-top: 1.8em; margin-bottom: 0.5em; font-weight: bold; }
    .html-render-wrapper ul, .html-render-wrapper ol { margin-left: 2em; margin-bottom: 1em; }
    .html-render-wrapper li { margin-bottom: 0.4em; }
    .html-render-wrapper p { margin-bottom: 0.8em; }
  `;

  const handleGenerate = async (e: any, type: string) => {
    e.preventDefault();
    setIsLoading(true);
    let prompt = "";
    
    if (type === 'modul') {
      const fase = getFase(fModul.kelas);
      prompt = `Bertindaklah sebagai perancang kurikulum Kemendikdasmen RI yang ahli dalam pendekatan Deep Learning. Buatkan Modul Ajar (RPP) lengkap dan komprehensif untuk jenjang SD Kelas ${fModul.kelas} (Fase ${fase}), Mata Pelajaran ${fModul.mapel}, Tahun Pelajaran ${fModul.tahunPelajaran}, dengan Topik/Materi: "${fModul.topik}".
      Model Pembelajaran yang digunakan adalah: ${fModul.model}.
      
      PENTING (Pedoman Kemendikdasmen 2026): Jika modelnya Deep Learning, wajib menonjolkan tiga pilar utama: Mindful Learning (berkesadaran), Meaningful Learning (bermakna), dan Joyful Learning (menyenangkan). Pendekatan ini berfokus pada pemahaman konsep secara mendalam daripada sekadar menghafal.
      
      Modul Ajar WAJIB disusun sesuai struktur terbaru ini secara berurutan:
      1. Identitas Modul / Informasi Umum (Memuat Fase: ${fase}, Kelas: ${fModul.kelas}, Mapel: ${fModul.mapel}, Tahun Pelajaran: ${fModul.tahunPelajaran}, Topik: ${fModul.topik}, Alokasi Waktu).
      2. Dimensi Profil Lulusan / Profil Pelajar Pancasila (sebutkan dimensi yang disasar, misal: Bernalar Kritis, Gotong Royong, dll).
      3. Tujuan Pembelajaran (CP yang disasar).
      4. Kerangka Pembelajaran (Sebutkan rincian untuk: Praktik Pedagogis, Kemitraan Pembelajaran, Lingkungan Pembelajaran, dan Pemanfaatan Digital).
      5. Materi Esensial (Ringkasan materi inti).
      6. Langkah-langkah Pembelajaran Mendalam. (PENTING! Wajib mencakup: Kegiatan Pendahuluan, Kegiatan Inti (dibagi menjadi fase a. Memahami, b. Mengaplikasi, c. Merefleksi), dan Kegiatan Penutup. SAJIKAN DALAM BENTUK TABEL yang memuat kolom: Tahapan Kegiatan (Pendahuluan/Inti/Penutup), Sintaks, Deskripsi Kegiatan Guru & Siswa, dan Alokasi Waktu).
      7. Penilaian atau Asesmen (Formatif & Sumatif).
      8. Refleksi (Untuk guru dan murid).
      9. Diagnostik Non Kognitif (Pertanyaan pemantik kesejahteraan psikologis).
      10. Rubrik Pengamatan Kinerja (Sajikan dalam bentuk Tabel bergaris).
      11. Rubrik Penilaian Keterampilan (Sajikan dalam bentuk Tabel bergaris).
      
      Gunakan format HTML murni. Gunakan tag <h3>, <h4>, <p>, <ul>, <ol>, <li> untuk struktur. Untuk Rubrik dan Tabel Kegiatan Pembelajaran, WAJIB gunakan tag <table> dengan atribut border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;". JANGAN sertakan tag <html> atau <body>. JANGAN bungkus dengan backticks markdown.`;
      setFormConfig(p => ({...p, jenisUtama: 'Modul Ajar (Pembelajaran Mendalam)'}));
    } else if (type === 'soal') {
      prompt = `Bertindaklah sebagai ahli pembuat instrumen evaluasi pendidikan Kemendikdasmen RI. Buatkan Kisi-kisi dan Naskah Soal untuk jenjang SD Kelas ${fSoal.kelas}, Mata Pelajaran ${fSoal.mapel}, dengan Topik/Materi: "${fSoal.topik}".
      Tingkat Kesulitan & Proporsi Taksonomi Bloom: ${fSoal.level}.
      Jumlah Soal: ${fSoal.jumlahSoal} soal.
      Jenis Soal: ${fSoal.bentukSoal}.
      
      ${fSoal.soalListManual ? `Referensi/Dasar materi soal yang diketik manual oleh guru: "${fSoal.soalListManual}". Kembangkan referensi tersebut menjadi soal evaluasi yang valid.` : ''}

      Aturan ketat penulisan (WAJIB DIIKUTI TANPA TERKECUALI):
      1. Buatkan Kisi-kisi Soal terlebih dahulu dalam bentuk tabel (Kolom WAJIB: No, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Topik/Materi, Indikator Soal, Level Kognitif (C1/C2/C3/C4/C5/C6), Bentuk Soal).
      2. Setelah tabel kisi-kisi, buatkan Naskah Soal lengkap sejumlah ${fSoal.jumlahSoal} soal dengan jenis ${fSoal.bentukSoal}.
      3. Naskah soal WAJIB diberi nomor urut dengan rapi (1, 2, 3, dst). Gunakan tag <ol> untuk daftar soal dan <li> untuk setiap pertanyaannya agar bernomor secara otomatis.
      4. Jika terdapat soal Pilihan Ganda, Opsi pilihan ganda WAJIB (mutlak) berada TEPAT DI BAWAH setiap pertanyaan. Opsi harus berupa A, B, C, dan D yang disusun ke bawah menggunakan tag <ol type="A" style="margin-left: 20px;"> dan <li>. JANGAN menaruh opsi di dalam paragraf yang sama dengan soal.
      5. Berikan Kunci Jawaban dan Pembahasan Singkat di bagian paling akhir dokumen.
      6. Gunakan format HTML murni. Untuk tabel gunakan border="1" style="border-collapse:collapse; width:100%;". JANGAN bungkus dengan markdown backticks.`;
      setFormConfig(p => ({...p, jenisUtama: 'Kisi-kisi & Naskah Soal Evaluasi'}));
    } else if (type === 'kurikulum') {
      prompt = `Bertindaklah sebagai ahli pengembang kurikulum Kemendikdasmen RI. Buatkan dokumen ${fKur.jenis} yang komprehensif untuk jenjang SD Kelas ${fKur.kelas} (Fase ${getFase(fKur.kelas)}), Mata Pelajaran ${fKur.mapel}, untuk Semester ${fKur.semester} Tahun Pelajaran ${fKur.tahunPelajaran}.

      Instruksi khusus implementasi Kurikulum Nasional Terbaru 2026:
      1. Pastikan isi ${fKur.jenis} terintegrasi, tersinkronisasi, dan sesuai dengan Standar Isi & Capaian Pembelajaran Kemendikdasmen terbaru.
      2. Rancang dokumen ini khusus untuk 1 semester penuh (Semester ${fKur.semester}).
      3. KHUSUS JIKA MEMBUAT PROSEM ATAU PROTA: Anda WAJIB menyesuaikan perhitungan alokasi waktu dengan asumsi Minggu Efektif belajar sekolah dasar (sekitar 18-20 minggu per semester). Sajikan kolom Alokasi Waktu (Jumlah JP) dan Keterangan Pelaksanaan (Minggu ke-1, 2, dst, Bulan apa). Berikan deskripsi/keterangan analisis minggu efektif di awal atau akhir tabel.
      4. KHUSUS JIKA MEMBUAT CP/ATP: Sajikan alur yang logis dari Elemen, Capaian Pembelajaran, Tujuan Pembelajaran, hingga Alur Tujuan Pembelajaran.
      5. Sajikan data UTAMA dalam bentuk tabel yang rapi dan komprehensif agar mudah dibaca oleh guru.
      6. Gunakan format HTML murni. Gunakan atribut tabel: border="1" style="border-collapse:collapse; width:100%; text-align:left;" cellpadding="5". JANGAN bungkus dengan backticks markdown.`;
      setFormConfig(p => ({...p, jenisUtama: fKur.jenis}));
    }

    try {
      db.showToast("Memulai proses Generate AI. Mohon tunggu...", "success");
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const response = await callGeminiAPI(payload);
      let text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```html/gi, '').replace(/```/gi, '').trim();
      setOutputHtml(text);
      setView('output');
      db.showToast("Berhasil menghasilkan dokumen!", "success");
    } catch (e) {
      db.showToast("Gagal menghasilkan dokumen via AI.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <style>{aiContentStyle}</style>
      <GlassPanel>
        <div className="flex items-center gap-3 mb-6 border-b border-white/50 pb-4">
          <LayoutGrid size={28} className="text-blue-600"/>
          <h3 className="text-2xl font-bold text-gray-800">Asisten Kurikulum AI</h3>
        </div>

        {view === 'grid' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div onClick={() => setView('modul')} className="bg-white/60 backdrop-blur border border-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-5 group">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-xl group-hover:from-blue-600 group-hover:to-blue-500 group-hover:text-white transition-all shadow-sm"><BookText size={36}/></div>
                  <div><h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-800 transition">Modul Ajar (RPP AI)</h4><p className="text-sm text-gray-600 mt-1">Buat skenario pembelajaran mendalam (PjBL, PBL, Deep Learning) lengkap komponen.</p></div>
              </div>
              <div onClick={() => setView('soal')} className="bg-white/60 backdrop-blur border border-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-5 group">
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 text-green-600 rounded-xl group-hover:from-green-600 group-hover:to-green-500 group-hover:text-white transition-all shadow-sm"><Target size={36}/></div>
                  <div><h4 className="font-bold text-gray-800 text-lg group-hover:text-green-800 transition">Kisi-kisi & Naskah Soal</h4><p className="text-sm text-gray-600 mt-1">Buat butir soal, PG, dan kisi-kisi dengan proporsi taksonomi Bloom terstruktur.</p></div>
              </div>
              <div onClick={() => { setFKur({...fKur, jenis: 'Capaian Pembelajaran (CP)'}); setView('kurikulum'); }} className="bg-white/60 backdrop-blur border border-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-5 group">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 rounded-xl group-hover:from-purple-600 group-hover:to-purple-500 group-hover:text-white transition-all shadow-sm"><FileCheck size={36}/></div>
                  <div><h4 className="font-bold text-gray-800 text-lg group-hover:text-purple-800 transition">CP dan ATP Terpadu</h4><p className="text-sm text-gray-600 mt-1">Sintesis Capaian dan Alur Tujuan Pembelajaran terstruktur terintegrasi aturan baru.</p></div>
              </div>
              <div onClick={() => { setFKur({...fKur, jenis: 'Program Semester (PROSEM)'}); setView('kurikulum'); }} className="bg-white/60 backdrop-blur border border-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-5 group">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 rounded-xl group-hover:from-orange-600 group-hover:to-orange-500 group-hover:text-white transition-all shadow-sm"><CalendarDays size={36}/></div>
                  <div><h4 className="font-bold text-gray-800 text-lg group-hover:text-orange-800 transition">PROSEM dan PROTA</h4><p className="text-sm text-gray-600 mt-1">Pemetaan minggu efektif untuk penyusunan program semester & tahunan rasional.</p></div>
              </div>
           </div>
        )}

        {view === 'modul' && (
           <form onSubmit={(e)=>handleGenerate(e, 'modul')} className="space-y-5 relative z-10 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4 text-blue-800"><button type="button" onClick={()=>setView('grid')} className="p-1 hover:bg-blue-100 rounded-md transition"><ArrowLeft size={20}/></button><h4 className="font-bold text-lg">Generator Modul Ajar Pendekatan Deep Learning</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelas (Fase {getFase(fModul.kelas)})</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fModul.kelas} onChange={e=>setFModul({...fModul, kelas:e.target.value})} disabled={isGuruKelas}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Mata Pelajaran</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fModul.mapel} onChange={e=>setFModul({...fModul, mapel:e.target.value})}>{mapelOptions.map(m=><option key={m}>{m}</option>)}</select></div>
                 <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Topik / Materi Esensial</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fModul.topik} onChange={e=>setFModul({...fModul, topik:e.target.value})} placeholder="Contoh: Operasi Bilangan Bulat, Mengenal Ciri Makhluk Hidup..." required/></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Model Pembelajaran Utama</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fModul.model} onChange={e=>setFModul({...fModul, model:e.target.value})}>{MODEL_PEMBELAJARAN.map(m=><option key={m}>{m}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Tahun Pelajaran</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fModul.tahunPelajaran} onChange={e=>setFModul({...fModul, tahunPelajaran:e.target.value})} placeholder="Misal: 2025/2026" required/></div>
                 <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Tempat dan Tanggal TTD</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={formConfig.tempatTgl} onChange={e=>setFormConfig({...formConfig, tempatTgl:e.target.value})} required/></div>
              </div>
              <div className="flex justify-end mt-4"><button disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition flex items-center gap-2">{isLoading?<Loader2 className="animate-spin" size={20}/>:<Sparkles size={20}/>} {isLoading?'Menyusun Modul...':'Generate Modul AI'}</button></div>
           </form>
        )}

        {view === 'soal' && (
           <form onSubmit={(e)=>handleGenerate(e, 'soal')} className="space-y-5 relative z-10 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4 text-green-800"><button type="button" onClick={()=>setView('grid')} className="p-1 hover:bg-green-100 rounded-md transition"><ArrowLeft size={20}/></button><h4 className="font-bold text-lg">Generator Kisi-kisi & Soal</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelas</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fSoal.kelas} onChange={e=>setFSoal({...fSoal, kelas:e.target.value})} disabled={isGuruKelas}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Mata Pelajaran</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fSoal.mapel} onChange={e=>setFSoal({...fSoal, mapel:e.target.value})}>{mapelOptions.map(m=><option key={m}>{m}</option>)}</select></div>
                 <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Topik / Materi Evaluasi</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fSoal.topik} onChange={e=>setFSoal({...fSoal, topik:e.target.value})} placeholder="Topik materi untuk dievaluasi..." required/></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Level Kesulitan Soal & Proporsi</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fSoal.level} onChange={e=>setFSoal({...fSoal, level:e.target.value})}>{LEVEL_SOAL.map(m=><option key={m}>{m}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Soal</label><input type="number" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fSoal.jumlahSoal} onChange={e=>setFSoal({...fSoal, jumlahSoal:e.target.value})} required min="1" max="50"/></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Jenis Soal (Isi Manual)</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fSoal.bentukSoal} onChange={e=>setFSoal({...fSoal, bentukSoal:e.target.value})} placeholder="Misal: Pilihan Ganda, Uraian, Campuran..." required/></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Tempat dan Tanggal TTD</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={formConfig.tempatTgl} onChange={e=>setFormConfig({...formConfig, tempatTgl:e.target.value})} required/></div>
                 <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Ketik Daftar Soal Manual (Opsional)</label><textarea rows={3} className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none custom-scrollbar" placeholder="Ketik draf pertanyaan manual di sini jika ingin AI mengembangkan soal Anda menjadi lebih terstruktur..." value={fSoal.soalListManual} onChange={e=>setFSoal({...fSoal, soalListManual:e.target.value})}></textarea></div>
              </div>
              <div className="flex justify-end mt-4"><button disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition flex items-center gap-2">{isLoading?<Loader2 className="animate-spin" size={20}/>:<Sparkles size={20}/>} {isLoading?'Menyusun Soal...':'Generate Soal AI'}</button></div>
           </form>
        )}

        {view === 'kurikulum' && (
           <form onSubmit={(e)=>handleGenerate(e, 'kurikulum')} className="space-y-5 relative z-10 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4 text-purple-800"><button type="button" onClick={()=>setView('grid')} className="p-1 hover:bg-purple-100 rounded-md transition"><ArrowLeft size={20}/></button><h4 className="font-bold text-lg">Generator Perangkat Kurikulum</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Jenis Perangkat Kurikulum</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fKur.jenis} onChange={e=>setFKur({...fKur, jenis:e.target.value})}>{JENIS_KURIKULUM.map(m=><option key={m}>{m}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelas (Fase {getFase(fKur.kelas)})</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fKur.kelas} onChange={e=>setFKur({...fKur, kelas:e.target.value})} disabled={isGuruKelas}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Mata Pelajaran</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fKur.mapel} onChange={e=>setFKur({...fKur, mapel:e.target.value})}>{mapelOptions.map(m=><option key={m}>{m}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Pemetaan Semester</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fKur.semester} onChange={e=>setFKur({...fKur, semester:e.target.value})}>{SEMESTER_OPTIONS.map(s=><option key={s.val} value={s.val}>Semester {s.label}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-gray-700 mb-1">Tahun Pelajaran</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={fKur.tahunPelajaran} onChange={e=>setFKur({...fKur, tahunPelajaran:e.target.value})} required/></div>
                 <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Tempat dan Tanggal TTD</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl shadow-inner focus:ring-2 outline-none" value={formConfig.tempatTgl} onChange={e=>setFormConfig({...formConfig, tempatTgl:e.target.value})} required/></div>
              </div>
              <div className="flex justify-end mt-4"><button disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition flex items-center gap-2">{isLoading?<Loader2 className="animate-spin" size={20}/>:<Sparkles size={20}/>} {isLoading?'Menganalisis Kurikulum...':'Generate Kurikulum AI'}</button></div>
           </form>
        )}

        {view === 'output' && (
           <div className="space-y-4 animate-fade-in-up">
              <div className="flex gap-3 justify-end print:hidden">
                 <button onClick={() => setView('grid')} className="px-4 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-xl hover:bg-white flex gap-2 font-bold shadow-sm transition"><ArrowLeft size={18}/> Menu AI</button>
                 <button onClick={() => exportToWord('ai-doc-export', `Export_${formConfig.jenisUtama}`)} className="px-4 py-2 bg-blue-100 border border-blue-200 text-blue-800 rounded-xl hover:bg-blue-200 flex gap-2 font-bold shadow-sm transition"><Download size={18}/> Unduh Word</button>
                 <button onClick={() => exportToPDF('ai-doc-export', `Export_${formConfig.jenisUtama}`, db.showToast)} className="px-4 py-2 bg-red-100 border border-red-200 text-red-800 rounded-xl hover:bg-red-200 flex gap-2 font-bold shadow-sm transition"><Download size={18}/> Unduh PDF</button>
                 <button onClick={() => {window.focus(); window.print();}} className="px-6 py-2 bg-gray-800 border border-gray-900 text-white rounded-xl hover:bg-gray-900 flex gap-2 font-bold shadow-sm transition"><Printer size={18}/> Cetak Dokumen</button>
              </div>

              <div id="ai-doc-export" className="bg-white p-10 md:p-14 border border-gray-200 shadow-xl rounded-xl print:m-0 print:border-none print:shadow-none font-serif text-black min-h-[297mm]">
                  <div className="text-center mb-6 border-b-[3px] border-black pb-4">
                       <p className="font-bold uppercase text-sm tracking-wide leading-tight">{db.konfigurasi.pemkab}<br/>{db.konfigurasi.dinas}</p>
                       <h2 className="text-2xl font-black uppercase tracking-widest mt-1 mb-1">{db.konfigurasi.namaSekolah}</h2>
                       <p className="text-xs tracking-wider">{db.konfigurasi.alamat}</p>
                       <p className="text-[11px] mt-1">Email: {db.konfigurasi.email} | NSS: {db.konfigurasi.nss} | NPSN: {db.konfigurasi.npsn}</p>
                  </div>
                  
                  <h3 className="text-center font-bold text-xl uppercase mb-8 underline">{formConfig.jenisUtama}</h3>
                  
                  <div className="html-render-wrapper leading-relaxed text-justify space-y-3" dangerouslySetInnerHTML={{ __html: outputHtml }} />

                  <div className="mt-16 flex justify-between px-8 break-inside-avoid">
                     <div className="text-center w-60">
                         <p>Mengetahui,</p>
                         <p>Kepala Sekolah</p>
                         <br/><br/><br/><br/><br/>
                         <p className="font-bold underline leading-tight">{db.konfigurasi.kepsek}</p>
                         <p>NIP. {db.konfigurasi.nipKepsek}</p>
                     </div>
                     <div className="text-center w-60">
                         <p>{formConfig.tempatTgl}</p>
                         <p>Guru Kelas / Mata Pelajaran</p>
                         <br/><br/><br/><br/><br/>
                         <p className="font-bold underline leading-tight">{user.name}</p>
                         <p>NIP/ID. {user.nip}</p>
                     </div>
                  </div>
              </div>
           </div>
        )}
      </GlassPanel>
    </div>
  );
}

function KelolaAkun({ db, adminId }: any) {
  const [form, setForm] = useState({ id: '', name: '', nip: '', role: 'guru_kelas_1', username: '', password: '' });
  const [isEdit, setIsEdit] = useState(false);
  const saveUser = async (e: any) => {
    e.preventDefault();
    try {
      if (isEdit) await db.setUsers((prev: any[]) => prev.map((u: any) => String(u.id) === String(form.id) ? form : u));
      else await db.setUsers((prev: any[]) => [...prev, { ...form, id: Date.now().toString() }]);
      db.showToast(`Akun berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
      setForm({ id: '', name: '', nip: '', role: 'guru_kelas_1', username: '', password: '' });
      setIsEdit(false);
    } catch (error) {
      console.error(error);
      db.showToast('Akun gagal disimpan ke Firebase.', 'error');
    }
  };
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <GlassPanel>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800"><UserPlus size={22}/> {isEdit ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}</h3>
        <form onSubmit={saveUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries({name:'Nama Lengkap', nip:'NIP/ID', username:'Username Login', password:'Password'}).map(([k,l])=>(<div key={k}><label className="block text-sm font-bold mb-1 text-gray-700">{l}</label><input type="text" className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={(form as any)[k]} onChange={e=>setForm({...form, [k]:e.target.value})} required/></div>))}
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Jabatan / Role</label>
            <select className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={Object.keys(ROLES).includes(form.role) ? form.role : 'lainnya'} onChange={e => { if (e.target.value === 'lainnya') setForm({...form, role: ''}); else setForm({...form, role: e.target.value}); }}>
              {Object.entries(ROLES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              <option value="lainnya">Lainnya (Isi Manual)</option>
            </select>
            {!Object.keys(ROLES).includes(form.role) && (
               <input type="text" className="w-full mt-3 bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} placeholder="Ketik nama jabatan secara manual..." required/>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end mt-2 pt-4 border-t border-gray-200/40">
            {isEdit && <button type="button" onClick={() => {setIsEdit(false); setForm({id:'', name:'', nip:'', role:'guru_kelas_1', username:'', password:''});}} className="mr-3 px-6 py-2.5 bg-white/50 hover:bg-white text-gray-700 rounded-xl font-bold border border-gray-200 shadow-sm transition">Batal</button>}
            <button type="submit" className="px-6 py-2.5 bg-blue-600/90 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition">{isEdit ? 'Simpan Perubahan' : 'Tambahkan Akun'}</button>
          </div>
        </form>
      </GlassPanel>
      <GlassPanel className="overflow-x-auto">
        <h4 className="font-bold mb-4 text-gray-800">Daftar Pengguna Sistem</h4>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead><tr className="bg-white/50 text-gray-700 text-sm border-b border-white"><th className="p-3 font-bold">Nama Lengkap</th><th className="p-3 font-bold">NIP</th><th className="p-3 font-bold">Jabatan</th><th className="p-3 font-bold">Username</th><th className="p-3 font-bold text-center">Aksi</th></tr></thead>
          <tbody className="text-sm">
            {db.users.map((u: any) => (
              <tr key={u.id} className="border-b border-white/40 hover:bg-white/60 transition"><td className="p-3 font-semibold text-gray-800">{u.name}</td><td className="p-3 text-gray-700">{u.nip}</td><td className="p-3"><span className="bg-blue-100/70 text-blue-900 py-1 px-3 rounded-md text-xs font-bold border border-blue-200">{ROLES[u.role] || u.role}</span></td><td className="p-3 text-gray-700">{u.username}</td>
                <td className="p-3 flex gap-2 justify-center">
                  <button onClick={()=>{setForm(u); setIsEdit(true);}} className="p-2 text-blue-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-blue-100 transition" title="Edit"><Edit size={16}/></button>
                  {String(u.id) !== String(adminId) && <button onClick={async ()=>{try { await db.setUsers((prev: any[]) => prev.filter((x: any)=>String(x.id)!==String(u.id))); db.showToast('Akun dihapus.'); } catch (error) { console.error(error); db.showToast('Akun gagal dihapus dari Firebase.', 'error'); }}} className="p-2 text-red-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-red-100 transition" title="Hapus"><Trash2 size={16}/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

function DataSiswa({ db }: any) {
  const [form, setForm] = useState({ id: '', name: '', nisn: '', kelas: '1', jk: 'L' });
  const [isEdit, setIsEdit] = useState(false);
  const saveSiswa = async (e: any) => {
    e.preventDefault();
    try {
      if(isEdit) await db.setStudents((prev: any[]) => prev.map((s: any) => String(s.id) === String(form.id) ? form : s));
      else await db.setStudents((prev: any[]) => [...prev, { ...form, id: Date.now().toString() }]);
      db.showToast(`Siswa berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
      setForm({ id: '', name: '', nisn: '', kelas: '1', jk: 'L' });
      setIsEdit(false);
    } catch (error) {
      console.error(error);
      db.showToast('Data siswa gagal disimpan ke Firebase.', 'error');
    }
  };
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <GlassPanel>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800"><Users size={22}/> {isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
        <form onSubmit={saveSiswa} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="block text-sm font-bold mb-1 text-gray-700">Nama Lengkap Siswa</label><input type="text" className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></div>
          <div><label className="block text-sm font-bold mb-1 text-gray-700">NISN</label><input type="text" className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={form.nisn} onChange={e=>setForm({...form, nisn:e.target.value})} required/></div>
          <div><label className="block text-sm font-bold mb-1 text-gray-700">Kelas</label><select className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={form.kelas} onChange={e=>setForm({...form, kelas:e.target.value})}>{KELAS_OPTIONS.map(k => <option key={k} value={k}>Kelas {k}</option>)}</select></div>
          <div><label className="block text-sm font-bold mb-1 text-gray-700">Jenis Kelamin</label><select className="w-full bg-white/70 backdrop-blur-sm border border-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" value={form.jk} onChange={e=>setForm({...form, jk:e.target.value})}><option value="L">Laki-Laki</option><option value="P">Perempuan</option></select></div>
          <div className="md:col-span-2 flex justify-end mt-2 pt-4 border-t border-gray-200/40">
            {isEdit && <button type="button" onClick={() => {setIsEdit(false); setForm({id:'', name:'', nisn:'', kelas:'1', jk:'L'});}} className="mr-3 px-6 py-2.5 bg-white/50 hover:bg-white text-gray-700 rounded-xl font-bold shadow-sm border border-gray-200 transition">Batal</button>}
            <button type="submit" className="px-6 py-2.5 bg-green-600/90 hover:bg-green-700 text-white rounded-xl font-bold shadow-md transition">{isEdit ? 'Simpan Perubahan' : 'Tambahkan Siswa'}</button>
          </div>
        </form>
      </GlassPanel>
      <GlassPanel className="overflow-x-auto">
        <h4 className="font-bold mb-4 text-gray-800">Daftar Siswa Aktif</h4>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead><tr className="bg-white/50 text-gray-700 text-sm border-b border-white"><th className="p-3 font-bold">Nama Siswa</th><th className="p-3 font-bold">NISN</th><th className="p-3 font-bold">Kelas</th><th className="p-3 font-bold">L/P</th><th className="p-3 font-bold text-center">Aksi</th></tr></thead>
          <tbody className="text-sm">
            {db.students.map((s: any) => (
              <tr key={s.id} className="border-b border-white/40 hover:bg-white/60 transition"><td className="p-3 font-semibold text-gray-800">{s.name}</td><td className="p-3 text-gray-700">{s.nisn}</td><td className="p-3">Kelas {s.kelas}</td><td className="p-3">{s.jk}</td>
                <td className="p-3 flex gap-2 justify-center">
                  <button onClick={()=>{setForm(s); setIsEdit(true);}} className="p-2 text-blue-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-blue-100 transition"><Edit size={16}/></button>
                  <button onClick={async ()=>{try { await db.setStudents((prev: any[]) => prev.filter((x: any)=>String(x.id)!==String(s.id))); db.showToast('Siswa dihapus.'); } catch (error) { console.error(error); db.showToast('Siswa gagal dihapus dari Firebase.', 'error'); }}} className="p-2 text-red-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-red-100 transition"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

function Inventaris({ db }: any) {
  const [form, setForm] = useState({ id:'', nama:'', jenis:'Habis Pakai', harga:'', satuan:'Pcs' });
  const saveBarang = async (e: any) => {
    e.preventDefault();
    try {
      await db.setBarang((prev: any[]) => [...prev, {...form, id:Date.now().toString()}]);
      setForm({id:'', nama:'', jenis:'Habis Pakai', harga:'', satuan:'Pcs'});
      db.showToast('Master barang tersimpan.');
    } catch (error) {
      console.error(error);
      db.showToast('Master barang gagal disimpan ke Firebase.', 'error');
    }
  };
  
  const [stok, setStok] = useState({ id:'', barangId:'', jumlah:'' });
  const [filterBulan, setFilterBulan] = useState('');
  const saveStok = async (e: any) => {
    e.preventDefault();
    const b = db.barang.find((x: any)=>String(x.id)===String(stok.barangId));
    if (!b) { db.showToast('Pilih barang terlebih dahulu.', 'error'); return; }
    const totalHarga = parseFloat(b.harga) * parseFloat(stok.jumlah);
    try {
      await db.setStokOpname((prev: any[]) => [...prev, {...stok, nama:b.nama, satuan:b.satuan, hargaSatuan:b.harga, totalHarga, tgl:new Date().toISOString().split('T')[0], id:Date.now().toString()}]);
      setStok({id:'', barangId:'', jumlah:''});
      db.showToast('Stok berhasil ditambah.');
    } catch (error) {
      console.error(error);
      db.showToast('Stok gagal disimpan ke Firebase.', 'error');
    }
  };
  const filteredStok = db.stokOpname.filter((s: any) => filterBulan === '' || s.tgl.split('-')[1] === filterBulan);
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassPanel>
          <h3 className="font-bold mb-4 text-lg text-gray-800"><Box className="inline mr-2 text-blue-600" size={20}/> Input Master Barang</h3>
          <form onSubmit={saveBarang} className="space-y-4">
            <div><label className="text-xs font-bold text-gray-700 mb-1 block">Nama Barang</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.nama} onChange={e=>setForm({...form, nama:e.target.value})} required/></div>
            <div><label className="text-xs font-bold text-gray-700 mb-1 block">Jenis Barang</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.jenis} onChange={e=>setForm({...form, jenis:e.target.value})}><option>Habis Pakai</option><option>Modal</option><option>Pemeliharaan</option></select></div>
            <div><label className="text-xs font-bold text-gray-700 mb-1 block">Harga Satuan (Rp)</label><input type="number" className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.harga} onChange={e=>setForm({...form, harga:e.target.value})} required/></div>
            <div><label className="text-xs font-bold text-gray-700 mb-1 block">Satuan</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.satuan} onChange={e=>setForm({...form, satuan:e.target.value})}>{SATUAN_BARANG.map(s=><option key={s}>{s}</option>)}</select></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold p-3 rounded-xl text-sm mt-2 shadow-md">Simpan Master Barang</button>
          </form>
          <div className="mt-6 border-t border-gray-200/50 pt-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Preview Master Barang</h4>
            <div className="max-h-40 overflow-y-auto bg-white/50 border border-white rounded-xl custom-scrollbar shadow-inner">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/70 border-b border-white sticky top-0 backdrop-blur-md"><tr><th className="p-3">Nama</th><th className="p-3">Harga</th><th className="p-3">Satuan</th><th className="p-3 text-center">Aksi</th></tr></thead>
                <tbody>{db.barang.map((b: any)=><tr key={b.id} className="border-b border-white/50 hover:bg-white/70"><td className="p-3 font-semibold">{b.nama}</td><td className="p-3">Rp{b.harga}</td><td className="p-3">{b.satuan}</td><td className="p-3 text-center"><button onClick={async ()=>{try { await db.setBarang((prev: any[]) => prev.filter((x: any)=>String(x.id)!==String(b.id))); db.showToast('Barang dihapus.'); } catch (error) { console.error(error); db.showToast('Barang gagal dihapus dari Firebase.', 'error'); }}} className="text-red-500 hover:bg-white p-1 rounded"><Trash2 size={14}/></button></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-4 text-lg text-gray-800">Stok Opname (Barang Masuk)</h3>
            <form onSubmit={saveStok} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-700 mb-1 block">Pilih Barang (Dari Master)</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={stok.barangId} onChange={e=>setStok({...stok, barangId:e.target.value})} required><option value="">-- Pilih Barang --</option>{db.barang.map((b: any)=><option key={b.id} value={b.id}>{b.nama} (Rp{b.harga})</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-700 mb-1 block">Jumlah Masuk</label><input type="number" className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={stok.jumlah} onChange={e=>setStok({...stok, jumlah:e.target.value})} required/></div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold p-3 rounded-xl text-sm mt-2 shadow-md">Rekam Stok Masuk</button>
            </form>
            <div className="mt-6 border-t border-gray-200/50 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-gray-800">Preview Stok Opname</h4>
                <select className="bg-white/70 border border-white rounded-lg p-1.5 text-xs outline-none shadow-sm font-semibold" value={filterBulan} onChange={e=>setFilterBulan(e.target.value)}><option value="">Semua Bulan</option>{BULAN_OPTIONS.filter(b=>b.val!=='').map(b=><option key={b.val} value={b.val}>{b.label}</option>)}</select>
              </div>
              <div className="max-h-40 overflow-y-auto bg-white/50 border border-white rounded-xl mb-4 custom-scrollbar shadow-inner">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/70 border-b border-white sticky top-0 backdrop-blur-md"><tr><th className="p-3">Tgl</th><th className="p-3">Barang</th><th className="p-3">Jml</th><th className="p-3">Total Harga</th></tr></thead>
                  <tbody>{filteredStok.map((s: any)=><tr key={s.id} className="border-b border-white/50 hover:bg-white/70"><td className="p-3">{s.tgl}</td><td className="p-3 font-semibold">{s.nama}</td><td className="p-3">{s.jumlah} <span className="text-[10px] bg-white p-0.5 rounded">{s.satuan}</span></td><td className="p-3 font-bold text-blue-700">Rp{s.totalHarga}</td></tr>)}</tbody>
                </table>
              </div>
              <button onClick={()=>{if(exportToExcel(filteredStok, `StokOpname_Bulan_${filterBulan||'Semua'}`, filterBulan ? 'per_bulan' : 'semua_bulan', filterBulan)) db.showToast("Data Stok diunduh ke Excel.");}} className="w-full text-center border border-green-500 bg-green-50/50 hover:bg-green-100 text-green-700 p-3 rounded-xl text-sm transition font-bold flex justify-center items-center gap-2"><Download size={18}/> Download Excel (.xlsx)</button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

function SuratMenyurat({ db, isAdmin }: any) {
  const [inForm, setInForm] = useState({ noSurat:'', dari:'', tanggal:'', hal:'' });
  const [outForm, setOutForm] = useState({ tanggalBuat:'', noSurat:'', perihalSurat:'', kepada:'', hariTglKegiatan:'', jam:'', perihalKegiatan:'', tempat:'', draft:'' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const saveMasuk = async (e: any) => {
    e.preventDefault();
    try {
      await db.setSuratMasuk((prev: any[]) => [...prev, {...inForm, id:Date.now().toString()}]);
      setInForm({noSurat:'', dari:'', tanggal:'', hal:''});
      db.showToast("Surat masuk terekam");
    } catch (error) {
      console.error(error);
      db.showToast('Surat masuk gagal disimpan ke Firebase.', 'error');
    }
  };
  const saveKeluar = async () => {
    try {
      await db.setSuratKeluar((prev: any[]) => [...prev, {...outForm, id:Date.now().toString()}]);
      db.showToast("Surat Keluar terekam ke Arsip");
    } catch (error) {
      console.error(error);
      db.showToast('Surat keluar gagal disimpan ke Firebase.', 'error');
    }
  };
  
  const generateDraftAI = async () => {
    if(!aiPrompt) return db.showToast("Masukkan detail instruksi surat untuk AI", "error");
    setIsGenerating(true); db.showToast("AI sedang menyusun draf surat...   ✨  ", "success");
    try {
      const promptText = `Buatkan isi paragraf surat resmi sekolah dengan instruksi: "${aiPrompt}". Gunakan tata bahasa Indonesia yang baku, sopan, dan formal. Susun surat secara lengkap HANYA bagian isinya saja. SERTAKAN langsung format detail acara di dalamnya berupa baris list rapi (Hari/Tanggal: ${outForm.hariTglKegiatan || '-'}, Waktu: ${outForm.jam || '-'}, Tempat: ${outForm.tempat || '-'}, Acara: ${outForm.perihalKegiatan || '-'}) tanpa mengulang tabel.`;
      const payload = { contents: [{ parts: [{ text: promptText }] }] };
      const data = await callGeminiAPI(payload);
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if(resultText) { setOutForm((prev: any) => ({...prev, draft: resultText.trim()})); db.showToast("Draf berhasil disusun AI!", "success"); }
    } catch(e) { db.showToast("Gagal menyusun surat via AI.", "error"); } finally { setIsGenerating(false); }
  }
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <GlassPanel className="h-fit">
          <div className="flex justify-between items-center mb-5"><h3 className="font-bold text-lg text-gray-800"><Mail className="inline mr-2 text-blue-600" size={20}/>Surat Masuk</h3></div>
          <div className="flex flex-col md:flex-row gap-6">
             <form onSubmit={saveMasuk} className="space-y-4 w-full md:w-1/3">
               <div><label className="text-xs font-bold text-gray-700 mb-1 block">Nomor Surat</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" value={inForm.noSurat} onChange={e=>setInForm({...inForm, noSurat:e.target.value})} required/></div>
               <div><label className="text-xs font-bold text-gray-700 mb-1 block">Surat Dari Instansi/Pengirim</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" value={inForm.dari} onChange={e=>setInForm({...inForm, dari:e.target.value})} required/></div>
               <div><label className="text-xs font-bold text-gray-700 mb-1 block">Tanggal Surat</label><input type="date" className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" value={inForm.tanggal} onChange={e=>setInForm({...inForm, tanggal:e.target.value})} required/></div>
               <div><label className="text-xs font-bold text-gray-700 mb-1 block">Perihal</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" value={inForm.hal} onChange={e=>setInForm({...inForm, hal:e.target.value})} required/></div>
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold p-3 rounded-xl text-sm shadow-md">Rekam Surat Masuk</button>
             </form>
             <div className="w-full md:w-2/3">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Preview Arsip Surat Masuk</h4>
                <div className="max-h-64 overflow-y-auto bg-white/50 border border-white rounded-xl shadow-inner custom-scrollbar">
                   <table className="w-full text-xs text-left">
                     <thead className="bg-white/70 border-b border-white sticky top-0 backdrop-blur-md"><tr><th className="p-3">No. Surat</th><th className="p-3">Pengirim</th><th className="p-3">Tanggal</th><th className="p-3">Perihal</th></tr></thead>
                     <tbody>{db.suratMasuk.map((s: any)=><tr key={s.id} className="border-b border-white/50 hover:bg-white/70"><td className="p-3 font-medium">{s.noSurat}</td><td className="p-3">{s.dari}</td><td className="p-3">{s.tanggal}</td><td className="p-3 font-semibold">{s.hal}</td></tr>)}
                     {db.suratMasuk.length===0&&<tr><td colSpan={4} className="p-6 text-center text-gray-500 italic font-medium">Belum ada surat masuk.</td></tr>}</tbody>
                   </table>
                </div>
             </div>
          </div>
        </GlassPanel>
        
        <GlassPanel>
          <div className="flex justify-between items-center mb-5 border-b border-white/50 pb-3">
             <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><FileSignature className="text-blue-600"/> Draft & Preview Surat Keluar</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <form className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Tanggal Pembuatan Surat</label><input type="date" className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" value={outForm.tanggalBuat} onChange={e=>setOutForm({...outForm, tanggalBuat:e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Nomor Surat</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="001/SDN1/2026" value={outForm.noSurat} onChange={e=>setOutForm({...outForm, noSurat:e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Perihal Surat</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="Undangan Rapat..." value={outForm.perihalSurat} onChange={e=>setOutForm({...outForm, perihalSurat:e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Kepada Yth.</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="Bapak/Ibu Wali Murid" value={outForm.kepada} onChange={e=>setOutForm({...outForm, kepada:e.target.value})}/></div>
               </div>
               
               <hr className="my-2 border-gray-200/50"/>
               <p className="text-xs font-bold text-gray-800 uppercase bg-white/50 p-2 rounded inline-block">Detail Informasi Acara / Kegiatan</p>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Hari dan Tanggal Kegiatan</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="Senin, 12 Juni 2026" value={outForm.hariTglKegiatan} onChange={e=>setOutForm({...outForm, hariTglKegiatan:e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Waktu Kegiatan</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="08.00 WIB - Selesai" value={outForm.jam} onChange={e=>setOutForm({...outForm, jam:e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Tempat Kegiatan</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="Aula SDN 1 Sukomulyo" value={outForm.tempat} onChange={e=>setOutForm({...outForm, tempat:e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-gray-700 mb-1 block">Hal Kegiatan / Acara</label><input className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 shadow-inner" placeholder="Pengambilan Rapor" value={outForm.perihalKegiatan} onChange={e=>setOutForm({...outForm, perihalKegiatan:e.target.value})}/></div>
               </div>
               <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100/50 shadow-inner">
                  <label className="text-xs font-bold text-blue-800 mb-2 block flex items-center gap-1"><Sparkles size={14}/> Instruksi AI & Generate Isi Surat</label>
                  <div className="flex gap-2">
                     <textarea rows={2} className="flex-1 bg-white/80 border border-blue-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 custom-scrollbar shadow-inner" placeholder="Misal: Buatkan surat undangan wali murid untuk rapat komite..." value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}/>
                     <button type="button" onClick={generateDraftAI} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition shadow-md w-32 flex flex-col items-center justify-center gap-1 text-xs">{isGenerating?<Loader2 className="animate-spin" size={20}/>:<Sparkles size={20}/>} {isGenerating?'Memproses...':'Generate AI'}</button>
                  </div>
               </div>
               <div><label className="text-xs font-bold text-gray-700 mb-2 block">Draf Isi Surat (Selesai Diedit/Diisi AI)</label>
                  <textarea rows={6} className="w-full bg-white/80 border border-white p-3 rounded-xl text-sm outline-none focus:ring-2 shadow-inner custom-scrollbar" placeholder="Isi paragraf penuh surat akan tampil di sini..." value={outForm.draft} onChange={e=>setOutForm({...outForm, draft:e.target.value})}/>
               </div>
               
               <button type="button" onClick={saveKeluar} className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold p-3 rounded-xl shadow-md text-sm">Simpan Surat ke Arsip DB</button>
             </form>
             
             {/* PREVIEW KANAN */}
             <div className="flex flex-col">
               <div className="flex gap-3 mb-4 print:hidden justify-end">
                 <button type="button" onClick={()=>exportToWord('surat-export-area', `Surat_${outForm.noSurat?.split('/').join('_') || 'Draft'}`)} className="bg-white/80 hover:bg-white text-blue-800 font-bold p-2.5 px-4 rounded-xl transition flex items-center gap-2 text-sm shadow-sm border border-blue-200"><Download size={16}/> Word (.doc)</button>
                 <button type="button" onClick={()=>exportToPDF('surat-export-area', `Surat_${outForm.noSurat?.split('/').join('_') || 'Draft'}`, db.showToast)} className="bg-white/80 hover:bg-white text-red-800 font-bold p-2.5 px-4 rounded-xl transition flex items-center gap-2 text-sm shadow-sm border border-red-200"><Download size={16}/> Unduh PDF</button>
                 <button type="button" onClick={()=>{window.focus(); window.print();}} className="bg-white/80 hover:bg-white text-gray-800 font-bold p-2.5 px-4 rounded-xl transition flex items-center gap-2 text-sm shadow-sm border border-gray-200"><Printer size={16}/> Cetak</button>
               </div>
               
               <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 p-8 overflow-y-auto custom-scrollbar relative print:fixed print:top-0 print:left-0 print:w-full print:border-none print:shadow-none print:z-50 print:p-10 z-10" id="surat-export-area">
                 <div className="text-center mb-6 border-b-[3px] border-black pb-4">
                   <p className="font-bold uppercase text-sm tracking-wide leading-tight">{db.konfigurasi.pemkab}<br/>{db.konfigurasi.dinas}</p>
                   <h4 className="font-extrabold text-2xl uppercase mt-2 mb-1 tracking-widest text-black">{db.konfigurasi.namaSekolah}</h4>
                   <p className="text-xs font-medium">{db.konfigurasi.alamat}</p>
                   <p className="text-[11px] mt-1">Email: {db.konfigurasi.email} | NSS: {db.konfigurasi.nss} | NPSN: {db.konfigurasi.npsn}</p>
                 </div>
                 <div className="text-sm text-black font-serif leading-relaxed">
                   <div className="flex justify-between mb-5">
                     <table className="border-none"><tbody>
                       <tr><td className="py-0.5 align-top">Nomor</td><td className="py-0.5 px-2 align-top">:</td><td className="py-0.5 align-top">{outForm.noSurat || '............./............./........'}</td></tr>
                       <tr><td className="py-0.5 align-top">Perihal</td><td className="py-0.5 px-2 align-top">:</td><td className="py-0.5 align-top font-bold">{outForm.perihalSurat || '........................'}</td></tr>
                     </tbody></table>
                     <div className="text-right"><p>Sukomulyo, {outForm.tanggalBuat ? new Date(outForm.tanggalBuat).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '........................'}</p></div>
                   </div>
                   <div className="mb-6 leading-normal">
                     <p>Kepala Sekolah,<br/><span className="font-bold">{outForm.kepada || '........................'}</span><br/>Di tempat.</p>
                   </div>
                   
                   <div className="text-justify whitespace-pre-wrap leading-loose mb-4">
                     {outForm.draft || <span className="text-gray-400 italic">Draf isi surat akan tampil di sini. Gunakan form di samping atau minta bantuan AI. Detail kegiatan sudah terintegrasi secara otomatis.</span>}
                   </div>
                   
                   <div className="flex justify-end mt-12">
                     <div className="text-center">
                       <p>Kepala Sekolah,</p>
                       <br/><br/><br/><br/>
                       <p className="font-bold underline text-black">{db.konfigurasi.kepsek}</p>
                       <p className="text-xs">NIP. {db.konfigurasi.nipKepsek}</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

function AbsenGuru({ db, user }: any) {
  const [tanggalAbsen, setTanggalAbsen] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Hadir');

  const handleAbsen = async (e: any) => {
    e.preventDefault();
    const alreadyExists = db.absenGuru.some((a: any) => String(a.userId) === String(user.id) && a.date === tanggalAbsen);
    if (alreadyExists) {
      db.showToast(`Anda sudah melakukan presensi pada tanggal ${tanggalAbsen}! Presensi hanya diperbolehkan 1 kali per hari.`, 'error');
      return;
    }
    try {
      await db.setAbsenGuru((prev: any[]) => [...prev, { id: Date.now().toString(), userId: user.id, name: user.name, nip: user.nip, date: tanggalAbsen, status }]);
      db.showToast("Presensi guru berhasil disimpan!");
    } catch (error) {
      console.error(error);
      db.showToast('Presensi guru gagal disimpan ke Firebase.', 'error');
    }
  };

  const myAbsen = db.absenGuru.filter((a: any) => String(a.userId) === String(user.id));
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <GlassPanel className="w-full md:w-1/3">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><CalendarCheck size={20}/> Form Presensi Guru</h3>
          <form onSubmit={handleAbsen} className="space-y-4">
            <div className="p-3 bg-white/60 rounded-xl border border-white text-sm shadow-inner"><span className="font-bold text-gray-700 block text-xs">NIP Pengguna</span> {user.nip}</div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Pilih Tanggal Presensi</label>
              <input type="date" className="w-full bg-white/70 border border-white text-gray-800 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-bold" value={tanggalAbsen} onChange={e => setTanggalAbsen(e.target.value)} required />
            </div>
            <div><label className="text-xs font-bold text-gray-700 mb-1 block">Status Kehadiran</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={status} onChange={e=>setStatus(e.target.value)}><option>Hadir</option><option>Izin</option><option>Sakit</option></select></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold py-3 rounded-xl mt-2 shadow-md border border-blue-500">Simpan Absensi</button>
          </form>
        </GlassPanel>
        <GlassPanel className="w-full md:w-2/3">
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-800">Riwayat Kehadiran Saya</h4></div>
          <div className="overflow-hidden bg-white/50 border border-white rounded-xl shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-white/70 sticky top-0 backdrop-blur-md border-b border-white"><tr className="text-gray-700"><th className="p-3 font-bold">Tanggal</th><th className="p-3 font-bold">Status</th></tr></thead>
              <tbody>
                {myAbsen.map((a: any) => <tr key={a.id} className="border-b border-white/50 hover:bg-white/70 transition"><td className="p-3 text-gray-800 font-semibold">{a.date}</td><td className="p-3"><span className={`px-3 py-1 rounded-md text-xs font-bold border ${a.status==='Hadir'?'bg-green-100 text-green-700 border-green-200':a.status==='Izin'?'bg-yellow-100 text-yellow-700 border-yellow-200':'bg-red-100 text-red-700 border-red-200'}`}>{a.status}</span></td></tr>)}
                {myAbsen.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-gray-500 font-medium italic">Belum ada riwayat presensi.</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function AbsenSiswa({ db, user }: any) {
  const lockedClass = user.role.startsWith('guru_kelas_') ? user.role.replace('guru_kelas_', '') : '1';
  const [selectedKelas, setSelectedKelas] = useState(lockedClass);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const studentsInClass = db.students.filter((s: any) => s.kelas === selectedKelas);
  
  const saveAbsen = async (studentId: any, status: string) => {
    try {
      await db.setAbsenSiswa((prev: any[]) => {
        const existingIndex = prev.findIndex((a: any) => String(a.studentId) === String(studentId) && a.date === tanggal);
        const updated = [...prev];
        if (existingIndex > -1) {
          updated[existingIndex] = { ...updated[existingIndex], status, kelas: selectedKelas };
        } else {
          updated.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, studentId: String(studentId), date: tanggal, status, kelas: selectedKelas });
        }
        return updated;
      });
      db.showToast("Absen berhasil tersimpan ke Firebase.", "success");
    } catch (error) {
      console.error(error);
      db.showToast("Absen gagal disimpan ke Firebase. Periksa koneksi internet.", "error");
    }
  };
    const getStatus = (id: any) => db.absenSiswa.find((a: any) => String(a.studentId) === String(id) && a.date === tanggal)?.status || '';
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <GlassPanel className="flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="flex gap-4 w-full md:w-auto">
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelas</label><select className="bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-32 shadow-inner" value={selectedKelas} onChange={e=>setSelectedKelas(e.target.value)} disabled={user.role.startsWith('guru_kelas_')}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Tanggal</label><input type="date" className="bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={tanggal} onChange={e=>setTanggal(e.target.value)} /></div>
        </div>
      </GlassPanel>
      <GlassPanel className="overflow-x-auto">
        <h4 className="font-bold mb-4 text-gray-800 text-lg">Input & Preview Absensi Siswa</h4>
        <table className="w-full text-left border-collapse bg-white/50 shadow-inner rounded-xl overflow-hidden">
          <thead className="bg-white/70 border-b border-white backdrop-blur-md">
  <tr className="text-gray-800 text-sm">
    <th className="p-4 font-bold">Nama Siswa</th>
    <th className="p-4 font-bold text-center w-20">Hadir</th>
    <th className="p-4 font-bold text-center w-20">Izin</th>
    <th className="p-4 font-bold text-center w-20">Sakit</th>
    <th className="p-4 font-bold text-center w-20">Alpa</th>
    <th className="p-4 font-bold text-center w-28 border-l border-white/50">Status Hari Ini</th>
    <th className="p-4 font-bold text-center w-24 border-l border-white/50">Aksi</th>
  </tr>
</thead>
          <tbody>
  {studentsInClass.map((s: any) => {
    const stat = getStatus(s.id);

    // Fungsi untuk menghapus absensi siswa spesifik pada tanggal aktif
    const deleteAbsen = async () => {
      try {
        await db.setAbsenSiswa((prev: any[]) => prev.filter(
          (a: any) => !(String(a.studentId) === String(s.id) && a.date === tanggal)
        ));
        db.showToast(`Absensi ${s.name} tanggal ${tanggal} berhasil dihapus.`, 'success');
      } catch (error) {
        console.error(error);
        db.showToast('Absensi gagal dihapus dari Firebase.', 'error');
      }
    };

    return (
      <tr key={s.id} className="border-b border-white/50 hover:bg-white/70 transition text-sm">
        <td className="p-4 font-semibold text-gray-800">{s.name}</td>
        
        {['Hadir', 'Izin', 'Sakit', 'Alpa'].map(t => (
          <td key={t} className="p-4 text-center">
            <input 
              type="radio" 
              name={`absen_${s.id}_${tanggal}`}
              checked={stat === t} 
              onChange={() => saveAbsen(s.id, t)} 
              className="w-4 h-4 text-blue-600 cursor-pointer accent-blue-600"
            />
          </td>
        ))}

        <td className="p-4 text-center border-l border-white/50">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block w-full ${
            stat==='Hadir'?'bg-green-100 text-green-700 border-green-200':
            stat==='Izin'?'bg-yellow-100 text-yellow-700 border-yellow-200':
            stat==='Sakit'?'bg-blue-100 text-blue-700 border-blue-200':
            stat==='Alpa'?'bg-red-100 text-red-700 border-red-200':
            'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {stat || 'Belum Diisi'}
          </span>
        </td>

        {/* Kolom Tombol Hapus */}
        <td className="p-4 text-center border-l border-white/50">
          {stat ? (
            <button
              type="button"
              onClick={deleteAbsen}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
              title="Hapus Presensi Hari Ini"
            >
              <Trash2 size={14} /> Hapus
            </button>
          ) : (
            <span className="text-gray-400 text-xs italic">-</span>
          )}
        </td>
      </tr>
    );
  })}
  {studentsInClass.length === 0 && (
    <tr>
      <td colSpan={7} className="p-8 text-center text-gray-500 italic font-medium">
        Tidak ada siswa di kelas ini.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

function JurnalHarian({ db, user }: any) {
  const lockedClass = user.role.startsWith('guru_kelas_') ? user.role.replace('guru_kelas_', '') : '1';
  const [form, setForm] = useState({ id: '', semester: '1', kelas: lockedClass, mapel: getAvailableMapel(user.role)[0] || '', tanggal: new Date().toISOString().split('T')[0], tp: '', materi: '', uraian: '', temaProyek: '', namaProyek: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isKoku = form.mapel === 'Kokurikuler';
  const isBta = form.mapel === 'BTA';
  const isEkstraOther = ['Pramuka', 'TIK', 'Futsal', 'Ekstrakurikuler'].includes(form.mapel); 
  const isAnyEkstra = isBta || isEkstraOther;
  
  const saveJurnal = async (e: any) => {
    e.preventDefault();
    try {
      await db.setJurnals((prev: any[]) => isEdit
        ? prev.map((j: any) => String(j.id) === String(form.id) ? {...form, userId:user.id} : j)
        : [...prev, { ...form, userId: user.id, id: Date.now().toString() }]
      );
      setForm({...form, id:'', tp:'', materi:'', uraian:'', temaProyek:'', namaProyek:''}); setIsEdit(false);
      db.showToast("Jurnal berhasil disimpan ke Firebase!");
    } catch (error) {
      console.error(error);
      db.showToast("Jurnal gagal disimpan ke Firebase.", 'error');
    }
  };
  
  const generateJurnalAI = async () => {
    const topik = form.materi;
    if (!topik) {
       db.showToast("Silakan isi Materi Pokok terlebih dahulu untuk menggunakan AI.", "error");
       return;
    }
    setIsGenerating(true); db.showToast("AI Gemini sedang menyusun jurnal...   ✨  ", "success");
    try {
      const promptText = `Buatkan formulasi jurnal mengajar guru SD. Mapel: ${form.mapel}, Kelas: ${form.kelas}. Topik: ${topik}. Buat ringkas format JSON: {"tp":"tujuan belajar","materi":"materi pokok","uraian":"uraian kbm paragraf"}`;
      const data = await callGeminiAPI({contents:[{parts:[{text:promptText}]}], generationConfig:{responseMimeType:"application/json", responseSchema:{type:"OBJECT", properties:{tp:{type:"STRING"},materi:{type:"STRING"},uraian:{type:"STRING"}}}}});
      if(data.candidates?.[0]?.content?.parts?.[0]?.text) {
         const res = JSON.parse(data.candidates[0].content.parts[0].text);
         setForm((prev: any) => ({...prev, tp: res.tp || prev.tp, materi: res.materi || prev.materi, uraian: res.uraian || prev.uraian}));
         db.showToast("Jurnal berhasil disusun AI!", "success");
      }
    } catch (error) { db.showToast("Gagal menghubungi AI.", "error"); } finally { setIsGenerating(false); }
  };
  
  const generateUraianAIOnly = async () => {
     if(!form.tp && !form.temaProyek && !isAnyEkstra) return db.showToast("Isi TP/Tema terlebih dahulu agar AI paham konteksnya.", "error");
     setIsGenerating(true); db.showToast("AI sedang menyusun Uraian KBM...   ✨  ", "success");
     try {
       const ctx = isKoku ? `Tema: ${form.temaProyek}, Proyek: ${form.namaProyek}` : `TP: ${form.tp}, Mapel: ${form.mapel}`;
       const promptText = `Buatkan paragraf Uraian/Catatan Kegiatan Belajar Mengajar (KBM) untuk guru SD kelas ${form.kelas} Mapel ${form.mapel}. Konteks: ${ctx}. Deskripsikan kegiatan pendahuluan, inti, dan penutup secara ringkas dan menarik dalam 1 paragraf saja.`;
       const data = await callGeminiAPI({contents:[{parts:[{text:promptText}]}]});
       const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
       if(result) { setForm((prev: any) => ({...prev, uraian: result.trim()})); db.showToast("Uraian KBM terisi otomatis!", "success"); }
     } catch(e) { db.showToast("Gagal Generate Uraian", "error"); } finally { setIsGenerating(false); }
  }
  
  const myJurnals = db.jurnals.filter((j: any) => String(j.userId) === String(user.id));
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <GlassPanel>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b border-white/40 pb-3 gap-3">
           <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800"><FileText size={22} className="text-blue-600"/> {isEdit?'Edit Dokumen Jurnal':'Input Jurnal Mengajar'}</h3>
           {!isKoku && !isEkstraOther && (
              <button type="button" onClick={generateJurnalAI} disabled={isGenerating} className="text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl transition-all shadow-md transform hover:scale-105 border border-purple-400">
                 {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} {isGenerating ? 'AI Memproses...' : 'Auto-Generate Semua via AI'}
              </button>
           )}
        </div>
        <form onSubmit={saveJurnal} className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Semester</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.semester} onChange={e=>setForm({...form, semester:e.target.value})}>{SEMESTER_OPTIONS.map(s => <option key={s.val} value={s.val}>Semester {s.label}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Kelas Target</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.kelas} onChange={e=>setForm({...form, kelas:e.target.value})} disabled={user.role.startsWith('guru_kelas_')}>{KELAS_OPTIONS.map(k => <option key={k} value={k}>Kelas {k}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Mata Pelajaran</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.mapel} onChange={e=>setForm({...form, mapel:e.target.value})} required>{getAvailableMapel(user.role).map((m: any) => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Tanggal KBM</label><input type="date" className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.tanggal} onChange={e=>setForm({...form, tanggal:e.target.value})} required/></div>
          
          {!isKoku && !isEkstraOther && (
            <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-700 mb-1">Tujuan Pembelajaran (TP)</label><input type="text" className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="Misal: Peserta didik mampu mengidentifikasi bangun ruang..." value={form.tp} onChange={e=>setForm({...form, tp:e.target.value})} required={!isGenerating}/></div>
          )}
          {!isKoku && !isAnyEkstra && (
            <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-700 mb-1">Materi Pokok</label><input type="text" className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="Isi untuk di-generate otomatis oleh AI..." value={form.materi} onChange={e=>setForm({...form, materi:e.target.value})} required={!isGenerating}/></div>
          )}
          {isKoku && (
            <><div className="md:col-span-4"><label className="block text-xs font-bold text-gray-700 mb-1">Tema Proyek Kokurikuler</label><input type="text" className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.temaProyek} onChange={e=>setForm({...form, temaProyek:e.target.value})} required/></div>
              <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-700 mb-1">Nama Spesifik Proyek</label><input type="text" className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={form.namaProyek} onChange={e=>setForm({...form, namaProyek:e.target.value})} required/></div></>
          )}
          <div className="md:col-span-4 relative">
             <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-bold text-gray-700">Uraian / Catatan KBM</label>
                <button type="button" onClick={generateUraianAIOnly} disabled={isGenerating} className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 hover:bg-indigo-200 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1 transition-colors shadow-sm"><Sparkles size={12}/> AI Susun Uraian</button>
             </div>
             <textarea className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] shadow-inner leading-relaxed custom-scrollbar" value={form.uraian} onChange={e=>setForm({...form, uraian:e.target.value})} required={!isGenerating} placeholder="Ketik manual atau klik tombol AI di atas..."></textarea>
          </div>
          <div className="md:col-span-4 flex justify-end mt-4 border-t border-gray-200/50 pt-4">
             {isEdit && <button type="button" onClick={() => {setIsEdit(false); setForm({id:'', semester: '1', kelas:lockedClass, mapel:'', tanggal:'', tp:'', materi:'', uraian:'', temaProyek:'', namaProyek:''})}} className="mr-3 px-6 py-2.5 bg-white/60 hover:bg-white text-gray-700 rounded-xl font-bold shadow-sm border border-gray-200 transition">Batal Edit</button>}
             <button type="submit" className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition border border-blue-500">{isEdit?'Simpan Pembaruan':'Simpan Jurnal'}</button>
          </div>
        </form>
      </GlassPanel>
      <GlassPanel className="overflow-x-auto">
        <div className="flex justify-between items-center mb-5"><h4 className="font-bold text-gray-800 text-lg">Arsip Jurnal Saya</h4></div>
        <div className="bg-white/50 border border-white rounded-xl shadow-inner overflow-hidden">
           
           <div className="hidden md:block overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse text-sm">
               <thead className="bg-white/70 border-b border-white sticky top-0 backdrop-blur-md"><tr className="text-gray-800"><th className="p-3 font-bold whitespace-nowrap">Tgl</th><th className="p-3 font-bold text-center whitespace-nowrap">Smt</th><th className="p-3 font-bold text-center whitespace-nowrap">Kls</th><th className="p-3 font-bold whitespace-nowrap">Mapel</th><th className="p-3 font-bold w-1/4">TP / Tema</th><th className="p-3 font-bold w-1/3">Uraian KBM</th><th className="p-3 font-bold text-center whitespace-nowrap">Aksi</th></tr></thead>
               <tbody>{myJurnals.map((j: any)=><tr key={j.id} className="border-b border-white/40 hover:bg-white/70 transition">
                 <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{j.tanggal}</td>
                 <td className="p-3 text-center font-bold text-blue-700 whitespace-nowrap">{j.semester || '1'}</td>
                 <td className="p-3 text-center whitespace-nowrap">{j.kelas}</td>
                 <td className="p-3 font-bold text-blue-800 whitespace-nowrap">{j.mapel}</td>
                 <td className="p-3 text-gray-700 whitespace-normal" title={j.mapel==='Kokurikuler'?j.temaProyek:j.tp}>{j.mapel==='Kokurikuler'?j.temaProyek:(j.tp || '-')}</td>
                 <td className="p-3 text-gray-600 italic whitespace-normal" title={j.uraian}>{j.uraian}</td>
                 <td className="p-3 flex flex-col xl:flex-row gap-2 justify-center items-center whitespace-nowrap">
                   <button onClick={()=>{setForm({semester: '1', ...j}); setIsEdit(true); window.scrollTo({top: 0, behavior: 'smooth'});}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition shadow-sm border border-blue-200">
                     <Edit size={14}/> Edit
                   </button>
                   <button onClick={async ()=>{if(window.confirm('Yakin ingin menghapus jurnal ini?')) { try { await db.setJurnals(db.jurnals.filter((x: any)=>String(x.id)!==String(j.id))); db.showToast('Jurnal dihapus.'); } catch (error) { console.error(error); db.showToast('Jurnal gagal dihapus dari Firebase.', 'error'); } }}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition shadow-sm border border-red-200">
                     <Trash2 size={14}/> Hapus
                   </button>
                 </td>
               </tr>)}
               {myJurnals.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic font-medium">Arsip jurnal kosong.</td></tr>}
               </tbody>
             </table>
           </div>

           <div className="md:hidden flex flex-col gap-3 p-3">
             {myJurnals.map((j: any) => (
                <div key={j.id} className="bg-white/80 p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col gap-2 relative">
                   <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div className="font-bold text-blue-800 text-base">{j.mapel} <div className="text-gray-500 text-xs font-semibold mt-0.5">Kelas {j.kelas} • Smt {j.semester||'1'}</div></div>
                      <div className="text-xs font-bold text-blue-900 bg-blue-100/50 px-2 py-1 rounded-md border border-blue-100">{j.tanggal}</div>
                   </div>
                   <div className="text-sm mt-1">
                      <div className="font-bold text-gray-700 text-xs uppercase mb-0.5">TP / Tema Proyek: </div>
                      <div className="text-gray-700 font-medium">{j.mapel==='Kokurikuler'?j.temaProyek:(j.tp || '-')}</div>
                   </div>
                   <div className="text-sm mt-1 bg-white/50 p-2 rounded-lg border border-gray-50">
                      <div className="font-bold text-gray-700 text-xs uppercase mb-0.5">Uraian KBM: </div>
                      <div className="text-gray-600 italic text-xs leading-relaxed">{j.uraian}</div>
                   </div>
                   <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-gray-100">
                      <button onClick={()=>{setForm({semester: '1', ...j}); setIsEdit(true); window.scrollTo({top: 0, behavior: 'smooth'});}} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition shadow-sm border border-blue-200"><Edit size={14}/> Edit</button>
                      <button onClick={async ()=>{if(window.confirm('Yakin ingin menghapus jurnal ini?')) { try { await db.setJurnals(db.jurnals.filter((x: any)=>String(x.id)!==String(j.id))); db.showToast('Jurnal dihapus.'); } catch (error) { console.error(error); db.showToast('Jurnal gagal dihapus dari Firebase.', 'error'); } }}} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition shadow-sm border border-red-200"><Trash2 size={14}/> Hapus</button>
                   </div>
                </div>
             ))}
             {myJurnals.length === 0 && <div className="p-6 text-center text-gray-500 italic font-medium">Arsip jurnal kosong.</div>}
           </div>

        </div>
      </GlassPanel>
    </div>
  );
}

function InputNilai({ db, user }: any) {
  const lockedClass = user.role.startsWith('guru_kelas_') ? user.role.replace('guru_kelas_', '') : '1';
  const [filter, setFilter] = useState({ semester: '1', kelas: lockedClass, mapel: getAvailableMapel(user.role)[0] || '', kategoriSumatif: 'Asesmen Sumatif Harian - ASH', tp: '', materi: '', temaProyek: '', namaProyek: '' });
  
  const isKoku = filter.mapel === 'Kokurikuler';
  const isBta = filter.mapel === 'BTA';
  const isEkstraOther = ['Pramuka', 'TIK', 'Futsal', 'Ekstrakurikuler'].includes(filter.mapel); 
  const isAnyEkstra = isBta || isEkstraOther;
  
  const relevantJurnals = db.jurnals.filter((j: any) => String(j.userId) === String(user.id) && j.kelas === filter.kelas && j.mapel === filter.mapel && (j.semester || '1') === filter.semester);
  const tpOptions = [...new Set(relevantJurnals.map((j: any) => j.tp).filter(Boolean))];
  
  const isASLM = filter.kategoriSumatif === 'Asesmen Sumatif Lingkup Materi - ASLM';
  const materiOptions = isASLM ? [...new Set(relevantJurnals.map((j: any) => j.materi).filter(Boolean))] : [...new Set(relevantJurnals.filter((j: any) => j.tp === filter.tp).map((j: any) => j.materi).filter(Boolean))];
  
  const proyekOptions = relevantJurnals.filter((j: any) => j.mapel === 'Kokurikuler');
  
  const [selectedDimensi, setSelectedDimensi] = useState<string[]>([]);
  const handleDimensiToggle = (d: string) => setSelectedDimensi(prev => prev.includes(d) ? prev.filter(x=>x!==d) : (prev.length < 3 ? [...prev, d] : prev));
  const studentsInClass = db.students.filter((s: any) => s.kelas === filter.kelas);
  
  const [localGrades, setLocalGrades] = useState<any>({}); 
  const handleGradeChange = (id: any, field: string, val: any) => setLocalGrades((p: any) => {
     const std = p[id] || {};
     return {...p, [id]: {...std, [field]: val}};
  });
  
  const handleHafalanChange = (sId: any, index: number, field: string, val: any) => {
    setLocalGrades((p: any) => {
        const std = p[sId] || {};
        const rawHafalan = std.hafalan || [{surah:'', predikat:''}];
        const current = Array.isArray(rawHafalan) ? rawHafalan.map(h => typeof h === 'string' ? {surah: h, predikat: ''} : (h || {surah:'', predikat:''})) : [{surah:'', predikat:''}];
        const next = [...current];
        if(!next[index]) next[index] = {surah:'', predikat:''};
        next[index] = { ...next[index], [field]: val };
        return {...p, [sId]: {...std, hafalan: next}};
    });
  };
  
  const addHafalan = (sId: any) => {
      setLocalGrades((p: any) => {
          const std = p[sId] || {};
          const rawHafalan = std.hafalan || [{surah:'', predikat:''}];
          const current = Array.isArray(rawHafalan) ? rawHafalan.map(h => typeof h === 'string' ? {surah: h, predikat: ''} : (h || {surah:'', predikat:''})) : [{surah:'', predikat:''}];
          return {...p, [sId]: {...std, hafalan: [...current, {surah:'', predikat:''}]}};
      });
  };
  
  const removeHafalan = (sId: any, index: number) => {
      setLocalGrades((p: any) => {
          const std = p[sId] || {};
          const rawHafalan = std.hafalan || [{surah:'', predikat:''}];
          const current = Array.isArray(rawHafalan) ? rawHafalan.map(h => typeof h === 'string' ? {surah: h, predikat: ''} : (h || {surah:'', predikat:''})) : [{surah:'', predikat:''}];
          const next = [...current];
          next.splice(index, 1);
          return {...p, [sId]: {...std, hafalan: next}};
      });
  }
  
  const saveGrades = async () => {
    const newGrades = Object.keys(localGrades).map(sId => ({
      id: Date.now().toString() + Math.random().toString(),
      userId: user.id,
      studentId: String(sId),
      semester: filter.semester,
      mapel: filter.mapel,
      kelas: filter.kelas,
      tp: filter.tp,
      materi: filter.materi,
      kategoriSumatif: filter.kategoriSumatif,
      temaProyek: filter.temaProyek,
      namaProyek: filter.namaProyek,
      data: localGrades[sId]
    }));

    try {
      await db.setNilais((prev: any[]) => {
        const toKeep = prev.filter((n: any) => {
          const isSameUser = String(n.userId) === String(user.id);
          const isSameKelas = n.kelas === filter.kelas;
          const isSameSemester = (n.semester || '1') === filter.semester;
          const isSameMapel = n.mapel === filter.mapel;
          const isSameKategori = n.kategoriSumatif === filter.kategoriSumatif;
          let isSameTpOrProyek = false;
          if (isKoku) isSameTpOrProyek = n.temaProyek === filter.temaProyek && n.namaProyek === filter.namaProyek;
          else if (isAnyEkstra) isSameTpOrProyek = true;
          else if (filter.kategoriSumatif === 'Assessment Sumatif Tengah Semester - ASTS' || filter.kategoriSumatif === 'Asesmen Sumatif Akhir Semester - ASAS') isSameTpOrProyek = true;
          else if (isASLM) isSameTpOrProyek = n.tp === filter.tp;
          else isSameTpOrProyek = n.tp === filter.tp;
          return !(isSameUser && isSameKelas && isSameSemester && isSameMapel && isSameKategori && isSameTpOrProyek);
        });
        return [...toKeep, ...newGrades];
      });
      db.showToast("Nilai berhasil disimpan ke Firebase!", 'success');
      setLocalGrades({});
    } catch (error) {
      console.error(error);
      db.showToast("Nilai gagal disimpan ke Firebase. Periksa koneksi internet.", 'error');
    }
  };

  const isASH = filter.kategoriSumatif === 'Asesmen Sumatif Harian - ASH';
// Tampilkan TP jika kategori ASH maupun ASLM
const showTp = (isASH || isASLM) && !isKoku && !isAnyEkstra;
// Tampilkan Materi HANYA untuk ASH
const showMateri = isASH && !isKoku && !isAnyEkstra;
  
  const currentSavedGrades = db.nilais.filter((n: any) => {
     const matchUser = String(n.userId) === String(user.id);
     const matchKelas = n.kelas === filter.kelas;
     const matchMapel = n.mapel === filter.mapel;
     const matchSemester = (n.semester || '1') === filter.semester;
     
     return matchUser && matchKelas && matchMapel && matchSemester;
  });
  
  return (
    <div className="space-y-6 max-w-full mx-auto">
      <GlassPanel>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800"><ClipboardList size={22} className="text-blue-600"/> Konfigurasi Penilaian</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Semester</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.semester} onChange={e=>setFilter({...filter, semester:e.target.value, tp:'', materi:''})}>{SEMESTER_OPTIONS.map(s=><option key={s.val} value={s.val}>Semester {s.label}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Kelas</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.kelas} onChange={e=>setFilter({...filter, kelas:e.target.value, tp:'', materi:''})} disabled={user.role.startsWith('guru_kelas_')}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Mata Pelajaran</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.mapel} onChange={e=>setFilter({...filter, mapel:e.target.value, tp:'', materi:''})}>{getAvailableMapel(user.role).map((m: any)=><option key={m} value={m}>{m}</option>)}</select></div>
          
          {!isKoku && !isAnyEkstra && (
            <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Kategori Sumatif</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.kategoriSumatif} onChange={e=>setFilter({...filter, kategoriSumatif:e.target.value, tp:'', materi:''})}><option>Asesmen Sumatif Harian - ASH</option><option>Asesmen Sumatif Lingkup Materi - ASLM</option><option>Assessment Sumatif Tengah Semester - ASTS</option><option>Asesmen Sumatif Akhir Semester - ASAS</option></select></div>
          )}
          {showTp && (
            <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Pilih TP (Otomatis dari Jurnal)</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.tp} onChange={e=>setFilter({...filter, tp:e.target.value})}><option value="">-- Pilih TP --</option>{tpOptions.map((tp: any)=><option key={tp} value={tp}>{tp}</option>)}</select></div>
          )}
          {showMateri && (
            <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Materi/Bab (Otomatis dari Jurnal)</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={filter.materi} onChange={e=>setFilter({...filter, materi:e.target.value})}><option value="">-- Pilih Materi --</option>{materiOptions.map((m: any)=><option key={m} value={m}>{m}</option>)}</select></div>
          )}
          {isKoku && (
            <><div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Proyek (Dari Jurnal)</label><select className="w-full bg-white/70 border border-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" onChange={e=>{const [t,n]=e.target.value.split('||'); setFilter({...filter, temaProyek:t, namaProyek:n})}}><option value="||">-- Pilih Proyek --</option>{proyekOptions.map((p: any)=><option key={p.id} value={`${p.temaProyek}||${p.namaProyek}`}>{p.temaProyek} - {p.namaProyek}</option>)}</select></div>
              <div className="md:col-span-4 bg-white/50 border border-white p-4 rounded-xl text-sm shadow-inner"><label className="font-bold text-blue-900 mb-3 block border-b border-white/50 pb-2">Pilih Dimensi Profil Pelajar Pancasila (Maksimal 3)</label><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">{DIMENSI_PROFIL.map(d=><label key={d} className="flex items-start space-x-2 text-xs font-bold text-gray-700 cursor-pointer bg-white/40 p-2 rounded-lg border border-white/60 hover:bg-white/60 transition"><input type="checkbox" className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 w-4 h-4" checked={selectedDimensi.includes(d)} onChange={()=>handleDimensiToggle(d)} disabled={!selectedDimensi.includes(d) && selectedDimensi.length>=3}/><span className="leading-tight">{d}</span></label>)}</div></div></>
          )}
        </div>
      </GlassPanel>
      <GlassPanel className="overflow-x-auto">
        <h4 className="font-bold text-gray-800 mb-4 text-lg">Form Input Nilai Siswa</h4>
        
        {(!isKoku && showTp && !filter.tp && !isAnyEkstra) ? (
    <div className="p-8 text-center bg-white/50 rounded-xl text-gray-600 italic font-medium border border-white shadow-inner">Silakan konfigurasikan form atau pilih TP terlebih dahulu di panel atas.</div>
) : (
        <>
        {!isKoku && !isEkstraOther && (
          <div className="bg-white/50 border border-white rounded-xl shadow-inner overflow-hidden max-w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="bg-white/70 border-b border-white backdrop-blur-md">
                <tr className="text-gray-800">
                <th className="p-3 font-bold w-10 text-center">No</th>
                <th className="p-3 font-bold">Nama Siswa</th>
                {!isBta && <th className="p-3 font-bold">Nilai Akademik (0-100)</th>}
                {isBta && <><th className="p-3 font-bold text-center border-l border-white/50 bg-blue-50/40">Nilai Baca</th><th className="p-3 font-bold text-xs text-gray-500 w-40 bg-blue-50/40">Kriteria Baca</th><th className="p-3 font-bold text-center border-l border-white/50 bg-green-50/40">Nilai Tulis</th><th className="p-3 font-bold text-xs text-gray-500 w-40 bg-green-50/40">Kriteria Tulis</th><th className="p-3 font-bold border-l border-white/50 bg-purple-50/40">Penilaian Hafalan Surat Pendek</th></>}
              </tr></thead>
              <tbody>
                {studentsInClass.map((s: any, idx: number) => {
                  const btaBacaDetail = isBta ? getBtaDetail(localGrades[s.id]?.baca) : {p:'', d:''};
                  const btaTulisDetail = isBta ? getBtaDetail(localGrades[s.id]?.tulis) : {p:'', d:''};
                  
                  const rawHaf = localGrades[s.id]?.hafalan;
                  let hafalanArr = [{surah:'', predikat:''}];
                  if (Array.isArray(rawHaf) && rawHaf.length > 0) {
                     hafalanArr = rawHaf.map(h => typeof h === 'string' ? {surah: h, predikat: ''} : (h || {surah:'', predikat:''}));
                  }
                  
                  return(
                    <tr key={s.id} className="border-b border-white/40 hover:bg-white/60 transition">
                      <td className="p-3 text-center text-gray-600 font-medium">{idx+1}</td>
                      <td className="p-3 font-bold text-gray-800">{s.name}</td>
                      {!isBta && <td className="p-3"><input type="number" min="0" max="100" className="w-24 bg-white/80 border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-blue-700 shadow-inner" value={localGrades[s.id]?.nilai || ''} onChange={e=>handleGradeChange(s.id,'nilai',e.target.value)} placeholder="0-100"/></td>}
                      {isBta && (
                        <><td className="p-3 text-center border-l border-white/50 bg-blue-50/20"><input type="number" className="w-20 bg-white/90 border border-blue-200 p-2 rounded-xl outline-none focus:ring-2 text-center font-bold text-blue-700 shadow-inner" value={localGrades[s.id]?.baca || ''} onChange={e=>handleGradeChange(s.id,'baca',e.target.value)} placeholder="0-100"/></td><td className="text-[11px] font-semibold text-blue-800 bg-blue-50/40 p-2 w-40 whitespace-normal leading-tight">{btaBacaDetail.p}</td>
                          <td className="p-3 text-center border-l border-white/50 bg-green-50/20"><input type="number" className="w-20 bg-white/90 border border-green-200 p-2 rounded-xl outline-none focus:ring-2 text-center font-bold text-green-700 shadow-inner" value={localGrades[s.id]?.tulis || ''} onChange={e=>handleGradeChange(s.id,'tulis',e.target.value)} placeholder="0-100"/></td><td className="text-[11px] font-semibold text-green-800 bg-green-50/40 p-2 w-40 whitespace-normal leading-tight">{btaTulisDetail.p}</td>
                          <td className="p-3 border-l border-white/50 bg-purple-50/20 min-w-[300px]">
                            <div className="flex flex-col gap-2">
                              {hafalanArr.map((hafalan, i) => (
                                 <div key={i} className="flex gap-2 items-center bg-white/60 p-1.5 rounded-lg border border-purple-100 shadow-sm">
                                    <input type="text" className="flex-1 bg-white border border-purple-200 p-2 rounded-md text-xs outline-none focus:ring-1 font-semibold shadow-inner" value={hafalan.surah || ''} onChange={e=>handleHafalanChange(s.id, i, 'surah', e.target.value)} placeholder="Nama Surah"/>
                                    <select className="w-28 bg-white border border-purple-200 p-2 rounded-md text-[10px] outline-none font-bold text-purple-800 shadow-inner" value={hafalan.predikat || ''} onChange={e=>handleHafalanChange(s.id, i, 'predikat', e.target.value)}><option value="">-Predikat-</option>{HAFALAN_NILAI.map(h=><option key={h} value={h}>{h}</option>)}</select>
                                    {i > 0 && <button onClick={()=>removeHafalan(s.id, i)} className="text-red-500 font-bold px-2 py-1.5 hover:bg-red-100 rounded text-xs transition bg-white/50"><Trash2 size={14}/></button>}
                                 </div>
                              ))}
                              <button onClick={()=>addHafalan(s.id)} className="text-purple-700 bg-purple-100/80 hover:bg-purple-200 text-xs font-bold py-1.5 px-3 rounded-lg self-start mt-1 transition flex gap-1 items-center border border-purple-200 shadow-sm"><Plus size={14}/> Tambah Hafalan</button>
                            </div>
                          </td></>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* KOKURIKULER UI SEPARATION */}
        {isKoku && (
          <div className="space-y-8">
            <div className="bg-white/50 border border-white rounded-xl shadow-inner overflow-hidden max-w-full overflow-x-auto custom-scrollbar">
              <div className="bg-blue-600/90 backdrop-blur-sm text-white p-3 font-bold text-sm tracking-wide shadow-sm">1. Penilaian Dimensi Profil Lulusan</div>
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-white/70 border-b border-white backdrop-blur-md"><tr className="text-gray-800"><th className="p-3 font-bold">Nama Siswa</th>{selectedDimensi.map(d=><th key={d} className="p-3 font-bold max-w-[150px] truncate" title={d}>{d}</th>)}</tr></thead>
                <tbody>
                  {studentsInClass.map((s: any) => (
                    <tr key={s.id} className="border-b border-white/50 hover:bg-white/60"><td className="p-3 font-bold text-gray-800">{s.name}</td>
                      {selectedDimensi.map(d=> <td key={d} className="p-2"><select className="w-full bg-white/80 border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 font-semibold shadow-inner" value={localGrades[s.id]?.[d] || ''} onChange={e=>handleGradeChange(s.id,d,e.target.value)}><option value="">-Pilih Predikat-</option>{KATEGORI_NILAI.map(k=><option key={k}>{k}</option>)}</select></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white/50 border border-white rounded-xl shadow-inner overflow-hidden max-w-full overflow-x-auto custom-scrollbar">
              <div className="bg-indigo-600/90 backdrop-blur-sm text-white p-3 font-bold text-sm tracking-wide shadow-sm">2. Penilaian Aspek & Sikap Khusus</div>
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-white/70 border-b border-white backdrop-blur-md"><tr className="text-gray-800"><th className="p-3 font-bold">Nama Siswa</th><th className="p-3 font-bold">Partisipasi</th><th className="p-3 font-bold">Kerjasama</th><th className="p-3 font-bold">Tanggung Jawab</th><th className="p-3 font-bold">Kreativitas</th><th className="p-3 font-bold w-48">Sikap Khusus (Teks Uraian)</th><th className="p-3 font-bold">Predikat Sikap Khusus</th></tr></thead>
                <tbody>
                  {studentsInClass.map((s: any) => (
                    <tr key={s.id} className="border-b border-white/50 hover:bg-white/60"><td className="p-3 font-bold text-gray-800">{s.name}</td>
                      {['partisipasi','kerjasama','tanggungjawab','kreativitas'].map(a=><td key={a} className="p-2"><select className="w-full bg-white/80 border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 font-semibold shadow-inner" value={localGrades[s.id]?.[a] || ''} onChange={e=>handleGradeChange(s.id,a,e.target.value)}><option value="">-Pilih-</option>{KATEGORI_NILAI.map(k=><option key={k}>{k}</option>)}</select></td>)}
                      <td className="p-2"><input type="text" className="w-full bg-white/80 border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 shadow-inner" value={localGrades[s.id]?.sikapKhususText || ''} onChange={e=>handleGradeChange(s.id,'sikapKhususText',e.target.value)} placeholder="Uraian Manual..."/></td>
                      <td className="p-2"><select className="w-full bg-white/80 border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 font-semibold shadow-inner" value={localGrades[s.id]?.sikapKhususNilai || ''} onChange={e=>handleGradeChange(s.id,'sikapKhususNilai',e.target.value)}><option value="">-Pilih-</option>{KATEGORI_NILAI.map(k=><option key={k}>{k}</option>)}</select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* FORM NILAI EKSTRA (PRAMUKA, TIK, FUTSAL) */}
        {isEkstraOther && !isKoku && (
          <div className="bg-white/50 border border-white rounded-xl shadow-inner overflow-hidden max-w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="bg-white/70 border-b border-white backdrop-blur-md">
                <tr className="text-gray-800">
                <th className="p-3 font-bold w-10 text-center">No</th>
                <th className="p-3 font-bold">Nama Siswa</th>
                <th className="p-3 font-bold text-center">Predikat Penilaian</th>
              </tr></thead>
              <tbody>
                {studentsInClass.map((s: any, idx: number) => (
                  <tr key={s.id} className="border-b border-white/40 hover:bg-white/60 transition">
                    <td className="p-3 text-center text-gray-600 font-medium">{idx+1}</td>
                    <td className="p-3 font-bold text-gray-800">{s.name}</td>
                    <td className="p-3 text-center">
                       <select className="w-full max-w-[200px] mx-auto bg-white/80 border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-blue-700 shadow-inner cursor-pointer" value={localGrades[s.id]?.predikat || ''} onChange={e=>handleGradeChange(s.id,'predikat',e.target.value)}>
                          <option value="">- Pilih Predikat -</option>
                          {EKSTRA_NILAI.map(n=><option key={n} value={n}>{n}</option>)}
                       </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8 flex justify-end border-t border-white/50 pt-6"><button onClick={saveGrades} className="px-8 py-3 bg-green-600/90 backdrop-blur hover:bg-green-700 transition transform hover:-translate-y-0.5 text-white font-bold rounded-xl shadow-lg border border-green-500 flex items-center gap-2"><CheckSquare size={20}/> Simpan Nilai ke Database</button></div>
        </>
        )}
        {/* PREVIEW NILAI SECTION */}
        <div className="mt-12 border-t border-white/60 pt-8">
           <h4 className="font-bold text-gray-800 mb-4 text-lg">Preview Data Nilai Tersimpan (Semester {filter.semester} | Kelas {filter.kelas} | {filter.mapel})</h4>
           <div className="overflow-x-auto bg-white/40 border border-white rounded-xl shadow-inner max-h-[300px] custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                 <thead className="bg-white/60 sticky top-0 backdrop-blur-md border-b border-white"><tr className="text-gray-800">
                    <th className="p-3 font-bold">Nama Siswa</th><th className="p-3 font-bold">Sumatif / Proyek</th>
                    <th className="p-3 font-bold">Detail Nilai Direkam</th>
                    <th className="p-3 font-bold text-center">Aksi</th>
                 </tr></thead>
                 <tbody>
   {currentSavedGrades.length > 0 ? currentSavedGrades.map((ng: any, i: number) => {
      const stdName = db.students.find((x: any)=>String(x.id) === String(ng.studentId))?.name || 'Unknown';
      const rawHaf = ng.data?.hafalan || [];
      const safeHaf = Array.isArray(rawHaf) ? rawHaf.map((h: any) => typeof h === 'string' ? {surah: h, predikat: ''} : (h || {surah:'', predikat:''})) : [];
      const btaHafalanStr = safeHaf.filter((h: any)=>h.surah).map((h: any)=>`${h.surah} (${h.predikat||'-'})`).join(', ');
      
      return (
         <tr key={i} className="border-b border-white/50 hover:bg-white/60 transition">
            <td className="p-3 font-bold text-gray-800">{stdName}</td>
            <td className="p-3 font-medium text-gray-700">
               {ng.kategoriSumatif} <br/>
               <span className="text-gray-500 text-[10px] font-bold">
                  {ng.tp ? `TP: ${ng.tp}` : (ng.materi ? `Materi: ${ng.materi}` : '-')}
               </span>
            </td>
            <td className="p-3 text-gray-800">
               {isKoku && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold border border-blue-200">Dimensi/Aspek terisi.</span>}
               {isBta && <span className="font-medium bg-white/60 px-2 py-1 rounded border border-white">Baca: <b className="text-blue-700">{ng.data?.baca||'-'}</b> | Tulis: <b className="text-green-700">{ng.data?.tulis||'-'}</b> | Hafalan: <i className="text-purple-700 font-bold">{btaHafalanStr || '-'}</i></span>}
               {isEkstraOther && <span className="font-semibold text-base bg-white/60 px-3 py-1.5 rounded border border-white">Predikat: <span className="font-black text-blue-700 uppercase">{ng.data?.predikat || '-'}</span></span>}
               
               {/* RINCIAN AKADEMIK (ASH, ASLM, ASTS, ASAS) */}
               {!isKoku && !isBta && !isEkstraOther && (
                  <div className="flex flex-col gap-1 bg-white/70 p-2 rounded-lg border border-white shadow-inner">
                     <div className="text-xs">
                        <span className="font-semibold text-gray-600">Nilai Angka:</span> <span className="font-black text-blue-700 text-sm">{ng.data?.nilai ?? '-'}</span>
                     </div>
                     {ng.tp && (
                        <div className="text-[11px] text-gray-600 leading-tight">
                           <span className="font-semibold">Tujuan Pembelajaran (TP):</span> {ng.tp}
                        </div>
                     )}
                  </div>
               )}
            </td>
            <td className="p-3 text-center">
               <button onClick={async ()=>{try { await db.setNilais((prev: any[]) => prev.filter((x: any)=>String(x.id)!==String(ng.id))); db.showToast('Nilai dihapus.'); } catch (error) { console.error(error); db.showToast('Nilai gagal dihapus dari Firebase.', 'error'); }}} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition shadow-sm border border-red-200">
                  <Trash2 size={14}/> Hapus
               </button>
            </td>
         </tr>
      )
   }) : <tr><td colSpan={4} className="p-8 text-center italic text-gray-500 font-medium">Belum ada data nilai tersimpan untuk filter saat ini.</td></tr>}
</tbody>
              </table>
           </div>
        </div>
      </GlassPanel>
    </div>
  );
}

function CetakRapor({ db, user, isAdmin }: any) {
  const lockedClass = isAdmin ? '' : user.role.replace('guru_kelas_', '');
  const [jenisRapor, setJenisRapor] = useState('ASAS');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedKelas, setSelectedKelas] = useState(lockedClass || '1');
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [tempatRapor, setTempatRapor] = useState(db.konfigurasi.pemkab);
  const [tglRapor, setTglRapor] = useState(new Date().toISOString().split('T')[0]);
  
  const [catatan, setCatatan] = useState<any>({});
  const [isGeneratingCatatan, setIsGeneratingCatatan] = useState(false);
  
  const studentsInClass = db.students.filter((s: any) => s.kelas === selectedKelas);
  const currentIndex = studentsInClass.findIndex((s: any) => String(s.id) === String(selectedSiswa));
  const currentSiswa = studentsInClass[currentIndex];
  
  const stdNilai = db.nilais.filter((n: any) => String(n.studentId) === String(selectedSiswa) && (n.semester || '1') === selectedSemester);
  
  const studentAbsen = db.absenSiswa.filter((a: any) => String(a.studentId) === String(selectedSiswa));
  const countSakit = studentAbsen.filter((a: any) => a.status === 'Sakit').length;
  const countIzin = studentAbsen.filter((a: any) => a.status === 'Izin').length;
  const countAlpa = studentAbsen.filter((a: any) => a.status === 'Alpa').length;
  
  const akademikRaw = stdNilai.filter((n: any) => !['Kokurikuler', 'BTA', 'Pramuka', 'TIK', 'Futsal', 'Ekstrakurikuler'].includes(n.mapel));
  const mapelGroups: any = {};
  
  const allowedCategories = jenisRapor === 'ASLM'
    ? ['Asesmen Sumatif Lingkup Materi - ASLM']
    : jenisRapor === 'ASTS' 
    ? ['Assessment Sumatif Tengah Semester - ASTS']
    : ['Asesmen Sumatif Harian - ASH', 'Asesmen Sumatif Lingkup Materi - ASLM', 'Assessment Sumatif Tengah Semester - ASTS', 'Asesmen Sumatif Akhir Semester - ASAS'];
  
  akademikRaw.forEach((a: any) => {
      if (!allowedCategories.includes(a.kategoriSumatif)) return;
      if (!mapelGroups[a.mapel]) mapelGroups[a.mapel] = { sum: 0, count: 0, tps: new Set(), categories: new Set() };
      const nVal = parseFloat(a.data?.nilai || 0);
      if(!isNaN(nVal)) {
         mapelGroups[a.mapel].sum += nVal;
         mapelGroups[a.mapel].count += 1;
      }
      if(a.tp) mapelGroups[a.mapel].tps.add(a.tp);
      if(a.kategoriSumatif) mapelGroups[a.mapel].categories.add(a.kategoriSumatif);
  });
  
  const akademik = Object.keys(mapelGroups).map(m => {
      const g = mapelGroups[m];
      const avg = g.count > 0 ? Math.round(g.sum / g.count) : 0;
let deskripsi = '';
const tpStr = Array.from(g.tps).join(', ');

// Jika jenis rapor adalah ASTS, gunakan rentang predikat khusus
if (jenisRapor === 'ASTS') {
    if (avg >= 93) {
        deskripsi = `Sangat Baik (A): Memiliki penguasaan yang sangat tinggi (Nilai ${avg}) dalam mencapai kompetensi: ${tpStr}.`;
    } else if (avg >= 84) {
        deskripsi = `Baik (B): Memiliki penguasaan yang baik (Nilai ${avg}) dalam mencapai kompetensi: ${tpStr}.`;
    } else if (avg >= 75) {
        deskripsi = `Cukup (C): Memiliki penguasaan yang cukup (Nilai ${avg}) dalam mencapai kompetensi: ${tpStr}.`;
    } else {
        deskripsi = `Kurang (D): Perlu bimbingan intensif (Nilai di bawah 75) terkait pencapaian kompetensi: ${tpStr}.`;
    }
} else {
    // Logika standar untuk ASLM / ASAS
    if (avg >= 85) deskripsi = `Menunjukkan penguasaan yang sangat baik dalam mencapai kompetensi: ${tpStr}.`;
    else if (avg >= 70) deskripsi = `Menunjukkan penguasaan yang baik dalam mencapai kompetensi: ${tpStr}.`;
    else deskripsi = `Mampu mencapai kompetensi dasar, namun masih perlu peningkatan dan bimbingan lebih dalam hal: ${tpStr}.`;
}
      return { mapel: m, nilai: avg, deskripsi };
  });
  
  const koku = stdNilai.filter((n: any) => n.mapel === 'Kokurikuler');
  const bta = stdNilai.filter((n: any) => n.mapel === 'BTA');
  const ekstraOther = stdNilai.filter((n: any) => ['Pramuka', 'TIK', 'Futsal', 'Ekstrakurikuler'].includes(n.mapel));
  
  const generateCatatanAI = async () => {
    if (!selectedSiswa) return db.showToast("Pilih siswa terlebih dahulu", "error");
    setIsGeneratingCatatan(true);
    db.showToast("AI sedang menyusun catatan wali kelas...  ✨ ", "success");
    try {
      const avgNilai = akademik.reduce((acc: number, curr: any) => acc + curr.nilai, 0) / (akademik.length || 1);
      const promptText = `Buatkan deskripsi singkat (maksimal 3 kalimat) "Catatan Wali Kelas" untuk rapor siswa SD bernama ${currentSiswa.name}. Rata-rata nilai akademiknya adalah ${avgNilai.toFixed(1)}. Berikan kalimat yang memotivasi, apresiatif, dan membangun karakter siswa. Gunakan bahasa Indonesia yang baku, sopan, dan santun. Jangan mengulangi angka nilai, fokus pada motivasi.`;
      const payload = { contents: [{ parts: [{ text: promptText }] }] };
      const data = await callGeminiAPI(payload);
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        setCatatan((prev: any) => ({ ...prev, [selectedSiswa]: resultText.trim() }));
        db.showToast("Catatan berhasil disusun AI!", "success");
      }
    } catch (e) {
      db.showToast("Gagal menyusun catatan via AI.", "error");
    } finally {
      setIsGeneratingCatatan(false);
    }
  };
  
  const handlePrint = () => { window.focus(); window.print(); };
  const handlePrev = () => { if (currentIndex > 0) setSelectedSiswa(studentsInClass[currentIndex - 1].id.toString()); };
  const handleNext = () => { if (currentIndex < studentsInClass.length - 1) setSelectedSiswa(studentsInClass[currentIndex + 1].id.toString()); };
  
  const handleDownloadWord = () => {
    const namaSiswaClean = currentSiswa?.name ? currentSiswa.name.trim() : 'Siswa';
    const namaFile = `Rapor_${jenisRapor}_Semester${selectedSemester}_${namaSiswaClean}`;
    const ok = exportToWord('rapor-export-area', namaFile);
    if(ok) db.showToast(`Rapor ${namaSiswaClean} berhasil diunduh format Word (.doc).`);
  }

  const handleDownloadPDF = () => {
    const namaSiswaClean = currentSiswa?.name ? currentSiswa.name.trim() : 'Siswa';
    const namaFile = `Rapor_${jenisRapor}_Semester${selectedSemester}_${namaSiswaClean}`;
    exportToPDF('rapor-export-area', namaFile, db.showToast);
  }
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      <GlassPanel className="print:hidden flex flex-col items-start gap-5 border-b-4 border-blue-500 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
           <div><label className="block text-xs font-bold text-gray-700 mb-1">Jenis Rapor</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner" value={jenisRapor} onChange={e=>setJenisRapor(e.target.value)}><option value="ASLM">Lingkup Materi (ASLM)</option><option value="ASTS">Tengah Semester (ASTS)</option><option value="ASAS">Akhir Semester (ASAS)</option></select></div>
           <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Semester</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner" value={selectedSemester} onChange={e=>setSelectedSemester(e.target.value)}>{SEMESTER_OPTIONS.map(s=><option key={s.val} value={s.val}>Semester {s.label}</option>)}</select></div>
           {isAdmin && <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelas</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner" value={selectedKelas} onChange={e=>{setSelectedKelas(e.target.value); setSelectedSiswa('');}}>{KELAS_OPTIONS.map(k=><option key={k} value={k}>Kelas {k}</option>)}</select></div>}
           <div className={isAdmin?"":"col-span-2"}><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Siswa</label><select className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner" value={selectedSiswa} onChange={e=>setSelectedSiswa(e.target.value)}><option value="">-- Pilih Siswa --</option>{studentsInClass.map((s: any)=><option key={s.id} value={s.id}>{s.name} ({s.nisn})</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
           <div><label className="block text-xs font-bold text-gray-700 mb-1">Tempat TTD</label><input type="text" className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner" value={tempatRapor} onChange={e=>setTempatRapor(e.target.value)}/></div>
           <div><label className="block text-xs font-bold text-gray-700 mb-1">Tanggal TTD</label><input type="date" className="w-full bg-white/70 border border-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 shadow-inner" value={tglRapor} onChange={e=>setTglRapor(e.target.value)}/></div>
        </div>
        <div className="flex gap-2 w-full mt-2 justify-end border-t border-gray-200/50 pt-4">
          <button onClick={handlePrev} disabled={currentIndex <= 0} className="bg-white/80 hover:bg-white disabled:opacity-50 text-gray-800 px-4 py-3 rounded-xl transition shadow-sm border border-white"><ChevronLeft size={20}/></button>
          <button onClick={handleNext} disabled={currentIndex === -1 || currentIndex >= studentsInClass.length - 1} className="bg-white/80 hover:bg-white disabled:opacity-50 text-gray-800 px-4 py-3 rounded-xl transition shadow-sm border border-white"><ChevronRight size={20}/></button>
          <button onClick={handleDownloadWord} disabled={!selectedSiswa} className="bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-800 px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 font-bold shadow-sm border border-blue-200" title="Download Word"><Download size={20}/></button>
          <button onClick={handleDownloadPDF} disabled={!selectedSiswa} className="bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-800 px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 font-bold shadow-sm border border-red-200" title="Download PDF"><Download size={20}/></button>
          <button onClick={handlePrint} disabled={!selectedSiswa} className="bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm border border-gray-300 transition" title="Print ke Printer Fisik"><Printer size={20}/> Cetak</button>
        </div>
        
        {selectedSiswa && (
          <div className="w-full bg-blue-50/70 p-4 rounded-xl border border-blue-100 shadow-inner mt-4">
              <label className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><Sparkles size={14}/> Catatan Wali Kelas (Otomatis dengan AI)</label>
              <div className="flex flex-col sm:flex-row gap-3">
                  <textarea rows={2} className="flex-1 bg-white/80 border border-blue-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 custom-scrollbar shadow-inner" placeholder="Tulis manual atau minta AI membuatkan kalimat motivasi untuk siswa ini berdasarkan capaian nilainya..." value={catatan[selectedSiswa] || ''} onChange={e=>setCatatan({...catatan, [selectedSiswa]: e.target.value})} />
                  <button onClick={generateCatatanAI} disabled={isGeneratingCatatan} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-xs sm:w-40 h-fit self-start sm:self-stretch">
                     {isGeneratingCatatan ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                     {isGeneratingCatatan ? 'Memproses...' : 'Generate AI'}
                  </button>
              </div>
          </div>
        )}
      </GlassPanel>
      
      {selectedSiswa && (
        <div id="rapor-export-area" className="bg-white rounded-2xl shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-gray-200 print:w-[210mm] print:absolute print:top-0 print:left-0 print:m-0 print:p-0 print:shadow-none print:border-none z-40 relative print:block">
          
          {/* HALAMAN 1: CAPAIAN AKADEMIK */}
          <div className="p-10 print:p-8 print:min-h-[297mm] break-inside-avoid print:block" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
             <div className="text-center mb-6 border-b-[3px] border-black pb-4">
               <p className="font-bold uppercase text-sm tracking-wide leading-tight">{db.konfigurasi.pemkab}<br/>{db.konfigurasi.dinas}</p>
               <h2 className="text-2xl font-black uppercase tracking-widest mt-1 mb-1 text-black">{db.konfigurasi.namaSekolah}</h2>
               <p className="text-xs tracking-wider">{db.konfigurasi.alamat}</p>
               <p className="text-[11px] mt-1">Email: {db.konfigurasi.email} | NSS: {db.konfigurasi.nss} | NPSN: {db.konfigurasi.npsn}</p>
             </div>
             <div className="text-center mb-6">
               <h3 className="text-lg font-bold uppercase tracking-wide underline mb-4 text-black">Laporan Hasil Belajar {jenisRapor === 'ASLM' ? '(Lingkup Materi)' : jenisRapor === 'ASTS' ? '(Tengah Semester)' : '(Akhir Semester)'}</h3>
               
               <div className="flex justify-between items-start text-[11px] font-semibold text-black gap-4 border border-black p-3 rounded-none text-left w-full mb-6 print:text-[11px]">
                  <div className="flex-1 space-y-1">
                      <div className="grid grid-cols-[100px_10px_auto]"><span>Nama Siswa</span><span>:</span><span className="font-bold uppercase">{currentSiswa?.name}</span></div>
                      <div className="grid grid-cols-[100px_10px_auto]"><span>NISN</span><span>:</span><span>{currentSiswa?.nisn}</span></div>
                      <div className="grid grid-cols-[100px_10px_auto]"><span>Fase</span><span>:</span><span>{getFase(currentSiswa?.kelas)}</span></div>
                  </div>
                  <div className="flex-1 space-y-1">
                      <div className="grid grid-cols-[100px_10px_auto]"><span>Kelas</span><span>:</span><span>{currentSiswa?.kelas}</span></div>
                      <div className="grid grid-cols-[100px_10px_auto]"><span>Semester</span><span>:</span><span className="font-bold">{selectedSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'}</span></div>
                      <div className="grid grid-cols-[100px_10px_auto]"><span>Tahun Pelajaran</span><span>:</span><span>2025/2026</span></div>
                  </div>
               </div>
             </div>
             <h4 className="font-bold text-sm mb-3 text-black uppercase">A. Capaian Akademik</h4>
             <table className="w-full border-collapse border border-black mb-8 text-[11px] print:text-[11px] text-black">
               <thead><tr className="bg-gray-100"><th className="border border-black p-2.5 w-10 text-center font-bold">No</th><th className="border border-black p-2.5 w-1/4 text-center font-bold">Mata Pelajaran</th><th className="border border-black p-2.5 w-16 text-center font-bold">Nilai Akhir</th><th className="border border-black p-2.5 text-center font-bold">Deskripsi Capaian Kompetensi</th></tr></thead>
               <tbody>
                 {akademik.map((a: any, i: number) => (
                   <tr key={i}>
                     <td className="border border-black p-2.5 text-center">{i+1}</td>
                     <td className="border border-black p-2.5 font-bold">{a.mapel}</td>
                     <td className="border border-black p-2.5 text-center font-extrabold text-base">{a.nilai || '-'}</td>
                     <td className="border border-black p-2.5 text-justify leading-relaxed">{a.deskripsi}</td>
                   </tr>
                 ))}
                 {akademik.length === 0 && <tr><td colSpan={4} className="border border-black p-4 text-center italic text-gray-500">Belum ada data nilai akademik untuk semester ini.</td></tr>}
               </tbody>
             </table>
          </div>
          
          {/* HALAMAN 2: KOKURIKULER */}
          <div className="p-10 print:p-8 print:min-h-[297mm] mt-8 print:mt-0 border-t-8 border-gray-100 print:border-none print:block" style={{ pageBreakBefore: 'always', pageBreakAfter: 'always', breakBefore: 'page', breakAfter: 'page' }}>
             <h4 className="font-bold text-sm mb-4 text-black uppercase">B. KOKURIKULER</h4>
             
             {koku.length > 0 ? koku.map((k: any, i: number) => {
                const dKeys = Object.keys(k.data || {}).filter(key => DIMENSI_PROFIL.includes(key));
                const aspekList = ['partisipasi', 'kerjasama', 'tanggungjawab', 'kreativitas'];
                
                return (
                  <div key={i} className="mb-8 break-inside-avoid">
                    <div className="bg-gray-100 border border-black p-3 mb-3">
                       <p className="font-bold text-[12px] text-black">Proyek {i + 1}: {k.namaProyek || '-'}</p>
                       <p className="font-semibold text-[11px] text-gray-800">Tema: {k.temaProyek || '-'}</p>
                    </div>
                    <p className="text-[11px] font-bold mb-1 ml-1 text-black">1. Penilaian Berdasarkan Dimensi Lulusan</p>
                    <table className="w-full border-collapse border border-black mb-4 text-[11px] print:text-[11px] text-black">
                      <thead><tr className="bg-gray-50"><th className="border border-black p-2.5 w-10 text-center font-bold">No</th><th className="border border-black p-2.5 w-1/4 text-center font-bold">Dimensi Lulusan</th><th className="border border-black p-2.5 w-24 text-center font-bold">Predikat</th><th className="border border-black p-2.5 text-center font-bold">Deskripsi Capaian</th></tr></thead>
                      <tbody>
                        {dKeys.length > 0 ? dKeys.map((dk, j) => (
                          <tr key={`${i}-${j}`}>
                            <td className="border border-black p-2.5 text-center">{j+1}</td>
                            <td className="border border-black p-2.5 font-bold">{dk}</td>
                            <td className="border border-black p-2.5 text-center font-extrabold">{k.data[dk]}</td>
                            <td className="border border-black p-2.5 text-justify leading-relaxed">{getKokuDeskripsi(dk, k.data[dk], true, k.temaProyek, k.namaProyek)}</td>
                          </tr>
                        )) : <tr><td colSpan={4} className="border border-black p-4 text-center italic text-gray-500">Data dimensi proyek belum dinilai.</td></tr>}
                      </tbody>
                    </table>
                    <p className="text-[11px] font-bold mb-1 ml-1 text-black">2. Penilaian Berdasarkan Aspek & Sikap Khusus</p>
                    <table className="w-full border-collapse border border-black text-[11px] print:text-[11px] text-black">
                      <thead><tr className="bg-gray-50"><th className="border border-black p-2.5 w-10 text-center font-bold">No</th><th className="border border-black p-2.5 w-1/4 text-center font-bold">Aspek Penilaian</th><th className="border border-black p-2.5 w-24 text-center font-bold">Predikat</th><th className="border border-black p-2.5 text-center font-bold">Deskripsi Detail</th></tr></thead>
                      <tbody>
                        {(() => {
                           let rowCount = 0;
                           const rows = aspekList.map((asp) => {
                             if(!k.data[asp]) return null;
                             rowCount++;
                             return (
                               <tr key={`${i}-${asp}`}>
                                 <td className="border border-black p-2.5 text-center">{rowCount}</td>
                                 <td className="border border-black p-2.5 font-bold capitalize">{asp}</td>
                                 <td className="border border-black p-2.5 text-center font-extrabold">{k.data[asp]}</td>
                                 <td className="border border-black p-2.5 text-justify leading-relaxed">{getKokuDeskripsi(asp, k.data[asp], false, k.temaProyek, k.namaProyek)}</td>
                               </tr>
                             );
                           });
                           if(k.data.sikapKhususNilai) {
                             rowCount++;
                             rows.push(
                               <tr key={`${i}-khusus`}>
                                 <td className="border border-black p-2.5 text-center">{rowCount}</td>
                                 <td className="border border-black p-2.5 font-bold">Sikap Khusus</td>
                                 <td className="border border-black p-2.5 text-center font-extrabold">{k.data.sikapKhususNilai}</td>
                                 <td className="border border-black p-2.5 text-justify leading-relaxed">{k.data.sikapKhususText}</td>
                               </tr>
                             )
                           }
                           return rowCount > 0 ? rows : <tr><td colSpan={4} className="border border-black p-4 text-center italic text-gray-500">Aspek penilaian detail proyek ini belum diisi.</td></tr>;
                        })()}
                      </tbody>
                    </table>
                  </div>
                );
             }) : <p className="italic text-gray-500 p-4 border border-black text-center">Data KOKURIKULER belum tersedia untuk semester ini.</p>}
          </div>
          
          {/* HALAMAN 3: EKSTRAKURIKULER & TTD */}
          <div className="p-10 print:p-8 print:min-h-[297mm] mt-8 print:mt-0 border-t-8 border-gray-100 print:border-none flex flex-col justify-between print:block" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
             <div>
                <h4 className="font-bold text-sm mb-3 text-black uppercase">C. Ekstrakurikuler</h4>
                
                {/* C.1 BTA Wajib */}
                <p className="text-[11px] font-bold mb-1 ml-1 text-black">C.1. Ekstrakurikuler Wajib (BTA)</p>
                <table className="w-full border-collapse border border-black mb-6 text-[11px] print:text-[11px] text-black">
                  <thead><tr className="bg-gray-100"><th className="border border-black p-2.5 w-10 text-center font-bold">No</th><th className="border border-black p-2.5 text-center font-bold w-32">Jenis Keterampilan</th><th className="border border-black p-2.5 w-16 text-center font-bold">Nilai</th><th className="border border-black p-2.5 w-28 text-center font-bold">Predikat</th><th className="border border-black p-2.5 text-center font-bold">Deskripsi Hafalan & Keterampilan</th></tr></thead>
                  <tbody>
                    {bta.length > 0 ? bta.map((b: any, i: number) => {
                      const bDetail = getBtaDetail(b.data?.baca);
                      const tDetail = getBtaDetail(b.data?.tulis);
                      const rawHaf = b.data?.hafalan || [];
                      const safeHaf = Array.isArray(rawHaf) ? rawHaf.map((h: any) => typeof h === 'string' ? {surah: h, predikat: ''} : (h || {surah:'', predikat:''})) : [];
                      const hafalanArr = safeHaf.filter((h: any)=>h.surah && h.surah.trim()!=='');
                      return (
                        <React.Fragment key={i}>
                          <tr><td className="border border-black p-2.5 text-center" rowSpan={3}>1</td><td className="border border-black p-2.5 font-bold bg-gray-50" colSpan={4}>Keterampilan Dasar</td></tr>
                          <tr><td className="border border-black p-2.5 font-bold indent-4">a. Membaca Al-Qur'an</td><td className="border border-black p-2.5 text-center font-extrabold text-base">{b.data?.baca || '-'}</td><td className="border border-black p-2.5 text-center font-bold">{bDetail.p}</td><td className="border border-black p-2.5 text-justify leading-relaxed">{bDetail.d}</td></tr>
                          <tr><td className="border border-black p-2.5 font-bold indent-4">b. Menulis Al-Qur'an</td><td className="border border-black p-2.5 text-center font-extrabold text-base">{b.data?.tulis || '-'}</td><td className="border border-black p-2.5 text-center font-bold">{tDetail.p}</td><td className="border border-black p-2.5 text-justify leading-relaxed">{tDetail.d}</td></tr>
                          <tr><td className="border border-black p-2.5 text-center">2</td><td className="border border-black p-2.5 font-bold bg-gray-50" colSpan={2}>Hafalan Surah Pendek</td><td className="border border-black p-2.5 text-justify leading-relaxed" colSpan={2}>
                             <ul className="list-disc ml-4 font-medium">
                                {hafalanArr.length > 0 ? hafalanArr.map((h: any, hi: number) => (
                                   <li key={hi}>Mampu melafalkan surah <b>{h.surah}</b> dengan predikat <span className="font-bold underline">{h.predikat || '-'}</span>.</li>
                                )) : <li>Belum ada hafalan yang diinputkan.</li>}
                             </ul>
                          </td></tr>
                        </React.Fragment>
                      )
                    }) : <tr><td colSpan={5} className="border border-black p-4 text-center italic text-gray-500">Nilai BTA belum diinput.</td></tr>}
                  </tbody>
                </table>
                
                {/* C.2 Ekstra Pilihan */}
                <p className="text-[11px] font-bold mb-1 ml-1 text-black">C.2. Ekstrakurikuler Pilihan</p>
                <table className="w-full border-collapse border border-black mb-8 text-[11px] print:text-[11px] text-black">
                  <thead><tr className="bg-gray-100"><th className="border border-black p-2.5 w-10 text-center font-bold">No</th><th className="border border-black p-2.5 w-1/4 text-center font-bold">Jenis Ekstrakurikuler</th><th className="border border-black p-2.5 w-24 text-center font-bold">Predikat Penilaian</th><th className="border border-black p-2.5 text-center font-bold">Deskripsi Capaian</th></tr></thead>
                  <tbody>
                    {ekstraOther.length > 0 ? ekstraOther.map((e: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-black p-2.5 text-center">{i+1}</td>
                        <td className="border border-black p-2.5 font-bold uppercase">{e.mapel}</td>
                        <td className="border border-black p-2.5 text-center font-extrabold text-base">{e.data?.predikat || '-'}</td>
                        <td className="border border-black p-2.5 text-justify leading-relaxed">{getEkstraLainDeskripsi(e.mapel, e.data?.predikat)}</td>
                      </tr>
                    )) : <tr><td colSpan={4} className="border border-black p-4 text-center italic text-gray-500">Tidak ada nilai ekstrakurikuler pilihan yang diinput.</td></tr>}
                  </tbody>
                </table>
             </div>
             
             <div className="mt-6 mb-8 break-inside-avoid">
               <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: 'none', width: '100%' }} className="border-none text-[11px] text-black">
                  <tbody>
                     <tr>
                        <td width="35%" valign="top" style={{ paddingRight: '15px' }} className="w-[35%] align-top pr-4">
                           <table width="100%" cellPadding={4} cellSpacing={0} style={{ borderCollapse: 'collapse', border: '1px solid black', width: '100%' }} className="border-collapse border border-black text-[11px]">
                              <thead>
                                 <tr><th style={{ border: '1px solid black', backgroundColor: '#f3f4f6' }} className="border border-black p-2 bg-gray-100" colSpan={3}>Ketidakhadiran</th></tr>
                              </thead>
                              <tbody>
                                 <tr><td style={{ border: '1px solid black' }} className="border border-black p-2">Sakit</td><td style={{ border: '1px solid black', textAlign: 'center' }} className="border border-black p-2 text-center w-10">{countSakit || '-'}</td><td style={{ border: '1px solid black', textAlign: 'center' }} className="border border-black p-2 w-10 text-center">hari</td></tr>
                                 <tr><td style={{ border: '1px solid black' }} className="border border-black p-2">Izin</td><td style={{ border: '1px solid black', textAlign: 'center' }} className="border border-black p-2 text-center w-10">{countIzin || '-'}</td><td style={{ border: '1px solid black', textAlign: 'center' }} className="border border-black p-2 w-10 text-center">hari</td></tr>
                                 <tr><td style={{ border: '1px solid black' }} className="border border-black p-2">Tanpa Keterangan</td><td style={{ border: '1px solid black', textAlign: 'center' }} className="border border-black p-2 text-center w-10">{countAlpa || '-'}</td><td style={{ border: '1px solid black', textAlign: 'center' }} className="border border-black p-2 w-10 text-center">hari</td></tr>
                              </tbody>
                           </table>
                        </td>
                        <td width="65%" valign="top" className="w-[65%] align-top">
                           <div style={{ border: '1px solid black', padding: '12px', minHeight: '90px', height: '100%' }} className="border border-black p-3 h-full min-h-[90px]">
                              <p style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }} className="font-bold mb-1 underline text-[11px] text-black">Catatan Wali Kelas:</p>
                              <p style={{ fontStyle: 'italic', textAlign: 'justify' }} className="text-[11px] text-justify text-black italic">"{catatan[selectedSiswa] || 'Tingkatkan terus belajarmu dan tetap semangat dalam menuntut ilmu. Jadilah anak yang cerdas dan membanggakan bagi orang tua dan sekolah.'}"</p>
                           </div>
                        </td>
                     </tr>
                  </tbody>
               </table>
             </div>
             
             {/* Tanda Tangan */}
             <div className="mt-8 flex justify-between px-10 text-[11px] print:text-[11px] text-black pb-10 break-inside-avoid">
               <div className="text-center w-52 flex flex-col justify-between">
                 <div>
                   <p>Mengetahui,</p>
                   <p>Kepala Sekolah</p>
                 </div>
                 <div className="mt-16">
                   <p className="font-bold underline leading-tight">{db.konfigurasi.kepsek}</p>
                   <p>NIP. {db.konfigurasi.nipKepsek}</p>
                 </div>
               </div>
               <div className="text-center w-52 flex flex-col justify-between">
                 <div>
                   <p>{tempatRapor || '...................'}, {tglRapor ? new Date(tglRapor).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : '................... 2026'}</p>
                   <p>Wali Kelas {selectedKelas}</p>
                 </div>
                 <div className="mt-16">
               <p className="font-bold underline leading-tight">{isAdmin ? '(..................................)' : user.name}</p>
               <p>NIP. {isAdmin ? '..................................' : user.nip}</p>
             </div>
           </div>
         </div>
      </div>
      
    </div>
  )}
</div>
);
}
