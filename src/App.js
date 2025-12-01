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
  Calendar,
  Bell,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Pencil,
  X
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
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'overdue': 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || colors['pending']}`}>
      {status.replace('-', ' ').toUpperCase()}
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
  const [appUser, setAppUser] = useState(null); // The simulated logged-in user
  const [userData, setUserData] = useState(null); // Firestore user profile data
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard, tasks, team

  // 1. Initialize Firebase Connection (Anonymous)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
        setFirebaseReady(true);
      } catch (err) {
        console.error("Firebase connection failed", err);
      }
    };
    initAuth();
  }, []);

  // 2. Check LocalStorage for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) {
      setAppUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // 3. Fetch Data for the Logged In User
  useEffect(() => {
    if (!appUser || !firebaseReady) {
      setUserData(null);
      return;
    }

    // Determine the stable UID based on username
    const stableUid = appUser.uid; 
    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', stableUid);
          
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Fallback if local session exists but DB record was deleted
        setUserData({ 
           name: appUser.name, 
           role: appUser.role,
           email: appUser.email 
        }); 
      }
    }, (error) => {
       console.error("Error fetching user data:", error);
    });

    return () => unsubscribeSnapshot();
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

  if (!appUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} firebaseReady={firebaseReady} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="text-blue-400" /> TaskFlow
          </h1>
          <p className="text-xs text-slate-400 mt-1">Project Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20}/>}>Dashboard</NavItem>
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        {view === 'dashboard' && <Dashboard userData={userData} setView={setView} currentUser={appUser} />}
        {view === 'tasks' && <TaskManager userData={userData} currentUser={appUser} />}
        {view === 'team' && userData?.role === 'manager' && <TeamManager currentUser={userData} />}
      </main>
    </div>
  );
}

// --- Sub-Components ---

const NavItem = ({ active, onClick, icon, children }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
    }`}
  >
    {icon}
    {children}
  </button>
);

