import type { AnalysisResult, ProjectContext, RuleCategory } from "./ruleEngine";

export interface AiReviewerMessage {
  role: "user" | "assistant";
  text: string;
}

type Intent = "score" | "weakness" | "improvement" | "security" | "scalability" | "availability" | "performance" | "database" | "compliance" | "networking" | "services" | "priority" | "unknown";
type SpecificIntent = Exclude<Intent, "unknown">;

const normalize = (value: string) => value.toLowerCase()
  .replace(/authorisation/g, "authorization")
  .replace(/optimise/g, "optimize")
  .replace(/\bdb\b/g, "database")
  .replace(/\bspof\b/g, "single point of failure")
  .replace(/[^a-z0-9%+\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const PATTERNS: Record<SpecificIntent, RegExp> = {
  priority: /\b(fix first|first fix|priority|prioritize|prioritise|most important|highest priority|top priority|what should i fix)\b/,
  score: /\b(score|rating|marks|grade|architecture score|how much did i score|why is my score)\b/,
  security: /\b(security|secure|authentication|authorization|iam|identity|permission|permissions|access control)\b/,
  scalability: /\b(scale|scaling|scalability|traffic|users|rps|requests|load|capacity|spike|spikes|bottleneck)\b/,
  availability: /\b(availability|reliability|reliable|\bha\b|high availability|downtime|failure|failover|resilient|resilience|single point of failure)\b/,
  performance: /\b(performance|latency|throughput|bottleneck|response time|speed|slow|fast|milliseconds|\d+ms)\b/,
  database: /\b(database|databases|data store|datastore|rds|dynamodb|replica|replicas|read replica|multi az)\b/,
  compliance: /\b(compliance|compliant|audit|auditing|governance|regulation|regulatory|control|controls|soc 2|soc2)\b/,
  networking: /\b(network|networking|vpc|subnet|public subnet|private subnet|nat|gateway|route|routing|direct connect)\b/,
  services: /\b(what service|which service|missing service|add|should i use|recommend|recommendation|service should)\b/,
  weakness: /\b(weakness(?:es)?|weak|problem(?:s)?|issue(?:s)?|flaw(?:s)?|risk(?:s)?|wrong with)\b/,
  improvement: /\b(improve|improvement(?:s)?|strengthen|strength|enhance|better|optimize|change the design|make it stronger)\b/,
};

const WEIGHT: Record<SpecificIntent, number> = {
  priority: 5, security: 4, scalability: 4, availability: 4, performance: 4,
  database: 4, compliance: 4, networking: 4, services: 3, score: 3,
  weakness: 3, improvement: 1,
};

export function detectAiIntent(question: string): { primary: Intent; secondary: Intent | null } {
  const value = normalize(question);
  const scored = (Object.keys(PATTERNS) as SpecificIntent[])
    .filter((intent) => PATTERNS[intent].test(value))
    .sort((a, b) => WEIGHT[b] - WEIGHT[a]);
  return { primary: scored[0] ?? "unknown", secondary: scored[1] ?? null };
}

type ConversationIntent = "greeting" | "howAreYou" | "who" | "capabilities" | "thanks" | "acknowledgement" | "goodbye";

const conversationPatterns: Record<ConversationIntent, RegExp> = {
  greeting: /^(hi|hello|hey|hiya|heya)(\s+(there|ai))?$|^good\s+(morning|afternoon|evening|day)$/,
  howAreYou: /^(how are you|how is it going|how s it going|how are things)\??$/,
  who: /^(who are you|what are you|what is this ai)\??$/,
  capabilities: /^(what can you do|what do you do|how can you help|what are your capabilities)\??$/,
  thanks: /\b(thanks?|thank you|thankyou|thx|ty)\b/,
  acknowledgement: /^(ok|okay|got it|understood|i understand|perfect|great|nice|sounds good|alright|cool)\s*[.!]?$/,
  goodbye: /^(bye|goodbye|good bye|see you|see ya|talk to you later|catch you later)\s*[.!]?$/,
};

function detectConversationIntent(value: string): ConversationIntent | null {
  return (Object.keys(conversationPatterns) as ConversationIntent[]).find((intent) => conversationPatterns[intent].test(value)) ?? null;
}

const conversationResponses: Record<ConversationIntent, string[]> = {
  greeting: [
    "Hi! How can I help you with your architecture today?",
    "Hello! I’m your AI Architecture Reviewer. What would you like to review?",
    "Hey! I’m ready to help analyze your architecture.",
  ],
  howAreYou: [
    "I’m doing great and ready to review your architecture. What would you like to check?",
    "Doing well! What can I help you improve in your architecture?",
  ],
  who: [
    "I’m your AI Architecture Reviewer. I analyze the canvas and help identify weaknesses across security, scalability, availability, performance, networking, database design, and compliance.",
  ],
  capabilities: [
    "I can review your current architecture for security, scalability, availability, performance, networking, database design, compliance, score, weaknesses, and improvement priorities.",
  ],
  thanks: [
    "You’re welcome! Happy to help.",
    "Anytime! Let me know what you’d like to review next.",
    "You’re welcome! Feel free to ask me anything about your architecture.",
  ],
  acknowledgement: [
    "Great! Let me know what you’d like to check next.",
    "Perfect! I’m here whenever you want to review another part of the architecture.",
  ],
  goodbye: [
    "Goodbye! Good luck with your architecture.",
    "See you! I’ll be here whenever you want to review your architecture again.",
    "Take care!",
  ],
};

function conversationResponse(intent: ConversationIntent, value: string) {
  const responses = conversationResponses[intent];
  return responses[value.length % responses.length];
}

export type GeneralConversationIntent =
  | "identity" | "creator" | "platform" | "doHere" | "purpose" | "aiDoes" | "aiWorks"
  | "realAi" | "help" | "pricing" | "servicesSupported" | "createArchitecture"
  | "reviewArchitecture" | "rememberArchitecture" | "architectureOverview" | "productionReady";

const generalConversationPatterns: Record<GeneralConversationIntent, RegExp> = {
  identity: /\b(who are you|what are you|who is this ai|tell me about yourself|what kind of ai are you|are you an ai)\b/,
  creator: /\b(who (made|created|built|developed) you|who is your (creator|developer)|who built this ai)\b/,
  platform: /\b(what is this( website| site| platform| tool)?( about| for)?|what does this (website|platform|site|tool) do|what is this for)\b/,
  doHere: /\b(what can i do( here| on this (site|website|platform))?|how does this work|how does (the )?(architecture designer|designer|architecture tool) work|what can i build here)\b/,
  purpose: /\b(why (was|is) this (website|platform|tool) (created|made|built)|what is the purpose of this (website|platform|tool)|why this tool|why was this created)\b/,
  aiDoes: /\b(what (can|does) (the )?(ai|assistant|reviewer) do|what is the ai (for|used for)|how can the ai help|what do you do|what can you do)\b/,
  aiWorks: /\b(how does (the )?ai work|how do you work|how does this assistant work|how are you analyzing|how does the reviewer work)\b/,
  realAi: /\b(are you (a )?real ai|are you actually ai|is this real ai|are you a bot)\b/,
  help: /\b(what can you help( me)? with|how can you help( me)?|can you help me)\b/,
  pricing: /\b(is this free|how much does this cost|what is the pricing|do you have pricing)\b/,
  servicesSupported: /\b(what (aws )?services (do you|does this) support|which services (can i|do you) use|what services are available)\b/,
  createArchitecture: /\b(can i (create|build|design|make) (my|an) (own )?architecture|can i design my own)\b/,
  reviewArchitecture: /\b(can you (review|analyze|analyse|check|evaluate) (my|this|the) architecture|can you check my design|can you review this)\b/,
  rememberArchitecture: /\b(do you (remember|know) (my|this) architecture|do you remember what i built)\b/,
  architectureOverview: /\b(what is (my|this) architecture|describe (my|this) architecture|give me an overview of (my|this) architecture)\b/,
  productionReady: /\b(is (my|this) architecture (production[ -]?ready|ready for production)|can i use this in production)\b/,
};

export function detectGeneralIntent(value: string): GeneralConversationIntent | null {
  return (Object.keys(generalConversationPatterns) as GeneralConversationIntent[]).find((intent) => generalConversationPatterns[intent].test(value)) ?? null;
}

function generalConversationResponse(intent: GeneralConversationIntent, result: AnalysisResult | null, ctx: ProjectContext): string {
  switch (intent) {
    case "identity": return "I'm your AI Architecture Reviewer. I analyze the architecture on your canvas, identify engineering risks, and explain how to improve security, scalability, availability, performance, and reliability.";
    case "creator": return "I'm part of ArchGuard AI, built by Riya Saini, Raj Anand Soni, and Prafful Goyal. I'm here to help you design, review, and improve cloud architectures.";
    case "platform": return "ArchGuard AI combines a visual architecture designer, deterministic rule engine, architecture scoring, security review, AI explanations, and a Knowledge Hub in one Design -> Review -> Learn -> Improve workflow.";
    case "doHere": return "You can create a project, choose a cloud and architecture context, build on the drag-and-drop canvas, connect components, run validation, review the score, learn from findings, and improve the design.";
    case "purpose": return "ArchGuard AI exists to catch architecture and security risks before they become expensive production problems. It combines visual modeling with consistent, explainable engineering feedback.";
    case "aiDoes": return "I explain findings from the architecture review. Ask me about security, scalability, availability, reliability, performance, databases, networking, compliance, observability, your score, weaknesses, or improvement priorities.";
    case "aiWorks": return "I read the structured services, connections, requirements, and rule findings from the current canvas. The deterministic rules decide the validation and score; I explain the results and suggest next steps.";
    case "realAi": return "I'm an AI-style architecture assistant built into this platform. My review is currently driven by predefined rules and analysis logic, which keeps recommendations consistent and explainable.";
    case "help": return "I can help with architecture design, security, scalability, availability, reliability, performance, databases, networking, compliance, observability, scoring, weaknesses, and improvement recommendations.";
    case "pricing": return "I don't have access to the platform's current pricing information. Check the Plans or Pricing section for the latest details.";
    case "servicesSupported": return `The Component Library adapts to the selected cloud. ArchGuard AI currently supports AWS, Azure, and GCP service catalogs across areas such as compute, storage, databases, networking, security, messaging, and monitoring. Current canvas cloud: ${ctx.cloud.toUpperCase()}.`;
    case "createArchitecture": return "Absolutely! Add cloud services to the canvas, connect them into a directional flow, organize them with architecture boundaries, and run a review when the design is ready.";
    case "reviewArchitecture": return "Absolutely. Add services and connections to the canvas, choose the workload context, and run the architecture review. I can then explain the rule findings and suggest improvements.";
    case "rememberArchitecture": return result?.nodeCount ? "Yes. I can analyze the architecture currently loaded on your canvas." : "I don't currently have an architecture loaded to review. Add services to the canvas and I'll be able to analyze them.";
    case "architectureOverview": return result?.nodeCount ? `Your current architecture contains ${result.nodeCount} component${result.nodeCount === 1 ? "" : "s"} connected by ${result.edgeCount} relationship${result.edgeCount === 1 ? "" : "s"}. It is designed for approximately ${ctx.traffic || "the configured traffic target"} with a ${ctx.availability || "configured"} availability requirement. Services detected: ${result.serviceNames.join(", ") || "none named yet"}.` : "There is no architecture loaded on the canvas yet. Add services and connections, then I can summarize it for you.";
    case "productionReady": {
      const critical = result?.issues.filter((issue) => issue.rule.severity === "critical").length ?? 0;
      const high = result?.issues.filter((issue) => issue.rule.severity === "high").length ?? 0;
      if (!result?.nodeCount) return "I can't assess production readiness yet because there is no architecture loaded on the canvas.";
      if (critical || result.overall < 70) return `Not quite yet. The current score is ${result.overall}/100, with ${critical + high} high-impact finding${critical + high === 1 ? "" : "s"}. Address the critical security, availability, and operational gaps before considering this production-ready.`;
      return `The design is moving toward production readiness at ${result.overall}/100. I would still validate the remaining findings with load, failure-recovery, and security testing before launch.`;
    }
  }
}

const scoreLabel = (score: number | null) => score === null ? "N/A" : `${score}/100`;
const weakestCategory = (result: AnalysisResult) => [...result.categories].filter((item) => item.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
const issueText = (issue: AnalysisResult["issues"][number]) => `${issue.rule.issue}. Recommended action: ${issue.rule.recommendation}`;
const categorySummary = (result: AnalysisResult) => result.categories.map((item) => `${item.category} ${scoreLabel(item.score)}`).join(" · ");

const relatedIssues = (result: AnalysisResult, predicate: (category: RuleCategory, text: string) => boolean) =>
  result.issues.filter((issue) => predicate(issue.rule.category, `${issue.rule.issue} ${issue.rule.recommendation}`.toLowerCase()));

type WeaknessGroup = {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  issues: AnalysisResult["issues"];
  why: string;
  action: string;
};

const severityRank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
const severityLabel = (issues: AnalysisResult["issues"]): WeaknessGroup["severity"] => {
  const severity = issues.reduce((highest, item) => severityRank[item.rule.severity] > severityRank[highest] ? item.rule.severity : highest, "low" as keyof typeof severityRank);
  return `${severity.charAt(0).toUpperCase()}${severity.slice(1)}` as WeaknessGroup["severity"];
};
const issueSearchText = (issue: AnalysisResult["issues"][number]) => `${issue.rule.id} ${issue.rule.issue} ${issue.rule.recommendation}`.toLowerCase();

function groupedWeaknesses(result: AnalysisResult, ctx: ProjectContext): WeaknessGroup[] {
  const definitions: Array<Pick<WeaknessGroup, "title" | "why" | "action"> & { matches: (text: string) => boolean }> = [
    { title: "Database isolation and resilience", matches: (text) => /database|private-db|single-db|db-availability|replica|multi-az/.test(text), why: "The data layer is a high-impact boundary: exposure or a single database failure can affect both security and availability.", action: "Isolate the database in the appropriate private/database layer and add replication or Multi-AZ protection when supported by the selected database service." },
    { title: "Controlled traffic path", matches: (text) => /waf|load balancer|apigw|api gateway|rate-limiting|public-exposure|direct|entry point|traffic path/.test(text), why: "A clear edge-to-service path gives the architecture a security boundary and prevents untrusted requests or traffic spikes from reaching internal resources directly.", action: `Use the components represented in the canvas to create a controlled path such as Client -> WAF/CDN -> Gateway or load balancer -> Services -> Data${ctx.traffic ? ` for the ${ctx.traffic} target` : ""}.` },
    { title: "Identity and data protection", matches: (text) => /auth|identity|permission|encrypt|secret|insecure-transport|compliance|audit/.test(text), why: "Without explicit identity, encryption, and audit controls, sensitive data and administrative paths are harder to protect and verify.", action: "Add or configure only the identity, encryption, secrets, and audit controls that are appropriate for the services and data represented on the canvas." },
    { title: "Availability and failure recovery", matches: (text) => /availability|failover|redundan|spof|single point|dr-|health|connected/.test(text), why: `A failure in an unprotected dependency can interrupt the request path${ctx.availability ? ` for the ${ctx.availability} availability requirement` : ""}.`, action: "Remove single points of failure with health checks, redundancy, replication, and a recovery path appropriate to the workload." },
    { title: "Observability and operations", matches: (text) => /monitor|tracing|logging|observability|health/.test(text), why: "A design that cannot expose failures, latency, or unusual traffic is difficult to operate safely in production.", action: "Add the monitoring, logs, traces, and alerting needed to diagnose the critical request path." },
    { title: "Scalability and performance bottlenecks", matches: (text) => /scale|capacity|bottleneck|latency|cache|cdn|throughput|async|queue/.test(text), why: `The current request path may not absorb growth efficiently${ctx.traffic ? ` at the ${ctx.traffic} target` : ""}.`, action: "Distribute traffic, scale stateless workloads horizontally, and use caching or asynchronous processing only where the current data flow benefits from it." },
  ];
  const assigned = new Set<string>();
  const groups = definitions.map((definition) => {
    const issues = result.issues.filter((issue) => !assigned.has(issue.rule.id) && definition.matches(issueSearchText(issue)));
    issues.forEach((issue) => assigned.add(issue.rule.id));
    return issues.length ? { title: definition.title, severity: severityLabel(issues), issues, why: definition.why, action: definition.action } : null;
  }).filter((group): group is WeaknessGroup => Boolean(group));
  result.issues.filter((issue) => !assigned.has(issue.rule.id)).slice(0, 5).forEach((issue) => groups.push({ title: issue.rule.category, severity: severityLabel([issue]), issues: [issue], why: issue.rule.issue, action: issue.rule.recommendation }));
  return groups.sort((a, b) => severityRank[b.severity.toLowerCase() as keyof typeof severityRank] - severityRank[a.severity.toLowerCase() as keyof typeof severityRank]).slice(0, 5);
}

function scoreResponse(result: AnalysisResult) {
  const scored = result.categories.filter((item) => item.score !== null);
  const strongest = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const attention = [...scored].filter((item) => (item.score ?? 0) < 60).sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3);
  const breakdown = result.categories.map((item) => `- ${item.category}: ${scoreLabel(item.score)}${item.score === null ? " (not evaluated)" : item.score >= 80 ? " (strong)" : item.score >= 60 ? " (moderate)" : " (needs attention)"}`).join("\n");
  return [
    `Architecture Score\n\n${result.overall}/100 - ${result.maturity}`,
    `Category breakdown:\n${breakdown}`,
    strongest ? `What stands out: ${strongest.category} is currently strongest at ${scoreLabel(strongest.score)}.` : "The canvas needs more detail before category scores can be evaluated.",
    attention.length ? `The areas needing attention are ${attention.map((item) => `${item.category} (${scoreLabel(item.score)})`).join(", ")}. I would inspect the underlying findings rather than treating the lowest score alone as the first fix.` : "No scored category is currently below 60.",
  ].join("\n\n");
}

function weaknessResponse(result: AnalysisResult, ctx: ProjectContext) {
  if (!result.nodeCount) return "The canvas is empty, so there are no detected weaknesses yet. Add services, connect them, and run the review first.";
  const groups = groupedWeaknesses(result, ctx);
  if (!groups.length) return "I do not see a current rule violation in the evaluated architecture. The next step is to validate the design with realistic traffic, failure, and security tests.";
  return [
    "Biggest Architecture Weaknesses",
    `I found ${groups.length} high-impact areas that are holding the architecture back:`,
    groups.map((group, index) => `${index + 1}. ${group.title} - ${group.severity}\nWhy it matters: ${group.why}\nRecommended: ${group.action}`).join("\n\n"),
    `If you fix only three things first:\n${groups.slice(0, 3).map((group, index) => `${index + 1}. ${group.title}`).join("\n")}`,
  ].join("\n\n");
}

function categoryResponse(result: AnalysisResult, ctx: ProjectContext, category: RuleCategory, title: string, related?: (text: string) => boolean) {
  const categoryResult = result.categories.find((item) => item.category === category);
  const issues = related ? relatedIssues(result, (item, text) => item === category || related(text)) : categoryResult?.failed ?? [];
  if (!categoryResult || categoryResult.score === null) return `${title}\n\nThis area is not scored yet. Add more architecture detail and run the review again so the applicable rules can be evaluated.`;
  return [`${title}: ${scoreLabel(categoryResult.score)} for this ${ctx.cloud.toUpperCase()} architecture.`, issues.length ? issues.slice(0, 3).map(issueText).join("\n") : `The design passes the applicable ${category.toLowerCase()} rules. Validate the ${ctx.availability} target with production-like testing.`].join("\n\n");
}

function improvementResponse(result: AnalysisResult, ctx: ProjectContext) {
  if (!result.nodeCount) return "The canvas is empty. Add services and relationships first, then I can prioritize improvements from the review findings.";
  const groups = groupedWeaknesses(result, ctx);
  if (!groups.length) return `Your architecture scores ${result.overall}/100 (${result.maturity}) and has no current rule violations. Strengthen it next with production-like load tests, failure drills, observability validation, and cost reviews.`;
  return [
    "How to Strengthen Your Architecture",
    `Your architecture currently scores ${result.overall}/100 (${result.maturity}). I would improve it in this order:`,
    groups.slice(0, 4).map((group, index) => `Priority ${index + 1} - ${group.title} (${group.severity})\nAction: ${group.action}\nExpected impact: ${group.why}`).join("\n\n"),
    `What I would fix first:\n${groups.slice(0, 3).map((group, index) => `${index + 1}. ${group.title}`).join("\n")}`,
  ].join("\n\n");
}

function topThreeImprovementResponse(result: AnalysisResult, ctx: ProjectContext) {
  if (!result.nodeCount) return "The canvas is empty. Add services and relationships first, then I can identify exactly three improvements from the architecture.";
  const groups = groupedWeaknesses(result, ctx);
  const fallback = [
    { title: "Validate the critical request path", action: "Confirm the intended client-to-service-to-data flow and test it under realistic traffic.", why: "This prevents recommendations from being based on assumptions that are not represented on the canvas." },
    { title: "Add production observability", action: "Define monitoring, logs, traces, and alerts for the critical path.", why: "Operational visibility is required to diagnose failures and performance regressions." },
    { title: "Run resilience and load tests", action: "Test traffic spikes, dependency failures, recovery, and latency against the stated requirements.", why: "Validation reveals risks that static architecture rules cannot confirm." },
  ];
  const items = [...groups, ...fallback].slice(0, 3);
  return [
    "Top 3 Improvements",
    items.map((item, index) => `${index + 1}. ${item.title}\nAction: ${item.action}\nWhy: ${item.why}`).join("\n\n"),
    "Expected outcome: these three changes address the highest-impact risks currently visible in the architecture without assuming configuration that is not shown on the canvas.",
  ].join("\n\n");
}

function serviceResponse(result: AnalysisResult) {
  const recommendations = result.issues.filter((issue) => /add|introduce|enable|use|move|front|replica|identity|monitor|logging|private/i.test(issue.rule.recommendation)).slice(0, 4);
  return recommendations.length ? ["Service recommendations based on the current findings:", ...recommendations.map((issue, index) => `${index + 1}. ${issue.rule.recommendation}`), `Current services: ${result.serviceNames.join(", ") || "none yet"}.`].join("\n") : `I cannot infer a missing service from the current rule results. Current services are: ${result.serviceNames.join(", ") || "none yet"}. Run a review after adding more architecture detail for targeted recommendations.`;
}

function priorityResponse(result: AnalysisResult) {
  const top = result.issues.slice(0, 3);
  const weakest = weakestCategory(result);
  return top.length ? [`Highest-priority fix: ${top[0].rule.issue}.`, `Category: ${top[0].rule.category}${weakest ? ` (${scoreLabel(weakest.score)} weakest scored area: ${weakest.category})` : ""}.`, `Recommended action: ${top[0].rule.recommendation}`, top.slice(1).map((issue, index) => `${index + 2}. ${issue.rule.category}: ${issue.rule.recommendation}`).join("\n")].join("\n\n") : "No rule violations are currently detected. Re-run the review after changing the canvas to identify the next highest-impact fix.";
}

export function getDeterministicAiResponse(question: string, result: AnalysisResult | null, ctx: ProjectContext): string {
  const value = normalize(question);
  if (!value) return "I’m not sure what aspect of the architecture you’re asking about. Try Security, Scalability, Availability, Performance, Database, Networking, Compliance, Score, Weaknesses, or Improvements.";
  const generalIntent = detectGeneralIntent(value);
  if (generalIntent) return generalConversationResponse(generalIntent, result, ctx);
  if (!result) return "Run an architecture review first, then I can answer questions using the current services, connections, requirements, score, and findings.";
  const architectureIntent = detectAiIntent(value);
  const conversationIntent = detectConversationIntent(value);

  // A real architecture question wins over a greeting prefix, e.g. "Hi, what's my score?".
  if (architectureIntent.primary === "unknown" && conversationIntent) {
    return conversationResponse(conversationIntent, value);
  }

  let response: string;
  switch (architectureIntent.primary) {
    case "score": return scoreResponse(result);
    case "weakness": return weaknessResponse(result, ctx);
    case "improvement": return /\btop 3 improvement/.test(value) ? topThreeImprovementResponse(result, ctx) : improvementResponse(result, ctx);
    case "security": return categoryResponse(result, ctx, "Security", "Security analysis", (text) => /identity|authentication|authorization|permission|iam|encrypt|security group|public access/.test(text));
    case "scalability": return categoryResponse(result, ctx, "Scalability", "Scalability analysis", (text) => /scale|traffic|capacity|load balancer|compute|cache|queue|replica|rps/.test(text));
    case "availability": return categoryResponse(result, ctx, "Availability", "Availability and reliability analysis", (text) => /availability|failover|replica|single point|multi az|redundancy|failure/.test(text));
    case "performance": return categoryResponse(result, ctx, "Performance", "Performance analysis", (text) => /latency|throughput|performance|bottleneck|response|cache/.test(text));
    case "database": return categoryResponse(result, ctx, "Reliability", "Database and storage analysis", (text) => /database|data|storage|replica|private|multi az|rds|dynamodb/.test(text));
    case "compliance": return categoryResponse(result, ctx, "Compliance", "Compliance analysis", (text) => /audit|compliance|governance|control|logging|identity|retention/.test(text));
    case "networking": return categoryResponse(result, ctx, "Security", "Networking analysis", (text) => /network|vpc|subnet|nat|route|gateway|private|public/.test(text));
    case "services": return serviceResponse(result);
    case "priority": return priorityResponse(result);
    default: response = "I’m not quite sure what you mean. I can help review security, scalability, availability, performance, networking, database design, compliance, weaknesses, improvements, and overall score.";
  }
  return conversationIntent === "greeting" ? `Hi! ${response}` : response;
}
