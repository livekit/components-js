# LiveKit Components

## Development Setup

This repo consists of multiple packages that partly build on top of each other.
It relies on yarn workspaces and turborepo (which gets installed automatically).

On the root level:

```bash
yarn install
```

In order to link up initial dependencies and check whether everything has installed correctly run

```
yarn build
```

This will build all the packages in /packages and the examples in /examples once.

After that you can use a more granular command to only rebuild the packages you are working on.
E.g. to test and automatically rebuild package dependencies for the nextjs example, run

```
yarn dev:next
```

> NOTE: for the examples to work you'll need to make sure to copy the the contents of .env.example in the specific example folder to a newly created .env.local file and adjust the values accordingly to your livekit server setup.


## Architecture Overview

stateDiagram-v2
    core: components/core
    react: components/react
    svelte: components/svelte
    sdk: livekit/client-sdk-js
    styles: components/styles
    internal : Included in this repository
    external : External dependencies
    frameworks: Framework specific impelemntations
    
    note left of core
        Transforms events based logic
        into observables holding state.
    end note
    note right of frameworks
        Consume core observables 
    end note
    
    frameworks --> core : builds on
    frameworks -->  styles: use styling from
    core --> external : builds on
 
    state frameworks {
        svelte
        react
    }

    state internal {
        frameworks
        core
        styles
    }

    state external {
        sdk
    }