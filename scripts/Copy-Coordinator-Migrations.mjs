import {cp,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=new URL('../apps/coordinator/src/migrations/',import.meta.url);
const target=new URL('../apps/coordinator/dist/migrations/',import.meta.url);
await mkdir(fileURLToPath(target),{recursive:true});
// Preserve the exact immutable migration artifact in source and built runtimes.
await cp(fileURLToPath(source),fileURLToPath(target),{recursive:true});
