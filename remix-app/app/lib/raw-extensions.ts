/**
 * Common RAW file extensions from various camera manufacturers
 */
export const RAW_EXTENSIONS = [
  '.cr2', '.cr3',  // Canon
  '.nef', '.nrw',  // Nikon
  '.arw', '.srf', '.sr2',  // Sony
  '.dng',  // Adobe/Generic
  '.raf',  // Fujifilm
  '.orf',  // Olympus
  '.rw2',  // Panasonic
  '.pef',  // Pentax
  '.srw',  // Samsung
  '.x3f',  // Sigma
  '.raw', '.rwl', '.dcs', '.dcr', '.kdc', '.k25',  // Kodak
  '.mrw',  // Minolta
  '.3fr',  // Hasselblad
  '.fff',  // Imacon/Hasselblad
  '.iiq',  // Phase One
  '.erf',  // Epson
  '.mef',  // Mamiya
  '.mos',  // Leaf
] as const;

export type RawExtension = typeof RAW_EXTENSIONS[number];

/**
 * Check if a filename has a RAW file extension
 */
export const isRawFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return RAW_EXTENSIONS.includes(ext as RawExtension);
};
