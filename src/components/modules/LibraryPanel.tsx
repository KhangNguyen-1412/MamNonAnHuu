import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Plus, Search, BookOpen, Calendar, Archive, Printer, Ban, 
  ShieldAlert, Eye, CheckCircle, Clock, Trash2, Edit, Check, X, ArrowRight, 
  UserCheck, Inbox, AlertTriangle, FileSpreadsheet, Lock, Users, PlusCircle, 
  CheckCircle2, ChevronRight, FileUp, Send, CheckCheck, RefreshCw, Barcode,
  RotateCcw, Sparkles, BookMarked, ShoppingCart, HelpCircle, AlertCircle, Play, Info
} from 'lucide-react';
import { ModalBase } from '../ui/Modals';
import { FilterSelect } from '../ui/BaseInputs';
import { 
  getLibraryBooks, saveLibraryBook, deleteLibraryBook,
  getLibraryTransactions, saveLibraryTransaction, deleteLibraryTransaction,
  getLibraryReaders, saveLibraryReader, deleteLibraryReader,
  getLibraryInventoryReports, saveLibraryInventoryReport,
  getLibraryPurchaseRequests, saveLibraryPurchaseRequest,
  saveFinanceReceipt, TuitionReceipt,
  LibraryBook, LibraryTransaction, LibraryReader, LibraryInventoryReport, LibraryPurchaseRequest
} from '../../services/dbService';
import { getStudents } from '../../services/studentService';
import { getStaffList } from '../../services/hrService';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend 
} from 'recharts';
import { ModuleId } from '../../types';

interface LibraryPanelProps {
  initialTab?: 'overview' | 'circulation' | 'inventory' | 'readers' | 'audit';
  onSelectModule?: (moduleId: ModuleId) => void;
}

