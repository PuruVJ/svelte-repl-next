import { derived, get, writable } from 'svelte/store';

/**
 * @typedef {import('./types').ReplState} ReplState
 */

/** @type {import('svelte/types/compiler').CompileOptions} */
const DEFAULT_COMPILE_OPTIONS = {
	generate: 'dom',
	dev: false,
	css: 'injected',
	hydratable: false,
	customElement: false,
	immutable: false,
	legacy: false,
};

/** @type {Map<string, import('@codemirror/state').EditorState>} */
const EDITOR_STATE_MAP = new Map();

/** @param {import('./types').File} file */
function get_full_filename(file) {
	return `${file.name}.${file.type}`;
}

/** @type {Symbol}  */
let current_token;
export async function rebundle() {
	const token = (current_token = Symbol());
	const result = await get(bundler)?.bundle(get(files));
	if (result && token === current_token) bundle.set(result);
}

/**
 * @param {number} index
 */
export function handle_select(index) {
	const $files = get(files);
	const $selected_index = get(selected_index);
	const $module_editor = get(module_editor);
	const $compile_options = get(compile_options);
	const $output = get(output);

	const file = $files[$selected_index];

	if (!file) return;

	EDITOR_STATE_MAP.set(
		get_full_filename($files[$selected_index]),
		$module_editor?.getEditorState()
	);
	selected_index.set(index);

	$module_editor?.set({ code: file.source, lang: file.type });

	if (EDITOR_STATE_MAP.has(get_full_filename(file))) {
		$module_editor?.setEditorState(EDITOR_STATE_MAP.get(get_full_filename(file)));
	} else {
		$module_editor?.clearEditorState();
	}

	$output?.set?.(index, $compile_options);
}

/**
 * @param {CustomEvent<{ value: string }>} event
 */
export function handle_change(event) {
	const $selected_index = get(selected_index);
	const $output = get(output);
	const $files = get(files);

	files.update(() => {
		const file = Object.assign({}, $files[get(selected_index)]);

		file.source = event.detail.value;
		file.modified = true;

		$files[$selected_index] = file;

		return $files;
	});

	// recompile selected component
	$output?.update?.($files[$selected_index], compile_options);

	rebundle();
}

/** @param {import('./types').MessageDetails | undefined} item */
export async function go_to_warning_pos(item) {
	if (!item) return;

	const match = /^(.+)\.(\w+)$/.exec(item.filename);
	if (!match) return; // ???

	const $files = get(files);
	const $module_editor = get(module_editor);

	const [, name, type] = match;
	const file_index = $files.findIndex((file) => file.name === name && file.type === type);

	if (!file_index) return;

	handle_select(file_index);

	await Promise.resolve();

	$module_editor?.focus();
	$module_editor?.setCursor(item.start.character);
}

/** Deletes all editor state */
export function clear_state() {
	const $module_editor = get(module_editor);

	$module_editor?.clearEditorState();

	EDITOR_STATE_MAP.clear();
}

/** @type {import('svelte/store').Writable<ReplState['files']>} */
export const files = writable([]);

/** @type {import('svelte/store').Writable<ReplState['selected_index']>} */
export const selected_index = writable(-1);

/** @type {import('svelte/store').Readable<import('./types').File | null>} */
export const selected = derived([files, selected_index], ([$files, $selected_index]) => {
	return $files[$selected_index] ?? null;
});

/** @type {import('svelte/store').Writable<ReplState['bundle']>} */
export const bundle = writable(null);

/** @type {import('svelte/store').Writable<ReplState['compile_options']>} */
export const compile_options = writable(DEFAULT_COMPILE_OPTIONS);

/** @type {import('svelte/store').Writable<ReplState['cursor_pos']>} */
export const cursor_pos = writable(0);

/** @type {import('svelte/store').Writable<ReplState['module_editor']>} */
export const module_editor = writable(null);

/** @type {import('svelte/store').Writable<ReplState['output']>} */
export const output = writable(null);

/** @type {import('svelte/store').Writable<ReplState['toggleable']>} */
export const toggleable = writable(false);

/** @type {import('svelte/store').Writable<import('./Bundler').default | null>} */
export const bundler = writable(null);
