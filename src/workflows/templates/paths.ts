export function buildCollectionPath(pluralResourceName) {
  return `/orgs/{org_id}/${pluralResourceName}`;
}

export function buildItemPath(resourceName, pluralResourceName) {
  const collectionPath = buildCollectionPath(pluralResourceName);
  return `${collectionPath}/{${resourceName.toLowerCase()}_id}`;
}