// Session scan log interface for Recess POS
interface PosScanLog {
  timestamp: string;
  type: 'borrow' | 'return';
  readerName: string;
  bookTitle: string;
  status: 'Thành công' | 'Thất bại';
  message: string;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ initialTab, onSelectModule }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'circulation' | 'inventory' | 'readers' | 'audit'>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // State arrays loaded from Firestore
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [readers, setReaders] = useState<LibraryReader[]>([]);
  const [inventories, setInventories] = useState<LibraryInventoryReport[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<LibraryPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Pagination & Loading
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState<string | null>(null);

  // Quick POS States (Overview Bar)
  const [posMode, setPosMode] = useState<'borrow' | 'return'>('borrow');
  const [posReaderId, setPosReaderId] = useState('');
  const [posBookId, setPosBookId] = useState('');
  const [posSuccessMsg, setPosSuccessMsg] = useState<string | null>(null);
  const [posErrorMsg, setPosErrorMsg] = useState<string | null>(null);
  const barcodeReaderInputRef = useRef<HTMLInputElement>(null);
  const barcodeBookInputRef = useRef<HTMLInputElement>(null);

  // Dedicated POS sub-tab states
  const [posTabMode, setPosTabMode] = useState<'borrow' | 'return'>('borrow');
  const [posTabReaderId, setPosTabReaderId] = useState('');
  const [posTabBookId, setPosTabBookId] = useState('');
  const [posTabSuccessMsg, setPosTabSuccessMsg] = useState<string | null>(null);
  const [posTabErrorMsg, setPosTabErrorMsg] = useState<string | null>(null);
  const posTabReaderRef = useRef<HTMLInputElement>(null);
  const posTabBookRef = useRef<HTMLInputElement>(null);
  const [posSessionLogs, setPosSessionLogs] = useState<PosScanLog[]>([]);

  // Circulation Sub-tabs
  const [circulationSubTab, setCirculationSubTab] = useState<'pos' | 'logs' | 'overdue' | 'readingRoom'>('pos');
  // Inventory Sub-tabs
  const [inventorySubTab, setInventorySubTab] = useState<'catalog' | 'labels'>('catalog');
  // Audit Sub-tabs
  const [auditSubTab, setAuditSubTab] = useState<'stocktake' | 'damage' | 'purchase'>('stocktake');

  // Filter conditions
  const [bookCategoryFilter, setBookCategoryFilter] = useState('All');
  const [bookStatusFilter, setBookStatusFilter] = useState('All');

  // Reading room student entry state
  const [readingRoomStudentId, setReadingRoomStudentId] = useState('');

  // Selected details drawer
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  // Selected reader history modal
  const [selectedReader, setSelectedReader] = useState<LibraryReader | null>(null);

  // Form states
  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Sách giáo khoa' as any,
    shelf: 'Kệ A - Tầng 1',
    totalCopies: 5,
    publisher: 'NXB Giáo Dục',
    publishYear: '2025',
    pages: 150,
    price: 45000,
    description: ''
  });

  const [checkoutForm, setCheckoutForm] = useState({
    readerId: '',
    bookId: '',
    dueDate: '28/06/2026',
    type: 'Mang về' as 'Mang về' | 'Đọc tại chỗ'
  });

  const [damageForm, setDamageForm] = useState({
    transactionId: '',
    damageNote: '',
    action: 'Bắt đền bù' as 'Bắt đền bù' | 'Thanh lý hao mòn' | 'Chuyển sửa chữa',
    compensationFee: 100000
  });

  const [purchaseForm, setPurchaseForm] = useState({
    title: '',
    items: '',
    reason: '',
    budget: 500000
  });

  const [stocktakeForm, setStocktakeForm] = useState({
    actualCount: 0,
    notes: ''
  });

  // Synthesis Beep Sound for scan confirmation
  const playBeepSound = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('AudioContext not allowed or not supported', e);
    }
  };

  // Load data from Firestore and sync readers with school board lists
  const loadData = async () => {
    setLoading(true);
    try {
      const [booksData, txData, readersData, invData, purData, studentsData, staffData] = await Promise.all([
        getLibraryBooks(),
        getLibraryTransactions(),
        getLibraryReaders(),
        getLibraryInventoryReports(),
        getLibraryPurchaseRequests(),
        getStudents().catch(() => []),
        getStaffList().catch(() => [])
      ]);
      
      setBooks(booksData);
      setTransactions(txData);
      setInventories(invData);
      setPurchaseRequests(purData);

      // Auto sync reader profiles with existing system lists
      let syncedReaders = [...readersData];
      let hasNewSync = false;

      studentsData.forEach(student => {
        if (!syncedReaders.some(r => r.id === student.id)) {
          const newReader: LibraryReader = {
            id: student.id,
            name: student.name,
            role: 'Học sinh',
            classOrDept: student.grade,
            activeLoansCount: 0,
            totalLoansCount: 0
          };
          syncedReaders.push(newReader);
          saveLibraryReader(newReader);
          hasNewSync = true;
        }
      });

      staffData.forEach(staff => {
        if (!syncedReaders.some(r => r.id === staff.id)) {
          const newReader: LibraryReader = {
            id: staff.id,
            name: staff.name,
            role: 'Giáo viên',
            classOrDept: staff.department,
            activeLoansCount: 0,
            totalLoansCount: 0
          };
          syncedReaders.push(newReader);
          saveLibraryReader(newReader);
          hasNewSync = true;
        }
      });

      setReaders(syncedReaders);
    } catch (err) {
      console.error("Failed to load library workspace database collections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Autofocus reader input in POS mode on Overview Dashboard
  useEffect(() => {
    if (activeTab === 'overview' && barcodeReaderInputRef.current) {
      barcodeReaderInputRef.current.focus();
    }
  }, [activeTab]);

  // Autofocus in Circulation POS tab
  useEffect(() => {
    if (activeTab === 'circulation' && circulationSubTab === 'pos') {
      if (posTabMode === 'borrow' && posTabReaderRef.current) {
        posTabReaderRef.current.focus();
      } else if (posTabMode === 'return' && posTabBookRef.current) {
        posTabBookRef.current.focus();
      }
    }
  }, [activeTab, circulationSubTab, posTabMode]);

  // Quick POS execution (Dashboard Bar)
  const handleQuickPosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosSuccessMsg(null);
    setPosErrorMsg(null);

    // Return Mode
    if (posMode === 'return') {
      const cleanBookId = posBookId.trim();
      if (!cleanBookId) return;

      const book = books.find(b => b.id === cleanBookId);
      if (!book) {
        playBeepSound('error');
        setPosErrorMsg(`Không tìm thấy Sách có mã: ${cleanBookId}`);
        return;
      }

      // Find outstanding transaction
      const activeTx = transactions.find(t => t.bookId === cleanBookId && (t.status === 'Đang mượn' || t.status === 'Quá hạn'));
      if (!activeTx) {
        playBeepSound('error');
        setPosErrorMsg(`Sách "${book.title}" (${cleanBookId}) hiện không được ghi nhận cho mượn.`);
        return;
      }

      // Process return
      const todayStr = '21/06/2026';
      const updatedTx: LibraryTransaction = {
        ...activeTx,
        status: 'Đã trả',
        returnDate: todayStr
      };

      const updatedBook: LibraryBook = {
        ...book,
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
        status: 'Sẵn sàng mượn'
      };

      const reader = readers.find(r => r.id === activeTx.readerId);
      const updatedReader: LibraryReader | null = reader ? {
        ...reader,
        activeLoansCount: Math.max(0, reader.activeLoansCount - 1)
      } : null;

      try {
        await Promise.all([
          saveLibraryTransaction(updatedTx),
          saveLibraryBook(updatedBook),
          updatedReader ? saveLibraryReader(updatedReader) : Promise.resolve()
        ]);

        setTransactions(prev => prev.map(t => t.id === activeTx.id ? updatedTx : t));
        setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
        if (updatedReader) {
          setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));
        }

        playBeepSound('success');
        setPosSuccessMsg(`Thành công: Đã trả sách "${book.title}". Bạn đọc: ${activeTx.readerName}.`);
        setPosBookId('');
        barcodeBookInputRef.current?.focus();
      } catch (err) {
        playBeepSound('error');
        setPosErrorMsg('Lỗi kết nối cơ sở dữ liệu khi trả sách.');
      }
      return;
    }

    // Borrow Mode
    const cleanReaderId = posReaderId.trim();
    const cleanBookId = posBookId.trim();

    if (!cleanReaderId) {
      barcodeReaderInputRef.current?.focus();
      return;
    }
    if (!cleanBookId) {
      barcodeBookInputRef.current?.focus();
      return;
    }

    const reader = readers.find(r => r.id === cleanReaderId);
    if (!reader) {
      playBeepSound('error');
      setPosErrorMsg(`Không tìm thấy Bạn đọc có mã: ${cleanReaderId}`);
      barcodeReaderInputRef.current?.select();
      return;
    }

    const book = books.find(b => b.id === cleanBookId);
    if (!book) {
      playBeepSound('error');
      setPosErrorMsg(`Không tìm thấy Sách có mã: ${cleanBookId}`);
      barcodeBookInputRef.current?.select();
      return;
    }

    if (book.status === 'Đã cho mượn' || book.availableCopies <= 0) {
      playBeepSound('error');
      setPosErrorMsg(`Sách "${book.title}" hiện đã được cho mượn hết.`);
      return;
    }

    if (book.status === 'Đang sửa chữa' || book.status === 'Đã thanh lý') {
      playBeepSound('error');
      setPosErrorMsg(`Sách "${book.title}" không sẵn sàng để lưu thông (Trạng thái: ${book.status}).`);
      return;
    }

    // Process borrow
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 7); // Default 7 days loan

    const pad = (num: number) => String(num).padStart(2, '0');
    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    const newTx: LibraryTransaction = {
      id: `TX-LIB-${Math.floor(Math.random() * 90000 + 10000)}`,
      readerId: reader.id,
      readerName: reader.name,
      readerClass: reader.classOrDept,
      bookId: book.id,
      bookTitle: book.title,
      borrowDate: '21/06/2026',
      dueDate: formatDate(dueDate),
      type: 'Mang về',
      status: 'Đang mượn'
    };

    // Update book status
    const updatedBook: LibraryBook = {
      ...book,
      availableCopies: book.availableCopies - 1,
      status: book.availableCopies - 1 === 0 ? 'Đã cho mượn' : book.status
    };

    // Update reader loans count
    const updatedReader: LibraryReader = {
      ...reader,
      activeLoansCount: reader.activeLoansCount + 1,
      totalLoansCount: reader.totalLoansCount + 1
    };

    try {
      await Promise.all([
        saveLibraryTransaction(newTx),
        saveLibraryBook(updatedBook),
        saveLibraryReader(updatedReader)
      ]);

      setTransactions(prev => [newTx, ...prev]);
      setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
      setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));

      playBeepSound('success');
      setPosSuccessMsg(`Thành công: Đã cho mượn "${book.title}" cho bạn đọc "${reader.name}".`);
      setPosReaderId('');
      setPosBookId('');
      barcodeReaderInputRef.current?.focus();
    } catch (err) {
      playBeepSound('error');
      setPosErrorMsg('Đã xảy ra lỗi khi ghi nhận giao dịch.');
    }
  };

  // Dedicated POS Tab submit
  const handleTabPosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosTabSuccessMsg(null);
    setPosTabErrorMsg(null);

    const nowTime = new Date().toLocaleTimeString('vi-VN').slice(0, 5);

    if (posTabMode === 'return') {
      const cleanBookId = posTabBookId.trim();
      if (!cleanBookId) return;

      const book = books.find(b => b.id === cleanBookId);
      if (!book) {
        playBeepSound('error');
        setPosTabErrorMsg(`Không tìm thấy Sách có mã: ${cleanBookId}`);
        setPosSessionLogs(prev => [{
          timestamp: nowTime,
          type: 'return',
          readerName: '-',
          bookTitle: cleanBookId,
          status: 'Thất bại',
          message: 'Không tìm thấy ID sách'
        }, ...prev]);
        return;
      }

      const activeTx = transactions.find(t => t.bookId === cleanBookId && (t.status === 'Đang mượn' || t.status === 'Quá hạn'));
      if (!activeTx) {
        playBeepSound('error');
        setPosTabErrorMsg(`Sách "${book.title}" hiện không được ghi nhận cho mượn.`);
        setPosSessionLogs(prev => [{
          timestamp: nowTime,
          type: 'return',
          readerName: '-',
          bookTitle: book.title,
          status: 'Thất bại',
          message: 'Sách đang nằm trong kho (không cho mượn)'
        }, ...prev]);
        return;
      }

      // Return process
      const updatedTx: LibraryTransaction = {
        ...activeTx,
        status: 'Đã trả',
        returnDate: '21/06/2026'
      };

      const updatedBook: LibraryBook = {
        ...book,
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
        status: 'Sẵn sàng mượn'
      };

      const reader = readers.find(r => r.id === activeTx.readerId);
      const updatedReader: LibraryReader | null = reader ? {
        ...reader,
        activeLoansCount: Math.max(0, reader.activeLoansCount - 1)
      } : null;

      try {
        await Promise.all([
          saveLibraryTransaction(updatedTx),
          saveLibraryBook(updatedBook),
          updatedReader ? saveLibraryReader(updatedReader) : Promise.resolve()
        ]);

        setTransactions(prev => prev.map(t => t.id === activeTx.id ? updatedTx : t));
        setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
        if (updatedReader) {
          setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));
        }

        playBeepSound('success');
        setPosTabSuccessMsg(`THÀNH CÔNG: Đã thu hồi sách "${book.title}" từ bạn đọc ${activeTx.readerName}.`);
        setPosSessionLogs(prev => [{
          timestamp: nowTime,
          type: 'return',
          readerName: activeTx.readerName,
          bookTitle: book.title,
          status: 'Thành công',
          message: 'Nhận trả sách thành công'
        }, ...prev]);
        setPosTabBookId('');
        posTabBookRef.current?.focus();
      } catch (err) {
        playBeepSound('error');
        setPosTabErrorMsg('Lỗi cập nhật Firestore khi nhận trả.');
      }
      return;
    }

    // Borrow Mode
    const cleanReaderId = posTabReaderId.trim();
    const cleanBookId = posTabBookId.trim();

    if (!cleanReaderId) {
      posTabReaderRef.current?.focus();
      return;
    }
    if (!cleanBookId) {
      posTabBookRef.current?.focus();
      return;
    }

    const reader = readers.find(r => r.id === cleanReaderId);
    if (!reader) {
      playBeepSound('error');
      setPosTabErrorMsg(`Không tìm thấy Bạn đọc có mã: ${cleanReaderId}`);
      posTabReaderRef.current?.select();
      return;
    }

    const book = books.find(b => b.id === cleanBookId);
    if (!book) {
      playBeepSound('error');
      setPosTabErrorMsg(`Không tìm thấy Sách có mã: ${cleanBookId}`);
      posTabBookRef.current?.select();
      return;
    }

    if (book.availableCopies <= 0) {
      playBeepSound('error');
      setPosTabErrorMsg(`Sách "${book.title}" hiện đã được cho mượn hết.`);
      setPosSessionLogs(prev => [{
        timestamp: nowTime,
        type: 'borrow',
        readerName: reader.name,
        bookTitle: book.title,
        status: 'Thất bại',
        message: 'Hết bản sách sẵn sàng'
      }, ...prev]);
      return;
    }

    if (book.status === 'Đang sửa chữa' || book.status === 'Đã thanh lý') {
      playBeepSound('error');
      setPosTabErrorMsg(`Sách "${book.title}" ở trạng thái không thể lưu thông.`);
      return;
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 7);
    const pad = (num: number) => String(num).padStart(2, '0');
    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    const newTx: LibraryTransaction = {
      id: `TX-LIB-${Math.floor(Math.random() * 90000 + 10000)}`,
      readerId: reader.id,
      readerName: reader.name,
      readerClass: reader.classOrDept,
      bookId: book.id,
      bookTitle: book.title,
      borrowDate: '21/06/2026',
      dueDate: formatDate(dueDate),
      type: 'Mang về',
      status: 'Đang mượn'
    };

    const updatedBook: LibraryBook = {
      ...book,
      availableCopies: book.availableCopies - 1,
      status: book.availableCopies - 1 === 0 ? 'Đã cho mượn' : book.status
    };

    const updatedReader: LibraryReader = {
      ...reader,
      activeLoansCount: reader.activeLoansCount + 1,
      totalLoansCount: reader.totalLoansCount + 1
    };

    try {
      await Promise.all([
        saveLibraryTransaction(newTx),
        saveLibraryBook(updatedBook),
        saveLibraryReader(updatedReader)
      ]);

      setTransactions(prev => [newTx, ...prev]);
      setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
      setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));

      playBeepSound('success');
      setPosTabSuccessMsg(`THÀNH CÔNG: Cho mượn "${book.title}" cho bạn đọc ${reader.name}.`);
      setPosSessionLogs(prev => [{
        timestamp: nowTime,
        type: 'borrow',
        readerName: reader.name,
        bookTitle: book.title,
        status: 'Thành công',
        message: 'Mượn sách thành công'
      }, ...prev]);
      setPosTabReaderId('');
      setPosTabBookId('');
      posTabReaderRef.current?.focus();
    } catch (err) {
      playBeepSound('error');
      setPosTabErrorMsg('Lỗi ghi nhận mượn sách vào DB.');
    }
  };

  // Regular book save
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.isbn.trim()) {
      alert('Vui lòng nhập tiêu đề sách và mã ISBN');
      return;
    }

    const nextId = `BK-${Math.floor(Math.random() * 900 + 100)}`;
    const newBook: LibraryBook = {
      id: nextId,
      isbn: bookForm.isbn.trim(),
      title: bookForm.title.trim(),
      author: bookForm.author.trim() || 'Nhiều tác giả',
      category: bookForm.category,
      shelf: bookForm.shelf,
      totalCopies: Number(bookForm.totalCopies),
      availableCopies: Number(bookForm.totalCopies),
      status: 'Sẵn sàng mượn'
    };

    try {
      await saveLibraryBook(newBook);
      setBooks(prev => [newBook, ...prev]);
      setModalOpen(null);
      setBookForm({
        isbn: '',
        title: '',
        author: '',
        category: 'Sách giáo khoa',
        shelf: 'Kệ A - Tầng 1',
        totalCopies: 5,
        publisher: 'NXB Giáo Dục',
        publishYear: '2025',
        pages: 150,
        price: 45000,
        description: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Regular borrow checkout from form
  const handleCheckoutBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const reader = readers.find(r => r.id === checkoutForm.readerId);
    const book = books.find(b => b.id === checkoutForm.bookId);

    if (!reader || !book) {
      alert('Vui lòng kiểm tra lại mã Sách hoặc mã Bạn đọc');
      return;
    }

    if (book.availableCopies <= 0) {
      alert('Sách đã hết bản sẵn sàng cho mượn.');
      return;
    }

    const newTx: LibraryTransaction = {
      id: `TX-LIB-${Math.floor(Math.random() * 90000 + 10000)}`,
      readerId: reader.id,
      readerName: reader.name,
      readerClass: reader.classOrDept,
      bookId: book.id,
      bookTitle: book.title,
      borrowDate: '21/06/2026',
      dueDate: checkoutForm.dueDate,
      type: checkoutForm.type,
      status: 'Đang mượn'
    };

    const updatedBook: LibraryBook = {
      ...book,
      availableCopies: book.availableCopies - 1,
      status: book.availableCopies - 1 === 0 ? 'Đã cho mượn' : book.status
    };

    const updatedReader: LibraryReader = {
      ...reader,
      activeLoansCount: reader.activeLoansCount + 1,
      totalLoansCount: reader.totalLoansCount + 1
    };

    try {
      await Promise.all([
        saveLibraryTransaction(newTx),
        saveLibraryBook(updatedBook),
        saveLibraryReader(updatedReader)
      ]);

      setTransactions(prev => [newTx, ...prev]);
      setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
      setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));
      setModalOpen(null);
      setCheckoutForm({
        readerId: '',
        bookId: '',
        dueDate: '28/06/2026',
        type: 'Mang về'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Return a book from transaction log list
  const handleReturnBook = async (tx: LibraryTransaction) => {
    const book = books.find(b => b.id === tx.bookId);
    const reader = readers.find(r => r.id === tx.readerId);

    const updatedTx: LibraryTransaction = {
      ...tx,
      status: 'Đã trả',
      returnDate: '21/06/2026'
    };

    const updatedBook: LibraryBook = book ? {
      ...book,
      availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
      status: 'Sẵn sàng mượn'
    } : null;

    const updatedReader: LibraryReader = reader ? {
      ...reader,
      activeLoansCount: Math.max(0, reader.activeLoansCount - 1)
    } : null;

    try {
      await saveLibraryTransaction(updatedTx);
      if (updatedBook) await saveLibraryBook(updatedBook);
      if (updatedReader) await saveLibraryReader(updatedReader);

      setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));
      if (updatedBook) setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
      if (updatedReader) setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));

      playBeepSound('success');
      alert(`Đã trả sách "${tx.bookTitle}" thành công!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit lost/damage and transfer to accounting
  const handleSaveDamageReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const tx = transactions.find(t => t.id === damageForm.transactionId);
    if (!tx) {
      alert('Không tìm thấy giao dịch tương ứng');
      return;
    }

    const book = books.find(b => b.id === tx.bookId);
    const reader = readers.find(r => r.id === tx.readerId);

    // Update transaction status
    const updatedTx: LibraryTransaction = {
      ...tx,
      status: 'Mất hỏng',
      compensationFee: damageForm.action === 'Bắt đền bù' ? Number(damageForm.compensationFee) : undefined,
      compensationPaid: false
    };

    // Update book copies
    let updatedBook: LibraryBook | null = null;
    if (book) {
      if (damageForm.action === 'Chuyển sửa chữa') {
        updatedBook = { ...book, status: 'Đang sửa chữa' };
      } else {
        // Lost/Liquidate -> Decrement total count
        updatedBook = {
          ...book,
          totalCopies: Math.max(0, book.totalCopies - 1),
          status: book.availableCopies === 0 ? 'Đã cho mượn' : book.status
        };
      }
    }

    const updatedReader: LibraryReader = reader ? {
      ...reader,
      activeLoansCount: Math.max(0, reader.activeLoansCount - 1)
    } : null;

    try {
      await saveLibraryTransaction(updatedTx);
      if (updatedBook) await saveLibraryBook(updatedBook);
      if (updatedReader) await saveLibraryReader(updatedReader);

      // INTEGRATION: Transfer compensation to accounting ledger as a receipt
      if (damageForm.action === 'Bắt đền bù') {
        const compensationReceipt: TuitionReceipt = {
          id: `REC-COMP-${Date.now().toString().slice(-4)}`,
          name: tx.readerName,
          className: tx.readerClass,
          amount: Number(damageForm.compensationFee),
          status: 'Chưa Nộp',
          date: '21/06/2026',
          voidReason: `Phạt đền bù sách mất/hỏng: ${tx.bookTitle} (Thư viện gửi)`
        };
        await saveFinanceReceipt(compensationReceipt);
        alert(`Đã ghi nhận phạt đền bù ${Number(damageForm.compensationFee).toLocaleString('vi-VN')} đ và chuyển dữ liệu công nợ sang Kế toán thu tiền.`);
      } else {
        alert('Đã xử lý thông tin mất hỏng/thanh lý thành công.');
      }

      setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));
      if (updatedBook) setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
      if (updatedReader) setReaders(prev => prev.map(r => r.id === reader.id ? updatedReader : r));
      setModalOpen(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit purchase proposal
  const handleSavePurchaseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.title.trim() || !purchaseForm.items.trim()) {
      alert('Vui lòng nhập tên đề xuất và danh mục sách cần mua');
      return;
    }

    const newProposal: LibraryPurchaseRequest = {
      id: `REQ-LIB-${Date.now().toString().slice(-4)}`,
      title: purchaseForm.title.trim(),
      date: '21/06/2026',
      items: purchaseForm.items.trim(),
      reason: purchaseForm.reason.trim() || 'Bổ sung tài nguyên phục vụ dạy và học',
      budget: Number(purchaseForm.budget),
      status: 'Chờ duyệt'
    };

    try {
      await saveLibraryPurchaseRequest(newProposal);
      setPurchaseRequests(prev => [newProposal, ...prev]);
      setModalOpen(null);
      setPurchaseForm({
        title: '',
        items: '',
        reason: '',
        budget: 500000
      });
      alert('Đã gửi đề xuất mua sách bổ sung lên Ban Giám Hiệu và Kế toán.');
    } catch (err) {
      console.error(err);
    }
  };

  // Periodical inventory submit
  const handleSaveStocktake = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalSystemCount = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const discrepancy = stocktakeForm.actualCount - totalSystemCount;

    const newReport: LibraryInventoryReport = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      date: '21/06/2026',
      operator: 'Cô Trịnh Thị Thư',
      totalSystem: totalSystemCount,
      totalActual: Number(stocktakeForm.actualCount),
      discrepancy,
      notes: stocktakeForm.notes.trim() || 'Kiểm kê định kỳ'
    };

    try {
      await saveLibraryInventoryReport(newReport);
      setInventories(prev => [newReport, ...prev]);
      setModalOpen(null);
      setStocktakeForm({
        actualCount: 0,
        notes: ''
      });
      alert('Đã lưu kết quả kiểm kê tài sản thư viện lên hệ thống.');
    } catch (err) {
      console.error(err);
    }
  };

  // Check student into reading room
  const handleReadingRoomCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = readingRoomStudentId.trim();
    if (!cleanId) return;

    const reader = readers.find(r => r.id === cleanId);
    if (!reader) {
      alert(`Không tìm thấy bạn đọc có mã: ${cleanId}`);
      return;
    }

    // Process borrow in-house
    const newTx: LibraryTransaction = {
      id: `TX-LIB-IN-${Math.floor(Math.random() * 9000 + 1000)}`,
      readerId: reader.id,
      readerName: reader.name,
      readerClass: reader.classOrDept,
      bookId: 'PHÒNG ĐỌC',
      bookTitle: 'Đọc sách tự chọn tại chỗ',
      borrowDate: '21/06/2026',
      dueDate: '21/06/2026',
      type: 'Đọc tại chỗ',
      status: 'Đang mượn'
    };

    saveLibraryTransaction(newTx)
      .then(() => {
        setTransactions(prev => [newTx, ...prev]);
        setReadingRoomStudentId('');
        playBeepSound('success');
      });
  };

  // Filter logics
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.isbn.includes(searchQuery);
    const matchesCat = bookCategoryFilter === 'All' ? true : b.category === bookCategoryFilter;
    const matchesStatus = bookStatusFilter === 'All' ? true : b.status === bookStatusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const filteredTransactions = transactions.filter(t => {
    return t.readerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           t.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.readerId.includes(searchQuery);
  });

  const filteredReaders = readers.filter(r => {
    return r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           r.id.includes(searchQuery) ||
           r.classOrDept.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Reading trends chart helper
  const getChartData = () => {
    const counts: Record<string, number> = {};
    books.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + b.totalCopies;
    });

    const colors = ['#2c5ea0', '#2e6b8a', '#2e4860', '#c29d38', '#80649f'];
    return Object.keys(counts).map((cat, idx) => ({
      name: cat,
      value: counts[cat],
      color: colors[idx % colors.length]
    }));
  };

  const chartData = getChartData();

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-[#f0f4fa] text-[#1e2a3a] main-scrollbar">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#b8c6d9_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] flex items-center gap-3">
              Quản Lý Thư Viện Trường
              <span className="text-xs font-sans font-bold bg-[#2c5ea0] text-[#f5f8fc] px-3 py-1 rounded-full uppercase tracking-wider">
                Thủ thư
              </span>
            </h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold mt-2">
              Biên mục tài nguyên, quản lý lưu thông mượn trả và tự động kiểm kê độc lập
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => {
                if (activeTab === 'inventory') setModalOpen('create_book');
                else if (activeTab === 'circulation') {
                  if (circulationSubTab === 'pos') setModalOpen('create_checkout');
                  else if (circulationSubTab === 'readingRoom') setModalOpen('reading_room_in');
                  else setModalOpen('create_checkout');
                }
                else if (activeTab === 'audit') {
                  if (auditSubTab === 'stocktake') setModalOpen('create_stocktake');
                  else if (auditSubTab === 'damage') setModalOpen('create_damage');
                  else setModalOpen('create_purchase');
                } else {
                  setModalOpen('create_checkout');
                }
              }}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 rounded-full whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'inventory' ? 'Thêm Ấn Phẩm Mới' 
                : activeTab === 'audit' && auditSubTab === 'purchase' ? 'Lập Đề Xuất Mua'
                : activeTab === 'audit' && auditSubTab === 'stocktake' ? 'Khởi Tạo Kiểm Kê'
                : 'Cho Mượn Sách Mới'}
            </button>
          </div>
        </div>

        {/* Search Strip (except for Overview & POS scan screen) */}
        {activeTab !== 'overview' && !(activeTab === 'circulation' && circulationSubTab === 'pos') && (
          <div className="flex flex-wrap gap-4 items-center justify-between bg-[#e8eef6] border border-[#b8c6d9] rounded-2xl p-4 mb-6 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4a5568] uppercase tracking-wider">
              <Search size={16} />
              Tìm kiếm nhanh
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Nhập thông tin tra cứu..."
                  className="pl-11 pr-4 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[240px] shadow-sm rounded-full placeholder:text-[#8e9eb4]"
                />
              </div>

              {activeTab === 'inventory' && inventorySubTab === 'catalog' && (
                <>
                  <FilterSelect
                    label="Thể loại"
                    value={bookCategoryFilter}
                    onChange={setBookCategoryFilter}
                    options={[
                      { value: 'All', label: 'Tất cả thể loại' },
                      { value: 'Sách giáo khoa', label: 'Sách giáo khoa' },
                      { value: 'Sách tham khảo', label: 'Sách tham khảo' },
                      { value: 'Văn học', label: 'Văn học' },
                      { value: 'Truyện tranh', label: 'Truyện tranh' },
                      { value: 'Báo & Tạp chí', label: 'Báo & Tạp chí' }
                    ]}
                    icon={Filter}
                  />

                  <FilterSelect
                    label="Trạng thái"
                    value={bookStatusFilter}
                    onChange={setBookStatusFilter}
                    options={[
                      { value: 'All', label: 'Tất cả trạng thái' },
                      { value: 'Sẵn sàng mượn', label: 'Sẵn sàng mượn' },
                      { value: 'Đã cho mượn', label: 'Đã cho mượn' },
                      { value: 'Đang sửa chữa', label: 'Đang sửa chữa' },
                      { value: 'Đã thanh lý', label: 'Đã thanh lý' }
                    ]}
                    icon={Filter}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition duration-300">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tổng tài nguyên</span>
                  <h4 className="text-sm font-bold text-gray-900 font-serif mt-1">Đầu sách / Bản sách</h4>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-serif font-bold text-gray-800 text-3xl">
                    {books.length} <span className="text-sm font-sans font-normal text-gray-500">đầu sách</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#2c5ea0]">
                    ({books.reduce((acc, b) => acc + b.totalCopies, 0)} cuốn)
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition duration-300">
                <div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">Trạng thái</span>
                  <h4 className="text-sm font-bold text-gray-900 font-serif mt-1">Đang mượn / Trên kệ</h4>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-serif font-bold text-green-800 text-3xl">
                    {transactions.filter(t => t.status === 'Đang mượn' || t.status === 'Quá hạn').length}
                  </div>
                  <div className="text-xs font-sans font-bold text-gray-500">
                    / {books.reduce((acc, b) => acc + b.availableCopies, 0)} còn lại
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-red-50/70 border-[2px] border-red-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition duration-300">
                <div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wider">Cảnh báo nợ quá hạn</span>
                  <h4 className="text-sm font-bold text-red-950 font-serif mt-1">Chưa trả đúng hẹn</h4>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-serif font-bold text-red-800 text-3xl">
                    {transactions.filter(t => t.status === 'Quá hạn').length}
                  </div>
                  {onSelectModule ? (
                    <button 
                      onClick={() => onSelectModule('library-circulation')}
                      className="text-xs font-bold text-red-700 flex items-center gap-1 hover:underline"
                    >
                      Chi tiết <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setActiveTab('circulation'); setCirculationSubTab('overdue'); }}
                      className="text-xs font-bold text-red-700 flex items-center gap-1 hover:underline"
                    >
                      Chi tiết <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-amber-50/70 border-[2px] border-amber-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition duration-300">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">Lượt mượn sách</span>
                  <h4 className="text-sm font-bold text-amber-950 font-serif mt-1">Lượt phục vụ hôm nay</h4>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-serif font-bold text-amber-800 text-3xl">
                    {transactions.filter(t => t.borrowDate === '21/06/2026').length}
                  </div>
                  <div className="text-xs font-sans font-bold text-gray-500">lượt giao dịch</div>
                </div>
              </div>
            </div>

            {/* Quick POS Barcode Terminal */}
            <div className="bg-[#131a25] text-[#8fa8c4] border-[3px] border-double border-[#8fa8c4] rounded-3xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2c5ea0] opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex items-center justify-between border-b border-[#283548] pb-4 mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Barcode className="text-[#c29d38] w-7 h-7" />
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#f5f8fc] uppercase tracking-wider">Giao dịch nhanh tại Quầy (Barcode/QR Scan)</h3>
                    <p className="text-[11px] text-[#7b8a9e]">Mở quầy quét mã vạch phục vụ mượn sách nhanh trong giờ ra chơi.</p>
                  </div>
                </div>

                <div className="flex bg-[#1e2a3a] p-1 border border-[#283548] rounded-xl text-xs font-bold uppercase tracking-wider">
                  <button 
                    type="button"
                    onClick={() => { setPosMode('borrow'); setPosSuccessMsg(null); setPosErrorMsg(null); }}
                    className={`px-4 py-1.5 rounded-lg transition-all ${posMode === 'borrow' ? 'bg-[#2c5ea0] text-white' : 'text-[#7b8a9e] hover:text-white'}`}
                  >
                    Cho Mượn
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setPosMode('return'); setPosSuccessMsg(null); setPosErrorMsg(null); }}
                    className={`px-4 py-1.5 rounded-lg transition-all ${posMode === 'return' ? 'bg-[#2c5ea0] text-white' : 'text-[#7b8a9e] hover:text-white'}`}
                  >
                    Trả Sách
                  </button>
                </div>
              </div>

              <form onSubmit={handleQuickPosSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {posMode === 'borrow' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-2 font-mono">
                        1. Mã Bạn Đọc (Quét thẻ)
                      </label>
                      <input
                        type="text"
                        ref={barcodeReaderInputRef}
                        value={posReaderId}
                        onChange={e => setPosReaderId(e.target.value)}
                        placeholder="VD: HS-2026-001"
                        className="w-full px-4 py-3 bg-[#1e2a3a] border border-[#283548] focus:border-[#c29d38] focus:outline-none rounded-xl text-sm font-bold text-[#f5f8fc] placeholder:text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-2 font-mono">
                        2. Mã vạch sách (Quét gáy)
                      </label>
                      <input
                        type="text"
                        ref={barcodeBookInputRef}
                        value={posBookId}
                        onChange={e => setPosBookId(e.target.value)}
                        placeholder="VD: BK-001"
                        className="w-full px-4 py-3 bg-[#1e2a3a] border border-[#283548] focus:border-[#c29d38] focus:outline-none rounded-xl text-sm font-bold text-[#f5f8fc] placeholder:text-gray-600"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-2 font-mono">
                      Quét mã vạch sách để trả nhanh
                    </label>
                    <input
                      type="text"
                      ref={barcodeBookInputRef}
                      value={posBookId}
                      onChange={e => setPosBookId(e.target.value)}
                      placeholder="Quét mã vạch dán trên gáy sách... (VD: BK-003)"
                      className="w-full px-4 py-3 bg-[#1e2a3a] border border-[#283548] focus:border-[#c29d38] focus:outline-none rounded-xl text-sm font-bold text-[#f5f8fc] placeholder:text-gray-600"
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#c29d38] hover:bg-[#b08b2d] text-gray-950 font-bold uppercase text-xs tracking-wider rounded-xl transition shadow-md cursor-pointer"
                  >
                    {posMode === 'borrow' ? 'Cho mượn' : 'Xác nhận Trả'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosReaderId('');
                      setPosBookId('');
                      setPosSuccessMsg(null);
                      setPosErrorMsg(null);
                    }}
                    className="px-4 py-3 border border-[#283548] text-[#7b8a9e] hover:text-[#8fa8c4] rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </form>

              {posSuccessMsg && (
                <div className="mt-4 p-3 bg-green-950/50 border border-green-800 text-green-300 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                  <CheckCircle size={16} />
                  <span>{posSuccessMsg}</span>
                </div>
              )}

              {posErrorMsg && (
                <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>{posErrorMsg}</span>
                </div>
              )}
            </div>

            {/* Layout Grid: Left (Reading Trends & Leaderboard) / Right (Alerts) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Trends & Charts */}
              <div className="lg:col-span-2 space-y-8">
                {/* Recharts Pie Chart */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                    Tỷ lệ sách trong kho theo Thể loại
                  </h3>
                  
                  <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="w-64 h-64">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} cuốn`} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">Không có dữ liệu biểu đồ</div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-bold text-[#4a5568]">
                      {chartData.map((data, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                          <span>{data.name}:</span>
                          <span className="text-[#1e2a3a]">{data.value} cuốn</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leaderboard tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Books */}
                  <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                    <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-4 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#2c5ea0]" />
                      Top 5 sách mượn nhiều nhất
                    </h4>
                    <div className="space-y-2.5">
                      {books.slice(0, 5).map((book, i) => (
                        <div key={book.id} className="flex items-center justify-between p-2.5 bg-[#f0f4fa] rounded-xl border border-[#e8dfc9] hover:bg-[#e8eef6]/50 transition">
                          <div className="flex items-center gap-3">
                            <span className="font-serif font-bold text-[#2c5ea0] text-sm">#{i+1}</span>
                            <div>
                              <p className="font-bold text-xs text-[#1e2a3a] line-clamp-1">{book.title}</p>
                              <p className="text-[9px] text-gray-500 font-mono">{book.id} | {book.author}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold bg-[#2c5ea0]/10 text-[#2c5ea0] px-2 py-0.5 rounded-full">
                            {12 - i * 2} lượt
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Readers */}
                  <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                    <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-4 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#2e6b8a]" />
                      Top 5 Bạn đọc tích cực nhất
                    </h4>
                    <div className="space-y-2.5">
                      {readers.slice(0, 5).map((reader, i) => (
                        <div key={reader.id} className="flex items-center justify-between p-2.5 bg-[#f0f4fa] rounded-xl border border-[#e8dfc9] hover:bg-[#e8eef6]/50 transition">
                          <div className="flex items-center gap-3">
                            <span className="font-serif font-bold text-[#2e6b8a] text-sm">#{i+1}</span>
                            <div>
                              <p className="font-bold text-xs text-[#1e2a3a]">{reader.name}</p>
                              <p className="text-[9px] text-gray-500 font-mono">{reader.id} | Lớp: {reader.classOrDept}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold bg-[#2e6b8a]/10 text-[#2e6b8a] px-2 py-0.5 rounded-full">
                            {reader.totalLoansCount} cuốn
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts and Queues */}
              <div className="space-y-8">
                {/* Online Book Reservations */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4 flex items-center gap-2">
                    <BookMarked size={16} className="text-[#2c5ea0]" />
                    Đặt sách online (Yêu cầu trước)
                  </h3>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto main-scrollbar pr-1">
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl flex justify-between items-start text-[11px]">
                      <div>
                        <p className="font-bold text-[#1e2a3a]">Nguyễn Văn An (10A1)</p>
                        <p className="text-gray-600 mt-1">Đăng ký mượn: <i>Sách giáo khoa Ngữ văn 10</i></p>
                      </div>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase font-mono">Đợi lấy</span>
                    </div>

                    <div className="p-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl flex justify-between items-start text-[11px]">
                      <div>
                        <p className="font-bold text-[#1e2a3a]">Trần Thị Bé (11A2)</p>
                        <p className="text-gray-600 mt-1">Đăng ký mượn: <i>Dế Mèn Phiêu Lưu Ký</i></p>
                      </div>
                      <button
                        onClick={() => alert('Đã ghi nhận gom sách thành công! Cuốn sách đã được chuyển sang kệ chờ lấy cho học sinh Trần Thị Bé.')}
                        className="text-[9px] font-bold bg-[#1e2a3a] text-white px-2 py-1 rounded uppercase hover:bg-gray-800 transition"
                      >
                        Gom sách
                      </button>
                    </div>
                  </div>
                </div>

                {/* Books needing repairs */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-700" />
                    Sách cần bảo dưỡng & sửa chữa
                  </h3>
                  <div className="space-y-3">
                    {books.filter(b => b.status === 'Đang sửa chữa').map(book => (
                      <div key={book.id} className="p-3 bg-amber-50/40 border border-amber-200 rounded-2xl flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-bold text-amber-950">{book.title}</p>
                          <p className="text-gray-500 font-mono text-[9px] mt-0.5">Vị trí cũ: {book.shelf}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const updated = { ...book, status: 'Sẵn sàng mượn' as any };
                            await saveLibraryBook(updated);
                            setBooks(prev => prev.map(b => b.id === book.id ? updated : b));
                            playBeepSound('success');
                            alert('Đã hoàn tất dán gáy/sửa chữa. Sách đã chuyển lại về trạng thái Sẵn sàng mượn.');
                          }}
                          className="text-[9px] font-bold bg-[#2e6b8a] text-white px-2.5 py-1 rounded uppercase hover:bg-green-800 transition"
                        >
                          Xong
                        </button>
                      </div>
                    ))}
                    {books.filter(b => b.status === 'Đang sửa chữa').length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-xs font-medium italic">Không có cuốn sách nào cần dán gáy sửa chữa.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: CIRCULATION ─── */}
        {activeTab === 'circulation' && (
          <div className="space-y-6 animate-fade-in">
            {/* Local Sub Tabs */}
            <div className="flex border-b border-[#b8c6d9] shrink-0 gap-4 mb-4">
              {[
                { id: 'pos', label: 'Giao diện Quầy (POS)', icon: Barcode },
                { id: 'logs', label: 'Nhật ký Mượn - Trả', icon: BookOpen },
                { id: 'overdue', label: 'Mượn quá hạn', icon: Clock },
                { id: 'readingRoom', label: 'Phòng đọc tại chỗ', icon: Users }
              ].map(sub => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCirculationSubTab(sub.id as any)}
                    className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative flex items-center gap-1.5 ${
                      circulationSubTab === sub.id ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                    }`}
                  >
                    <Icon size={14} />
                    {sub.label}
                    {circulationSubTab === sub.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
                  </button>
                );
              })}
            </div>

            {/* Sub-tab 1: POS Giao diện quầy */}
            {circulationSubTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* POS terminal controls */}
                <div className="lg:col-span-2 bg-[#141210] text-[#eae5db] border-[3px] border-double border-[#4a453f] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#2c5ea0]/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center border-b border-[#2d2925] pb-4 mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-ping"></div>
                      <span className="text-xs font-mono font-bold tracking-widest text-[#a49d93]">TERMINAL ACTIVE</span>
                    </div>

                    <div className="flex bg-[#23201d] p-1 border border-[#36322d] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      <button 
                        onClick={() => { setPosTabMode('borrow'); setPosTabSuccessMsg(null); setPosTabErrorMsg(null); }}
                        className={`px-3 py-1 rounded ${posTabMode === 'borrow' ? 'bg-[#2c5ea0] text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        Mượn Sách
                      </button>
                      <button 
                        onClick={() => { setPosTabMode('return'); setPosTabSuccessMsg(null); setPosTabErrorMsg(null); }}
                        className={`px-3 py-1 rounded ${posTabMode === 'return' ? 'bg-[#2c5ea0] text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        Trả Sách
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleTabPosSubmit} className="space-y-6">
                    {posTabMode === 'borrow' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-2 font-mono">
                            QUÉT THẺ HỌC SINH / GIÁO VIÊN
                          </label>
                          <input 
                            type="text" 
                            ref={posTabReaderRef}
                            value={posTabReaderId}
                            onChange={e => setPosTabReaderId(e.target.value)}
                            placeholder="Mã vạch thẻ... (VD: HS-2026-001)"
                            className="w-full px-4 py-3.5 bg-[#1f1b18] border border-[#3a3530] focus:border-[#c29d38] focus:outline-none rounded-xl text-sm font-bold text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-2 font-mono">
                            QUÉT MÃ VẠCH TRÊN GÁY SÁCH
                          </label>
                          <input 
                            type="text" 
                            ref={posTabBookRef}
                            value={posTabBookId}
                            onChange={e => setPosTabBookId(e.target.value)}
                            placeholder="Mã vạch sách... (VD: BK-001)"
                            className="w-full px-4 py-3.5 bg-[#1f1b18] border border-[#3a3530] focus:border-[#c29d38] focus:outline-none rounded-xl text-sm font-bold text-white font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-2 font-mono">
                          QUÉT MÃ VẠCH SÁCH ĐỂ THU HỒI (INSTANT RETURN)
                        </label>
                        <input 
                          type="text" 
                          ref={posTabBookRef}
                          value={posTabBookId}
                          onChange={e => setPosTabBookId(e.target.value)}
                          placeholder="Quét mã vạch gáy sách để trả... (VD: BK-003)"
                          className="w-full px-4 py-4 bg-[#1f1b18] border border-[#3a3530] focus:border-[#c29d38] focus:outline-none rounded-xl text-base font-bold text-white font-mono text-center tracking-widest"
                          autoFocus
                        />
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-[#c29d38] hover:bg-[#b08b2d] text-gray-950 font-bold uppercase text-xs tracking-widest rounded-xl transition duration-200 cursor-pointer shadow-lg"
                      >
                        {posTabMode === 'borrow' ? 'Thực hiện giao dịch mượn' : 'Thu hồi sách về kho'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setPosTabReaderId('');
                          setPosTabBookId('');
                          setPosTabSuccessMsg(null);
                          setPosTabErrorMsg(null);
                        }}
                        className="px-6 py-4 border border-[#3a3530] text-[#7b8a9e] hover:text-white rounded-xl transition cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>

                  {/* Dynamic Alert Banner */}
                  {posTabSuccessMsg && (
                    <div className="mt-6 p-4 bg-green-950/60 border border-green-800 text-green-300 rounded-xl text-xs flex items-center gap-3 animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      <div>
                        <p className="font-bold uppercase tracking-wider">Thao tác thành công</p>
                        <p className="mt-0.5 opacity-90">{posTabSuccessMsg}</p>
                      </div>
                    </div>
                  )}

                  {posTabErrorMsg && (
                    <div className="mt-6 p-4 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-3 animate-fade-in">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <p className="font-bold uppercase tracking-wider">Cảnh báo lỗi</p>
                        <p className="mt-0.5 opacity-90">{posTabErrorMsg}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Scan Log */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm flex flex-col h-full">
                  <div className="border-b border-[#b8c6d9] pb-3 mb-4">
                    <h3 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={14} className="text-[#2c5ea0]" />
                      Lịch sử quét trong phiên (Recess Session)
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 main-scrollbar pr-1 text-xs">
                    {posSessionLogs.map((log, idx) => (
                      <div key={idx} className={`p-3 border rounded-xl flex flex-col justify-between ${
                        log.status === 'Thành công' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[9px] text-gray-400 font-bold">{log.timestamp} | {log.type === 'borrow' ? 'Mượn' : 'Trả'}</span>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            log.status === 'Thành công' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="font-bold text-[#1e2a3a] mt-1.5 line-clamp-1">{log.bookTitle}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Bạn đọc: {log.readerName}</p>
                      </div>
                    ))}

                    {posSessionLogs.length === 0 && (
                      <div className="text-center py-12 text-gray-400 italic">Phiên làm việc sạch. Chưa ghi nhận lượt quét nào.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Logs Table */}
            {circulationSubTab === 'logs' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <div className="overflow-x-auto max-h-[450px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã GD</th>
                        <th className="p-4">Bạn đọc</th>
                        <th className="p-4">Cuốn sách</th>
                        <th className="p-4">Ngày mượn</th>
                        <th className="p-4">Hạn trả</th>
                        <th className="p-4">Hình thức</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-center">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {filteredTransactions
                        .filter(t => t.type !== 'Đọc tại chỗ')
                        .map(tx => (
                          <tr key={tx.id} className="hover:bg-[#f0f4fa] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#7b8a9e]">{tx.id}</td>
                            <td className="p-4">
                              <div className="font-bold text-[#1e2a3a]">{tx.readerName}</div>
                              <div className="text-[9px] text-gray-400 font-bold">{tx.readerId} | Lớp: {tx.readerClass}</div>
                            </td>
                            <td className="p-4 font-bold text-[#1e2a3a]">{tx.bookTitle}</td>
                            <td className="p-4 text-[#4a5568]">{tx.borrowDate}</td>
                            <td className="p-4 text-[#4a5568]">{tx.dueDate}</td>
                            <td className="p-4 font-bold text-[#2c5ea0]">{tx.type}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                tx.status === 'Đang mượn' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                tx.status === 'Đã trả' ? 'bg-green-50 text-green-700 border-green-300' :
                                tx.status === 'Quá hạn' ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' :
                                'bg-gray-100 text-gray-700 border-gray-300'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {tx.status === 'Đang mượn' || tx.status === 'Quá hạn' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleReturnBook(tx)}
                                    className="px-3 py-1 bg-[#2e6b8a] hover:bg-[#2d4535] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition"
                                  >
                                    Trả sách
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setDamageForm(prev => ({ ...prev, transactionId: tx.id }));
                                      setModalOpen('create_damage');
                                    }}
                                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold uppercase rounded cursor-pointer transition"
                                  >
                                    Mất/hỏng
                                  </button>
                                </div>
                              ) : tx.status === 'Mất hỏng' && tx.compensationFee && !tx.compensationPaid ? (
                                <span className="text-[10px] font-bold text-red-700 italic">Đã đẩy Kế toán thu phạt</span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Giao dịch đã đóng</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {filteredTransactions.filter(t => t.type !== 'Đọc tại chỗ').length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest">Không có giao dịch mượn trả nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Overdue Management */}
            {circulationSubTab === 'overdue' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <div className="overflow-x-auto max-h-[450px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã GD</th>
                        <th className="p-4">Bạn đọc</th>
                        <th className="p-4">Cuốn sách</th>
                        <th className="p-4">Ngày mượn</th>
                        <th className="p-4">Hạn trả</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-center">Tác vụ nhắc nhở</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {transactions
                        .filter(t => t.status === 'Quá hạn')
                        .map(tx => (
                          <tr key={tx.id} className="hover:bg-[#f0f4fa] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#7b8a9e]">{tx.id}</td>
                            <td className="p-4">
                              <div className="font-bold text-[#1e2a3a]">{tx.readerName}</div>
                              <div className="text-[9px] text-gray-400 font-bold">{tx.readerId} | Lớp: {tx.readerClass}</div>
                            </td>
                            <td className="p-4 font-bold text-[#1e2a3a]">{tx.bookTitle}</td>
                            <td className="p-4 text-[#4a5568]">{tx.borrowDate}</td>
                            <td className="p-4 text-red-700 font-bold">{tx.dueDate}</td>
                            <td className="p-4 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                QUÁ HẠN
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => {
                                  playBeepSound('success');
                                  alert(`Hệ thống đã tự động gửi tin nhắn nhắc nợ sách qua tài khoản Zalo liên kết của phụ huynh/học sinh "${tx.readerName}".`);
                                }}
                                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold uppercase rounded-full cursor-pointer flex items-center justify-center mx-auto gap-1"
                              >
                                <Send size={12} />
                                Gửi nhắc nợ Zalo
                              </button>
                            </td>
                          </tr>
                        ))}
                      {transactions.filter(t => t.status === 'Quá hạn').length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest">Tuyệt vời! Không có bạn đọc nào quá hạn nợ sách.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 4: Reading Room */}
            {circulationSubTab === 'readingRoom' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Reading Room check in form */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                      Ghi nhận Bạn đọc vào Phòng đọc
                    </h3>
                    <form onSubmit={handleReadingRoomCheckIn} className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">
                          Mã học sinh / giáo viên (ID)
                        </label>
                        <input 
                          type="text"
                          value={readingRoomStudentId}
                          onChange={e => setReadingRoomStudentId(e.target.value)}
                          placeholder="Nhập mã thẻ... (VD: HS-2026-001)"
                          className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                        />
                        <p className="text-[10px] text-gray-500 mt-2">Đăng ký bạn đọc tại chỗ để theo dõi lượng phục vụ và kiểm soát kỷ luật phòng đọc.</p>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-[#1e2a3a] hover:bg-gray-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition cursor-pointer"
                      >
                        Đóng dấu vào phòng đọc
                      </button>
                    </form>
                  </div>
                </div>

                {/* Reading Room checklist table */}
                <div className="lg:col-span-2 bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                    Học sinh đang ngồi tại phòng đọc thư viện
                  </h3>
                  
                  <div className="overflow-x-auto max-h-[300px] main-scrollbar">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                        <tr>
                          <th className="p-4">Mã bạn đọc</th>
                          <th className="p-4">Họ tên bạn đọc</th>
                          <th className="p-4">Lớp/Phòng</th>
                          <th className="p-4">Giờ vào</th>
                          <th className="p-4 text-center">Tác vụ ra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8eef6]">
                        {transactions
                          .filter(t => t.type === 'Đọc tại chỗ' && t.status === 'Đang mượn')
                          .map(tx => (
                            <tr key={tx.id} className="hover:bg-[#f0f4fa]">
                              <td className="p-4 font-mono font-bold text-[#7b8a9e]">{tx.readerId}</td>
                              <td className="p-4 font-bold text-[#1e2a3a]">{tx.readerName}</td>
                              <td className="p-4 text-gray-500 font-bold">{tx.readerClass}</td>
                              <td className="p-4 text-gray-400 font-mono">10:15</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={async () => {
                                    const updated = { ...tx, status: 'Đã trả' as any, returnDate: '21/06/2026' };
                                    await saveLibraryTransaction(updated);
                                    setTransactions(prev => prev.map(t => t.id === tx.id ? updated : t));
                                    playBeepSound('success');
                                  }}
                                  className="px-3 py-1 bg-[#2c5ea0] text-white hover:bg-[#5c2e2e] text-[10px] font-bold uppercase rounded cursor-pointer transition"
                                >
                                  Check out
                                </button>
                              </td>
                            </tr>
                          ))}
                        {transactions.filter(t => t.type === 'Đọc tại chỗ' && t.status === 'Đang mượn').length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-400 italic">Phòng đọc hiện trống.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: INVENTORY ─── */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            {/* Local Sub tabs */}
            <div className="flex border-b border-[#b8c6d9] shrink-0 gap-4 mb-4">
              <button
                onClick={() => setInventorySubTab('catalog')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative ${
                  inventorySubTab === 'catalog' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Danh mục Ấn phẩm
                {inventorySubTab === 'catalog' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
              <button
                onClick={() => setInventorySubTab('labels')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative ${
                  inventorySubTab === 'labels' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Nhập kho & Dán nhãn
                {inventorySubTab === 'labels' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
            </div>

            {inventorySubTab === 'catalog' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <div className="overflow-x-auto max-h-[450px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã sách</th>
                        <th className="p-4">Mã ISBN</th>
                        <th className="p-4">Tiêu đề ấn phẩm</th>
                        <th className="p-4">Tác giả</th>
                        <th className="p-4">Thể loại</th>
                        <th className="p-4">Vị trí kệ</th>
                        <th className="p-4 text-center">Tổng / Khả dụng</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-center">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {filteredBooks.map(book => (
                        <tr 
                          key={book.id} 
                          onClick={() => setSelectedBook(book)}
                          className="hover:bg-[#f0f4fa] transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-mono font-bold text-[#7b8a9e]">{book.id}</td>
                          <td className="p-4 font-mono font-bold text-[#4a5568]">{book.isbn}</td>
                          <td className="p-4 font-bold text-[#1e2a3a]">{book.title}</td>
                          <td className="p-4 text-[#4a5568] font-bold">{book.author}</td>
                          <td className="p-4 text-[#4a5568]">{book.category}</td>
                          <td className="p-4 text-gray-500 font-bold">{book.shelf}</td>
                          <td className="p-4 text-center font-bold font-mono">
                            {book.totalCopies} / <span className="text-[#2c5ea0]">{book.availableCopies}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              book.status === 'Sẵn sàng mượn' ? 'bg-green-50 text-green-700 border-green-200' :
                              book.status === 'Đã cho mượn' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              book.status === 'Đang sửa chữa' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              {book.status === 'Sẵn sàng mượn' ? '🟢 Sẵn sàng mượn' :
                               book.status === 'Đã cho mượn' ? '🔴 Đã cho mượn' :
                               book.status === 'Đang sửa chữa' ? '🟡 Đang sửa chữa' : '⚫ Đã thanh lý'}
                            </span>
                          </td>
                          <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedBook(book)}
                              className="px-2.5 py-1 bg-[#1e2a3a] text-white hover:bg-gray-800 text-[10px] font-bold uppercase rounded shadow-sm cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {inventorySubTab === 'labels' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left panel: Add form */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                    Nhập Lô Ấn Phẩm & In Mã Vạch
                  </h3>
                  
                  <form onSubmit={handleSaveBook} className="space-y-4 font-sans text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Mã ISBN *</label>
                      <input 
                        type="text" 
                        value={bookForm.isbn}
                        onChange={e => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                        placeholder="VD: 9786040188981" 
                        className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Tiêu đề sách *</label>
                      <input 
                        type="text" 
                        value={bookForm.title}
                        onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Nhập tên sách..." 
                        className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Tác giả</label>
                      <input 
                        type="text" 
                        value={bookForm.author}
                        onChange={e => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="VD: Nguyễn Du..." 
                        className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Thể loại</label>
                        <select 
                          value={bookForm.category}
                          onChange={e => setBookForm(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                        >
                          <option value="Sách giáo khoa">Sách giáo khoa</option>
                          <option value="Sách tham khảo">Sách tham khảo</option>
                          <option value="Văn học">Văn học</option>
                          <option value="Truyện tranh">Truyện tranh</option>
                          <option value="Báo & Tạp chí">Báo & Tạp chí</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Số lượng nhập</label>
                        <input 
                          type="number" 
                          value={bookForm.totalCopies}
                          onChange={e => setBookForm(prev => ({ ...prev, totalCopies: Number(e.target.value) }))}
                          min={1} 
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Vị trí kệ sách</label>
                      <input 
                        type="text" 
                        value={bookForm.shelf}
                        onChange={e => setBookForm(prev => ({ ...prev, shelf: e.target.value }))}
                        placeholder="VD: Kệ B - Tầng 2" 
                        className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-[#1e2a3a] hover:bg-gray-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition cursor-pointer"
                    >
                      Nhập kho & In nhãn mã vạch
                    </button>
                  </form>
                </div>

                {/* Right panel: Barcode Sheet Preview */}
                <div className="lg:col-span-2 bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-3 mb-5">
                    <h3 className="text-sm font-serif font-bold text-[#1e2a3a] uppercase tracking-wider">
                      Nhãn mã vạch gáy sách vừa tạo (Barcode Labels)
                    </h3>
                    <button 
                      onClick={() => {
                        playBeepSound('success');
                        alert('Đang kết nối máy in nhiệt Zebra... Đã phát hành lệnh in mã vạch hàng loạt.');
                      }}
                      className="flex items-center px-4 py-1.5 border border-[#b8c6d9] bg-white text-gray-900 text-xs font-bold uppercase rounded-lg hover:bg-[#e8eef6] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 mr-2" />
                      In nhãn hàng loạt
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-[#e8dfc9] bg-[#f0f4fa] rounded-2xl max-h-[360px] overflow-y-auto main-scrollbar">
                    {books.slice(0, 12).map(book => (
                      <div key={book.id} className="p-3 bg-white border border-gray-200 rounded-xl text-center flex flex-col items-center justify-between shadow-sm relative group hover:border-[#2c5ea0]">
                        <span className="text-[8px] font-bold text-gray-800 line-clamp-1">{book.title}</span>
                        <div className="my-2 p-1.5 border border-black border-dashed flex flex-col items-center w-full bg-[#f5f8fc]">
                          <span className="font-mono text-xs font-bold leading-none tracking-widest select-none">||||| | || ||</span>
                          <span className="text-[8px] font-mono font-bold mt-1 text-gray-700">{book.id}</span>
                        </div>
                        <span className="text-[7px] text-gray-400 font-mono">ISBN: {book.isbn.slice(-5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: READERS ─── */}
        {activeTab === 'readers' && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm animate-fade-in">
            <div className="overflow-x-auto max-h-[450px] main-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                  <tr>
                    <th className="p-4">Mã bạn đọc</th>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Phân loại</th>
                    <th className="p-4">Lớp / Tổ công tác</th>
                    <th className="p-4 text-center">Sách đang nợ</th>
                    <th className="p-4 text-center">Tổng lượt mượn</th>
                    <th className="p-4 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eef6]">
                  {filteredReaders.map(reader => (
                    <tr 
                      key={reader.id} 
                      onClick={() => setSelectedReader(reader)}
                      className="hover:bg-[#f0f4fa] transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{reader.id}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{reader.name}</td>
                      <td className="p-4 font-bold text-[#2c5ea0]">{reader.role}</td>
                      <td className="p-4 text-[#4a5568] font-bold">{reader.classOrDept}</td>
                      <td className="p-4 text-center font-bold text-[#2c5ea0] font-mono">{reader.activeLoansCount}</td>
                      <td className="p-4 text-center font-bold font-mono">{reader.totalLoansCount}</td>
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedReader(reader)}
                          className="px-3 py-1 bg-[#1e2a3a] hover:bg-gray-800 text-white text-[10px] font-bold uppercase rounded shadow-sm cursor-pointer"
                        >
                          Lịch sử
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 5: AUDIT ─── */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sub tabs */}
            <div className="flex border-b border-[#b8c6d9] shrink-0 gap-4 mb-4">
              <button
                onClick={() => setAuditSubTab('stocktake')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative ${
                  auditSubTab === 'stocktake' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Kiểm kê định kỳ
                {auditSubTab === 'stocktake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
              <button
                onClick={() => setAuditSubTab('damage')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative ${
                  auditSubTab === 'damage' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Xử lý Mất/Hỏng &amp; Thanh lý
                {auditSubTab === 'damage' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
              <button
                onClick={() => setAuditSubTab('purchase')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative ${
                  auditSubTab === 'purchase' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Đề xuất mua sắm bổ sung
                {auditSubTab === 'purchase' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
            </div>

            {/* Sub-tab 1: Stocktake logs */}
            {auditSubTab === 'stocktake' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                  Lịch sử Báo cáo Kiểm kê Kho tài sản
                </h3>
                <div className="overflow-x-auto max-h-[400px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã kiểm kê</th>
                        <th className="p-4">Ngày thực hiện</th>
                        <th className="p-4">Người kiểm kê</th>
                        <th className="p-4 text-center">Tổng sổ sách hệ thống</th>
                        <th className="p-4 text-center">Thực tế trên kệ</th>
                        <th className="p-4 text-center">Chênh lệch</th>
                        <th className="p-4">Ghi chú chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {inventories.map(inv => (
                        <tr key={inv.id} className="hover:bg-[#f0f4fa] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#7b8a9e]">{inv.id}</td>
                          <td className="p-4 font-bold text-[#1e2a3a]">{inv.date}</td>
                          <td className="p-4 text-[#4a5568] font-bold">{inv.operator}</td>
                          <td className="p-4 text-center font-mono">{inv.totalSystem} cuốn</td>
                          <td className="p-4 text-center font-mono font-bold">{inv.totalActual} cuốn</td>
                          <td className={`p-4 text-center font-mono font-bold ${
                            inv.discrepancy < 0 ? 'text-red-700' : inv.discrepancy > 0 ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {inv.discrepancy > 0 ? `+${inv.discrepancy}` : inv.discrepancy} cuốn
                          </td>
                          <td className="p-4 text-gray-500 font-medium italic">"{inv.notes}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Damage Log */}
            {auditSubTab === 'damage' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                  Nhật ký sự cố hư hỏng &amp; Xử lý đền bù
                </h3>
                <div className="overflow-x-auto max-h-[400px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã GD</th>
                        <th className="p-4">Người mượn</th>
                        <th className="p-4">Tên cuốn sách</th>
                        <th className="p-4">Ngày mượn</th>
                        <th className="p-4 text-center">Phí đền bù</th>
                        <th className="p-4 text-center">Hệ thống đồng bộ</th>
                        <th className="p-4 text-center">Tác vụ kế toán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {transactions
                        .filter(t => t.status === 'Mất hỏng')
                        .map(tx => (
                          <tr key={tx.id} className="hover:bg-[#f0f4fa] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#7b8a9e]">{tx.id}</td>
                            <td className="p-4 font-bold text-[#1e2a3a]">{tx.readerName} ({tx.readerClass})</td>
                            <td className="p-4 font-bold text-[#1e2a3a]">{tx.bookTitle}</td>
                            <td className="p-4 text-[#4a5568]">{tx.borrowDate}</td>
                            <td className="p-4 text-center font-mono font-bold text-[#2c5ea0]">
                              {tx.compensationFee ? `${tx.compensationFee.toLocaleString('vi-VN')} đ` : '-'}
                            </td>
                            <td className="p-4 text-center">
                              {tx.compensationFee ? (
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-green-200 bg-green-50 text-green-700`}>
                                  Đã đồng bộ công nợ
                                </span>
                              ) : (
                                <span className="text-gray-400 font-bold uppercase text-[9px]">Sửa chữa nội bộ</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {tx.compensationFee ? (
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-bold">
                                  <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                                  Chuyển sang Kế toán thu nợ
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {transactions.filter(t => t.status === 'Mất hỏng').length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest">Không ghi nhận sự cố hư hỏng nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Purchase Proposals */}
            {auditSubTab === 'purchase' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                  Đề xuất mua sắm bổ sung tài nguyên (Trình BGH &amp; Kế toán)
                </h3>
                <div className="overflow-x-auto max-h-[400px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã số</th>
                        <th className="p-4">Tên đề xuất</th>
                        <th className="p-4">Ngày đề nghị</th>
                        <th className="p-4">Đầu sách cần mua</th>
                        <th className="p-4 text-right">Kinh phí dự kiến</th>
                        <th className="p-4 text-center">Trạng thái phê duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {purchaseRequests.map(req => (
                        <tr key={req.id} className="hover:bg-[#f0f4fa] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#7b8a9e]">{req.id}</td>
                          <td className="p-4 font-bold text-[#1e2a3a]">{req.title}</td>
                          <td className="p-4 text-[#4a5568]">{req.date}</td>
                          <td className="p-4 text-[#4a5568] max-w-xs truncate" title={req.items}>{req.items}</td>
                          <td className="p-4 text-right font-mono font-bold text-[#2c5ea0]">
                            {req.budget.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              req.status === 'Chờ duyệt' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                              req.status === 'Đã duyệt' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── DRAWER: SLIDING BOOK DETAILS DRAWER (FROM RIGHT) ─── */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop blur click wrapper */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedBook(null)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#f5f8fc] border-l-[6px] border-double border-[#2c5ea0] shadow-2xl flex flex-col justify-between p-6 overflow-y-auto transform transition duration-300 translate-x-0">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#b8c6d9] pb-4">
                <div>
                  <span className="text-[9px] font-bold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded font-mono">
                    ID: {selectedBook.id}
                  </span>
                  <h3 className="font-serif font-bold text-gray-900 text-lg mt-2 leading-tight">
                    {selectedBook.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">ISBN: {selectedBook.isbn}</p>
                </div>
                <button 
                  onClick={() => setSelectedBook(null)}
                  className="p-1 border border-transparent hover:border-[#b8c6d9] hover:bg-[#e8eef6] rounded-md transition text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 py-6 space-y-6 text-xs text-gray-700">
                {/* Status Badges */}
                <div className="flex items-center justify-between p-3 bg-white border border-[#e8dfc9] rounded-2xl shadow-inner">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Trạng thái kho</span>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    selectedBook.status === 'Sẵn sàng mượn' ? 'bg-green-50 text-green-700 border-green-300' :
                    selectedBook.status === 'Đã cho mượn' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                    selectedBook.status === 'Đang sửa chữa' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {selectedBook.status === 'Sẵn sàng mượn' ? '🟢 Sẵn sàng mượn' :
                     selectedBook.status === 'Đã cho mượn' ? '🔴 Đã cho mượn' :
                     selectedBook.status === 'Đang sửa chữa' ? '🟡 Đang sửa chữa' : '⚫ Đã thanh lý'}
                  </span>
                </div>

                {/* Core Specifications */}
                <div className="space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-[#2c5ea0] text-[10px]">Thông tin chi tiết</h4>
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 border border-[#e8dfc9] rounded-2xl shadow-sm">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Tác giả</p>
                      <p className="font-bold text-gray-900">{selectedBook.author}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Thể loại</p>
                      <p className="font-bold text-gray-900">{selectedBook.category}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Kệ lưu trữ</p>
                      <p className="font-bold text-gray-900">{selectedBook.shelf}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Nhà xuất bản</p>
                      <p className="font-bold text-gray-900">NXB Giáo Dục</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Năm xuất bản</p>
                      <p className="font-bold text-gray-900">2025</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Số bản sách</p>
                      <p className="font-bold text-gray-900 font-mono">{selectedBook.totalCopies} / {selectedBook.availableCopies} khả dụng</p>
                    </div>
                  </div>
                </div>

                {/* Abstract / Summary */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[#2c5ea0] text-[10px]">Tóm tắt nội dung</h4>
                  <p className="bg-[#f0f4fa] p-3 border border-[#b8c6d9] rounded-2xl italic leading-relaxed text-gray-600">
                    Sách giáo khoa chính khóa của Bộ GD&amp;ĐT phát hành, phục vụ chương trình học mới chuẩn hóa Mầm non An Hữu.
                  </p>
                </div>

                {/* Book Loans Log History */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[#2c5ea0] text-[10px]">Lịch sử luân chuyển sách</h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto main-scrollbar pr-1">
                    {transactions
                      .filter(t => t.bookId === selectedBook.id)
                      .map(tx => (
                        <div key={tx.id} className="p-2.5 bg-white border border-[#e8dfc9] rounded-xl flex justify-between items-center text-[10px]">
                          <div>
                            <p className="font-bold text-[#1e2a3a]">{tx.readerName} ({tx.readerClass})</p>
                            <p className="text-gray-400 text-[8px] font-mono mt-0.5">Hạn: {tx.dueDate} | Trả: {tx.returnDate || '—'}</p>
                          </div>
                          <span className={`font-bold uppercase text-[8px] px-1.5 py-0.5 rounded ${
                            tx.status === 'Đã trả' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      ))}
                    {transactions.filter(t => t.bookId === selectedBook.id).length === 0 && (
                      <div className="text-center py-4 text-gray-400 italic">Chưa phát sinh giao dịch cho mượn nào.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-[#b8c6d9] pt-4 flex gap-2">
                <button
                  onClick={async () => {
                    if (selectedBook.status === 'Đang sửa chữa') {
                      const updated = { ...selectedBook, status: 'Sẵn sàng mượn' as any };
                      await saveLibraryBook(updated);
                      setBooks(prev => prev.map(b => b.id === selectedBook.id ? updated : b));
                      setSelectedBook(updated);
                      alert('Đã khôi phục cuốn sách về trạng thái Sẵn sàng mượn.');
                    } else {
                      const updated = { ...selectedBook, status: 'Đang sửa chữa' as any };
                      await saveLibraryBook(updated);
                      setBooks(prev => prev.map(b => b.id === selectedBook.id ? updated : b));
                      setSelectedBook(updated);
                      alert('Đã chuyển cuốn sách vào ngăn bảo dưỡng sửa chữa.');
                    }
                  }}
                  className="flex-1 py-2.5 border border-[#b8c6d9] hover:bg-[#e8eef6] text-gray-900 text-[10px] font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw size={12} />
                  {selectedBook.status === 'Đang sửa chữa' ? 'Khôi phục' : 'Bảo dưỡng'}
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn thanh lý và xóa đầu sách biên mục này?')) {
                      deleteLibraryBook(selectedBook.id)
                        .then(() => {
                          setBooks(prev => prev.filter(b => b.id !== selectedBook.id));
                          setSelectedBook(null);
                          alert('Thanh lý thành công!');
                        });
                    }
                  }}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} />
                  Thanh lý
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: READER HISTORY MODAL ─── */}
      {selectedReader && (
        <ModalBase 
          isOpen={true} 
          onClose={() => setSelectedReader(null)} 
          title={`Hồ sơ Bạn đọc: ${selectedReader.name}`} 
          subtitle={`${selectedReader.role} | Lớp/Tổ: ${selectedReader.classOrDept} | ID: ${selectedReader.id}`}
          width="max-w-2xl" 
          centerY
        >
          <div className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl">
              <div>Lượt mượn hiện tại: <strong className="text-[#2c5ea0] font-mono text-sm">{selectedReader.activeLoansCount}</strong> cuốn</div>
              <div>Tổng lịch sử mượn: <strong className="font-mono text-sm">{selectedReader.totalLoansCount}</strong> cuốn</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-gray-500 text-[9px]">Lịch sử giao dịch chi tiết</h4>
              <div className="overflow-x-auto max-h-[250px] border border-[#b8c6d9] rounded-xl main-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-[#f0f4fa] text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-[#b8c6d9]">
                    <tr>
                      <th className="p-3">Mã GD</th>
                      <th className="p-3">Tên sách</th>
                      <th className="p-3">Mượn từ</th>
                      <th className="p-3">Hạn trả</th>
                      <th className="p-3">Ngày trả thực</th>
                      <th className="p-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8eef6]">
                    {transactions
                      .filter(t => t.readerId === selectedReader.id)
                      .map(tx => (
                        <tr key={tx.id} className="hover:bg-[#f0f4fa]">
                          <td className="p-3 font-mono font-bold text-gray-400">{tx.id}</td>
                          <td className="p-3 font-bold text-gray-800">{tx.bookTitle}</td>
                          <td className="p-3">{tx.borrowDate}</td>
                          <td className="p-3">{tx.dueDate}</td>
                          <td className="p-3">{tx.returnDate || '—'}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              tx.status === 'Đã trả' ? 'bg-green-100 text-green-800' :
                              tx.status === 'Quá hạn' ? 'bg-red-100 text-red-800 animate-pulse' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {transactions.filter(t => t.readerId === selectedReader.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 italic">Chưa mượn cuốn sách nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#b8c6d9]">
              <button 
                onClick={() => setSelectedReader(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* ─── MODAL: NHẬP SÁCH MỚI (CREATE BOOK) ─── */}
      {modalOpen === 'create_book' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Biên mục tài nguyên sách mới" subtitle="Nhập thông tin ấn phẩm mới và gán mã vị trí lưu trữ" width="max-w-2xl" centerY>
          <form onSubmit={handleSaveBook} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-6 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Mã ISBN *</label>
                <input 
                  type="text" 
                  value={bookForm.isbn}
                  onChange={e => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                  placeholder="Nhập mã vạch ISBN sách..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Tiêu đề ấn phẩm *</label>
                <input 
                  type="text" 
                  value={bookForm.title}
                  onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Tên cuốn sách..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Họ tên tác giả</label>
                <input 
                  type="text" 
                  value={bookForm.author}
                  onChange={e => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Nhập tên tác giả..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Thể loại</label>
                  <select 
                    value={bookForm.category}
                    onChange={e => setBookForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  >
                    <option value="Sách giáo khoa">Sách giáo khoa</option>
                    <option value="Sách tham khảo">Sách tham khảo</option>
                    <option value="Văn học">Văn học</option>
                    <option value="Truyện tranh">Truyện tranh</option>
                    <option value="Báo & Tạp chí">Báo & Tạp chí</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Số lượng bản sách</label>
                  <input 
                    type="number" 
                    value={bookForm.totalCopies}
                    onChange={e => setBookForm(prev => ({ ...prev, totalCopies: Number(e.target.value) }))}
                    min={1} 
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Vị trí lưu trữ (Kệ/Ngăn)</label>
                <input 
                  type="text" 
                  value={bookForm.shelf}
                  onChange={e => setBookForm(prev => ({ ...prev, shelf: e.target.value }))}
                  placeholder="VD: Kệ A - Tầng 2 - Ngăn 3" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#2c5ea0] hover:bg-[#5c2e2e] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Lưu vào cơ sở dữ liệu
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: LẬP PHIẾU CHO MƯỢN SÁCH (CREATE LOAN) ─── */}
      {modalOpen === 'create_checkout' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Thiết lập Giao dịch Cho mượn sách" subtitle="Quy trình cấp mượn sách mang về hoặc đọc tại phòng đọc" width="max-w-xl" centerY>
          <form onSubmit={handleCheckoutBook} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 gap-4 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Mã số Sách (ID) *</label>
                <input 
                  type="text" 
                  value={checkoutForm.bookId}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, bookId: e.target.value }))}
                  placeholder="VD: BK-001" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Mã số Bạn đọc *</label>
                <input 
                  type="text" 
                  value={checkoutForm.readerId}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, readerId: e.target.value }))}
                  placeholder="VD: HS-2026-001" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Hình thức mượn</label>
                  <select 
                    value={checkoutForm.type}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  >
                    <option value="Mang về">Mang về (Hạn 7 ngày)</option>
                    <option value="Đọc tại chỗ">Đọc tại chỗ (Phòng đọc)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Hạn trả dự kiến</label>
                  <input 
                    type="text" 
                    value={checkoutForm.dueDate}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Xác nhận cho mượn
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: BÁO CÁO MẤT HỎNG SÁCH & ĐỒNG BỘ NỢ PHẠT (DAMAGE REPORT) ─── */}
      {modalOpen === 'create_damage' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Báo cáo Mất/Hỏng ấn phẩm" subtitle="Lập phiếu xử lý sách hỏng rách và chuyển khoản nợ sang kế toán" width="max-w-xl" centerY>
          <form onSubmit={handleSaveDamageReport} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 gap-4 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <p className="font-bold text-gray-500 uppercase text-[9px]">MÃ GIAO DỊCH LIÊN QUAN</p>
                <p className="font-mono font-bold text-[#1e2a3a] text-sm mt-1">{damageForm.transactionId}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Giải pháp xử lý sự cố *</label>
                <select 
                  value={damageForm.action}
                  onChange={e => setDamageForm(prev => ({ ...prev, action: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                >
                  <option value="Bắt đền bù">Học sinh làm mất/hỏng (Bắt đền bù tiền)</option>
                  <option value="Chuyển sửa chữa">Sách rách trang (Chuyển dán sửa chữa)</option>
                  <option value="Thanh lý hao mòn">Thanh lý hao mòn (Thư viện tự hấp thu)</option>
                </select>
              </div>

              {damageForm.action === 'Bắt đền bù' && (
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Số tiền đền bù (Giá bìa sách) *</label>
                  <input 
                    type="number" 
                    value={damageForm.compensationFee}
                    onChange={e => setDamageForm(prev => ({ ...prev, compensationFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                  <p className="text-[10px] text-red-600 mt-2 italic">* Số tiền này sẽ tự động được ghi nhận thành khoản nợ học phí đền bù của học sinh bên phân hệ Kế toán.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Mô tả chi tiết tình trạng hư hỏng *</label>
                <textarea 
                  rows={2} 
                  value={damageForm.damageNote}
                  onChange={e => setDamageForm(prev => ({ ...prev, damageNote: e.target.value }))}
                  placeholder="Ghi nhận cụ thể như: Mất gáy, rách nát 10 trang giữa, hoặc học sinh báo làm mất ở nhà..." 
                  className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Xác nhận &amp; Đóng giao dịch
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: LẬP ĐỀ XUẤT MUA SẮM (CREATE PURCHASE PROPOSAL) ─── */}
      {modalOpen === 'create_purchase' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Lập đề xuất mua sách bổ sung" subtitle="Đề xuất bổ sung sách mới trình lên Hiệu trưởng &amp; Kế toán trưởng" width="max-w-2xl" centerY>
          <form onSubmit={handleSavePurchaseRequest} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 gap-4 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Tên đề xuất *</label>
                <input 
                  type="text" 
                  value={purchaseForm.title}
                  onChange={e => setPurchaseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Đề xuất bổ sung Sách ngoại văn Lớp 10 học kỳ 1" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Danh mục sách &amp; số lượng cần mua *</label>
                <textarea 
                  rows={3} 
                  value={purchaseForm.items}
                  onChange={e => setPurchaseForm(prev => ({ ...prev, items: e.target.value }))}
                  placeholder="Ví dụ: 10 cuốn Oxford English Grammar, 5 cuốn Từ điển Việt-Anh..." 
                  className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Kinh phí dự toán (đ) *</label>
                  <input 
                    type="number" 
                    value={purchaseForm.budget}
                    onChange={e => setPurchaseForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Lý do bổ sung</label>
                  <input 
                    type="text" 
                    value={purchaseForm.reason}
                    onChange={e => setPurchaseForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="VD: Phục vụ chuyên đề tự chọn tiếng Anh mới" 
                    className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#1e2a3a] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Gửi đề xuất
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: LẬP BÁO CÁO KIỂM KÊ (CREATE STOCKTAKE) ─── */}
      {modalOpen === 'create_stocktake' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Báo cáo kiểm kê kho định kỳ" subtitle="Chốt số lượng sách vật lý thực tế đang có trên kệ" width="max-w-xl" centerY>
          <form onSubmit={handleSaveStocktake} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 gap-4 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-gray-500 uppercase text-[9px]">SÁCH TRÊN HỆ THỐNG</p>
                  <p className="font-serif font-bold text-[#1e2a3a] text-lg mt-1">
                    {books.reduce((acc, b) => acc + b.totalCopies, 0)} cuốn
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Thực tế đếm được *</label>
                  <input 
                    type="number" 
                    value={stocktakeForm.actualCount}
                    onChange={e => setStocktakeForm(prev => ({ ...prev, actualCount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Ghi chú kiểm kê</label>
                <textarea 
                  rows={2} 
                  value={stocktakeForm.notes}
                  onChange={e => setStocktakeForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi nhận chênh lệch hoặc tình hình hao mòn sách..." 
                  className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#2e6b8a] hover:bg-[#2d4535] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Lưu báo cáo kiểm kê
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: CHECK-IN PHÒNG ĐỌC THƯỜNG (READING ROOM ENTRY MODAL) ─── */}
      {modalOpen === 'reading_room_in' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Đăng ký vào phòng đọc thư viện" subtitle="Ghi nhận bạn đọc vào khu vực tự học" width="max-w-md" centerY>
          <form onSubmit={handleReadingRoomCheckIn} className="p-6 space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mã Bạn đọc *</label>
              <input 
                type="text"
                value={readingRoomStudentId}
                onChange={e => setReadingRoomStudentId(e.target.value)}
                placeholder="Nhập mã thẻ... (VD: HS-2026-002)"
                className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 border border-[#b8c6d9] rounded-lg">Hủy</button>
              <button type="submit" onClick={() => setModalOpen(null)} className="px-5 py-2 bg-[#1e2a3a] text-white rounded-lg font-bold">Xác nhận vào</button>
            </div>
          </form>
        </ModalBase>
      )}

    </main>
  );
};
