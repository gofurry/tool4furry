export type FileIssueReason = 'type' | 'size' | 'count';
export interface FileIssue {
  name: string;
  reason: FileIssueReason;
}
export interface FileConstraints {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
}
export interface FileSelection {
  accepted: File[];
  rejected: FileIssue[];
}

/** Metadata hints only: neither MIME nor a filename authenticates file contents. */
export function matchesAccept(
  file: Pick<File, 'name' | 'type'>,
  accept = '',
): boolean {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (/^(image|audio|video)\/\*$/.test(rule))
      return mime.startsWith(rule.slice(0, -1));
    return rule.includes('/') && mime === rule;
  });
}

/** Partial acceptance, in input order. Invalid type/size does not consume capacity. */
export function validateFiles(
  files: readonly File[],
  constraints: FileConstraints = {},
): FileSelection {
  const { accept, multiple = false, maxFiles, maxSizeBytes } = constraints;
  if (
    maxFiles !== undefined &&
    (!Number.isSafeInteger(maxFiles) || maxFiles < 0)
  ) {
    throw new RangeError('maxFiles must be a non-negative safe integer');
  }
  if (
    maxSizeBytes !== undefined &&
    (!Number.isSafeInteger(maxSizeBytes) || maxSizeBytes < 0)
  ) {
    throw new RangeError('maxSizeBytes must be a non-negative safe integer');
  }
  const capacity = Math.min(multiple ? Infinity : 1, maxFiles ?? Infinity);
  const accepted: File[] = [];
  const rejected: FileIssue[] = [];
  for (const file of files) {
    const reason = !matchesAccept(file, accept)
      ? 'type'
      : maxSizeBytes !== undefined && file.size > maxSizeBytes
        ? 'size'
        : accepted.length >= capacity
          ? 'count'
          : null;
    if (reason) rejected.push({ name: file.name, reason });
    else accepted.push(file);
  }
  return { accepted, rejected };
}
