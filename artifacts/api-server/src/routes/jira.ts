import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ─── Auth middleware ────────────────────────────────────────────────────────
const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  db.insert(usersTable)
    .values({ id: userId, email: (auth.sessionClaims?.email as string) ?? "" })
    .onConflictDoNothing()
    .execute()
    .catch(() => {});
  next();
};

// ─── Jira config helper ──────────────────────────────────────────────────────
function getJiraConfig() {
  const url = process.env["JIRA_URL"];
  const email = process.env["JIRA_EMAIL"];
  const token = process.env["JIRA_API_TOKEN"];
  const project = process.env["JIRA_PROJECT_KEY"];

  if (!url || !email || !token || !project) {
    return null;
  }
  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return { url: url.replace(/\/$/, ""), auth, project };
}

async function jiraFetch(path: string, options: RequestInit = {}) {
  const cfg = getJiraConfig();
  if (!cfg) throw new Error("Jira not configured");

  const response = await fetch(`${cfg.url}/rest/api/3${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${cfg.auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jira API error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// ─── GET /api/jira/status — check if Jira is configured ─────────────────────
router.get("/status", requireAuth, (_req, res) => {
  const cfg = getJiraConfig();
  return res.json({
    configured: cfg !== null,
    projectKey: cfg?.project ?? null,
    jiraUrl: cfg?.url ?? null,
    message: cfg
      ? "Jira is connected and ready."
      : "Jira is not configured. Set JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY in your environment.",
  });
});

// ─── GET /api/jira/issues — list all issues in project ──────────────────────
router.get("/issues", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) {
      return res.status(503).json({
        error: "Jira not configured",
        configured: false,
        message: "Configure JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY to enable Jira tracking.",
      });
    }

    const { status, assignee, priority, type, sprint, page = "1", limit = "20" } = req.query as Record<string, string>;

    let jql = `project = "${cfg.project}"`;
    if (status) jql += ` AND status = "${status}"`;
    if (assignee) jql += ` AND assignee = "${assignee}"`;
    if (priority) jql += ` AND priority = "${priority}"`;
    if (type) jql += ` AND issuetype = "${type}"`;
    if (sprint) jql += ` AND sprint = "${sprint}"`;
    jql += ` ORDER BY created DESC`;

    const startAt = (Number(page) - 1) * Number(limit);

    const data = await jiraFetch(
      `/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${limit}&fields=summary,status,assignee,reporter,priority,issuetype,created,updated,description,labels,comment,timetracking,fixVersions,sprint`,
    ) as any;

    const issues = (data.issues ?? []).map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      url: `${cfg.url}/browse/${issue.key}`,
      summary: issue.fields.summary,
      status: issue.fields.status?.name ?? "Unknown",
      statusCategory: issue.fields.status?.statusCategory?.key ?? "undefined",
      type: issue.fields.issuetype?.name ?? "Task",
      typeIcon: issue.fields.issuetype?.iconUrl ?? null,
      priority: issue.fields.priority?.name ?? "Medium",
      priorityIcon: issue.fields.priority?.iconUrl ?? null,
      assignee: issue.fields.assignee
        ? {
            name: issue.fields.assignee.displayName,
            email: issue.fields.assignee.emailAddress,
            avatar: issue.fields.assignee.avatarUrls?.["48x48"] ?? null,
          }
        : null,
      reporter: issue.fields.reporter
        ? {
            name: issue.fields.reporter.displayName,
            email: issue.fields.reporter.emailAddress,
          }
        : null,
      labels: issue.fields.labels ?? [],
      created: issue.fields.created,
      updated: issue.fields.updated,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text ?? null,
      commentCount: issue.fields.comment?.total ?? 0,
      timeSpent: issue.fields.timetracking?.timeSpent ?? null,
      timeEstimate: issue.fields.timetracking?.originalEstimate ?? null,
    }));

    return res.json({
      issues,
      total: data.total,
      startAt: data.startAt,
      maxResults: data.maxResults,
      projectKey: cfg.project,
      jiraUrl: cfg.url,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch Jira issues");
    return res.status(500).json({ error: err.message ?? "Failed to fetch Jira issues" });
  }
});

// ─── GET /api/jira/issues/:key — single issue detail ─────────────────────────
router.get("/issues/:key", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) return res.status(503).json({ error: "Jira not configured", configured: false });

    const { key } = req.params;
    const data = await jiraFetch(
      `/issue/${key}?fields=summary,status,assignee,reporter,priority,issuetype,created,updated,description,labels,comment,timetracking,subtasks,parent`,
    ) as any;

    const comments = (data.fields.comment?.comments ?? []).map((c: any) => ({
      id: c.id,
      author: c.author?.displayName ?? "Unknown",
      body: c.body?.content?.[0]?.content?.[0]?.text ?? "",
      created: c.created,
    }));

    return res.json({
      id: data.id,
      key: data.key,
      url: `${cfg.url}/browse/${data.key}`,
      summary: data.fields.summary,
      status: data.fields.status?.name ?? "Unknown",
      type: data.fields.issuetype?.name ?? "Task",
      priority: data.fields.priority?.name ?? "Medium",
      assignee: data.fields.assignee ? {
        name: data.fields.assignee.displayName,
        email: data.fields.assignee.emailAddress,
        avatar: data.fields.assignee.avatarUrls?.["48x48"] ?? null,
      } : null,
      reporter: data.fields.reporter ? {
        name: data.fields.reporter.displayName,
      } : null,
      description: data.fields.description?.content?.[0]?.content?.[0]?.text ?? null,
      labels: data.fields.labels ?? [],
      created: data.fields.created,
      updated: data.fields.updated,
      comments,
      subtasks: (data.fields.subtasks ?? []).map((s: any) => ({
        key: s.key,
        summary: s.fields.summary,
        status: s.fields.status?.name ?? "Unknown",
      })),
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch Jira issue");
    return res.status(500).json({ error: err.message ?? "Failed to fetch issue" });
  }
});

// ─── POST /api/jira/issues — create a new issue ──────────────────────────────
router.post("/issues", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) return res.status(503).json({ error: "Jira not configured", configured: false });

    const {
      summary,
      description,
      type = "Task",
      priority = "Medium",
      assigneeEmail,
      labels = [],
    } = req.body as {
      summary: string;
      description?: string;
      type?: string;
      priority?: string;
      assigneeEmail?: string;
      labels?: string[];
    };

    if (!summary) return res.status(400).json({ error: "summary is required" });

    // Build Jira issue payload (Atlassian Document Format for description)
    const payload: any = {
      fields: {
        project: { key: cfg.project },
        summary,
        issuetype: { name: type },
        priority: { name: priority },
        labels,
      },
    };

    if (description) {
      payload.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      };
    }

    if (assigneeEmail) {
      // Look up account ID by email
      try {
        const users = await jiraFetch(`/user/search?query=${encodeURIComponent(assigneeEmail)}`) as any[];
        const user = users?.find((u: any) => u.emailAddress === assigneeEmail);
        if (user) payload.fields.assignee = { accountId: user.accountId };
      } catch {
        // Best effort — skip assignee if lookup fails
      }
    }

    const data = await jiraFetch("/issue", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as any;

    return res.status(201).json({
      id: data.id,
      key: data.key,
      url: `${cfg.url}/browse/${data.key}`,
      message: `Issue ${data.key} created successfully`,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create Jira issue");
    return res.status(500).json({ error: err.message ?? "Failed to create issue" });
  }
});

// ─── PATCH /api/jira/issues/:key — update status or assignee ─────────────────
router.patch("/issues/:key", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) return res.status(503).json({ error: "Jira not configured", configured: false });

    const { key } = req.params;
    const { status, priority, summary } = req.body as {
      status?: string;
      priority?: string;
      summary?: string;
    };

    // Handle status transitions separately (Jira requires transition API)
    if (status) {
      const transitions = await jiraFetch(`/issue/${key}/transitions`) as any;
      const transition = transitions.transitions?.find(
        (t: any) => t.name.toLowerCase() === status.toLowerCase() ||
                    t.to?.name.toLowerCase() === status.toLowerCase(),
      );

      if (!transition) {
        const available = transitions.transitions?.map((t: any) => t.name) ?? [];
        return res.status(400).json({
          error: `Invalid transition. Available: ${available.join(", ")}`,
          availableTransitions: available,
        });
      }

      await jiraFetch(`/issue/${key}/transitions`, {
        method: "POST",
        body: JSON.stringify({ transition: { id: transition.id } }),
      });
    }

    // Update other fields if provided
    if (priority || summary) {
      const fields: any = {};
      if (priority) fields.priority = { name: priority };
      if (summary) fields.summary = summary;

      await jiraFetch(`/issue/${key}`, {
        method: "PUT",
        body: JSON.stringify({ fields }),
      });
    }

    return res.json({ success: true, message: `Issue ${key} updated` });
  } catch (err: any) {
    req.log.error({ err }, "Failed to update Jira issue");
    return res.status(500).json({ error: err.message ?? "Failed to update issue" });
  }
});

// ─── POST /api/jira/issues/:key/comments — add comment ───────────────────────
router.post("/issues/:key/comments", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) return res.status(503).json({ error: "Jira not configured", configured: false });

    const { key } = req.params;
    const { body: commentBody } = req.body as { body: string };

    if (!commentBody) return res.status(400).json({ error: "Comment body is required" });

    const data = await jiraFetch(`/issue/${key}/comment`, {
      method: "POST",
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            { type: "paragraph", content: [{ type: "text", text: commentBody }] },
          ],
        },
      }),
    }) as any;

    return res.status(201).json({
      id: data.id,
      author: data.author?.displayName ?? "Unknown",
      body: commentBody,
      created: data.created,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to add comment");
    return res.status(500).json({ error: err.message ?? "Failed to add comment" });
  }
});

// ─── GET /api/jira/summary — project-level stats for founder dashboard ────────
router.get("/summary", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) {
      return res.status(503).json({
        error: "Jira not configured",
        configured: false,
        message: "Add JIRA_* environment variables to enable the founder dashboard.",
      });
    }

    // Fetch summary stats in parallel
    const [todoData, inProgressData, doneData, bugData, allData] = await Promise.all([
      jiraFetch(`/search?jql=${encodeURIComponent(`project = "${cfg.project}" AND status = "To Do"`)}&maxResults=0`) as any,
      jiraFetch(`/search?jql=${encodeURIComponent(`project = "${cfg.project}" AND status = "In Progress"`)}&maxResults=0`) as any,
      jiraFetch(`/search?jql=${encodeURIComponent(`project = "${cfg.project}" AND status = "Done"`)}&maxResults=1`) as any,
      jiraFetch(`/search?jql=${encodeURIComponent(`project = "${cfg.project}" AND issuetype = Bug AND status != Done`)}&maxResults=5&fields=summary,priority,assignee,created`) as any,
      jiraFetch(`/search?jql=${encodeURIComponent(`project = "${cfg.project}" ORDER BY updated DESC`)}&maxResults=5&fields=summary,status,assignee,priority,updated,issuetype`) as any,
    ]);

    const recentIssues = (allData?.issues ?? []).map((issue: any) => ({
      key: issue.key,
      url: `${cfg.url}/browse/${issue.key}`,
      summary: issue.fields.summary,
      status: issue.fields.status?.name ?? "Unknown",
      statusCategory: issue.fields.status?.statusCategory?.key ?? "undefined",
      type: issue.fields.issuetype?.name ?? "Task",
      priority: issue.fields.priority?.name ?? "Medium",
      assignee: issue.fields.assignee?.displayName ?? "Unassigned",
      updated: issue.fields.updated,
    }));

    const openBugs = (bugData?.issues ?? []).map((issue: any) => ({
      key: issue.key,
      url: `${cfg.url}/browse/${issue.key}`,
      summary: issue.fields.summary,
      priority: issue.fields.priority?.name ?? "Medium",
      assignee: issue.fields.assignee?.displayName ?? "Unassigned",
      created: issue.fields.created,
    }));

    return res.json({
      projectKey: cfg.project,
      jiraUrl: cfg.url,
      configured: true,
      stats: {
        todo: todoData?.total ?? 0,
        inProgress: inProgressData?.total ?? 0,
        done: doneData?.total ?? 0,
        openBugs: bugData?.total ?? 0,
      },
      recentIssues,
      openBugs,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch Jira summary");
    return res.status(500).json({ error: err.message ?? "Failed to fetch Jira summary" });
  }
});

// ─── GET /api/jira/transitions/:key — available status transitions ─────────────
router.get("/transitions/:key", requireAuth, async (req: any, res) => {
  try {
    const cfg = getJiraConfig();
    if (!cfg) return res.status(503).json({ error: "Jira not configured", configured: false });

    const data = await jiraFetch(`/issue/${req.params.key}/transitions`) as any;
    return res.json({
      transitions: (data.transitions ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        to: t.to?.name,
      })),
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch transitions");
    return res.status(500).json({ error: err.message ?? "Failed to fetch transitions" });
  }
});

export default router;
