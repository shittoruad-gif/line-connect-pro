/**
 * Portal wrapper pages that reuse admin page components
 * but automatically inject the client's own clientId
 */
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useClient } from "@/contexts/ClientContext";

/**
 * HOC that wraps an admin page component and auto-sets the client context
 * to the portal user's own client
 */
export function withPortalClient<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function PortalWrapped(props: P) {
    const { data: myClient, isLoading } = trpc.portal.myClient.useQuery();
    const { setSelectedClientId } = useClient();

    useEffect(() => {
      if (myClient?.id) {
        setSelectedClientId(myClient.id);
      }
    }, [myClient?.id, setSelectedClientId]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!myClient) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">クライアント情報が見つかりません</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
