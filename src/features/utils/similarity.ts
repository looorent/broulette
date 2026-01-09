/**
 * Calculates the similarity between two strings using the Sørensen–Dice coefficient.
 * This mimics the behavior of the 'string-similarity' library.
 * Returns a value between 0 and 1.
 */
export function compareTwoStrings(first: string, second: string): number {
  first = first.replace(/\s+/g, "").toLowerCase();
  second = second.replace(/\s+/g, "").toLowerCase();

  if (first === second) {
    return 1;
  } else if (first.length < 2 || second.length < 2) {
    return 0;
  } else {
    const firstBigrams = new Map<string, number>();
    for (let i = 0; i < first.length - 1; i++) {
      const bigram = first.substring(i, i + 2);
      const count = firstBigrams.get(bigram) || 0;
      firstBigrams.set(bigram, count + 1);
    }

    let intersectionSize = 0;
    for (let i = 0; i < second.length - 1; i++) {
      const bigram = second.substring(i, i + 2);
      const count = firstBigrams.get(bigram) || 0;

      if (count > 0) {
        firstBigrams.set(bigram, count - 1);
        intersectionSize++;
      }
    }

    return (2.0 * intersectionSize) / (first.length - 1 + second.length - 1);
  }
}
