/**
 * Backward-compatible re-exports from the central chain registry.
 * Existing components that import from here will keep working.
 */
export { getAssetColor, getAssetTextColor, getAssetIcon as AssetIcon } from '@/lib/chains';
