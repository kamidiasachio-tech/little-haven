import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { PawPrint, CalendarDays, ClipboardPlus, Users, Receipt, ChartNoAxesCombined, LogOut, Search, Plus, Menu, X, Stethoscope, FileText, Settings, ShieldCheck } from "lucide-react";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anon ? createClient(url, anon) : null;

const demo = {
  appointments: [
    {id:"DEMO-001", starts_at:"2026-11-18T08:30:00", patient_name:"Mochi", owner_name:"Nadia Putri", species:"Cat", reason:"Vomiting", status:"waiting"},
    {id:"DEMO-002", starts_at:"2026-11-18T09:00:00", patient_name:"Bruno", owner_name:"Raka Pratama", species:"Dog", reason:"Routine check-up", status:"waiting"},
    {id:"DEMO-003", starts_at:"2026-11-18T10:30:00", patient_name:"Luna", owner_name:"Maya Anindita", species:"Cat", reason:"Vaccination", status:"in_progress"}
  ],
  patients: [
    {id:"DEMO-P01", name:"Mochi", species:"Cat", breed:"Domestic Shorthair", owner_name:"Nadia Putri"},
    {id:"DEMO-P02", name:"Bruno", species:"Dog", breed:"Golden Retriever", owner_name:"Raka Pratama"},
    {id:"DEMO-P03", name:"Luna", species:"Cat", breed:"Persian", owner_name:"Maya Anindita"}
  ]
};

