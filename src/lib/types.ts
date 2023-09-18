import type { Writable } from 'svelte/store';
import type { Adapter } from './adapter';

export type InputFile = {
	path: string;
	content: string;
	modified?: boolean;
};

export type File = InputFile & {
	id: string;
};

export type ReplContext = {
	files: Writable<File[]>;
	selected_id: Writable<string | null>;
	adapter: Adapter;
};
