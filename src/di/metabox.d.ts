declare const TYPE_BOX_KEY: '__MetaBox_value';

export interface Box<T> {
  [TYPE_BOX_KEY]?: [T];
}

export type Unbox<T extends Box<any>> = NonNullable<T[typeof TYPE_BOX_KEY]>[0];

export type Unpack<T> = T extends Box<any> ? Unbox<T> : T;