function App(){
  const [session,setSession]=useState(null), [profile,setProfile]=useState(null);
  const [section,setSection]=useState("Overview"), [rows,setRows]=useState(demo);
  const [loading,setLoading]=useState(false), [error,setError]=useState("");
  const [email,setEmail]=useState(""), [password,setPassword]=useState("");
  const [selected,setSelected]=useState(null), [query,setQuery]=useState("");
  const [mobileOpen,setMobileOpen]=useState(false), [notice,setNotice]=useState("");
  const [form,setForm]=useState({chief_complaint:"",anamnesis:"",vitals:"",diagnosis:"",treatment:"",medication:"",clinical_notes:"",follow_up:""});
  const role=profile?.role || "Doctor";
  const demoMode=!supabase;

  async function loadData(userId){
    if(!supabase || !userId) return;
    setLoading(true); setError("");
    const [p,a]=await Promise.all([
      supabase.from("patients").select("id,name,species,breed,owners(full_name)").order("created_at",{ascending:false}),
      supabase.from("appointments").select("id,starts_at,reason,status,patients(name,species),owners(full_name)").order("starts_at")
    ]);
    if(p.error || a.error) setError(p.error?.message || a.error?.message);
    else setRows({
      patients:(p.data||[]).map(x=>({...x,owner_name:x.owners?.full_name||"—"})),
      appointments:(a.data||[]).map(x=>({...x,patient_name:x.patients?.name||"—",species:x.patients?.species||"",owner_name:x.owners?.full_name||"—"}))
    });
    setLoading(false);
  }

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    async function getProfile(){
      if(!session?.user) {setProfile(null);return;}
      const {data,error}=await supabase.from("profiles").select("full_name,role").eq("id",session.user.id).single();
      if(error){setError("Profil akun belum disiapkan oleh administrator.");return;}
      setProfile(data); loadData(session.user.id);
    }
    getProfile();
  },[session]);

  async function login(e){
    e.preventDefault(); setError(""); setLoading(true);
    if(!supabase){setError("Mode pratinjau: konfigurasi Supabase belum diisi. Login sungguhan belum aktif.");setLoading(false);return;}
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)setError(error.message);
    setLoading(false);
  }
  async function logout(){if(supabase) await supabase.auth.signOut();setProfile(null);setSession(null);}
  function flash(s){setNotice(s);setTimeout(()=>setNotice(""),3500);}
  const nav=[
    ["Overview",ChartNoAxesCombined],["Appointments",CalendarDays],["Patients",PawPrint],
    ["Medical Records",ClipboardPlus],["Billing",Receipt],["Staff & Accounts",Users],["Reports",FileText]
  ];
  const patients=rows.patients||[];
  const appointments=rows.appointments||[];
  const filteredPatients=patients.filter(p=>(p.name+" "+p.owner_name).toLowerCase().includes(query.toLowerCase()));
  async function saveRecord(e){
    e.preventDefault();
    if(demoMode){flash("Pratinjau saja: sambungkan Supabase untuk menyimpan permanen.");return;}
    if(!selected){flash("Pilih pasien terlebih dahulu.");return;}
    const {error}=await supabase.from("medical_records").insert({
      patient_id:selected.id, doctor_id:session.user.id, ...form
    });
    if(error) flash(error.message); else {flash("Medical record berhasil disimpan.");setForm({chief_complaint:"",anamnesis:"",vitals:"",diagnosis:"",treatment:"",medication:"",clinical_notes:"",follow_up:""});}
  }

  if(!session || !profile) return <div className="login-shell"><div className="login-card">
    <div className="brand-mark"><PawPrint size={28}/></div><p className="eyebrow">VETERINARY CLINIC MANAGEMENT</p><h1>Little Haven</h1><p className="muted">A calmer way to care.</p>
    <form onSubmit={login} className="stack"><label>Email / username<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Akun staf" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required/></label><button className="primary" disabled={loading}>{loading?"Memproses...":"Sign in"}</button></form>
    {error&&<p className="error">{error}</p>}
    <div className="preview-note"><ShieldCheck size={16}/><span>{demoMode?"Mode pratinjau. Backend belum terhubung.":"Login menggunakan akun staf Little Haven."}</span></div>
  </div></div>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}><div className="brand"><div className="brand-mark"><PawPrint/></div><div><b>Little Haven</b><small>VETERINARY CLINIC</small></div><button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X/></button></div>
      <div className="side-label">WORKSPACE</div>{nav.map(([name,Icon])=><button key={name} className={`nav-item ${section===name?"active":""}`} onClick={()=>{setSection(name);setMobileOpen(false)}}><Icon size={18}/>{name}</button>)}
      <div className="side-bottom"><div className="user-chip"><div className="avatar">{(profile.full_name||"U").slice(0,1)}</div><div><b>{profile.full_name}</b><small>{profile.role}</small></div></div><button className="nav-item" onClick={logout}><LogOut size={18}/>Sign out</button></div>
    </aside>
    {mobileOpen&&<div className="scrim" onClick={()=>setMobileOpen(false)}/>}
    <main className="main"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button><div><p className="eyebrow">LITTLE HAVEN / {section.toUpperCase()}</p><h2>{section}</h2></div><div className="top-user"><span className="status-dot"/> {profile.full_name}</div></header>
      {notice&&<div className="toast">{notice}</div>}{error&&<div className="error-banner">{error}</div>}
      {demoMode&&<div className="preview-banner">Preview mode · Data contoh saja · Hubungkan Supabase untuk autentikasi dan penyimpanan permanen.</div>}
      {section==="Overview"&&<><div className="welcome"><div><p className="eyebrow">GOOD DAY, {profile.full_name?.toUpperCase()}</p><h1>Care starts here.</h1><p className="muted">Ringkasan aktivitas Little Haven hari ini.</p></div><div className="welcome-icon"><PawPrint size={48}/></div></div><div className="stats"><Stat title="Appointments" value={appointments.length} icon={CalendarDays}/><Stat title="Patients" value={patients.length} icon={PawPrint}/><Stat title="Waiting" value={appointments.filter(x=>x.status==="waiting").length} icon={Users}/><Stat title="In progress" value={appointments.filter(x=>x.status==="in_progress").length} icon={Stethoscope}/></div><Panel title="Upcoming appointments" action={()=>setSection("Appointments")}><AppointmentTable items={appointments.slice(0,5)} onSelect={x=>{setSelected(x);setSection("Medical Records")}}/></Panel></>}
      {section==="Appointments"&&<Panel title="Appointment schedule"><AppointmentTable items={appointments} onSelect={x=>{setSelected(x);setSection("Medical Records")}}/></Panel>}
      {section==="Patients"&&<Panel title="Patient directory"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama pasien atau owner..."/></div><div className="patient-grid">{filteredPatients.map(p=><button className="patient-card" key={p.id} onClick={()=>{setSelected(p);setSection("Medical Records")}}><div className="pet-icon"><PawPrint/></div><div><b>{p.name}</b><small>{p.species} · {p.breed||"Breed belum diisi"}</small><small>Owner: {p.owner_name}</small></div></button>)}</div></Panel>}
      {section==="Medical Records"&&<div className="record-layout"><Panel title="Select patient"><div className="stack">{patients.map(p=><button key={p.id} className={`patient-choice ${selected?.id===p.id?"chosen":""}`} onClick={()=>setSelected(p)}><b>{p.name}</b><small>{p.species} · {p.owner_name}</small></button>)}</div></Panel><Panel title="New medical record"><form className="stack" onSubmit={saveRecord}><div className="selected-patient">{selected?`${selected.name} · ${selected.species}`:"Pilih pasien di sebelah kiri"}</div>{Object.entries({chief_complaint:"Chief complaint",anamnesis:"History / Anamnesis",vitals:"Vital signs & physical examination",diagnosis:"Clinical diagnosis",treatment:"Treatment / procedures",medication:"Medication / prescription",clinical_notes:"Clinical notes",follow_up:"Follow-up recommendation"}).map(([key,label])=><label key={key}>{label}<textarea rows={key==="vitals"?4:3} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={`Isi ${label.toLowerCase()}...`}/></label>)}<div className="record-author">Record author · {profile.full_name}</div><button className="primary" disabled={!selected}>Save medical record</button></form></Panel></div>}
      {section==="Billing"&&<Panel title="Billing"><p className="muted">Modul invoice, katalog layanan, pembayaran, dan receipt disiapkan untuk tahap berikutnya.</p><div className="empty"><Receipt size={32}/><b>Billing workspace</b><span>Struktur database billing sudah disiapkan.</span></div></Panel>}
      {section==="Staff & Accounts"&&<Panel title="Staff & role access"><p className="muted">Pengelolaan akun dibatasi sesuai kebijakan Little Haven.</p><div className="role-row"><b>Doctor</b><span>Individual accounts</span></div><div className="role-row"><b>Receptionist</b><span>Individual accounts</span></div><div className="role-row"><b>Clinic Manager</b><span>Role terpisah · Nayi</span></div><p className="muted tiny">Doctor dan Receptionist memiliki akses berbeda. Clinic Manager tidak termasuk pengelolaan akun yang kamu pegang.</p></Panel>}
      {section==="Reports"&&<Panel title="Reports"><div className="empty"><ChartNoAxesCombined size={32}/><b>Operational reports</b><span>Laporan appointment, pasien, dan billing akan tampil setelah modul diaktifkan.</span></div></Panel>}
      <footer>Little Haven Veterinary Clinic <span>·</span> Internal management workspace</footer>
    </main>
  </div>
}
function Stat({title,value,icon:Icon}){return <div className="stat"><div className="stat-icon"><Icon size={19}/></div><small>{title}</small><strong>{value}</strong></div>}
function Panel({title,children,action}){return <section className="panel"><div className="panel-head"><h3>{title}</h3>{action&&<button className="text-btn" onClick={action}>View all →</button>}</div>{children}</section>}
function AppointmentTable({items,onSelect}){return <div className="table-wrap"><table><thead><tr><th>TIME</th><th>PATIENT</th><th>OWNER</th><th>REASON</th><th>STATUS</th><th></th></tr></thead><tbody>{items.map(a=><tr key={a.id}><td>{new Date(a.starts_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</td><td><b>{a.patient_name}</b><small>{a.species}</small></td><td>{a.owner_name}</td><td>{a.reason}</td><td><span className={`pill ${a.status}`}>{a.status.replace("_"," ")}</span></td><td><button className="text-btn" onClick={()=>onSelect(a)}>Open</button></td></tr>)}</tbody></table>{!items.length&&<div className="empty">Belum ada appointment.</div>}</div>}
createRoot(document.getElementById("root")).render(<App/>);
