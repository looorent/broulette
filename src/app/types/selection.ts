export class Selection {
  constructor(readonly id: string,
              readonly searchId: string
  ) {}

  toUrl(): string {
    return `/searches/${this.searchId}/selections/${this.id}`;
  }
}

export function createEmptySelection(searchId: string): Selection {
  return new Selection(crypto.randomUUID(), searchId);
}
