import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BillRecommendation } from '../types';
import { getMySaved, saveBill, unsaveBill } from '../services/apiService';
import { useAuth } from './AuthContext';

type SavedContextValue = {
  savedIds: Set<number>;
  savedBills: BillRecommendation[];
  refreshSaved: () => Promise<void>;
  isSaved: (billId: number) => boolean;
  toggleSave: (bill: BillRecommendation) => Promise<void>;
};

const SavedContext = createContext<SavedContextValue | undefined>(undefined);

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authToken } = useAuth();
  const [savedBills, setSavedBills] = useState<BillRecommendation[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const refreshSaved = useCallback(async (): Promise<void> => {
    if (!authToken) {
      setSavedBills([]);
      setSavedIds(new Set());
      return;
    }
    const bills = await getMySaved(authToken);
    setSavedBills(bills);
    setSavedIds(new Set(bills.map((bill) => bill.bill_id)));
  }, [authToken]);

  useEffect(() => {
    void refreshSaved();
  }, [authToken]);

  const isSaved = (billId: number): boolean => savedIds.has(billId);

  const toggleSave = useCallback(async (bill: BillRecommendation): Promise<void> => {
    if (!authToken) {
      return;
    }
    const currentlySaved = savedIds.has(bill.bill_id);
    if (currentlySaved) {
      const nextIds = new Set(savedIds);
      nextIds.delete(bill.bill_id);
      setSavedIds(nextIds);
      setSavedBills((prev) => prev.filter((item) => item.bill_id !== bill.bill_id));
      try {
        await unsaveBill(authToken, bill.bill_id);
      } catch (err) {
        await refreshSaved();
        throw err;
      }
      return;
    }
    const nextIds = new Set(savedIds);
    nextIds.add(bill.bill_id);
    setSavedIds(nextIds);
    setSavedBills((prev) => [bill, ...prev.filter((item) => item.bill_id !== bill.bill_id)]);
    try {
      await saveBill(authToken, bill.bill_id);
    } catch (err) {
      await refreshSaved();
      throw err;
    }
  }, [authToken, refreshSaved, savedIds]);

  const value = useMemo(
    () => ({
      savedIds,
      savedBills,
      refreshSaved,
      isSaved,
      toggleSave,
    }),
    [savedIds, savedBills, refreshSaved, toggleSave]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
};

export const useSaved = (): SavedContextValue => {
  const ctx = useContext(SavedContext);
  if (!ctx) {
    throw new Error('useSaved must be used within SavedProvider');
  }
  return ctx;
};
