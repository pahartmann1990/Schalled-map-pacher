export interface ParsedFile {
  name: string;
  content: string;
  lastModified: number;
}

export interface SerialMatch {
  value: string;
  count: number;
  isPmu: boolean;
  networkId?: string; // e.g. "H16"
  attributes: Record<string, string>; // Store all attributes for cloning
}

export interface ReplacementOptions {
  targetSN: string;
  newSN: string;
  limit: number;
  newNetworkId?: string;
  sourceCloneSN?: string; // SN to copy attributes FROM
}
