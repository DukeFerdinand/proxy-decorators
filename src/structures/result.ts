
export interface ResultTrait<T, E> {
  isOk(): boolean;
  isErr(): boolean;
  unwrap(): T;
  unwrapErr(): E;
}

export class Ok<T> implements ResultTrait<T, never> {
  private readonly value: T
  constructor(val: T) {
    this.value = val
  }
  isOk() { return true }
  isErr() { return false }
  unwrap(): T {
    return this.value
  }
  unwrapErr(): never {
    throw new TypeError('Error: attempted to call `unwrapErr` on `Ok` variant.')
  }
}

export class Err<E> implements ResultTrait<never, E> {
  private readonly value: E
  constructor(val: E) {
    this.value = val
  }
  isOk() { return false }
  isErr() { return true }
  unwrap(): never {
    throw new TypeError('Error: attempted to call `unwrap` on `Err` variant.')
  }
  unwrapErr(): E {
    return this.value
  }
}

export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(val: T) => new Ok(val)
export const err = <T>(val: T) => new Err(val)

export const isResult = (arg: any) => {
  return arg instanceof Ok || arg instanceof Err
}
