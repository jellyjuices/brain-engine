import { useEffect, useState } from "react";
import type { StoredNote } from "@/lib/notes/model.ts";
import type { DeviceFind } from "@/lib/search/device-find.ts";
import { findOnDevice } from "@/lib/search/find-on-device.ts";

export function useDeviceFind(q: string, notes: readonly StoredNote[]): DeviceFind | null {
  const [found, setFound] = useState<DeviceFind | null>(null);
  useEffect(() => {
    let alive = true;
    void findOnDevice(q, notes).then((next) => alive && setFound(next));
    return () => {
      alive = false;
    };
  }, [q, notes]);
  return found?.q === q ? found : null;
}
