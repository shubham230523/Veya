import { SecurityScanStatus } from '../../types/skill';

export interface SecurityScanFinding {
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  matchedText?: string;
}

export interface SecurityScanResult {
  status: SecurityScanStatus;
  scannedAt: string;
  summary: string;
  findings: SecurityScanFinding[];
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /bypass\s+(system|safety|security)\s+(filters|prompts|guardrails)/i,
  /act\s+as\s+a\s+(DAN|jailbroken|unrestricted)/i,
  /disregard\s+system\s+prompt/i,
  /override\s+safety\s+protocols/i,
];

const CREDENTIAL_HARVESTING_PATTERNS = [
  /(enter|give|send|export|expose|reveal)\s+your\s+(api\s*key|password|secret|token|credentials)/i,
  /process\.env\.[A-Z_]*(SECRET|KEY|PASS|TOKEN)/i,
  /cat\s+~\/\.ssh\/id_rsa/i,
  /aws_access_key_id/i,
];

const DANGEROUS_COMMAND_PATTERNS = [
  /rm\s+-rf\s+(\/|~\/\*|\*)/i,
  /format\s+[c-z]:/i,
  /mkfs\./i,
  /dd\s+if=\/dev\/zero/i,
  /curl\s+.*\|\s*sh/i,
  /wget\s+.*\|\s*bash/i,
];

export const scanSkillContent = (content: {
  name: string;
  description: string;
  objective: string;
  instructions: string;
  rules?: string[];
}): SecurityScanResult => {
  const findings: SecurityScanFinding[] = [];
  const fullText = `
    ${content.name}
    ${content.description}
    ${content.objective}
    ${content.instructions}
    ${(content.rules || []).join(' ')}
  `;

  // 1. Check Injection
  for (const pattern of INJECTION_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      findings.push({
        ruleId: 'PROMPT_INJECTION',
        severity: 'high',
        message: 'Potential prompt injection attempt to override system instructions.',
        matchedText: match[0],
      });
    }
  }

  // 2. Check Credential Harvesting
  for (const pattern of CREDENTIAL_HARVESTING_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      findings.push({
        ruleId: 'CREDENTIAL_HARVESTING',
        severity: 'high',
        message: 'Suspicious request attempting to extract secrets or credentials.',
        matchedText: match[0],
      });
    }
  }

  // 3. Check Dangerous Shell Commands
  for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      findings.push({
        ruleId: 'DANGEROUS_COMMAND',
        severity: 'high',
        message: 'Destructive system or shell command detected.',
        matchedText: match[0],
      });
    }
  }

  let status: SecurityScanStatus = 'clean';
  let summary = 'No obvious security issues detected.';

  const highSeverity = findings.filter((f) => f.severity === 'high');
  if (highSeverity.length > 0) {
    status = 'flagged';
    summary = `Flagged: Detected ${highSeverity.length} high-risk security issue(s).`;
  } else if (findings.length > 0) {
    status = 'warning';
    summary = `Warning: ${findings.length} potential warning(s) detected.`;
  }

  return {
    status,
    scannedAt: new Date().toISOString(),
    summary,
    findings,
  };
};
