import type { Writable } from 'svelte/store';

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
};
