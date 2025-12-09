export class Search {
  constructor(readonly id: string) { }

  toUrl(): string {
    return `/searches/${this.id}`;
  }

  toNewSelectionUrl(): string {
    return `/searches/${this.id}/selections`;
  }
}

export function createEmptySearch(): Search {
  return new Search(crypto.randomUUID());
}
