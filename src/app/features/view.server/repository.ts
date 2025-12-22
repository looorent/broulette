import prisma from "@features/db.server/prisma";
import type { CandidateRedirect, CandidateView, SearchRedirect, SearchView } from "@features/view";
import { buildViewModelOfCandidate, buildViewModelOfSearch } from "./factory";

const LATEST = "latest";

export async function findSearchViewModel(
  searchId: string,
  locale: string
): Promise<SearchRedirect | SearchView | undefined> {
  if (searchId) {
    const search = await prisma.search.findWithLatestCandidateId(searchId);
    return buildViewModelOfSearch(search, locale);
  } else {
    return undefined;
  }
}

export async function findCandidateViewModel(
  searchId: string,
  candidateId: string,
  now: Date,
  locale: string
): Promise<CandidateRedirect | CandidateView | undefined> {
  if (searchId && candidateId) {
    if (candidateId === LATEST) {
      const search = await prisma.search.findWithLatestCandidateId(searchId);
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
      const candidate = await prisma.searchCandidate.findUnique({
        where: {
          id: candidateId,
          searchId: searchId
        },
        include: {
          search: true,
          restaurant: { include: { profiles: true } }
        }
      });
      return buildViewModelOfCandidate(candidate, locale, now);
    }
  } else {
    return undefined;
  }
}
