export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SearchNotFoundError extends SearchError {
  constructor(searchId: string) {
    super(`Search with ID ${searchId} not found.`);
    this.name = 'SearchNotFoundError';
  }
}
