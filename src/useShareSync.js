import { useEffect, useRef } from "react";
import { listenShare } from "./shares.js";
import { todayStr } from "./data.js";

// Mom's side of live sync: listen to today's share doc and apply only the
// done-flags the worker actually flipped since the previous snapshot, so
// mom's own local toggles are never clobbered. Mom never writes to the doc.
export function useShareSync(lastShare, setToday) {
  const lastRemote = useRef(null);

  useEffect(() => {
    if (!lastShare?.id || lastShare.date !== todayStr()) return;
    lastRemote.current = null;
    const unsub = listenShare(lastShare.id, (data) => {
      const remote = new Map((data.tasks || []).map((x) => [x.id, !!x.done]));
      setToday((prev) => {
        if (!prev || prev.date !== todayStr()) return prev;
        const base = lastRemote.current;
        lastRemote.current = remote;
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
