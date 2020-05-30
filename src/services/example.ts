import { HandleErrors, LogErrors } from '@/structures/errors'
import { APIResponse } from '@/structures/api'
import { ok, err } from '@/structures/result'

// @HandleErrors
export class ExampleService {
  @LogErrors({
    async: true,
    sendToVuex: true
  })
  public async testResponse(fail: boolean): APIResponse<number, string> {
    if (!fail) {
      return await ok(0)
    } else {
      return await err('Triggered a failure')
    }
  }

  @LogErrors({ async: false })
  public testNormal(): number {
    return 0
  }
}
