/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, OperationType, handleFirestoreError } from './firebase';
import { Note, UserProfile } from './types';
import { formatNoteWithAI, getEmbeddings, chatWithNotes } from './services/geminiService';
import GooglePayButton from '@google-pay/button-react';
import { 
  Search, Plus, LogOut, FileText, Mic, Trash2, Save, 
  Sparkles, Download, Menu, X, ChevronRight, 
  Clock, Hash, User as UserIcon, Settings,
  MoreVertical, Share2, Copy, Check,
  MicOff,
  StopCircle,
  MessageCircle,
  Send,
  Bot,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <pre className="bg-white/5 p-4 rounded-xl text-xs text-red-400 max-w-lg overflow-auto mb-6">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black font-bold rounded-full"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ignore errors if ads are blocked or script not loaded
    }
  }, []);

  return (
    <div className="w-full bg-white/5 rounded-xl p-4 my-4 flex flex-col items-center justify-center border border-white/10 min-h-[100px]">
      <span className="text-[10px] text-white/20 uppercase tracking-widest mb-2">Advertisement</span>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-0000000000000000"
           data-ad-slot="0000000000"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}

function LuminaInsight({ notes, isPremium }: { notes: Note[], isPremium: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    if (!isPremium) {
      setMessages(prev => [...prev, { role: 'user', content: query }, { role: 'ai', content: "Lumina Insight is a Premium feature. Upgrade to chat with your knowledge base!" }]);
      setQuery('');
      return;
    }

    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const response = await chatWithNotes(userQuery, notes);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] glass rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            <div className="p-4 border-bottom border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <span className="font-bold text-sm">Lumina Insight</span>
                {!isPremium && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/40">PREMIUM</span>}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-white/40" />
                  </div>
                  <p className="text-sm font-medium mb-2">Ask your Knowledge Base</p>
                  <p className="text-xs text-white/40">"What did I learn about AI last week?" or "Summarize my project notes."</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    m.role === 'user' ? "bg-white text-black" : "bg-white/5 border border-white/10 text-white/80"
                  )}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-top border-white/10 bg-white/5">
              <div className="relative">
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Lumina..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-white/20 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'voice'>('all');
  const [newTag, setNewTag] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Local state for editor to prevent glitchy typing
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName,
            photoURL: user.photoURL,
            isPremium: false,
            createdAt: Timestamp.now(),
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePaymentSuccess = async (paymentData: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: true
      });
      setUserProfile(prev => prev ? { ...prev, isPremium: true } : null);
    } catch (error) {
      console.error('Payment update error:', error);
    }
  };

  // Notes listener
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(notesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return () => unsubscribe();
  }, [user]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Sync local state when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setLocalTitle(selectedNote.title);
      setLocalContent(selectedNote.content);
      setIsDirty(false);
    } else {
      setLocalTitle('');
      setLocalContent('');
      setIsDirty(false);
    }
  }, [selectedNote?.id]);

  // Debounced update to Firestore
  useEffect(() => {
    if (!selectedNote || !isDirty) return;
    const timeout = setTimeout(() => {
      updateNote(selectedNote.id, { title: localTitle, content: localContent });
      setIsDirty(false);
    }, 800); // 800ms debounce
    return () => clearTimeout(timeout);
  }, [localTitle, localContent, isDirty, selectedNote?.id]);

  const createNote = async () => {
    if (!user) return;
    try {
      const newNote = {
        userId: user.uid,
        title: 'Untitled Note',
        content: '',
        markup: null,
        tags: [],
        isVoiceNote: false,
        audioUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'notes'), newNote);
      setSelectedNoteId(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const updatedFields: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // If content changed, generate embeddings (debounced or on significant change)
      if (updates.content && updates.content.length > 20) {
        const embeddings = await getEmbeddings(updates.content);
        if (embeddings) {
          updatedFields.embeddings = embeddings;
        }
      }

      await updateDoc(doc(db, 'notes', id), updatedFields);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      if (selectedNoteId === id) setSelectedNoteId(null);
      setNoteToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  };

  const handleFormatNote = async () => {
    if (!selectedNote || isFormatting) return;
    
    if (!selectedNote.content.trim()) {
      toast.error("Please add some content to your note first");
      return;
    }
    
    setIsFormatting(true);
    try {
      const formatted = await formatNoteWithAI(selectedNote.content);
      await updateNote(selectedNote.id, { markup: formatted });
      toast.success("Note illuminated!");
    } catch (error) {
      console.error("[UI] handleFormatNote error:", error);
      toast.error("Failed to illuminate note. Check console for details.");
    } finally {
      setIsFormatting(false);
    }
  };

  const exportToPDF = async () => {
    if (!selectedNote) return;
    
    const element = document.getElementById('illuminated-content');
    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedNote.title || 'note'}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      // Fallback to simple text PDF if html2canvas fails
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(selectedNote.title || 'Untitled Note', 20, 20);
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(selectedNote.markup || selectedNote.content, 170);
      doc.text(splitText, 20, 30);
      doc.save(`${selectedNote.title || 'note'}.pdf`);
    }
  };

  const addCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (selectedNote.tags.includes(tag)) {
      setNewTag('');
      return;
    }
    const updatedTags = [...selectedNote.tags, tag];
    await updateNote(selectedNote.id, { tags: updatedTags });
    setNewTag('');
  };

  const removeTag = async (tagToRemove: string) => {
    if (!selectedNote) return;
    const updatedTags = selectedNote.tags.filter(t => t !== tagToRemove);
    await updateNote(selectedNote.id, { tags: updatedTags });
  };

  const copyToClipboard = async () => {
    if (!selectedNote) return;
    const text = `${selectedNote.title || 'Untitled Note'}\n\n${selectedNote.content}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const shareViaEmail = () => {
    if (!selectedNote) return;
    const subject = encodeURIComponent(selectedNote.title || 'Note from Lumina');
    const body = encodeURIComponent(selectedNote.content || '');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Voice Recording Logic
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // In a real app, upload to storage. For now, we'll just create a voice note.
        // We'll also use AI to transcribe if possible.
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            // Transcribe or just mark as voice note
            await createVoiceNote();
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const createVoiceNote = async () => {
    if (!user) return;
    try {
      const newNote = {
        userId: user.uid,
        title: 'Voice Note ' + format(new Date(), 'MMM d, h:mm a'),
        content: 'Recording...',
        markup: null,
        tags: ['voice'],
        isVoiceNote: true,
        audioUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'notes'), newNote);
      setSelectedNoteId(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!feedbackText.trim()) return;
      
      toast.success('Thanks for your feedback!');
      setFeedbackText('');
      setFeedbackSent(true);
      setTimeout(() => setShowFeedback(false), 1500);
    };

    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
        
        <div className="absolute top-6 right-6 flex gap-3 z-20">
          <button
            onClick={() => setShowFeedback(true)}
            className="px-4 py-2 glass rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            Feedback
          </button>
          <a
            href="https://ko-fi.com/lumina"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-sm text-pink-400 hover:bg-pink-500/30 transition-all"
          >
            Donate
          </a>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-500/20">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-5xl font-bold tracking-tight">Lumina</h1>
            <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded text-xs font-bold text-yellow-400">BETA</span>
          </div>
          <p className="text-white/60 mb-10 text-lg leading-relaxed">
            Your thoughts, illuminated. Simple, intuitive, and powered by AI.
          </p>
          <button 
            onClick={loginWithGoogle}
            className="w-full py-4 px-6 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </motion.div>

        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowFeedback(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-dark rounded-3xl p-8 max-w-md w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Share Your Feedback</h3>
                <p className="text-white/50 text-sm mb-6">Help us improve Lumina! Report bugs, suggest features, or just say hi.</p>
                <form onSubmit={handleFeedbackSubmit}>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Your feedback..."
                    rows={4}
                    className="w-full glass-input rounded-xl p-4 text-sm mb-4 resize-none focus:outline-none focus:border-white/20"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFeedback(false)}
                      className="flex-1 py-3 glass rounded-xl hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!feedbackText.trim()}
                      className="flex-1 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-screen bg-transparent text-white flex overflow-hidden font-sans">
      <LuminaInsight notes={notes} isPremium={!!userProfile?.isPremium} />
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-72 h-full glass-dark border-r border-white/5 flex flex-col z-30"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight font-display">Lumina</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-full transition-all">
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <div className="px-4 mb-6">
              <button 
                onClick={createNote}
                className="w-full py-3 px-4 glass hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-3 transition-all group"
              >
                <Plus className="w-5 h-5 text-white/60 group-hover:text-white" />
                <span className="font-medium">New Note</span>
              </button>
            </div>

            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
              <SidebarItem 
                icon={<FileText className="w-4 h-4" />} 
                label="All Notes" 
                active={activeTab === 'all'} 
                onClick={() => setActiveTab('all')}
                count={notes.length}
              />
              <SidebarItem 
                icon={<Mic className="w-4 h-4" />} 
                label="Voice" 
                active={activeTab === 'voice'} 
                onClick={() => setActiveTab('voice')}
                count={notes.filter(n => n.isVoiceNote).length}
              />
              
              {!userProfile?.isPremium && (
                <div className="px-4 py-6 mt-4 glass rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Lumina Premium</p>
                  <p className="text-xs text-white/60 mb-4 leading-relaxed">Unlock Lumina Insight and remove ads for a one-time fee of $9.99.</p>
                  <GooglePayButton
                    environment="TEST"
                    paymentRequest={{
                      apiVersion: 2,
                      apiVersionMinor: 0,
                      allowedPaymentMethods: [
                        {
                          type: 'CARD',
                          parameters: {
                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                            allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
                          },
                          tokenizationSpecification: {
                            type: 'PAYMENT_GATEWAY',
                            parameters: {
                              gateway: 'example',
                              gatewayMerchantId: 'exampleGatewayMerchantId',
                            },
                          },
                        },
                      ],
                      merchantInfo: {
                        merchantId: '12345678901234567890',
                        merchantName: 'Lumina Notes',
                      },
                      transactionInfo: {
                        totalPriceStatus: 'FINAL',
                        totalPriceLabel: 'Total',
                        totalPrice: '9.99',
                        currencyCode: 'USD',
                        countryCode: 'US',
                      },
                    }}
                    onLoadPaymentData={handlePaymentSuccess}
                    buttonColor="white"
                    buttonType="buy"
                    className="w-full h-10"
                  />
                </div>
              )}

              <div className="pt-8 pb-2 px-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Recent Tags</div>
              <div className="px-2 space-y-1">
                {Array.from(new Set(notes.flatMap(n => n.tags))).slice(0, 8).map(tag => (
                  <SidebarItem key={tag} icon={<Hash className="w-4 h-4" />} label={tag} />
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 p-3 rounded-xl glass">
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-white/10" alt="User" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName}</p>
                  <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                </div>
                <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <LogOut className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Note List */}
      <div className={cn(
        "w-80 h-full glass-dark border-r border-white/5 flex flex-col transition-all duration-300",
        !isSidebarOpen && "ml-0"
      )}>
        <div className="p-6">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="mb-4 p-2 hover:bg-white/5 rounded-lg transition-all">
              <Menu className="w-5 h-5 text-white/40" />
            </button>
          )}
          <h2 className="text-2xl font-bold mb-6 font-display">Notes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

          <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
            {!userProfile?.isPremium && <AdBanner />}
            {filteredNotes.map(note => (
            <motion.button
              layout
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                selectedNoteId === note.id 
                  ? "glass bg-white/10" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={cn(
                  "font-semibold truncate pr-4",
                  selectedNoteId === note.id ? "text-white" : "text-white/60 group-hover:text-white/80"
                )}>
                  {note.title || 'Untitled Note'}
                </h3>
                {note.isVoiceNote && <Mic className="w-3 h-3 text-purple-400 mt-1" />}
              </div>
              <p className="text-xs text-white/30 line-clamp-2 leading-relaxed">
                {note.content || 'No content yet...'}
              </p>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-white/20">
                  <Clock className="w-3 h-3" />
                  {format(note.updatedAt?.toDate() || new Date(), 'MMM d')}
                </div>
                <div className="flex gap-1">
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] text-white/40 uppercase tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {selectedNoteId === note.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-full"
                />
              )}
            </motion.button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="text-center py-20 opacity-20">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm">No notes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <main className="flex-1 h-full flex flex-col relative bg-transparent">
        <AnimatePresence mode="wait">
          {selectedNote ? (
            <motion.div 
              key={selectedNote.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              {/* Toolbar */}
              <header className="h-16 glass border-b-0 flex items-center justify-between px-8 mx-6 mt-6 rounded-2xl">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleFormatNote}
                    disabled={isFormatting}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all",
                      isFormatting 
                        ? "bg-purple-500/20 text-purple-300 cursor-not-allowed" 
                        : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                    )}
                  >
                    <Sparkles className={cn("w-4 h-4", isFormatting && "animate-pulse")} />
                    {isFormatting ? 'Illuminating...' : 'AI Format'}
                  </button>
                  <button 
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/60 hover:bg-white/10 text-xs font-semibold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setNoteToDelete(selectedNote.id)}
                    className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-lg transition-all"
                    title="Delete Note"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/5 text-white/20 hover:text-white rounded-lg transition-all"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={shareViaEmail}
                    className="p-2 hover:bg-white/5 text-white/20 hover:text-white rounded-lg transition-all"
                    title="Share via Email"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Editor Content */}
              <div className="flex-1 overflow-y-auto p-12 lg:p-20 max-w-6xl mx-auto w-full">
                <div className="mb-12">
                  <input 
                    type="text"
                    value={localTitle}
                    onChange={(e) => {
                      setLocalTitle(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Note Title"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="w-full bg-transparent text-5xl font-bold mb-6 focus:outline-none placeholder:text-white/10 tracking-tight font-display"
                  />
                  
                  {/* Tags Section */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedNote.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <form onSubmit={addCustomTag} className="relative">
                      <input 
                        type="text"
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="bg-transparent border-b border-white/10 text-[10px] py-1 px-2 focus:outline-none focus:border-purple-500/50 transition-all w-24"
                      />
                    </form>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">
                      <span>Plain Text</span>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>Live Sync</span>
                      </div>
                    </div>
                    <textarea 
                      value={localContent}
                      onChange={(e) => {
                        setLocalContent(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Start writing your thoughts..."
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="w-full h-[55vh] bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-white/5"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">
                      <span>Illuminated View</span>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    </div>
                    <div className="w-full h-[55vh] overflow-y-auto prose prose-invert prose-purple max-w-none glass rounded-3xl p-8" id="illuminated-content">
                      {selectedNote.markup ? (
                        <ReactMarkdown>{selectedNote.markup}</ReactMarkdown>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                          <Sparkles className="w-12 h-12 mb-4" />
                          <p className="text-sm">Click "AI Format" to illuminate your note</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-transparent">
              <div className="w-24 h-24 glass rounded-3xl flex items-center justify-center mb-8">
                <FileText className="w-10 h-10 text-white/10" />
              </div>
              <h2 className="text-3xl font-bold mb-4 font-display">Select a note to begin</h2>
              <p className="text-white/30 max-w-xs leading-relaxed">
                Choose a note from the sidebar or create a new one to start illuminating your thoughts.
              </p>
              <button 
                onClick={createNote}
                className="mt-8 py-3 px-8 bg-white text-black font-bold rounded-full hover:scale-105 transition-all active:scale-95 shadow-xl"
              >
                Create New Note
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* Voice Recording Floating Button */}
        <div className="absolute bottom-10 right-10 flex flex-col items-end gap-4">
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl shadow-red-500/40"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Recording...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90",
              isRecording 
                ? "bg-red-500 text-white rotate-90" 
                : "bg-gradient-to-br from-purple-500 to-orange-500 text-white hover:scale-110"
            )}
          >
            {isRecording ? <StopCircle className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {noteToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-dark max-w-sm w-full p-8 rounded-3xl border border-white/10 shadow-2xl"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">Delete Note?</h3>
                <p className="text-white/40 text-center mb-8 text-sm leading-relaxed">
                  This action cannot be undone. All content and AI illuminations will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setNoteToDelete(null)}
                    className="flex-1 py-3 px-4 glass hover:bg-white/5 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => deleteNote(noteToDelete)}
                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ 
  icon, 
  label, 
  active = false, 
  onClick, 
  count 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick?: () => void;
  count?: number;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group",
        active ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/60"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-md text-white/20">
          {count}
        </span>
      )}
    </button>
  );
}
