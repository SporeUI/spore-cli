export type TypeTimeout = ReturnType<typeof setTimeout>;

export type TypeInterval = ReturnType<typeof setInterval>;

export interface TypePlainObject {
  [key: string]: unknown;
}

export declare type TypeSimpleValue = null | undefined | string | number | boolean;

export interface TypeSimpleObject {
  [key: string]: TypeSimpleValue;
}

export type TypeDate = Date | string | number;

export type TypePromiseFn = (...args: unknown[]) => Promise<unknown>;
