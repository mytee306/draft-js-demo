export interface Option<Value> {
  value: Value;
  label: string;
}

export type Options<Value> = Option<Value>[];

export type StringOptions = Options<string>;
