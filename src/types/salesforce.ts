export interface SalesforceObject {
  name: string;
  label: string;
  custom: boolean;
  keyPrefix?: string;
  labelPlural?: string;
  layoutable?: boolean;
  activateable?: boolean;
  updateable?: boolean;
  createable?: boolean;
  deletable?: boolean;
  feedEnabled?: boolean;
  hasSubtypes?: boolean;
  isSubtype?: boolean;
  queryable?: boolean;
  retrieveable?: boolean;
  searchable?: boolean;
  triggerable?: boolean;
  undeletable?: boolean;
  mergeable?: boolean;
  replicateable?: boolean;
  deprecatedAndHidden?: boolean;
}

export interface SalesforceField {
  name: string;
  label: string;
  type: string;
  length?: number;
  byteLength?: number;
  digits?: number;
  precision?: number;
  scale?: number;
  inlineHelpText?: string;
  defaultValue?: any;
  defaultValueFormula?: string;
  calculated?: boolean;
  createable?: boolean;
  updateable?: boolean;
  unique?: boolean;
  nillable?: boolean;
  externalId?: boolean;
  autoNumber?: boolean;
  restrictedPicklist?: boolean;
  picklistValues?: PicklistValue[];
  referenceTo?: string[];
  relationshipName?: string;
  relationshipOrder?: number;
  writeRequiresMasterRead?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  permissionable?: boolean;
  dependentPicklist?: boolean;
  controllerName?: string;
  restrictedDelete?: boolean;
  cascadeDelete?: boolean;
}

export interface PicklistValue {
  active: boolean;
  defaultValue: boolean;
  label: string;
  validFor?: string;
  value: string;
}

export interface SalesforceRecordTypeInfo {
  available: boolean;
  defaultRecordTypeMapping: boolean;
  master: boolean;
  name: string;
  recordTypeId: string;
}

export interface SalesforceChildRelationship {
  cascadeDelete: boolean;
  childSObject: string;
  deprecatedAndHidden: boolean;
  field: string;
  junctionIdListName?: string;
  junctionReferenceTo?: string[];
  relationshipName?: string;
  restrictedDelete: boolean;
}