import { writable } from 'svelte/store';

export const intersect = writable();
export const match = writable();
export const ref_bbox = writable([-8, 50, 3, 60]);
