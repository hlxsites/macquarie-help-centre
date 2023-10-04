# Macquarie Help Centre
Macquarie Bank Help Centre site on Edge Delivery Services.

## Environments
- Preview: https://main--macquarie-help-centre--hlxsites.hlx.page/
- Live: https://main--macquarie-help-centre--hlxsites.hlx.live/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `helix-project-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [helix-bot](https://github.com/apps/helix-bot) to the repository
1. Install the [Helix CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/helix-cli`
1. Start Franklin Proxy: `hlx up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
