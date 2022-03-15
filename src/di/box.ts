const BOX_KEY: '__Box_value' = '__Box_value';

export interface Box<T> {
  [BOX_KEY]: T;
}

export type Unbox<T extends Box<any>> = T[typeof BOX_KEY];

export type Unpack<T> = T extends Box<any> ? Unbox<T> : T;

export function box<T>(value: T): Box<T> {
  return { [BOX_KEY]: value };
}

export function unbox<T>(box: Box<T>): T {
  return box[BOX_KEY];
}

export function isBox(maybeBox: unknown): maybeBox is Box<unknown> {
  return (
    typeof maybeBox === 'object' && maybeBox !== null && BOX_KEY in maybeBox
  );
}

export function unpack<T>(boxOrValue: Box<T> | T): T {
  return isBox(boxOrValue) ? boxOrValue[BOX_KEY] : boxOrValue;
}
