import { invoke, InvokeArgs } from "@tauri-apps/api/core";
import { EventCallback, listen } from "@tauri-apps/api/event";

export class MultiWindowBridge {
    static async emitToAll(event: string, payload?: InvokeArgs) {
        await invoke("multi_window_bridge_send", {
            payload: {
                target: "announce",
                event,
                payload,
            },
        });
    }
    static async emit(target: string, event: string, payload?: InvokeArgs) {
        await invoke("multi_window_bridge_send", {
            payload: {
                target,
                event,
                payload,
            },
        });
    }
    static async on<T>(event: string, callback: EventCallback<T>) {
        return await listen(event, callback);
    }
}
