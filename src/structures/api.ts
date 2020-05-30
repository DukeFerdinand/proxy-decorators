import { Result } from './result'

export type APIResponse<T, E> = Promise<Result<T, E>>
