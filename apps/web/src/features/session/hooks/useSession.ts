import { useSessionStore } from "@/store/session.store";

export function useSession() {
    return useSessionStore();
}
