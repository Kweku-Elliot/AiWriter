'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type Plan = 'Free' | 'Pro' | 'Premium+';

interface HistoryItem {
  id: string;
  type: string;
  input: any;
  output: any;
  timestamp: string;
}

interface BillingTransaction {
  id: string;
  date: string;
  item: string;
  amount: number;
  method: 'Stripe' | 'Paystack';
}

interface UserData {
    credits: number;
    plan: Plan;
    history: HistoryItem[];
    billingHistory: BillingTransaction[];
    hasReceivedFreeCredits: boolean;
}

interface UserContextType extends Omit<UserData, 'hasReceivedFreeCredits'> {
  user: User | null;
  isInitialized: boolean;
  deductCredits: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  setPlan: (plan: Plan) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  addTransaction: (item: Omit<BillingTransaction, 'id'>) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlanState] = useState<Plan>('Free');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingTransaction[]>([]);
  const [hasReceivedFreeCredits, setHasReceivedFreeCredits] = useState(false);

  const loadUserData = useCallback(async (currentUser: User) => {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as UserData;
      setCredits(data.credits);
      setPlanState(data.plan);
      setHistory(data.history || []);
      setBillingHistory(data.billingHistory || []);
      setHasReceivedFreeCredits(data.hasReceivedFreeCredits || false);
    } else {
      // Create a new document for a new user
      const newUserData: UserData = {
        credits: 25,
        plan: 'Free',
        history: [],
        billingHistory: [],
        hasReceivedFreeCredits: true,
      };
      await setDoc(userRef, newUserData);
      setCredits(newUserData.credits);
      setPlanState(newUserData.plan);
      setHistory(newUserData.history);
      setBillingHistory(newUserData.billingHistory);
      setHasReceivedFreeCredits(true);
    }
  }, []);

  const resetToGuestState = () => {
    setCredits(0);
    setPlanState('Free');
    setHistory([]);
    setBillingHistory([]);
    setHasReceivedFreeCredits(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser);
      } else {
        resetToGuestState();
      }
      setIsInitialized(true);
    });
    return () => unsubscribe();
  }, [loadUserData]);


  const signInWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      router.push('/');
      toast({ title: 'Signed in successfully!' });
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      router.push('/');
      toast({ title: 'Account created!', description: "You have been signed in successfully." });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/new-login');
      toast({ title: 'Signed out successfully.' });
    } catch (error) {
      console.error('Error signing out', error);
      toast({ variant: 'destructive', title: 'Sign out failed' });
    }
  };

  const deductCredits = async (amount: number) => {
    if (!user) return false;
    if (credits >= amount) {
      const newCredits = credits - amount;
      await updateDoc(doc(db, 'users', user.uid), { credits: newCredits });
      setCredits(newCredits);
      return true;
    }
    return false;
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    const newCredits = credits + amount;
    await updateDoc(doc(db, 'users', user.uid), { credits: newCredits });
    setCredits(newCredits);
    toast({
      title: 'Credits Added!',
      description: `${amount} credits have been added to your account.`,
    });
  };

  const setPlan = async (newPlan: Plan) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please Sign In', description: 'You need to be logged in to change your plan.'});
      router.push('/new-login');
      return;
    }

    if (plan === 'Premium+' && newPlan === 'Pro') {
      toast({
        variant: 'destructive',
        title: 'Downgrade Not Allowed',
        description: 'Please cancel your current Premium+ plan before subscribing to Pro.',
      });
      return;
    }

    let creditsToAdd = 0;
    if (newPlan === 'Pro') creditsToAdd = 250;
    if (newPlan === 'Premium+') creditsToAdd = 600;
    
    const newCredits = credits + creditsToAdd;

    await updateDoc(doc(db, 'users', user.uid), { plan: newPlan, credits: newCredits });
    setPlanState(newPlan);
    setCredits(newCredits);

    if (creditsToAdd > 0) {
        toast({ title: `Upgraded to ${newPlan}!`, description: `Your plan has been upgraded and ${creditsToAdd} credits have been added.`});
    } else {
         toast({ title: `Plan Changed to ${newPlan}!`, description: `Your plan has been changed.`});
    }
  };

  const cancelSubscription = async () => {
    if (!user || plan === 'Free') return;
    await updateDoc(doc(db, 'users', user.uid), { plan: 'Free' });
    setPlanState('Free');
    toast({
      title: 'Subscription Canceled',
      description: 'You are now on the Free plan. Your remaining credits have been saved.',
    });
  };

  const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (!user || plan === 'Free') return;
    const newHistoryItem: HistoryItem = {
      ...item,
      id: new Date().toISOString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'users', user.uid), {
        history: arrayUnion(newHistoryItem)
    });
    setHistory((prev) => [newHistoryItem, ...prev]);
  };

  const addTransaction = async (item: Omit<BillingTransaction, 'id'>) => {
    if (!user) return;
    const newTransaction: BillingTransaction = {
      ...item,
      id: new Date().toISOString() + Math.random().toString(36).substr(2, 9),
    };
     await updateDoc(doc(db, 'users', user.uid), {
        billingHistory: arrayUnion(newTransaction)
    });
    setBillingHistory(prev => [newTransaction, ...prev]);
  };

  const value: UserContextType = {
    user,
    credits,
    plan,
    history,
    billingHistory,
    isInitialized,
    deductCredits,
    addCredits,
    setPlan,
    cancelSubscription,
    addToHistory,
    addTransaction,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <UserContext.Provider value={value}>{!isInitialized ? <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
