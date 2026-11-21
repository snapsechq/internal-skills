# ES6 Modules Standards and Rules

Every backend service created or refactored with this skill **must strictly enforce ECMAScript 6 (ES6) modules**.

---

## 1. Package Configuration (`package.json`)

`package.json` must contain `"type": "module"`:

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "type": "module",
  "main": "src/app.js",
  ...
}
```

---

## 2. Import and Export Rules

### Explicit Extensions are Mandatory
Under Node.js ES modules, relative file imports **must include the `.js` extension**. Omitting the extension causes runtime `ERR_MODULE_NOT_FOUND` errors:

- ❌ `import { appConfig } from './config/app-config';`
- ❌ `import itemRoutes from './item.routes';`
- ✅ `import { appConfig } from './config/app-config.js';`
- ✅ `import itemRoutes from './item.routes.js';`

### No CommonJS Syntax Allowed
CommonJS keywords are illegal in ES6 module environments:

- ❌ `const express = require('express');`
- ❌ `module.exports = app;`
- ❌ `exports.myHelper = ...;`
- ✅ `import express from 'express';`
- ✅ `export default app;`
- ✅ `export const myHelper = ...;`

### Dynamic Imports
For lazy loading or conditional imports, use `await import(...)`:

```javascript
const { mqbroker } = await import("../services/rabbitmq.service.js");
if (mqbroker?.publish) {
    await mqbroker.publish("exchange", "key", payload);
}
```

### Handling `__dirname` and `__filename`
In ES modules, `__dirname` and `__filename` are not globals. If path resolution is needed:

```javascript
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
