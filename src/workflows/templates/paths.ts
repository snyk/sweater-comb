export function buildCollectionPath(pluralResourceName) {
  return `/orgs/{org_id}/${pluralResourceName.toLowerCase()}`;
}

export function buildItemPath(resourceName, pluralResourceName) {
  const collectionPath = buildCollectionPath(pluralResourceName);
  return `${collectionPath.toLowerCase()}/{${resourceName.toLowerCase()}_id}`;
}
