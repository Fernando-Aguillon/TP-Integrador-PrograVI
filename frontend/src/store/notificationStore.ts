import { create } from 'zustand'
export type NotificationKind = 'success' | 'error' | 'info'
interface NotificationState { message: string | null; kind: NotificationKind; showNotification: (message: string, kind?: NotificationKind) => void; hideNotification: () => void }
export const useNotificationStore = create<NotificationState>((set) => ({ message: null, kind: 'info', showNotification: (message, kind = 'info') => set({ message, kind }), hideNotification: () => set({ message: null }) }))
