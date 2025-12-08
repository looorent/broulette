export class Search {
  constructor(readonly id: string) { }

  toUrl(): string {
    return `/searches/${this.id}`;
  }
}

export function createEmptySearch(): Search {
  return new Search(crypto.randomUUID());
}
