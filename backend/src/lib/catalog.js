// Seeding compares this against Settings.catalogVersion and skips when the
// stored value is not lower. Clearing the catalog by hand stores this
// sentinel, which marks the catalog as the owner's own: a future bump to
// the demo catalog must never drop pizza back into a real business's menu.
const OWNER_MANAGED_CATALOG = 9999;

module.exports = { OWNER_MANAGED_CATALOG };
