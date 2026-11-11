import { loadBundledPacks } from '../../packs';
import { getDb } from '@/db/expoDb';
import { installPack } from '@/packs/install';
import type { Db } from '@/db/db';

export interface AppContext {
  db: Db;
  lang: string;
  ttsLocale: string;
}

let ctx: Promise<AppContext> | null = null;

/** Ouvre la base, installe/met à jour les packs embarqués, renvoie la langue active (jalon 1 : la première). */
export function bootstrap(): Promise<AppContext> {
  ctx ??= (async () => {
    const db = await getDb();
    const packs = loadBundledPacks();
    for (const p of packs) {
      const cur = await db.get<{ pack_version: string }>(
        'SELECT pack_version FROM packs WHERE lang=?',
        [p.meta.lang],
      );
      if (cur?.pack_version !== p.packVersion) await installPack(db, p);
    }
    return { db, lang: packs[0].meta.lang, ttsLocale: packs[0].meta.ttsLocale };
  })();
  return ctx;
}
