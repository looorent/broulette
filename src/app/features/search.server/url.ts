export function buildUrlForSearch(searchId: string): string {
  return `/searches/${searchId}`;
}

export function buildUrlForNewCandidate(searchId: string): string {
  return `${buildUrlForSearch(searchId)}/candidates`;
}

export function buildUrlForCandidate(searchId: string, candidateId: string): string {
  return `${buildUrlForSearch(searchId)}/candidates/${candidateId}`;
}
