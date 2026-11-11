import type { Pack } from '@/packs/schema';
import { validatePack } from '@/packs/validate';

/**
 * Packs embarqués dans l'APK. Pour ajouter une langue : déposer `xx.pack.json` dans ce dossier
 * et l'ajouter à cette liste (un script d'indexation automatique viendra avec le pack italien).
 */
const RAW: unknown[] = [require('./test.pack.json')];

export function loadBundledPacks(): Pack[] {
  return RAW.map(validatePack);
}
