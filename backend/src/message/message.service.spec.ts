import { NjsNatsService } from '@warpy-be/nats/nats.service';
import { mockedNatsService } from '@warpy-be/nats/nats.services.mock';
import { testModuleBuilder } from '@warpy-be/__fixtures__/app.module';
import { NjsMessageService } from './message.service';

describe('MessageService', () => {
  let messageService: NjsMessageService;

  beforeAll(async () => {
    const m = await testModuleBuilder
      .overrideProvider(NjsNatsService)
      .useValue(mockedNatsService)
      .compile();

    messageService = m.get(NjsMessageService);
  });

  it('sends message', () => {
    const user = 'test-user';
    const msg = { test: 1 };
    const encodedMsg = new Uint8Array(120);

    mockedNatsService.jc.encode.mockReturnValueOnce(encodedMsg);

    messageService.sendMessage(user, msg);

    expect(mockedNatsService.jc.encode).toBeCalledWith(msg);
    expect(mockedNatsService.publish).toBeCalledWith(
      `reply.user.${user}`,
      encodedMsg,
    );
  });
});
