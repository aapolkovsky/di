/* eslint-disable @typescript-eslint/no-namespace */

import * as BoxNS from './box';

export type Box<T> = BoxNS.Box<() => T>;

export type Unbox<T extends Box<any>> = ReturnType<BoxNS.Unbox<T>>;

export type Unpack<T> = T extends Box<any> ? Unbox<T> : T;

export function box<T>(ref: () => T): Box<T> {
  return BoxNS.box(ref);
}

export function unbox<T>(box: Box<T>): T {
  return BoxNS.unbox(box)();
}

export function isRefBox(maybeRef: unknown): maybeRef is Box<unknown> {
  return BoxNS.isBox(maybeRef) && typeof BoxNS.unbox(maybeRef) === 'function';
}

export function unpack<T>(boxOrValue: Box<T> | T): T {
  return isRefBox(boxOrValue) ? unbox(boxOrValue) : boxOrValue;
}
