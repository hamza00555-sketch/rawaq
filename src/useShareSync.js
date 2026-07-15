import { useEffect, useRef } from "react";
import { listenShare } from "./shares.js";
import { todayStr } from "./data.js";

// Mom's side of live sync: listen to today's share doc and apply only the
// done-flags the worker actually flipped since the previous snapshot, so
// mom's own local toggles are never clobbered. Mom never writes to the doc.
// onProgress(count) fires when the worker completes new tasks since the last
// snapshot (used to raise a device notification).
export function useShareSync(lastShare, setToday, onProgress) {
  const lastRemote = useRef(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    if (!lastShare?.id || lastShare.date !== todayStr()) return;
    lastRemote.current = null;
    const unsub = listenShare(lastShare.id, (data) => {
      const remote = new Map((data.tasks || []).map((x) => [x.id, !!x.done]));
      const base = lastRemote.current;
      // newly-completed tasks since the last snapshot (skip the first snapshot)
      if (base) {
        let newlyDone = 0;
        for (const [id, done] of remote) if (done && !base.get(id)) newlyDone++;
        if (newlyDone > 0) cb.current?.(newlyDone);
      }
      lastRemote.current = remote;
      setToday((prev) => {
        if (!prev || prev.date !== todayStr()) return prev;
        let touched = false;
        const tasks = prev.tasks.map((task) => {
          if (!remote.has(task.id)) return task;
          const remoteDone = remote.get(task.id);
          // first snapshot: only apply done=true (worker progress so far)
          const changed = base ? remoteDone !== base.get(task.id) : remoteDone;
          if (changed && remoteDone !== task.done) {
            touched = true;
            return { ...task, done: remoteDone };
          }
          return task;
        });
        return touched ? { ...prev, tasks } : prev;
      });
    });
    return unsub;
  }, [lastShare?.id, lastShare?.date, setToday]);
}
