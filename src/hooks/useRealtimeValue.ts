import { useCallback, useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../config/firebase";

export const useRealtimeValue = <T,>(path: string | null) => {
    const [data, setValue] = useState<T | null>(null);
    useEffect(() => {
        if (!db || !path) return;
        const r = ref(db, path);

        const unsubscribe = onValue(r, (snapshot) => {
            setValue(snapshot.val());
        });

        return () => unsubscribe();
    }, [path]);

    const setData = useCallback((value: T) => {
        if (!db || !path) return;
        set(ref(db, path), value)
    }, [path]);

    return [data, setData] as const;
}