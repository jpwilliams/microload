# microload

A simplified version of [`microboot`](https://github.com/jpwilliams/microboot) and [`microloader`](https://github.com/jpwilliams/microloader) that synchronously loads a given path as an object.

# Key features

- Requires and imports entire directories
- Ignores hidden files

# Usage

``` sh
yarn add microload
```

``` js
const { microload } = require('microload')
const lib = microload('./lib')
```

Based on the following tree structure, `lib` would now be:

```
.
└── lib
    ├── config
    │   ├── creds.js
    │   └── tokens.json
    ├── getter.js
    ├── parser.js
    └── utils
        ├── loadMongo.js
        ├── loadRedis.js
        └── .loadRethink.js
```

``` json
{
  "config": {
    "creds": ...,
    "tokens": ...
  },
  "getter": ...,
  "parser": ...,
  "utils": {
    "loadMongo": ...,
    "loadRedis": ...
  }
}
```

