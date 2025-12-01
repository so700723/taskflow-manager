import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp, 
  orderBy,
  getDocs,
  limit
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  LogOut, 
  Plus, 
  Clock, 
  AlertCircle, 
  FileText, 
  Link as LinkIcon, 
  ChevronDown, 
  ChevronUp,
  Send,
  Calendar as CalendarIcon,
  Bell,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Pencil,
  X,
  Globe,
  Flag,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCecRuVpUJpoAy4ef7IcPI5Vla5iCxzDlE",
  authDomain: "mytaskflow-9d204.firebaseapp.com",
  projectId: "mytaskflow-9d204",
  storageBucket: "mytaskflow-9d204.firebasestorage.app",
  messagingSenderId: "595466988042",
  appId: "1:595466988042:web:e1ab13d1eed6bcfc4f4df3",
  measurementId: "G-LH760519XM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Define App ID 
const appId = "taskflow-public";

// --- Utility Components ---

const StatusBadge = ({ status }) => {
  const colors = {
    'pending': 'bg-slate-100 text-slate-600 border-slate-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'overdue': 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors['pending']}`}>
      {status?.replace('-', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    'high': 'text-red-600 bg-red-50 border-red-100',
    'medium': 'text-orange-600 bg-orange-50 border-orange-100',
    'low': 'text-blue-600 bg-blue-50 border-blue-100',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1 ${colors[priority] || colors['low']}`}>
      <Flag size={10} /> {priority}
    </span>
  );
};

const VisibilityBadge = ({ visibility }) => {
  return visibility === 'public' ? (
    <span className="text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1" title="Visible to Team">
      <Globe size={10} /> Public
    </span>
  ) : (
    <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1" title="Private to Assignee">
      <Lock size={10} /> Private
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// --- Main Application Component ---

export default function App() {
  const [appUser, setAppUser] = useState(null); 
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard, tasks, calendar, team

// 1. Initialize Firebase Connection
useEffect(() => {
  const initAuth = async () => {
    try {
      // Establish a secure connection to the database
      await signInAnonymously(auth); 
      setFirebaseReady(true);
    } catch (err) {
      console.error("Firebase connection failed", err);
      // Allow app to load even if auth fails (e.g. for UI testing)
      setFirebaseReady(true); 
    }
  };
  initAuth();
}, []);

  // 2. Local Session Check
  useEffect(() => {
    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) setAppUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  // 3. Fetch User Data
  useEffect(() => {
    if (!appUser || !firebaseReady) {
      setUserData(null);
      return;
    }
    const stableUid = appUser.uid; 
    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', stableUid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
      else setUserData({ name: appUser.name, role: appUser.role, email: appUser.email }); 
    });
    return () => unsubscribe();
  }, [appUser, firebaseReady]);

  const handleLogout = async () => {
    localStorage.removeItem('taskflow_user');
    setAppUser(null);
    setUserData(null);
    setView('dashboard');
  };

  const handleLoginSuccess = (userObj) => {
    setAppUser(userObj);
    localStorage.setItem('taskflow_user', JSON.stringify(userObj));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading TaskFlow...</div>;

  if (!appUser) return <AuthScreen onLoginSuccess={handleLoginSuccess} firebaseReady={firebaseReady} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="text-blue-400" /> TaskFlow
          </h1>
          <p className="text-xs text-slate-400 mt-1">Project Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20}/>}>Dashboard</NavItem>
          <NavItem active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarIcon size={20}/>}>Calendar</NavItem>
          <NavItem active={view === 'tasks'} onClick={() => setView('tasks')} icon={<FileText size={20}/>}>
            {userData?.role === 'manager' ? 'Manage Tasks' : 'My Tasks'}
          </NavItem>
          {userData?.role === 'manager' && (
            <NavItem active={view === 'team'} onClick={() => setView('team')} icon={<Users size={20}/>}>Accounts</NavItem>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {userData?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{userData?.name || appUser.email}</p>
              <p className="text-xs text-slate-400 capitalize">{userData?.role || 'Guest'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        {view === 'dashboard' && <Dashboard userData={userData} setView={setView} currentUser={appUser} />}
        {view === 'calendar' && <CalendarView userData={userData} currentUser={appUser} />}
        {view === 'tasks' && <TaskManager userData={userData} currentUser={appUser} />}
        {view === 'team' && userData?.role === 'manager' && <TeamManager currentUser={userData} />}
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon, children }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
    {icon} {children}
  </button>
);

// --- Calendar Component ---
const CalendarView = ({ userData, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Fetch Tasks
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsub = onSnapshot(q, snap => {
      let allTasks = snap.docs.map(d => ({id: d.id, ...d.data()}));
      const visibleTasks = allTasks.filter(t => {
        if (userData?.role === 'manager') return true;
        const isMine = t.assignedTo?.includes(currentUser.uid);
        const isPublic = t.visibility === 'public';
        return isMine || isPublic;
      });
      setTasks(visibleTasks);
    });
    return () => unsub;
  }, [userData, currentUser]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month); 

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));
  };

  const dayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="text-blue-500" /> Work Calendar
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
          <span className="font-bold text-lg w-40 text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {days.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <div 
                  key={idx} 
                  onClick={() => day && setSelectedDay(day)}
                  className={`border-b border-r border-slate-100 p-2 min-h-[100px] relative transition-colors ${
                    !day ? 'bg-slate-50' : 
                    selectedDay === day ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10 cursor-pointer' : 
                    'hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayTasks.slice(0, 3).map(t => (
                          <div key={t.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded border ${
                            t.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' : 
                            t.priority === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[10px] text-slate-400 pl-1">+{dayTasks.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-80 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-700">
              {selectedDay 
                ? new Date(year, month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a Date'}
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {!selectedDay ? (
              <p className="text-center text-slate-400 text-sm mt-10">Click a day on the calendar to view scheduled work.</p>
            ) : dayTasks.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-10">No tasks due on this day.</p>
            ) : (
              dayTasks.map(t => (
                <div key={t.id} className="p-3 rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <PriorityBadge priority={t.priority} />
                    <VisibilityBadge visibility={t.visibility} />
                  </div>
                  <h4 className="font-medium text-slate-800 text-sm mb-1">{t.title}</h4>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={12} />
                    {t.deadline ? new Date(t.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All Day'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Task Manager Component ---
const TaskManager = ({ userData, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (!userData) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
    const unsub = onSnapshot(q, snap => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub;
  }, [userData]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsub = onSnapshot(q, snap => {
      let loadedTasks = snap.docs.map(d => ({id: d.id, ...d.data()}));
      if (userData?.role !== 'manager') {
         loadedTasks = loadedTasks.filter(t => t.assignedTo?.includes(currentUser.uid));
      }
      loadedTasks.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTasks(loadedTasks);
    });
    return () => unsub;
  }, [userData, currentUser]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {userData?.role === 'manager' ? 'Manage Tasks' : 'My Assignments'}
        </h2>
        {userData?.role === 'manager' && (
          <button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
        <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-3 pb-20">
          {tasks.map(task => (
            <div 
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTask?.id === task.id ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{task.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <CalendarIcon size={12} /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}
                {task.visibility === 'public' && <Globe size={12} className="ml-auto text-slate-400" />}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center text-slate-400 mt-10">No tasks found.</p>}
        </div>

        <div className="lg:col-span-2 overflow-y-auto pb-20">
          {selectedTask ? (
            <TaskDetail task={selectedTask} currentUser={userData || { name: 'User', role: 'employee' }} allUsers={users} onClose={() => setSelectedTask(null)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
              <CheckSquare size={48} className="mb-4 opacity-20" />
              <p>Select a task to view details or report progress.</p>
            </div>
          )}
        </div>
      </div>

      {isCreating && <CreateTaskModal users={users} onClose={() => setIsCreating(false)} />}
    </div>
  );
};

// --- Create Task Modal ---
const CreateTaskModal = ({ users, onClose }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [visibility, setVisibility] = useState('private');
  const [loading, setLoading] = useState(false);

  const toggleUser = (uid) => {
    if (assignedTo.includes(uid)) setAssignedTo(assignedTo.filter(id => id !== uid));
    else setAssignedTo([...assignedTo, uid]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
        title,
        description: desc,
        deadline,
        assignedTo,
        priority,
        visibility,
        status: 'pending',
        createdAt: serverTimestamp(),
        progressLogs: []
      });
      onClose();
    } catch (err) {
      alert("Error creating task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg">Create New Job</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
            <input type="text" required className="w-full p-2 border rounded-lg" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea required rows="2" className="w-full p-2 border rounded-lg" value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline & Time</label>
              <input type="datetime-local" required className="w-full p-2 border rounded-lg text-sm" value={deadline} onChange={e=>setDeadline(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select className="w-full p-2 border rounded-lg text-sm" value={priority} onChange={e=>setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 border p-2 rounded-lg flex-1 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="vis" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} />
                <span className="text-sm flex items-center gap-1"><Lock size={14}/> Private (Assignee)</span>
              </label>
              <label className="flex items-center gap-2 border p-2 rounded-lg flex-1 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="vis" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} />
                <span className="text-sm flex items-center gap-1"><Globe size={14}/> Public (Team)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
            <div className="space-y-1 max-h-32 overflow-y-auto border p-2 rounded-lg">
              {users.map(u => (
                <div key={u.id} onClick={() => toggleUser(u.uid)} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${assignedTo.includes(u.uid) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${assignedTo.includes(u.uid) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {assignedTo.includes(u.uid) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 mt-2">{loading ? 'Creating...' : 'Assign Job'}</button>
        </form>
      </Card>
    </div>
  );
};

// --- Task Detail Component ---
const TaskDetail = ({ task, currentUser, allUsers, onClose }) => {
  const [updateText, setUpdateText] = useState('');
  const [fileLink, setFileLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isManager = currentUser?.role === 'manager';
  const assignedNames = allUsers.filter(u => task.assignedTo?.includes(u.uid)).map(u => u.name).join(', ') || 'Unassigned';

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if(!updateText && !fileLink) return;
    setSubmitting(true);
    const newLog = { text: updateText, link: fileLink, user: currentUser.name || 'User', createdAt: new Date().toISOString() };
    const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
    const updates = { progressLogs: [...(task.progressLogs || []), newLog] };
    if (task.status === 'pending') updates.status = 'in-progress';
    try { await updateDoc(taskRef, updates); setUpdateText(''); setFileLink(''); } 
    catch (err) { alert("Failed to update"); }
    setSubmitting(false);
  };

  const markComplete = async () => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { status: 'completed' });

  // -- Edit Logic --
  const startEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description,
      deadline: task.deadline || '',
      priority: task.priority || 'medium',
      visibility: task.visibility || 'private',
      assignedTo: task.assignedTo || []
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    try {
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
      await updateDoc(taskRef, editForm);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save changes: " + err.message);
    }
  };

  const toggleEditUser = (uid) => {
    const current = editForm.assignedTo || [];
    if (current.includes(uid)) {
      setEditForm({ ...editForm, assignedTo: current.filter(id => id !== uid) });
    } else {
      setEditForm({ ...editForm, assignedTo: [...current, uid] });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            {!isEditing && <PriorityBadge priority={task.priority} />}
            {!isEditing && <VisibilityBadge visibility={task.visibility} />}
          </div>
          <div className="flex gap-2">
            {isManager && !isEditing && (
              <button onClick={startEdit} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors" title="Edit Task">
                <Pencil size={18} />
              </button>
            )}
            <button onClick={onClose} className="md:hidden text-slate-400"><X/></button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <input 
              className="w-full p-2 border rounded font-bold text-lg" 
              value={editForm.title} 
              onChange={e => setEditForm({...editForm, title: e.target.value})} 
              placeholder="Task Title"
            />
            <div className="grid grid-cols-2 gap-2">
               <input 
                 type="datetime-local" 
                 className="p-1 border rounded text-xs" 
                 value={editForm.deadline} 
                 onChange={e => setEditForm({...editForm, deadline: e.target.value})}
               />
               <select 
                 className="p-1 border rounded text-xs"
                 value={editForm.priority}
                 onChange={e => setEditForm({...editForm, priority: e.target.value})}
               >
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
            </div>
            <div className="flex gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                   <input type="radio" name="editVis" value="private" checked={editForm.visibility === 'private'} onChange={() => setEditForm({...editForm, visibility: 'private'})} />
                   Private
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                   <input type="radio" name="editVis" value="public" checked={editForm.visibility === 'public'} onChange={() => setEditForm({...editForm, visibility: 'public'})} />
                   Public
                </label>
            </div>
            {/* User Assign Section in Edit Mode */}
            <div className="border rounded p-2 max-h-24 overflow-y-auto">
               <p className="text-xs font-bold text-slate-500 mb-1">Assignees:</p>
               {allUsers.map(u => (
                 <div key={u.id} onClick={() => toggleEditUser(u.uid)} className={`flex items-center gap-2 text-xs p-1 cursor-pointer hover:bg-slate-50 ${editForm.assignedTo.includes(u.uid) ? 'bg-blue-50' : ''}`}>
                    <div className={`w-3 h-3 border rounded flex items-center justify-center ${editForm.assignedTo.includes(u.uid) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                      {editForm.assignedTo.includes(u.uid) && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    {u.name}
                 </div>
               ))}
            </div>
            <div className="flex gap-2 pt-2">
               <button onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Save size={12}/> Save</button>
               <button onClick={cancelEdit} className="border border-slate-300 text-slate-600 px-3 py-1 rounded text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{task.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Users size={14}/> {assignedNames}</span>
              <span className="flex items-center gap-1"><CalendarIcon size={14}/> Due: {task.deadline ? new Date(task.deadline).toLocaleString() : 'No Date'}</span>
            </div>
          </>
        )}
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h4>
          {isEditing ? (
            <textarea 
              className="w-full p-2 border rounded text-sm" 
              rows="4" 
              value={editForm.description} 
              onChange={e => setEditForm({...editForm, description: e.target.value})}
            />
          ) : (
            <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
          )}
        </div>

        {!isEditing && (
          <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Progress History</h4>
            <div className="space-y-4">
              {task.progressLogs?.map((log, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-1 min-w-[24px] h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{log.user[0]}</div>
                  <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700">{log.user}</span>
                      <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">{log.text}</p>
                    {log.link && <a href={log.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><LinkIcon size={12}/> View Attachment</a>}
                  </div>
                </div>
              ))}
              {(!task.progressLogs || task.progressLogs.length === 0) && <p className="text-sm text-slate-400 italic">No updates yet.</p>}
            </div>
          </div>
        )}
      </div>

      {!isEditing && task.status !== 'completed' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
           <form onSubmit={handleProgressSubmit} className="space-y-3">
             <textarea placeholder="Report progress..." className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="2" value={updateText} onChange={e => setUpdateText(e.target.value)} />
             <div className="flex gap-2">
                <input type="url" placeholder="https://..." className="flex-1 p-2 rounded-lg border border-slate-300 text-sm outline-none" value={fileLink} onChange={e => setFileLink(e.target.value)} />
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 rounded-lg font-medium text-sm flex items-center gap-2"><Send size={16}/> Report</button>
                {isManager && <button type="button" onClick={markComplete} className="bg-green-600 text-white px-4 rounded-lg font-medium text-sm">Done</button>}
             </div>
           </form>
        </div>
      )}
    </Card>
  );
};

// --- Auth Component ---
const AuthScreen = ({ onLoginSuccess, firebaseReady }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseReady) return;
    const seedDefaultAccounts = async () => {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      const snap = await getDocs(query(usersRef, limit(1)));
      if (snap.empty) {
        const mEmail = 'bryansoph@taskflow.com', mUid = 'user_' + mEmail.replace(/[^a-z0-9]/g, '');
        await setDoc(doc(usersRef, mUid), { uid: mUid, name: 'Bryan Soph', email: mEmail, password: 'so146563856', role: 'manager', createdAt: serverTimestamp() });
        const sEmail = 'abctry@taskflow.com', sUid = 'user_' + sEmail.replace(/[^a-z0-9]/g, '');
        await setDoc(doc(usersRef, sUid), { uid: sUid, name: 'ABC Staff', email: sEmail, password: 'bmeailab', role: 'employee', createdAt: serverTimestamp() });
      }
    };
    seedDefaultAccounts();
  }, [firebaseReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseReady) return setError("System initializing...");
    setError(''); setLoading(true);
    const finalEmail = (email.trim().toLowerCase().includes('@') ? email.trim().toLowerCase() : `${email.trim().toLowerCase()}@taskflow.com`);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('email', '==', finalEmail));
      const snap = await getDocs(q);
      if (snap.empty) { setError('User not found.'); setLoading(false); return; }
      const userDoc = snap.docs[0].data();
      if (userDoc.password === password) onLoginSuccess(userDoc);
      else setError('Incorrect password.');
    } catch (err) { setError('Login error.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white mb-4"><Lock size={24} /></div>
          <h2 className="text-2xl font-bold text-slate-900">TaskFlow Login</h2>
          <p className="text-slate-500 mt-2">Restricted Access System</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Username</label><input type="text" required className="w-full p-2 border border-slate-300 rounded-lg" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" required className="w-full p-2 border border-slate-300 rounded-lg" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} /></div>
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">{loading ? 'Verifying...' : 'Access System'}</button>
        </form>
      </Card>
    </div>
  );
};

// --- Team Manager Component ---
const TeamManager = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
    const unsub = onSnapshot(q, snap => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub;
  }, []);

  const confirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', deleteConfirmUser.id)); setDeleteConfirmUser(null); } 
    catch (err) { alert('Failed to delete user.'); }
  };

  const AddAccountModal = ({ onClose }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
    const handleSubmit = async (e) => {
      e.preventDefault();
      const finalEmail = formData.email.includes('@') ? formData.email : `${formData.email}@taskflow.com`;
      const uid = 'user_' + finalEmail.replace(/[^a-z0-9]/g, '');
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { uid, ...formData, email: finalEmail, createdAt: serverTimestamp() });
        onClose();
      } catch (err) { alert(err.message); }
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md p-6">
          <div className="flex justify-between mb-4"><h3 className="font-bold">Add Account</h3><button onClick={onClose}>×</button></div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Name" required className="w-full p-2 border rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            <input placeholder="Email/User" required className="w-full p-2 border rounded" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
            <input placeholder="Password" required className="w-full p-2 border rounded" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
            <select className="w-full p-2 border rounded" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}><option value="employee">Employee</option><option value="manager">Manager</option></select>
            <button className="w-full bg-blue-600 text-white p-2 rounded">Create</button>
          </form>
        </Card>
      </div>
    );
  };

  const EditAccountModal = ({ user, onClose }) => {
    const [formData, setFormData] = useState({ name: user.name, email: user.email, password: user.password, role: user.role });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.id), formData);
        onClose();
      } catch (err) { alert(err.message); }
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md p-6">
          <div className="flex justify-between mb-4"><h3 className="font-bold">Edit Account</h3><button onClick={onClose}>×</button></div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Name" required className="w-full p-2 border rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            <input placeholder="Email" required className="w-full p-2 border rounded" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
            <input placeholder="Password" required className="w-full p-2 border rounded" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
            <select className="w-full p-2 border rounded" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}><option value="employee">Employee</option><option value="manager">Manager</option></select>
            <button className="w-full bg-blue-600 text-white p-2 rounded">Save</button>
          </form>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-slate-800">Account Management</h2>
         <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700">
           <UserPlus size={18} /> Add Account
         </button>
       </div>
       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Password</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{user.email}</td>
                  <td className="p-4 flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{showPasswords[user.id] ? user.password : '••••••••'}</span>
                    <button onClick={() => setShowPasswords(p => ({...p, [user.id]: !p[user.id]}))} className="text-slate-400"><Eye size={14}/></button>
                  </td>
                  <td className="p-4 capitalize">{user.role}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setEditingUser(user)} className="text-blue-400 p-1"><Pencil size={16}/></button>
                    {user.id !== currentUser.uid && <button onClick={() => setDeleteConfirmUser(user)} className="text-red-400 p-1"><Trash2 size={16}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
       {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} />}
       {editingUser && <EditAccountModal user={editingUser} onClose={() => setEditingUser(null)} />}
       {deleteConfirmUser && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm p-6 text-center">
              <h3 className="font-bold text-lg mb-2">Delete Account?</h3>
              <p className="text-sm text-slate-500 mb-4">Are you sure you want to delete {deleteConfirmUser.name}?</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmUser(null)} className="flex-1 py-2 border rounded">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded">Delete</button>
              </div>
            </Card>
         </div>
       )}
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ userData, setView, currentUser }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsub = onSnapshot(q, snap => {
      let tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (userData?.role !== 'manager') tasks = tasks.filter(t => t.assignedTo?.includes(currentUser.uid));
      
      const now = new Date();
      let overdue = 0, pending = 0;
      tasks.forEach(t => {
        if (t.status !== 'completed') {
           pending++;
           if (t.deadline && new Date(t.deadline) < now) overdue++;
        }
      });
      setStats({ total: tasks.length, pending, overdue });
      setRecentTasks(tasks.slice(0, 5));
    });
    return () => unsub;
  }, [userData, currentUser]);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Hello, {userData?.name || currentUser?.email}</h2>
        <p className="text-slate-500">Here's what's happening today.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6"><div className="text-slate-500 mb-2">Total Tasks</div><div className="text-3xl font-bold">{stats.total}</div></Card>
        <Card className="p-6"><div className="text-slate-500 mb-2">Pending</div><div className="text-3xl font-bold text-yellow-600">{stats.pending}</div></Card>
        <Card className="p-6 bg-red-50 border-red-100"><div className="text-red-500 mb-2">Overdue</div><div className="text-3xl font-bold text-red-600">{stats.overdue}</div></Card>
      </div>
      <div>
        <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Recent Tasks</h3><button onClick={() => setView('tasks')} className="text-blue-600 text-sm">View All</button></div>
        <div className="space-y-3">
          {recentTasks.map(t => (
            <Card key={t.id} className="p-4 flex justify-between items-center">
              <div><h4 className="font-medium">{t.title}</h4><p className="text-xs text-slate-500">{t.deadline ? new Date(t.deadline).toLocaleDateString() : ''}</p></div>
              <StatusBadge status={t.status} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};