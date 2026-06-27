import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface LoginHistoryRecord {
  id: string;
  email: string;
  time: string;
  device: string;
  ip: string;
  status: 'Thành Công' | 'Sai Mật Khẩu' | 'Lỗi Xác Thực';
}

const COLLECTION_NAME = 'login_history';

function parseUserAgent(ua: string): string {
  if (ua.includes('Macintosh')) {
    const chrome = ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Safari';
    return `Mac OS (${chrome})`;
  }
  if (ua.includes('Windows')) {
    const edge = ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : 'Firefox';
    return `Windows (${edge})`;
  }
  if (ua.includes('iPhone') || ua.includes('iPad')) {
    return 'iOS Device';
  }
  if (ua.includes('Android')) {
    return 'Android Device';
  }
  return 'Trình duyệt Web';
}

export async function recordLogin(email: string, status: 'Thành Công' | 'Sai Mật Khẩu' | 'Lỗi Xác Thực'): Promise<void> {
  const localKey = `login_history_${email.toLowerCase().trim()}`;
  
  // 1. Get IP address
  let ip = '14.161.22.4'; // Fallback VN IP
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) ip = data.ip;
    }
  } catch (err) {
    console.log("Could not fetch public IP, using fallback:", err);
  }

  // 2. Parse User Agent
  const device = parseUserAgent(navigator.userAgent);

  // 3. Format Date
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const record: LoginHistoryRecord = {
    id: `LH-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    email: email.toLowerCase().trim(),
    time: dateStr,
    device,
    ip,
    status
  };

  // 4. Save to Firestore if user is authenticated (if status is success, auth.currentUser is populated)
  if (auth.currentUser && status === 'Thành Công') {
    try {
      await setDoc(doc(db, COLLECTION_NAME, record.id), record);
    } catch (err) {
      console.warn("Failed to save login history to Firestore:", err);
    }
  }

  // 5. Save to LocalStorage (both success and fail)
  try {
    const cached = localStorage.getItem(localKey);
    let history: LoginHistoryRecord[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(history)) history = [];
    history.unshift(record);
    // Keep only top 10
    history = history.slice(0, 10);
    localStorage.setItem(localKey, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save login history to LocalStorage:", err);
  }
}

export async function getLoginHistory(email: string): Promise<LoginHistoryRecord[]> {
  const cleanEmail = email.toLowerCase().trim();
  const localKey = `login_history_${cleanEmail}`;

  // 1. Try to fetch from Firestore if authenticated
  if (auth.currentUser) {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);
      const list: LoginHistoryRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push(docSnap.data() as LoginHistoryRecord);
      });
      if (list.length > 0) {
        // Sort descending by time
        list.sort((a, b) => {
          const parseTime = (t: string) => {
            const parts = t.split(/[/\s•:-]+/);
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4])).getTime();
          };
          return parseTime(b.time) - parseTime(a.time);
        });
        localStorage.setItem(localKey, JSON.stringify(list.slice(0, 10)));
        return list.slice(0, 5);
      }
    } catch (err) {
      console.warn("Failed to get login history from Firestore:", err);
    }
  }

  // 2. Fallback to LocalStorage
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      const list = JSON.parse(cached) as LoginHistoryRecord[];
      if (Array.isArray(list)) {
        return list.slice(0, 5);
      }
    }
  } catch (err) {
    console.error(err);
  }

  // Default initial mock history
  const defaultHistory: LoginHistoryRecord[] = [
    { id: 'LH-1', email: cleanEmail, time: '11/06/2026 - 08:35', device: 'Mac OS (Chrome)', ip: '113.161.42.12', status: 'Thành Công' },
    { id: 'LH-2', email: cleanEmail, time: '10/06/2026 - 15:20', device: 'Windows (Edge)', ip: '14.161.22.4', status: 'Thành Công' },
    { id: 'LH-3', email: cleanEmail, time: '10/06/2026 - 15:18', device: 'Windows (Edge)', ip: '14.161.22.4', status: 'Sai Mật Khẩu' }
  ];
  localStorage.setItem(localKey, JSON.stringify(defaultHistory));
  return defaultHistory.slice(0, 5);
}
