/* eslint-disable no-redeclare, @typescript-eslint/no-use-before-define, @typescript-eslint/no-namespace*/

import * as MetaBox from './metabox';
import * as RefBox from './refbox';

// ---------------------
// SymbolToken
// ---------------------

type SymbolToken<T> = symbol & MetaBox.Box<T>;

function tokenSymbol<T>(name?: string): SymbolToken<T> {
  return Symbol(name) as SymbolToken<T>;
}

// ---------------------
// StringToken
// ---------------------

type StringToken<T> = string & MetaBox.Box<T>;

function tokenString<T>(name?: string): StringToken<T> {
  const randomSafeInt = Math.ceil(Number.MAX_SAFE_INTEGER * Math.random());

  return `${name}${randomSafeInt.toString()}` as StringToken<T>;
}

// ---------------------
// Common
// ---------------------

type Newable = new (...args: any) => unknown;

type PlainToken = SymbolToken<any> | StringToken<any> | Newable;

type Token = PlainToken | RefBox.Box<PlainToken>;

// ---------------------
// Metadata
// ---------------------

const METADATA_TAG: '__Metadata' = '__Metadata';

interface Metadata<T extends Token> {
  [METADATA_TAG]: true;
  token: T;
  tags: Record<string, any>;
  name?: string;
  multi?: boolean;
  optional?: boolean;
}

function createMetadata<T extends Token>(token: T): Metadata<T> {
  return {
    [METADATA_TAG]: true,
    token: token,
    tags: {},
  };
}

interface Multi {
  multi: true;
}

type WithMulti<T extends Metadata<any>> = T & Multi;

interface OptionalM {
  optional: true;
}

type WithOptional<T extends Metadata<any>> = T & OptionalM;

function isMetadata(meta: Metadata<any> | Token): meta is Metadata<any> {
  return typeof meta === 'object' && meta !== null && METADATA_TAG in meta;
}

type GetToken<T extends Metadata<any> | Token> = T extends Metadata<any>
  ? T['token']
  : T;

type ToMetadata<T extends Metadata<any> | Token> = T extends Metadata<any>
  ? T
  : Metadata<GetToken<T>>;

function tagged(key: string, value: any) {
  return <T extends Metadata<any> | Token>(tokenOrMeta: T): ToMetadata<T> => {
    if (isMetadata(tokenOrMeta)) {
      tokenOrMeta.tags[key] = value;

      return tokenOrMeta as ToMetadata<T>;
    }

    const metadata = createMetadata(tokenOrMeta as GetToken<T>);

    metadata.tags[key] = value;

    return metadata as ToMetadata<T>;
  };
}

function named(name: string) {
  return <T extends Metadata<any> | Token>(tokenOrMeta: T): ToMetadata<T> => {
    if (isMetadata(tokenOrMeta)) {
      (tokenOrMeta as ToMetadata<T>).name = name;

      return tokenOrMeta as ToMetadata<T>;
    }

    const metadata = createMetadata(tokenOrMeta as GetToken<T>);

    metadata.name = name;

    return metadata as ToMetadata<T>;
  };
}

function multi<T extends Metadata<any> | Token>(
  tokenOrMeta: T,
): WithMulti<ToMetadata<T>> {
  if (isMetadata(tokenOrMeta)) {
    (tokenOrMeta as ToMetadata<T>).multi = true;

    return tokenOrMeta as WithMulti<ToMetadata<T>>;
  }

  const metadata = createMetadata(tokenOrMeta as GetToken<T>);

  metadata.multi = true;

  return metadata as WithMulti<ToMetadata<T>>;
}

function optional<T extends Metadata<any> | Token>(
  tokenOrMeta: T,
): WithOptional<ToMetadata<T>> {
  if (isMetadata(tokenOrMeta)) {
    (tokenOrMeta as ToMetadata<T>).optional = true;

    return tokenOrMeta as WithOptional<ToMetadata<T>>;
  }

  const metadata = createMetadata(tokenOrMeta as GetToken<T>);

  metadata.optional = true;

  return metadata as WithOptional<ToMetadata<T>>;
}

// ---------------------
// ObjectInjection
// ---------------------

interface ClassWithDependencies {
  injectTypes: Record<string, Token | Metadata<Token>>;
}

type GetDependencyType<T> = T extends StringToken<any>
  ? MetaBox.Unbox<T>
  : T extends SymbolToken<any>
  ? MetaBox.Unbox<T>
  : T extends Newable
  ? InstanceType<T>
  : never;

type Dependencies<Class extends ClassWithDependencies> = {
  [K in keyof Class['injectTypes']]: Class['injectTypes'][K] extends Multi
    ? Array<GetDependencyType<RefBox.Unpack<GetToken<Class['injectTypes'][K]>>>>
    : Class['injectTypes'][K] extends OptionalM
    ?
        | GetDependencyType<RefBox.Unpack<GetToken<Class['injectTypes'][K]>>>
        | undefined
    : GetDependencyType<RefBox.Unpack<GetToken<Class['injectTypes'][K]>>>;
};

// ---------------------
// Example
// ---------------------

export type Deps = Dependencies<typeof MyService>; // remove

interface Logger {
  log(...values: any[]): void;
}

const Logger = tokenString<Logger>('Logger');

interface Store {
  getItem(key: string): string | null;
}

const Store = tokenSymbol<Store>();

class MyService implements Dependencies<typeof MyService> {
  static injectTypes = {
    logger: optional(Logger),
    loggers: multi(Logger),
    store: RefBox.box(() => Store),
    arraybuffer: tagged('id', 'data')(ArrayBuffer),
    map: named('cities')(RefBox.box(() => Map)),
  };

  logger: Logger | undefined;
  loggers: Logger[];
  store: Store;
  arraybuffer: ArrayBuffer;
  map: Map<any, any>;

  constructor({
    logger,
    loggers,
    store,
    arraybuffer,
    map,
  }: Dependencies<typeof MyService>) {
    this.logger = logger;
    this.loggers = loggers;
    this.store = store;
    this.arraybuffer = arraybuffer;
    this.map = map;
  }
}

console.log(((window as any).MyService = MyService));
