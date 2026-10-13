interface Job {
  id: string;
  type: string;
  /** Opaque to the queue: it stores work, it does not inspect it. */
  payload: unknown;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class InMemoryJobQueue {
  private jobs = new Map<string, Job>();

  add(job: Omit<Job, "createdAt" | "status">): Job {
    const j: Job = {
      ...job,
      status: "queued",
      createdAt: new Date(),
    };
    this.jobs.set(j.id, j);
    return j;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  update(id: string, updates: Partial<Job>): Job | undefined {
    const j = this.jobs.get(id);
    if (!j) return undefined;
    const updated = { ...j, ...updates };
    this.jobs.set(id, updated);
    return updated;
  }

  list(): Job[] {
    return Array.from(this.jobs.values());
  }
}

export const jobQueue = new InMemoryJobQueue();
