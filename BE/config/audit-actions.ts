// Canonical admin audit-log action names. Import these instead of retyping the literal
// string at each logAdminAction() call site — a typo here silently breaks the audit trail.
export const AUDIT_ACTIONS = {
  ACCOUNT_CREATE: "account.create",
  ACCOUNT_UPDATE: "account.update",
  ACCOUNT_DELETE: "account.delete",
  ACCOUNT_ROLE_ASSIGN: "account.role_assign",

  CANDIDATE_VERIFY: "candidate.verify",
  CANDIDATE_UNVERIFY: "candidate.unverify",
  CANDIDATE_BAN: "candidate.ban",
  CANDIDATE_UNBAN: "candidate.unban",
  CANDIDATE_DELETE: "candidate.delete",

  COMPANY_APPROVE: "company.approve",
  COMPANY_BAN: "company.ban",
  COMPANY_STATUS_CHANGE: "company.status_change",
  COMPANY_DELETE: "company.delete",

  JOB_DELETE: "job.delete",

  EXPERIENCE_APPROVE: "experience.approve",
  EXPERIENCE_REJECT: "experience.reject",
  EXPERIENCE_DELETE: "experience.delete",
  EXPERIENCE_COMMENT_DELETE: "experience.comment_delete",

  REVIEW_APPROVE: "review.approve",
  REVIEW_REJECT: "review.reject",
  REVIEW_DELETE: "review.delete",

  REPORT_RESOLVE: "report.resolve",
  REPORT_DISMISS: "report.dismiss",

  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",
} as const;
