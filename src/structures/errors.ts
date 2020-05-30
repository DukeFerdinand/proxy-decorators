import { APIResponse } from './api'
import { Ok, Err, isResult, Result } from './result'

type Constructor = {
  // Reason for ignore: We need this to be super generic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new(...args: any[]): {};
};

type FunctionType<ArgType = any, RetVal = any> = (...args: ArgType[]) => RetVal

export function HandleErrors<T extends Constructor>(constructor: T) {
  // Not all keys are marked enumerable, so we have to do this
  for (const propertyName of Object.getOwnPropertyNames(constructor.prototype)) {
    // ignore special constructor "method"
    if (propertyName !== 'constructor') {
      const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, propertyName) || {}

      // Redeclare method to handle error
      const isMethod = descriptor.value instanceof Function
      if (!isMethod) { continue }

      // Save original method code
      const originalMethod = descriptor.value

      const proxyMethod = new Proxy(originalMethod, {
        async apply(target: FunctionType, thisArg, args) {
          const returnVal = await target.apply(thisArg, args)

          return returnVal
        }
      })

      // TODO: Handle any sync functions differently than async functions
      // Wrap original method with a proxy/error handling wrapper
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // descriptor.value = async function (...args: any[]) {
      //   const result = await (originalMethod.apply(this, args) as APIResponse<{}, {}>)
      //   if (result instanceof Ok || result instanceof Err) {
      //     // result is a `Result` response, handle
      //     if (result.isOk()) {
      //       return result.unwrap()
      //     } else {
      //       return null
      //     }
      //   }
      //   // ? This is for the use case of using `psFetch` instead of `autoPsFetch` so you can override auto error handling
      //   return result
      // }
      descriptor.value = proxyMethod

      Object.defineProperty(constructor.prototype, propertyName, descriptor)
    }
  }
}

export function LogErrors<ErrType = any>(config: {
  async: boolean;
  sendToVuex?: boolean;
  // If this key is defined, no value is returned
  errHandler?: (arg: ErrType) => void;
}) {
  // Target is the base class
  return function (target: { [index: string]: any }, propertyKey: string, descriptor: PropertyDescriptor) {
    const handleRes = (res: any) => {
      // Check if result type
      if (isResult(res)) {
        if ((res as Result<any, any>).isErr()) {
          // Check if window is dev if using this in a real project
          console.error(`Error at ${propertyKey}`, res)
          console.log(config)
          if (config.errHandler !== undefined) {
            console.log('handling error')
            config.errHandler((res as Result<any, any>).unwrapErr())
            return
          }
        }

        return res
      }

      // Result is not a `Result` class instance, check other error types here...
      // if (res.<key> === 'whatever') {
      // -- Handle...
      // }

      // If nothing else matches, return and assume fine or otherwise handled
      return res
    }

    // Wrap the meat of the handler in normal function
    const apply = function (t: Function, thisArg: object, args: any[]) {
      try {
        const res = t.apply(thisArg, args)
        return handleRes(res)
      } catch (e) {
        console.error(e)
      }
    }

    // Do the same but async
    const asyncApply = async function (t: Function, thisArg: object, args: any[]) {
      try {
        const res = await t.apply(thisArg, args)
        return handleRes(res)
      } catch (e) {
        console.error(e)
      }
    }

    descriptor.value = new Proxy(descriptor.value, {
      apply: config.async ? asyncApply : apply
    })
  }
}
