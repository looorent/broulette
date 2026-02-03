export interface ServiceStrategy<TArgs extends unknown[], TResult> {
  name: string;
  execute(...args: TArgs): Promise<TResult>;
}
