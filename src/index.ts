import program from '@filmcalendar/agents-core';
import type { IAgent } from '@filmcalendar/agents-core/dist/agent.d';

import agents from './agents';

// FIX: casting to unknown
program(agents as unknown as Record<string, IAgent>);
