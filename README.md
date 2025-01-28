# @kernpunkt/saga

## Overview

This package is a Typescript implementation of the [Saga Pattern](https://microservices.io/patterns/data/saga.html), specifically in the form of a **Saga Orchestrator**.

The orchestrator helps you implement loose coupling in your procceses, especially if those deal with multiple microservices. This is achieved by dividing logic into multiple **steps** (see below), each implementing an `execute` function (which will change something about the context and do something in the world) and a `rollback` function (which will serve to undo the change if an error occurs further down the chain).

## Installation

To install the package, simply run:

```bash
npm install @kernpunkt/saga
yarn add @kernpunkt/saga
```

## Usage

After installation, simply import the `SagaOrchestrator` like so:

```typescript
import { SagaOrchestrator } from '@kernpunkt/saga';
```

Afterwards, you can start by defining a **context** applicable to your domain, and using it in a **step**:

```typescript
import { TSagaContext, ISagaStep } from '@kernpunkt/saga';
type TVacationContext = TSagaContext & {
    flightNumber?: number;
}

class BookFlightStep implements ISagaStep<TVacationContext> {
    getKey(): string {
        return 'book-flight';
    }

    async execute(context: TVacationContext): Promise<TVacationContext> {
        // booking logic
    }

    async rollback(context: TVacationContext): Promise<TVacationContext> {
        // rollback logic
    }
}
```

Then, you can start the **saga**!

```typescript
import { SagaOrchestrator } from '@kernpunkt/saga';

const saga = new SagaOrchestrator()
    .addStep(new BookFlightStep());

const context: TVacationContext = {
    log: { successes: [], errors: [] }
};

const result = await saga.orchestrate(context);
```

### `shouldRollbackSelf`

Steps that implement the `ISagaStep` interface have the opportunity to provide a `shouldRollbackSelf` method. If this method exists (and returns `true`), a potential rollback **will start with this current step**. Otherwise, the current step will be ommitted.


## Contact

|                                   |                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| ![](https://res.cloudinary.com/ddux8vytr/image/upload/w_200,h_200,c_thumb,g_face,z_0.6/v1717664499/izxda0mc6o4c7v22yvtv.jpg) | **Jörn Meyer**<br>Team CodeJunkeys<br> [joern.meyer@kernpunkt.de](mailto://joern.meyer@kernpunkt.de) |