
export interface Project {
  _id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsApiResponse {
  success: boolean;
  count: number;
  data: Project[];
}

export interface ProjectMonitor {
  _id: string;
  projectId: string;
  name: string;
  url: string;
  type: "website" | "api";
  interval: number;
  timeout: number;
  status: "operational" | "down" | "paused";
  enabled: boolean;
  failureCount: number;
  lastCheckedAt: string | null;
  lastResponseTime: number | null;
  createdAt: string;
}

export interface ProjectDetailsResponse {
  success: boolean;
  message: string;
  data: {
    project: Project;
    monitors: ProjectMonitor[];
    stats: {
      total: number;
      operational: number;
      down: number;
      paused: number;
    };
  };
}
