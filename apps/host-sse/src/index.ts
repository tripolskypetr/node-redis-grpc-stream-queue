import { grpc } from '@modules/remote-grpc';

import "./__test__/foo-service.test";
import "./__test__/bar-service.test";
import "./__test__/baz-service.test";

grpc.loggerService.setPrefix("host-sse");
