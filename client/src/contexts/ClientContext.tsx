import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ClientContextType = {
  selectedClientId: number | null;
  setSelectedClientId: (id: number | null) => void;
};

const ClientContext = createContext<ClientContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedClientId");
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    if (selectedClientId !== null) {
      localStorage.setItem("selectedClientId", selectedClientId.toString());
    } else {
      localStorage.removeItem("selectedClientId");
    }
  }, [selectedClientId]);

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
