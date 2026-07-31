/**
 * Dump e ripristino non possono girare insieme, né sovrapporsi a se stessi: uno
 * scriverebbe il database mentre l'altro lo legge. I due flag stavano fra le variabili
 * di modulo di backupManager, ma servono sia al dump sia al ripristino, che ora sono in
 * file diversi: isolarli qui evita che i due moduli si importino a vicenda.
 */
import { BackupManagerError } from "./backupError";

let dumpInProgress = false;
let restoreInProgress = false;

export const isDumpInProgress = () => dumpInProgress;

export const assertNoOperationInProgress = () => {
    if (dumpInProgress || restoreInProgress) {
        throw new BackupManagerError("E gia in corso un'operazione sul database", 409);
    }
};

export const beginDump = () => {
    dumpInProgress = true;
};

export const endDump = () => {
    dumpInProgress = false;
};

export const beginRestore = () => {
    restoreInProgress = true;
};

export const endRestore = () => {
    restoreInProgress = false;
};
