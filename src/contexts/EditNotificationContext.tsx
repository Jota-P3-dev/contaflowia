import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface EditNotification {
  type: "goal" | "transaction" | "leisure";
  action: "create" | "update" | "delete";
  itemName: string;
  oldValue?: string | number;
  newValue?: string | number;
}

interface EditNotificationContextType {
  pendingNotification: EditNotification | null;
  notifyEdit: (notification: EditNotification) => void;
  clearNotification: () => void;
}

const EditNotificationContext = createContext<EditNotificationContextType | null>(null);

export function EditNotificationProvider({ children }: { children: ReactNode }) {
  const [pendingNotification, setPendingNotification] = useState<EditNotification | null>(null);

  const notifyEdit = useCallback((notification: EditNotification) => {
    setPendingNotification(notification);
  }, []);

  const clearNotification = useCallback(() => {
    setPendingNotification(null);
  }, []);

  return (
    <EditNotificationContext.Provider value={{ pendingNotification, notifyEdit, clearNotification }}>
      {children}
    </EditNotificationContext.Provider>
  );
}

export function useEditNotification() {
  const context = useContext(EditNotificationContext);
  if (!context) {
    throw new Error("useEditNotification must be used within EditNotificationProvider");
  }
  return context;
}
