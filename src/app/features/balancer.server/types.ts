export interface ServiceStrategy<TArgs extends any[], TResult> {
  name: string;
  execute(...args: TArgs): Promise<TResult>;
}
