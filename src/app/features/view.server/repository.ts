import type { CandidateRepository, SearchRepository } from "@features/db.server";
import type { CandidateRedirect, CandidateView, SearchRedirect, SearchView } from "@features/view";

import { buildViewModelOfCandidate, buildViewModelOfSearch } from "./factory";

const LATEST = "latest";

export async function findSearchViewModel(
  searchId: string,
  locale: string,
  searchRepository: SearchRepository
): Promise<SearchRedirect | SearchView | undefined> {
  if (searchId) {
    const search = await searchRepository.findWithLatestCandidateId(searchId);
    return buildViewModelOfSearch(search, locale);
  } else {
    return undefined;
  }
}

export async function findCandidateViewModel(
  searchId: string,
  candidateId: string,
  now: Date,
  locale: string,
  searchRepository: SearchRepository,
  candidateRepository: CandidateRepository
): Promise<CandidateRedirect | CandidateView | undefined> {
  if (searchId && candidateId) {
    if (candidateId === LATEST) {
      const search = await searchRepository.findWithLatestCandidateId(searchId);
      if (search?.latestCandidateId) {
        return {
          searchId: search.searchId,
          candidateId: search?.latestCandidateId,
          redirectRequired: true
        };
      } else {
        return undefined;
      }
    } else {
      const candidate = await candidateRepository.findById(candidateId, searchId);
      return buildViewModelOfCandidate(candidate, locale, now);
    }
  } else {
    return undefined;
  }
}
