# LiveKit Components

Create your LiveKit experience without worrying about state.

## Monorepo Navigation
* [Home  👈](/README.md)
* **Internals**
    * [Core](/packages/core/README.md)
    * [Styles](/packages/styles/README.md)
* **Framework Implementations**:
    * [React](/packages/react/README.md)
    * [Vue](/packages/vue/README.md)

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

[![](https://mermaid.ink/img/pako:eNptUz2P2zAM_SuC5rgHdPTQ5XoHdOjUToUXRaITNRJpSLLvgkP--9FSbMuHaDBo8pF8_PqQmgzIVsakEvy06hSUb6bvHQp-mgK0_PUDIWCKT7OimAIonXa2rCnGOIFLe8-iupvNpRXOTnCx6Uk7y4CGdc3_eLenq4O4d8-qYraYIKByohW_ULvRgGGdSGcbmdZA0SYK14KF9xX7sogGBkADqO0Sseei4Y3ChZO-LrKIA2jbWy2sH8CBR26RJbz7lC9SAuGgT4J6sXVnfn-DwthT8FHANBchjioyVUcnqzcYV0OCjhHCpI5coziTMxZPIk_k270MNDlVlTTY0zln3chvQZ-Z5ughM9oFfxTuaw9E0_wonq04jtaZKAgfgtZJjRGyPPPuA_ltfTKumkIdcJk211lH_tjqqLdm3brye-uw9l-XovJ-1Jn9jOq1-hJw5VzTMZcKm8XNOD95kB6CV9bwSWXHTqYzeOhky6KBXo0udbLDG0PVmOjPFbVsUxjhIMfBbEe4KMHM6_y7XGk-1oMcFP4jYkivXITbJ88xPgo?type=png)](https://mermaid-js.github.io/mermaid-live-editor/edit#pako:eNptUz2P2zAM_SuC5rgHdPTQ5XoHdOjUToUXRaITNRJpSLLvgkP--9FSbMuHaDBo8pF8_PqQmgzIVsakEvy06hSUb6bvHQp-mgK0_PUDIWCKT7OimAIonXa2rCnGOIFLe8-iupvNpRXOTnCx6Uk7y4CGdc3_eLenq4O4d8-qYraYIKByohW_ULvRgGGdSGcbmdZA0SYK14KF9xX7sogGBkADqO0Sseei4Y3ChZO-LrKIA2jbWy2sH8CBR26RJbz7lC9SAuGgT4J6sXVnfn-DwthT8FHANBchjioyVUcnqzcYV0OCjhHCpI5coziTMxZPIk_k270MNDlVlTTY0zln3chvQZ-Z5ughM9oFfxTuaw9E0_wonq04jtaZKAgfgtZJjRGyPPPuA_ltfTKumkIdcJk211lH_tjqqLdm3brye-uw9l-XovJ-1Jn9jOq1-hJw5VzTMZcKm8XNOD95kB6CV9bwSWXHTqYzeOhky6KBXo0udbLDG0PVmOjPFbVsUxjhIMfBbEe4KMHM6_y7XGk-1oMcFP4jYkivXITbJ88xPgo)