// --- Auth Component ---
const AuthScreen = ({ onLoginSuccess, firebaseReady }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initial Seeding Logic (Runs once if DB is empty)
  useEffect(() => {
    if (!firebaseReady) return;

    const seedDefaultAccounts = async () => {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      const snap = await getDocs(query(usersRef, limit(1)));
      
      if (snap.empty) {
        console.log("Seeding default accounts...");
        // Seed Manager
        const mEmail = 'bryansoph@taskflow.com';
        const mUid = 'user_' + mEmail.replace(/[^a-z0-9]/g, '');
        await setDoc(doc(usersRef, mUid), {
           uid: mUid,
           name: 'Bryan Soph',
           email: mEmail,
           password: 'so146563856', // Storing for management visibility
           role: 'manager',
           createdAt: serverTimestamp()
        });

        // Seed Staff
        const sEmail = 'abctry@taskflow.com';
        const sUid = 'user_' + sEmail.replace(/[^a-z0-9]/g, '');
        await setDoc(doc(usersRef, sUid), {
           uid: sUid,
           name: 'ABC Staff',
           email: sEmail,
           password: 'bmeailab',
           role: 'employee',
           createdAt: serverTimestamp()
        });
      }
    };
    seedDefaultAccounts();
  }, [firebaseReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseReady) {
      setError("System initializing... please wait.");
      return;
    }
    
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const processEmail = (input) => input.includes('@') ? input : `${input}@taskflow.com`;
    const finalEmail = processEmail(cleanEmail);

    try {
      // Query Firestore for this user
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      const q = query(usersRef, where('email', '==', finalEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0].data();

      // Check Password
      if (userDoc.password === password) {
         // Login Success
         onLoginSuccess(userDoc);
      } else {
         setError('Incorrect password.');
      }
    } catch (err) {
      console.error(err);
      setError('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">TaskFlow Login</h2>
          <p className="text-slate-500 mt-2">Restricted Access System</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              required 
              // Removed placeholder as requested
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors flex justify-center"
          >
            {loading ? 'Verifying...' : 'Access System'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Public registration is disabled.</p>
          <p>Contact your manager for credentials.</p>
        </div>
      </Card>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ userData, setView, currentUser }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);

  useEffect(() => {
    // If we don't have userData yet, we can't reliably filter, but we can wait.
    if (!currentUser) return;

    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    // Fetch all public tasks and filter in memory to avoid permission/index issues with complex queries
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter: if not manager, only show assigned
      if (userData?.role !== 'manager') {
         tasks = tasks.filter(t => t.assignedTo?.includes(currentUser.uid));
      }

      // Memory Sort
      tasks.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      const now = new Date();
      const warningZone = new Date();
      warningZone.setDate(warningZone.getDate() + 2);

      let overdueCount = 0;
      let pendingCount = 0;
      let urgent = [];

      tasks.forEach(t => {
        if (t.status !== 'completed') {
           pendingCount++;
           const deadlineDate = t.deadline ? new Date(t.deadline) : null;
           
           if (deadlineDate && deadlineDate < now) {
             overdueCount++;
             urgent.push({...t, urgentReason: 'Overdue'});
           } else if (deadlineDate && deadlineDate < warningZone) {
             urgent.push({...t, urgentReason: 'Due Soon'});
           }
        }
      });

      setStats({
        total: tasks.length,
        pending: pendingCount,
        overdue: overdueCount
      });
      setRecentTasks(tasks.slice(0, 5));
      setUrgentTasks(urgent);
    }, (err) => console.log("Dashboard fetch error:", err));

    return () => unsubscribe();
  }, [userData, currentUser]);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Hello, {userData?.name || currentUser?.email}</h2>
        <p className="text-slate-500">Here's what's happening today.</p>
      </header>

      {/* Urgent Reminders Section */}
      {urgentTasks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="text-orange-800 font-bold flex items-center gap-2 mb-3">
            <Bell size={18} /> Attention Needed
          </h3>
          <div className="space-y-2">
            {urgentTasks.map(task => (
              <div key={task.id} className="bg-white p-3 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm">
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 ${task.urgentReason === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {task.urgentReason}
                  </span>
                  <span className="font-medium text-slate-800">{task.title}</span>
                </div>
                <button onClick={() => setView('tasks')} className="text-xs text-blue-600 font-medium hover:underline">View</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Tasks" value={stats.total} icon={<FileText className="text-blue-500"/>} />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="text-yellow-500"/>} />
        <StatCard title="Overdue" value={stats.overdue} icon={<AlertCircle className="text-red-500"/>} bg="bg-red-50" />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Recent Tasks</h3>
          <button onClick={() => setView('tasks')} className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <p className="text-slate-400 italic">No tasks found.</p>
          ) : (
            recentTasks.map(task => (
              <Card key={task.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar size={12} /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                  </p>
                </div>
                <StatusBadge status={task.status || 'pending'} />
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg = "bg-white" }) => (
  <Card className={`p-6 ${bg}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="text-slate-500 font-medium">{title}</div>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-slate-800">{value}</div>
  </Card>
);

// --- Task Manager Component ---
const TaskManager = ({ userData, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch Users for assignment (Manager only)
  useEffect(() => {
    if (!userData || userData.role !== 'manager') return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, err => console.log("User fetch error", err));
    return () => unsub;
  }, [userData]);

  // Fetch Tasks
  useEffect(() => {
    if (!currentUser) return;
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    
    // Default Query (fetch all then filter in memory)
    const q = query(tasksRef);
    
    const unsub = onSnapshot(q, snap => {
      let loadedTasks = snap.docs.map(d => ({id: d.id, ...d.data()}));
      
      // Filter in memory
      if (userData?.role !== 'manager') {
         loadedTasks = loadedTasks.filter(t => t.assignedTo?.includes(currentUser.uid));
      }

      // Sort in memory
      loadedTasks.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTasks(loadedTasks);
    }, err => console.log("Task fetch error", err));
    return () => unsub;
  }, [userData, currentUser]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {userData?.role === 'manager' ? 'Manage Tasks' : 'My Assignments'}
        </h2>
        {userData?.role === 'manager' && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
          >
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
        {/* Task List */}
        <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-3 pb-20">
          {tasks.map(task => (
            <div 
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedTask?.id === task.id 
                ? 'bg-blue-50 border-blue-500 shadow-md' 
                : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <StatusBadge status={task.status} />
                {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && (
                   <span className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Overdue</span>
                )}
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{task.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center text-slate-400 mt-10">No tasks found.</p>}
        </div>

        {/* Task Detail View */}
        <div className="lg:col-span-2 overflow-y-auto pb-20">
          {selectedTask ? (
            <TaskDetail 
              task={selectedTask} 
              currentUser={userData || { name: 'User', role: 'employee' }} 
              allUsers={users}
              onClose={() => setSelectedTask(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
              <CheckSquare size={48} className="mb-4 opacity-20" />
              <p>Select a task to view details or report progress.</p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <CreateTaskModal 
          users={users} 
          onClose={() => setIsCreating(false)} 
        />
      )}
    </div>
  );
};

// --- Task Detail & Progress Report ---
const TaskDetail = ({ task, currentUser, allUsers, onClose }) => {
  const [updateText, setUpdateText] = useState('');
  const [fileLink, setFileLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isManager = currentUser?.role === 'manager';
  const assignedNames = allUsers
    .filter(u => task.assignedTo?.includes(u.uid))
    .map(u => u.name)
    .join(', ') || 'Unassigned';

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if(!updateText && !fileLink) return;
    setSubmitting(true);

    const newLog = {
      text: updateText,
      link: fileLink,
      user: currentUser.name || 'User',
      createdAt: new Date().toISOString()
    };

    const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
    
    // We update the logs array. We also might want to auto-update status to 'in-progress' if it was pending
    const updates = {
      progressLogs: [...(task.progressLogs || []), newLog]
    };
    if (task.status === 'pending') updates.status = 'in-progress';

    try {
      await updateDoc(taskRef, updates);
      setUpdateText('');
      setFileLink('');
    } catch (err) {
      alert("Failed to update task");
    }
    setSubmitting(false);
  };

  const markComplete = async () => {
    const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
    await updateDoc(taskRef, { status: 'completed' });
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{task.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Users size={14}/> {assignedNames}</span>
            <span className="flex items-center gap-1"><Calendar size={14}/> Due: {task.deadline}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={onClose} className="md:hidden text-slate-400"><ChevronUp/></button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h4>
          <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Progress History</h4>
          <div className="space-y-4">
            {task.progressLogs?.map((log, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="mt-1 min-w-[24px] h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {log.user[0]}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700">{log.user}</span>
                    <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600">{log.text}</p>
                  {log.link && (
                    <a href={log.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <LinkIcon size={12}/> View Attachment
                    </a>
                  )}
                </div>
              </div>
            ))}
            {(!task.progressLogs || task.progressLogs.length === 0) && (
              <p className="text-sm text-slate-400 italic">No updates yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Input Area */}
      {task.status !== 'completed' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
           <form onSubmit={handleProgressSubmit} className="space-y-3">
             <textarea 
               placeholder="Report progress..." 
               className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
               rows="2"
               value={updateText}
               onChange={e => setUpdateText(e.target.value)}
             />
             <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="https:// (Link to File/Video)" 
                  className="flex-1 p-2 rounded-lg border border-slate-300 text-sm outline-none"
                  value={fileLink}
                  onChange={e => setFileLink(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-blue-600 text-white px-4 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <Send size={16}/> Report
                </button>
                {isManager && (
                   <button 
                    type="button"
                    onClick={markComplete}
                    className="bg-green-600 text-white px-4 rounded-lg font-medium text-sm"
                   >
                     Done
                   </button>
                )}
             </div>
           </form>
        </div>
      )}
    </Card>
  );
};

// --- Create Task Modal ---
const CreateTaskModal = ({ users, onClose }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleUser = (uid) => {
    if (assignedTo.includes(uid)) {
      setAssignedTo(assignedTo.filter(id => id !== uid));
    } else {
      setAssignedTo([...assignedTo, uid]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
        title,
        description: desc,
        deadline,
        assignedTo, // Array of UIDs
        status: 'pending',
        createdAt: serverTimestamp(),
        progressLogs: []
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating task");
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Duties</label>
            <textarea required rows="3" className="w-full p-2 border rounded-lg" value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
            <input type="date" required className="w-full p-2 border rounded-lg" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-lg">
              {users.map(u => (
                <div key={u.id} 
                  onClick={() => toggleUser(u.uid)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${assignedTo.includes(u.uid) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${assignedTo.includes(u.uid) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {assignedTo.includes(u.uid) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm">{u.name} ({u.email})</span>
                </div>
              ))}
              {users.length === 0 && <p className="text-xs text-slate-400">No other users found. Invite them to sign up!</p>}
            </div>
          </div>

          <div className="pt-4">
             <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
               {loading ? 'Creating...' : 'Assign Job'}
             </button>
          </div>
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
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, error => console.error(error));
    return () => unsub;
  }, []);

  const togglePassword = (uid) => {
    setShowPasswords(prev => ({...prev, [uid]: !prev[uid]}));
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirmUser(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', deleteConfirmUser.id));
      setDeleteConfirmUser(null);
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-slate-800">Account Management</h2>
         <button 
           onClick={() => setShowAddModal(true)}
           className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700"
         >
           <UserPlus size={18} /> Add Account
         </button>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Username / Email</th>
                <th className="p-4 font-medium">Password</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{user.name}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{user.email}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                         {showPasswords[user.id] ? user.password : '••••••••'}
                      </span>
                      <button onClick={() => togglePassword(user.id)} className="text-slate-400 hover:text-blue-600">
                        {showPasswords[user.id] ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${user.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Edit Button */}
                       <button 
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit Account"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* Delete Button (Hide for self) */}
                      {user.id !== currentUser.uid && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="p-8 text-center text-slate-400">No users found.</div>}
       </div>

       {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} />}
       {editingUser && <EditAccountModal user={editingUser} onClose={() => setEditingUser(null)} />}
       {deleteConfirmUser && (
         <DeleteConfirmModal 
           user={deleteConfirmUser} 
           onConfirm={confirmDelete} 
           onCancel={() => setDeleteConfirmUser(null)} 
         />
       )}
    </div>
  );
};

const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <Card className="w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
        <AlertCircle size={24} />
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-2">Delete Account?</h3>
      <p className="text-slate-500 text-sm mb-6">
        Are you sure you want to delete <span className="font-bold text-slate-800">{user.name}</span>? 
        This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Card>
  </div>
);

const AddAccountModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const processEmail = (input) => input.includes('@') ? input : `${input}@taskflow.com`;
    const finalEmail = processEmail(cleanEmail);
    
    // Create consistent UID
    const uid = 'user_' + finalEmail.replace(/[^a-z0-9]/g, '');

    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      await setDoc(doc(usersRef, uid), {
         uid,
         name,
         email: finalEmail,
         password,
         role,
         createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      alert("Error adding user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Add New Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" required className="w-full p-2 border rounded-lg" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
            <input 
               type="text" 
               required 
               placeholder="e.g. john" 
               className="w-full p-2 border rounded-lg" 
               value={email} 
               onChange={e=>setEmail(e.target.value)} 
            />
            <p className="text-xs text-slate-400 mt-1">Will be saved as {email.includes('@') ? email : `${email || '...'}@taskflow.com`}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="text" required className="w-full p-2 border rounded-lg font-mono text-sm" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select className="w-full p-2 border rounded-lg" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="employee">Employee / Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 mt-4">
             {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Card>
    </div>
  );
};

const EditAccountModal = ({ user, onClose }) => {
  const [name, setName] = useState(user.name);
  // We allow editing email, but note that the internal ID (uid) won't change
  const [email, setEmail] = useState(user.email.replace('@taskflow.com', '')); 
  const [password, setPassword] = useState(user.password);
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const processEmail = (input) => input.includes('@') ? input : `${input}@taskflow.com`;
    const finalEmail = processEmail(cleanEmail);

    try {
      // Update existing document
      // Note: We do NOT change the document ID (uid), only the data fields.
      // This ensures external references (if any) don't break, and is simpler.
      // However, the login system queries by 'email' field, so login WILL work with new email.
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.id);
      
      await updateDoc(userRef, {
         name,
         email: finalEmail,
         password,
         role
      });
      onClose();
    } catch (err) {
      alert("Error updating user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Edit Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" required className="w-full p-2 border rounded-lg" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
            <input 
               type="text" 
               required 
               className="w-full p-2 border rounded-lg" 
               value={email} 
               onChange={e=>setEmail(e.target.value)} 
            />
            <p className="text-xs text-slate-400 mt-1">
              Saving as: {email.includes('@') ? email : `${email || '...'}@taskflow.com`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="text" required className="w-full p-2 border rounded-lg font-mono text-sm" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select className="w-full p-2 border rounded-lg" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="employee">Employee / Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 mt-4">
             {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Card>
    </div>
  );
};